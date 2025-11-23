// src/context/PremiumContext.tsx
// Contexto para manejar el estado premium de los usuarios
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { db } from '../config/firebaseConfig';
import firebase from 'firebase/compat/app';
import { setUserProperties } from '../utils/analytics';

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  subscriptionType: 'monthly' | 'yearly' | 'lifetime' | null;
  subscriptionExpiry: Date | null;
  purchaseDate: Date | null;
  refreshPremiumStatus: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

const STORAGE_KEY = '@premium:status';
const STORAGE_EXPIRY_KEY = '@premium:expiry';
const STORAGE_TYPE_KEY = '@premium:type';
const STORAGE_PURCHASE_KEY = '@premium:purchase_date';

export const PremiumProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionType, setSubscriptionType] = useState<'monthly' | 'yearly' | 'lifetime' | null>(null);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<Date | null>(null);
  const [purchaseDate, setPurchaseDate] = useState<Date | null>(null);

  // Cargar estado premium desde AsyncStorage
  const loadPremiumStatus = useCallback(async () => {
    try {
      const [status, expiryStr, type, purchaseStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(STORAGE_EXPIRY_KEY),
        AsyncStorage.getItem(STORAGE_TYPE_KEY),
        AsyncStorage.getItem(STORAGE_PURCHASE_KEY),
      ]);

      if (status === 'true') {
        setIsPremium(true);
        setSubscriptionType(type as 'monthly' | 'yearly' | 'lifetime' | null);
        
        if (expiryStr) {
          const expiry = new Date(expiryStr);
          setSubscriptionExpiry(expiry);
          
          // Verificar si la suscripción expiró
          if (expiry < new Date() && type !== 'lifetime') {
            setIsPremium(false);
            setSubscriptionType(null);
            setSubscriptionExpiry(null);
            await AsyncStorage.multiRemove([
              STORAGE_KEY,
              STORAGE_EXPIRY_KEY,
              STORAGE_TYPE_KEY,
            ]);
          }
        }
        
        if (purchaseStr) {
          setPurchaseDate(new Date(purchaseStr));
        }
      }
    } catch (error) {
      console.error('Error loading premium status:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sincronizar con Firestore si el usuario está autenticado
  const syncWithFirestore = useCallback(async () => {
    if (!user) return;

    try {
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const premiumData = userData?.premium;
        
        if (premiumData) {
          const isActive = premiumData.isActive || false;
          const expiry = premiumData.expiry ? premiumData.expiry.toDate() : null;
          const type = premiumData.type || null;
          const purchase = premiumData.purchaseDate ? premiumData.purchaseDate.toDate() : null;
          
          // Verificar si expiró
          if (expiry && expiry < new Date() && type !== 'lifetime') {
            // Actualizar en Firestore
            await db.collection('users').doc(user.uid).update({
              'premium.isActive': false,
            });
            setIsPremium(false);
            setSubscriptionType(null);
            setSubscriptionExpiry(null);
            setPurchaseDate(null);
          } else if (isActive) {
            setIsPremium(true);
            setSubscriptionType(type);
            setSubscriptionExpiry(expiry);
            setPurchaseDate(purchase);
            
            // Guardar en AsyncStorage
            await AsyncStorage.multiSet([
              [STORAGE_KEY, 'true'],
              [STORAGE_EXPIRY_KEY, expiry ? expiry.toISOString() : ''],
              [STORAGE_TYPE_KEY, type || ''],
              [STORAGE_PURCHASE_KEY, purchase ? purchase.toISOString() : ''],
            ]);
          }
        }
      }
    } catch (error) {
      console.error('Error syncing premium status with Firestore:', error);
    }
  }, [user]);

  // Refrescar estado premium
  const refreshPremiumStatus = useCallback(async () => {
    setIsLoading(true);
    await loadPremiumStatus();
    if (user) {
      await syncWithFirestore();
    }
    setIsLoading(false);
  }, [loadPremiumStatus, syncWithFirestore, user]);

  // Cargar estado inicial
  useEffect(() => {
    loadPremiumStatus();
  }, [loadPremiumStatus]);

  // Sincronizar cuando el usuario cambia
  useEffect(() => {
    if (user) {
      syncWithFirestore();
    } else {
      // Limpiar estado premium si el usuario cierra sesión
      setIsPremium(false);
      setSubscriptionType(null);
      setSubscriptionExpiry(null);
      setPurchaseDate(null);
    }
  }, [user, syncWithFirestore]);

  // Actualizar Analytics cuando cambia el estado premium
  useEffect(() => {
    setUserProperties({
      is_premium: isPremium,
      subscription_type: subscriptionType || 'none',
    });
  }, [isPremium, subscriptionType]);

  const value: PremiumContextType = useMemo(
    () => ({
      isPremium,
      isLoading,
      subscriptionType,
      subscriptionExpiry,
      purchaseDate,
      refreshPremiumStatus,
    }),
    [isPremium, isLoading, subscriptionType, subscriptionExpiry, purchaseDate, refreshPremiumStatus]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
};

export const usePremium = (): PremiumContextType => {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

/**
 * Helper para activar premium (usado después de compra exitosa)
 */
export const activatePremium = async (
  userId: string,
  type: 'monthly' | 'yearly' | 'lifetime',
  transactionId: string
) => {
  try {
    const now = new Date();
    let expiry: Date | null = null;

    if (type === 'monthly') {
      expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días
    } else if (type === 'yearly') {
      expiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 365 días
    } else if (type === 'lifetime') {
      expiry = null; // Sin expiración
    }

    // Guardar en Firestore
    await db.collection('users').doc(userId).set(
      {
        premium: {
          isActive: true,
          type,
          expiry: expiry ? firebase.firestore.Timestamp.fromDate(expiry) : null,
          purchaseDate: firebase.firestore.Timestamp.fromDate(now),
          transactionId,
          lastUpdated: firebase.firestore.Timestamp.fromDate(now),
        },
      },
      { merge: true }
    );

    // Guardar en AsyncStorage
    await AsyncStorage.multiSet([
      [STORAGE_KEY, 'true'],
      [STORAGE_EXPIRY_KEY, expiry ? expiry.toISOString() : ''],
      [STORAGE_TYPE_KEY, type],
      [STORAGE_PURCHASE_KEY, now.toISOString()],
    ]);

    return true;
  } catch (error) {
    console.error('Error activating premium:', error);
    throw error;
  }
};

