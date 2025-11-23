// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { getFirebaseAuth, auth as firebaseAuth } from '../config/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { 
  trackEvent, 
  AnalyticsEvent, 
  setUserId, 
  setUserProperties 
} from '../utils/analytics';
import { loadFromFirestore, setupConnectionListener } from '../utils/offlineSync';

// Cerrar el navegador web cuando termine la autenticación
WebBrowser.maybeCompleteAuthSession();

// Función helper para obtener auth de forma segura
// SIEMPRE usar la instancia exportada desde firebaseConfig para garantizar consistencia
const getAuthInstance = () => {
  // Usar siempre la instancia exportada de firebaseConfig
  // Esta instancia está vinculada a la app inicializada
  if (firebaseAuth) {
    return firebaseAuth;
  }
  
  // Si por alguna razón no está disponible, intentar obtenerla
  // pero esto NO debería pasar nunca si firebaseConfig está correcto
  try {
    const authFromHelper = getFirebaseAuth();
    if (__DEV__) {
      console.warn('⚠️ Usando auth desde helper en lugar de instancia exportada');
    }
    return authFromHelper;
  } catch (error) {
    console.error('❌ Error crítico obteniendo instancia de auth:', error);
    throw new Error('Firebase auth no está disponible. Verifica tu configuración de Firebase.');
  }
};

interface AuthContextType {
  user: firebase.User | null;
  loading: boolean;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    try {
      const authInstance = getAuthInstance();
      
      unsubscribe = authInstance.onAuthStateChanged(async (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
        
        if (firebaseUser) {
          // Guardar información del usuario en AsyncStorage
          await AsyncStorage.setItem('@user:uid', firebaseUser.uid);
          await AsyncStorage.setItem('@user:email', firebaseUser.email || '');
          
          // Configurar Analytics para el usuario
          setUserId(firebaseUser.uid);
          setUserProperties({
            email: firebaseUser.email || '',
            email_verified: firebaseUser.emailVerified,
            sign_in_method: firebaseUser.providerData[0]?.providerId || 'email',
          });

          // Cargar datos desde Firestore y configurar sincronización
          await loadFromFirestore(firebaseUser.uid);
        } else {
          // Limpiar información del usuario
          await AsyncStorage.removeItem('@user:uid');
          await AsyncStorage.removeItem('@user:email');
          
          // Limpiar Analytics
          setUserId(null);
        }
      });
    } catch (error) {
      console.error('Error configurando auth listener:', error);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<void> => {
    const authInstance = getAuthInstance();
    
    try {
      await authInstance.createUserWithEmailAndPassword(email, password);
      
      // Trackear registro exitoso
      trackEvent(AnalyticsEvent.USER_SIGNED_UP, {
        method: 'email',
      });
    } catch (error: any) {
      let errorMessage = 'Error al registrar usuario';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Este correo ya está registrado';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Correo electrónico inválido';
            break;
          case 'auth/weak-password':
            errorMessage = 'La contraseña es muy débil';
            break;
          default:
            errorMessage = error.message || 'Error desconocido';
        }
      } else {
        errorMessage = error.message || 'Error desconocido';
      }
      
      throw new Error(errorMessage);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const authInstance = getAuthInstance();
    
    try {
      await authInstance.signInWithEmailAndPassword(email, password);
      
      // Trackear inicio de sesión exitoso
      trackEvent(AnalyticsEvent.USER_SIGNED_IN, {
        method: 'email',
      });
    } catch (error: any) {
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'Usuario no encontrado';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Contraseña incorrecta';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Correo electrónico inválido';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
            break;
          default:
            errorMessage = error.message || 'Error desconocido';
        }
      } else {
        errorMessage = error.message || 'Error desconocido';
      }
      
      throw new Error(errorMessage);
    }
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<void> => {
    const authInstance = getAuthInstance();
    
    try {
      // Configurar el proveedor de Google
      const provider = new firebase.auth.GoogleAuthProvider();
      
      // Agregar scopes adicionales si es necesario
      provider.addScope('profile');
      provider.addScope('email');
      
      // Para web, usar popup (mejor UX)
      if (Platform.OS === 'web') {
        const result = await authInstance.signInWithPopup(provider);
        if (result.user) {
          // Trackear inicio de sesión con Google
          trackEvent(AnalyticsEvent.USER_SIGNED_IN, {
            method: 'google',
          });
          // Usuario autenticado correctamente
          return;
        }
      } else {
        // Para React Native/Expo, usar redirect (más confiable)
        // Firebase manejará automáticamente el redirect y volverá a la app
        await authInstance.signInWithRedirect(provider);
      }
    } catch (error: any) {
      let errorMessage = 'Error al iniciar sesión con Google';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
          case 'auth/cancelled-popup-request':
            errorMessage = 'Autenticación cancelada';
            break;
          case 'auth/popup-blocked':
            errorMessage = 'Popup bloqueado. Por favor permite popups para este sitio';
            break;
          case 'auth/account-exists-with-different-credential':
            errorMessage = 'Ya existe una cuenta con este correo usando otro método de autenticación';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Autenticación con Google no está habilitada. Verifica la configuración de Firebase';
            break;
          default:
            errorMessage = error.message || 'Error desconocido al autenticar con Google';
        }
      } else {
        errorMessage = error.message || 'Error desconocido al autenticar con Google';
      }
      
      throw new Error(errorMessage);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const authInstance = getAuthInstance();
    
    try {
      // Trackear cierre de sesión
      trackEvent(AnalyticsEvent.USER_SIGNED_OUT);
      
      await authInstance.signOut();
      await AsyncStorage.clear();
    } catch (error: any) {
      throw new Error(error.message || 'Error al cerrar sesión');
    }
  }, []);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      loading,
      register,
      login,
      loginWithGoogle,
      logout,
    }),
    [user, loading, register, login, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

