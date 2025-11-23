import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Platform, View, Text } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types/navigation';
import { trackScreenView, trackSessionStart } from '../utils/analytics';
import SplashScreen from '../components/SplashScreen';
// HomeScreenRedesign se importa directamente porque es la pantalla principal del tab
import HomeScreenRedesign from '../screens/HomeScreenRedesign';

// Tipos para el módulo de Onboarding
interface OnboardingModule {
  default?: React.ComponentType<{ onComplete: () => void }>;
  Onboarding?: React.ComponentType<{ onComplete: () => void }>;
  useOnboardingStatus?: () => { isCompleted: boolean; isLoading: boolean };
}

interface OnboardingModuleResult {
  Onboarding: React.ComponentType<{ onComplete: () => void }> | null;
  useOnboardingStatus: (() => { isCompleted: boolean; isLoading: boolean }) | null;
}

// Lazy load Onboarding para evitar que bloquee el registro del componente principal
let OnboardingComponent: React.ComponentType<{ onComplete: () => void }> | null = null;
let useOnboardingStatusHook: (() => { isCompleted: boolean; isLoading: boolean }) | null = null;

const loadOnboarding = (): OnboardingModuleResult => {
  if (OnboardingComponent !== null && useOnboardingStatusHook !== null) {
    return { Onboarding: OnboardingComponent, useOnboardingStatus: useOnboardingStatusHook };
  }
  
  try {
    // Intentar cargar el módulo
    let onboardingModule: OnboardingModule | undefined;
    try {
      onboardingModule = require('../components/Onboarding') as OnboardingModule;
    } catch (requireError: unknown) {
      const error = requireError instanceof Error ? requireError : new Error(String(requireError));
      console.warn('⚠️ Error requiring Onboarding module:', error.message);
      return { Onboarding: null, useOnboardingStatus: null };
    }
    
    // Verificar que el módulo existe y tiene las exportaciones esperadas
    if (!onboardingModule || typeof onboardingModule !== 'object') {
      console.warn('⚠️ Onboarding module is undefined or invalid. Type:', typeof onboardingModule);
      return { Onboarding: null, useOnboardingStatus: null };
    }
    
    // Intentar obtener el componente default
    OnboardingComponent = onboardingModule.default || null;
    
    // Si no hay default, intentar obtener Onboarding directamente
    if (!OnboardingComponent && onboardingModule.Onboarding) {
      OnboardingComponent = onboardingModule.Onboarding;
    }
    
    // Obtener el hook
    useOnboardingStatusHook = onboardingModule.useOnboardingStatus || null;
    
    if (!OnboardingComponent) {
      const availableKeys = onboardingModule ? Object.keys(onboardingModule) : [];
      console.warn('⚠️ Onboarding component not found in module. Available keys:', availableKeys);
      return { Onboarding: null, useOnboardingStatus: useOnboardingStatusHook || null };
    }
    
    if (!useOnboardingStatusHook) {
      console.warn('⚠️ useOnboardingStatus hook not found in module');
      return { Onboarding: OnboardingComponent, useOnboardingStatus: null };
    }
    
    console.log('✅ Onboarding module loaded successfully');
    return { Onboarding: OnboardingComponent, useOnboardingStatus: useOnboardingStatusHook };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.warn('⚠️ Unexpected error loading Onboarding component:', err.message);
    return { Onboarding: null, useOnboardingStatus: null };
  }
};

// Hook wrapper que siempre se puede llamar, incluso si el módulo no está cargado
// Usa AsyncStorage directamente para evitar depender del módulo completo
// IMPORTANTE: No llama hooks condicionalmente para cumplir con las reglas de React
const useOnboardingStatusSafe = () => {
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const checkOnboardingStatus = async () => {
    if (Platform.OS === 'web') {
      setIsCompleted(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // NO llamar useOnboardingStatusHook() aquí porque es un hook y no puede ser llamado condicionalmente
      // Siempre usar AsyncStorage directamente para mantener consistencia
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const completed = await AsyncStorage.getItem('@onboarding:completed');
      // Si es null o undefined, significa que es cuenta nueva y debe mostrar onboarding (false)
      // Si es 'true', está completado
      // Si es 'false', no está completado
      if (completed === null || completed === undefined) {
        setIsCompleted(false); // Cuenta nueva, mostrar onboarding
      } else {
        setIsCompleted(completed === 'true');
      }
    } catch (error) {
      console.warn('Error checking onboarding status:', error);
      setIsCompleted(false); // En caso de error, mostrar onboarding para estar seguro
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkOnboardingStatus();
  }, [refreshTrigger]);

  // Función para forzar actualización (se expone para uso externo)
  const refresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Retornar el estado del onboarding
  // Si isCompleted es null, aún está cargando (isLoading debería ser true)
  // Si isCompleted es false, no está completado (cuenta nueva o no completado) - DEBE mostrar onboarding
  // Si isCompleted es true, está completado - NO debe mostrar onboarding
  return { 
    isCompleted: isCompleted ?? false, // Si es null, retornar false (cuenta nueva)
    isLoading, 
    refresh 
  };
};

// Pantallas de autenticación
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Lazy loading de pantallas principales para mejorar tiempo de inicio
const DashboardScreen = React.lazy(() => import('../screens/DashboardScreen'));
const ExamenScreen = React.lazy(() => import('../screens/ExamenScreen'));
const SubscriptionScreen = React.lazy(() => import('../screens/SubscriptionScreen'));

// Pantallas de estudio (lazy loading)
const StudyScreenModerno = React.lazy(() => import('../screens/StudyScreenModerno'));
const SubcategoriasScreenModerno = React.lazy(() => import('../screens/SubcategoriasScreenModerno'));
const StudyCardsScreenModerno = React.lazy(() => import('../screens/StudyCardsScreenModerno'));
const StudyCardsByTypeScreen = React.lazy(() => import('../screens/StudyCardsByTypeScreen'));
const ExplanationScreenModerno = React.lazy(() => import('../screens/ExplanationScreenModerno'));

// Pantallas de práctica (lazy loading)
const PruebaPracticaScreenModerno = React.lazy(() => import('../screens/PruebaPracticaScreenModerno'));
const CategoryPracticeScreen = React.lazy(() => import('../screens/practice/CategoryPracticeScreen'));
const CategoryPracticeScreenModerno = React.lazy(() => import('../screens/practice/CategoryPracticeScreenModerno'));
const RandomPracticeScreen = React.lazy(() => import('../screens/practice/RandomPracticeScreen'));
const IncorrectPracticeScreen = React.lazy(() => import('../screens/IncorrectPracticeScreen'));
const MarkedPracticeScreen = React.lazy(() => import('../screens/MarkedPracticeScreen'));
const QuestionTypePracticeScreen = React.lazy(() => import('../screens/practice/QuestionTypePracticeScreen'));
const QuestionTypePracticeScreenModerno = React.lazy(() => import('../screens/practice/QuestionTypePracticeScreenModerno'));
const Random20PracticeScreen = React.lazy(() => import('../screens/practice/Random20PracticeScreen'));
const Random20PracticeScreenModerno = React.lazy(() => import('../screens/practice/Random20PracticeScreenModerno'));
const AIInterviewN400ScreenModerno = React.lazy(() => import('../screens/practice/AIInterviewN400ScreenModerno'));
const PhotoMemoryScreen = React.lazy(() => import('../screens/practice/PhotoMemoryScreen'));
const PhotoMemoryScreenModerno = React.lazy(() => import('../screens/practice/PhotoMemoryScreenModerno'));
const VocabularioScreenModernoV2 = React.lazy(() => import('../screens/VocabularioScreenModernoV2'));
const SpacedRepetitionPracticeScreen = React.lazy(() => import('../screens/practice/SpacedRepetitionPracticeScreen'));

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStackNavigator = createNativeStackNavigator();
const StudyStackNavigator = createNativeStackNavigator();
const PracticeStackNavigator = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <AuthStackNavigator.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'fade',
    }}
  >
    <AuthStackNavigator.Screen name="Login" component={LoginScreen} />
    <AuthStackNavigator.Screen name="Register" component={RegisterScreen} />
  </AuthStackNavigator.Navigator>
);

// Componente de carga para lazy loading
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
    <Text>Cargando...</Text>
  </View>
);

const StudyStack = () => (
  <Suspense fallback={<LoadingScreen />}>
    <StudyStackNavigator.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <StudyStackNavigator.Screen name="StudyHome" component={StudyScreenModerno} />
      <StudyStackNavigator.Screen name="Subcategorias" component={SubcategoriasScreenModerno} />
      <StudyStackNavigator.Screen name="StudyCards" component={StudyCardsScreenModerno} />
      <StudyStackNavigator.Screen name="StudyCardsByType" component={StudyCardsByTypeScreen} />
      <StudyStackNavigator.Screen
        name="QuestionTypePracticeHome"
        component={QuestionTypePracticeScreenModerno}
      />
      <StudyStackNavigator.Screen
        name="Explanation"
        component={ExplanationScreenModerno}
        options={{ presentation: 'modal' }}
      />
    </StudyStackNavigator.Navigator>
  </Suspense>
);

const PracticeStack = () => (
  <Suspense fallback={<LoadingScreen />}>
    <PracticeStackNavigator.Navigator
      initialRouteName="PruebaPracticaHome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
    <PracticeStackNavigator.Screen
      name="PruebaPracticaHome"
      component={PruebaPracticaScreenModerno}
    />
    <PracticeStackNavigator.Screen
      name="CategoryPracticeHome"
      component={CategoryPracticeScreenModerno}
    />
    <PracticeStackNavigator.Screen name="CategoryPractice" component={CategoryPracticeScreen} />
    <PracticeStackNavigator.Screen name="RandomPractice" component={RandomPracticeScreen} />
    <PracticeStackNavigator.Screen name="IncorrectPractice" component={IncorrectPracticeScreen} />
    <PracticeStackNavigator.Screen name="MarkedPractice" component={MarkedPracticeScreen} />
    <PracticeStackNavigator.Screen
      name="QuestionTypePracticeHome"
      component={QuestionTypePracticeScreenModerno}
    />
    <PracticeStackNavigator.Screen
      name="Random20PracticeHome"
      component={Random20PracticeScreenModerno}
    />
    <PracticeStackNavigator.Screen
      name="EntrevistaAIHome"
      component={AIInterviewN400ScreenModerno}
    />
    <PracticeStackNavigator.Screen
      name="PhotoMemoryHome"
      component={PhotoMemoryScreenModerno}
    />
    <PracticeStackNavigator.Screen
      name="VocabularioHome"
      component={VocabularioScreenModernoV2}
    />
    <PracticeStackNavigator.Screen name="ExamenHome" component={ExamenScreen} />
    <PracticeStackNavigator.Screen
      name="SpacedRepetitionPractice"
      component={SpacedRepetitionPracticeScreen}
    />
  </PracticeStackNavigator.Navigator>
  </Suspense>
);

const AppTabNavigator = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          // Iconos más pequeños: 20px
          const iconSize = 20;
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'home';
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Study') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Practice') {
            iconName = focused ? 'pencil-box' : 'pencil-box-outline';
          }
          return <MaterialCommunityIcons name={iconName} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: '#1E40AF', // Azul profesional
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',
          borderTopWidth: 1,
          height: 42 + (Platform.OS === 'ios' ? Math.max(insets.bottom - 8, 0) : 0), // Reducido 14%: de 49 a 42px + safe area
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom - 8, 4) : 4, // Ajustar para safe area
          paddingTop: 10, // Padding superior para subir contenido
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2, // Acercar texto a iconos
          paddingTop: 0,
          marginBottom: 0,
          lineHeight: 10,
        },
        tabBarIconStyle: {
          marginTop: -3, // Subir iconos
          marginBottom: 2, // Pequeño espacio antes del texto
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          paddingHorizontal: 0,
          justifyContent: 'center',
          alignItems: 'center',
        },
      })}
    >
    <Tab.Screen
      name="Home"
      component={HomeScreenRedesign as React.ComponentType<any>}
      options={{ tabBarLabel: 'Inicio' }}
    />
    <Tab.Screen name="Study" component={StudyStack} options={{ tabBarLabel: 'Estudio' }} />
    <Tab.Screen name="Practice" component={PracticeStack} options={{ tabBarLabel: 'Práctica' }} />
    </Tab.Navigator>
  );
};


export default function AppNavigator() {
  const { user, loading } = useAuth();
  const [onboardingModule, setOnboardingModule] = useState<OnboardingModuleResult | null>(null);
  const [hasShownSplash, setHasShownSplash] = useState(false);
  const [showSplash, setShowSplash] = useState(true); // Mostrar splash al inicio
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const routeNameRef = useRef<string | undefined>(undefined);

  // IMPORTANTE: Llamar useOnboardingStatusSafe ANTES de cualquier return condicional
  // para cumplir con las reglas de los hooks de React
  const { isCompleted: onboardingCompleted, isLoading: onboardingLoading, refresh: refreshOnboardingStatus } = useOnboardingStatusSafe();

  // Cargar Onboarding de forma lazy solo cuando hay usuario autenticado
  // IMPORTANTE: Cargar el módulo tan pronto como haya usuario, incluso si aún está cargando
  // para que esté disponible cuando se necesite
  useEffect(() => {
    if (Platform.OS === 'web') {
      // No cargar Onboarding en web
      return;
    }
    
    // Cargar Onboarding cuando hay usuario autenticado (incluso si aún está verificando)
    // Esto asegura que el módulo esté disponible cuando se determine si debe mostrarse
    if (user && !onboardingModule) {
      const module = loadOnboarding();
      setOnboardingModule(module);
      if (__DEV__) {
        console.log('📦 Módulo de onboarding cargado:', {
          hasOnboarding: !!module.Onboarding,
          hasHook: !!module.useOnboardingStatus,
        });
      }
    }
  }, [user, onboardingModule]);

  // Trackear sesión al iniciar
  useEffect(() => {
    trackSessionStart();
  }, []);

  // Trackear cambios de pantalla
  const handleNavigationStateChange = () => {
    const previousRouteName = routeNameRef.current;
    const currentRoute = navigationRef.current?.getCurrentRoute();
    const currentRouteName = currentRoute?.name;

    if (previousRouteName !== currentRouteName && currentRouteName) {
      trackScreenView(currentRouteName, {
        previous_screen: previousRouteName || 'none',
        user_id: user?.uid || 'anonymous',
      });
    }

    routeNameRef.current = currentRouteName;
  };

  const handleOnboardingComplete = () => {
    // Forzar actualización del estado del onboarding
    // Esto asegura que se re-lea AsyncStorage y se actualice el estado inmediatamente
    if (refreshOnboardingStatus) {
      refreshOnboardingStatus();
    }
    // Pequeño delay para asegurar que AsyncStorage se haya guardado
    setTimeout(() => {
      if (refreshOnboardingStatus) {
        refreshOnboardingStatus();
      }
    }, 100);
  };

  // Manejar cuando el splash termina
  const handleSplashComplete = () => {
    setShowSplash(false);
    setHasShownSplash(true);
  };

  // Ocultar splash automáticamente cuando termine la inicialización
  useEffect(() => {
    if (!loading && !onboardingLoading && hasShownSplash && showSplash) {
      // Si ya se mostró el splash pero sigue visible y la inicialización terminó,
      // ocultarlo después de un pequeño delay para asegurar transición suave
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, onboardingLoading, hasShownSplash, showSplash]);

  // Determinar qué mostrar ANTES de cualquier return
  // Esta lógica debe ser calculada después de todos los hooks pero antes de los returns
  const isInitializing = loading || onboardingLoading;
  // Mostrar onboarding si:
  // 1. No está inicializando (terminó de cargar auth y onboarding status)
  // 2. No está mostrando splash
  // 3. Hay usuario autenticado
  // 4. El módulo de onboarding está cargado
  // 5. El onboarding NO está completado (false significa no completado - cuenta nueva o no completado)
  // 6. No es web
  // IMPORTANTE: No verificar null aquí porque isLoading ya maneja eso
  // Si isLoading es false y onboardingCompleted es false, significa cuenta nueva y debe mostrar onboarding
  const shouldShowOnboarding = !isInitializing && 
                                !showSplash &&
                                user && 
                                onboardingModule?.Onboarding && 
                                onboardingCompleted === false &&
                                Platform.OS !== 'web';

  // Debug logging para entender el flujo
  useEffect(() => {
    if (!isInitializing && !showSplash) {
      console.log('🔍 Estado navegación:', {
        loading,
        onboardingLoading,
        hasUser: !!user,
        hasModule: !!onboardingModule?.Onboarding,
        onboardingCompleted,
        shouldShowOnboarding,
        platform: Platform.OS,
        showSplash,
      });
    }
  }, [loading, onboardingLoading, user, onboardingModule, onboardingCompleted, shouldShowOnboarding, isInitializing, showSplash]);

  // AHORA SÍ podemos hacer returns condicionales después de todos los hooks
  // 1. Si debe mostrar splash (al inicio) → Mostrar SplashScreen con animaciones
  if (showSplash && Platform.OS !== 'web') {
    return (
      <SplashScreen 
        onFinish={handleSplashComplete} 
        duration={2500} // Duración del splash personalizado
      />
    );
  }

  // 2. Si está inicializando (verificando auth o onboarding) después del splash → Mostrar nada (esperar)
  // Esto previene que se muestre algo antes de determinar qué mostrar
  if (isInitializing && hasShownSplash) {
    return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  }

  // 2. Si debe mostrar onboarding (usuario autenticado + onboarding no completado) → Mostrar Onboarding
  // IMPORTANTE: Esto debe ir ANTES de renderizar NavigationContainer para evitar el flash de Home
  if (shouldShowOnboarding) {
    const Onboarding = onboardingModule?.Onboarding;
    if (Onboarding) {
      return <Onboarding onComplete={handleOnboardingComplete} />;
    }
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
      }}
      onStateChange={handleNavigationStateChange}
    >
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <RootStack.Screen name="AuthStack" component={AuthStack} />
        ) : (
          <>
            <RootStack.Screen name="AppTabs" component={AppTabNavigator} />
            <RootStack.Screen 
              name="Subscription" 
              component={() => (
                <Suspense fallback={<LoadingScreen />}>
                  <SubscriptionScreen />
                </Suspense>
              )}
              options={{ presentation: 'modal' }}
            />
            <RootStack.Screen 
              name="ExamenHome" 
              component={() => (
                <Suspense fallback={<LoadingScreen />}>
                  <ExamenScreen />
                </Suspense>
              )}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}