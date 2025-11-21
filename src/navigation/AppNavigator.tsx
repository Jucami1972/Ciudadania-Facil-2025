import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types/navigation';
import { trackScreenView, trackSessionStart } from '../utils/analytics';
import SplashScreen from '../components/SplashScreen';

// Lazy load Onboarding para evitar que bloquee el registro del componente principal
let OnboardingComponent: React.ComponentType<any> | null = null;
let useOnboardingStatusHook: (() => { isCompleted: boolean; isLoading: boolean }) | null = null;

const loadOnboarding = () => {
  if (OnboardingComponent !== null && useOnboardingStatusHook !== null) {
    return { Onboarding: OnboardingComponent, useOnboardingStatus: useOnboardingStatusHook };
  }
  
  try {
    // Intentar cargar el módulo
    let onboardingModule: any;
    try {
      onboardingModule = require('../components/Onboarding');
    } catch (requireError: any) {
      console.warn('⚠️ Error requiring Onboarding module:', requireError?.message || requireError);
      return { Onboarding: null, useOnboardingStatus: null };
    }
    
    // Verificar que el módulo existe y tiene las exportaciones esperadas
    if (!onboardingModule || typeof onboardingModule !== 'object') {
      console.warn('⚠️ Onboarding module is undefined or invalid. Type:', typeof onboardingModule);
      return { Onboarding: null, useOnboardingStatus: null };
    }
    
    // Intentar obtener el componente default
    OnboardingComponent = onboardingModule.default;
    
    // Si no hay default, intentar obtener Onboarding directamente
    if (!OnboardingComponent && onboardingModule.Onboarding) {
      OnboardingComponent = onboardingModule.Onboarding;
    }
    
    // Obtener el hook
    useOnboardingStatusHook = onboardingModule.useOnboardingStatus;
    
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
  } catch (error: any) {
    console.warn('⚠️ Unexpected error loading Onboarding component:', error?.message || error);
    return { Onboarding: null, useOnboardingStatus: null };
  }
};

// Hook wrapper que siempre se puede llamar, incluso si el módulo no está cargado
// Usa AsyncStorage directamente para evitar depender del módulo completo
// IMPORTANTE: No llama hooks condicionalmente para cumplir con las reglas de React
const useOnboardingStatusSafe = () => {
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsCompleted(true);
      setIsLoading(false);
      return;
    }

    const checkOnboardingStatus = async () => {
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

    checkOnboardingStatus();
  }, []);

  return { isCompleted: isCompleted ?? false, isLoading };
};

// Pantallas de autenticación
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Pantallas legacy (fallback)
import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import StudyScreen from '../screens/StudyScreen';
import SubcategoriasScreen from '../screens/SubcategoriasScreen';
import StudyCardsScreen from '../screens/StudyCardsScreen';
import ExplanationScreen from '../screens/ExplanationScreen';
import PruebaPracticaScreen from '../screens/PruebaPracticaScreen';
import VocabularioScreen from '../screens/VocabularioScreen';
import EntrevistaAIScreen from '../screens/EntrevistaAIScreen';
import ExamenScreen from '../screens/ExamenScreen';
import CategoryPracticeScreen from '../screens/practice/CategoryPracticeScreen';
import RandomPracticeScreen from '../screens/practice/RandomPracticeScreen';
import IncorrectPracticeScreen from '../screens/IncorrectPracticeScreen';
import MarkedPracticeScreen from '../screens/MarkedPracticeScreen';
import QuestionTypePracticeScreen from '../screens/practice/QuestionTypePracticeScreen';
import Random20PracticeScreen from '../screens/practice/Random20PracticeScreen';
import PhotoMemoryScreen from '../screens/practice/PhotoMemoryScreen';
import SpacedRepetitionPracticeScreen from '../screens/practice/SpacedRepetitionPracticeScreen';

// Pantallas modernas
import HomeScreenModerno from '../screens/HomeScreenModerno';
import HomeScreenRedesign from '../screens/HomeScreenRedesign';
import StudyScreenModerno from '../screens/StudyScreenModerno';
import SubcategoriasScreenModerno from '../screens/SubcategoriasScreenModerno';
import StudyCardsScreenModerno from '../screens/StudyCardsScreenModerno';
import StudyCardsByTypeScreen from '../screens/StudyCardsByTypeScreen';
import ExplanationScreenModerno from '../screens/ExplanationScreenModerno';
import PruebaPracticaScreenModerno from '../screens/PruebaPracticaScreenModerno';
import CategoryPracticeScreenModerno from '../screens/practice/CategoryPracticeScreenModerno';
import QuestionTypePracticeScreenModerno from '../screens/practice/QuestionTypePracticeScreenModerno';
import Random20PracticeScreenModerno from '../screens/practice/Random20PracticeScreenModerno';
import AIInterviewN400ScreenModerno from '../screens/practice/AIInterviewN400ScreenModerno';
import PhotoMemoryScreenModerno from '../screens/practice/PhotoMemoryScreenModerno';
import VocabularioScreenModernoV2 from '../screens/VocabularioScreenModernoV2';
import SubscriptionScreen from '../screens/SubscriptionScreen';

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

const StudyStack = () => (
  <StudyStackNavigator.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <StudyStackNavigator.Screen name="StudyHome" component={StudyScreenModerno || StudyScreen} />
    <StudyStackNavigator.Screen name="Subcategorias" component={SubcategoriasScreenModerno || SubcategoriasScreen} />
    <StudyStackNavigator.Screen name="StudyCards" component={StudyCardsScreenModerno || StudyCardsScreen} />
    <StudyStackNavigator.Screen name="StudyCardsByType" component={StudyCardsByTypeScreen} />
    <StudyStackNavigator.Screen
      name="QuestionTypePracticeHome"
      component={QuestionTypePracticeScreenModerno || QuestionTypePracticeScreen}
    />
    <StudyStackNavigator.Screen
      name="Explanation"
      component={ExplanationScreenModerno || ExplanationScreen}
      options={{ presentation: 'modal' }}
    />
  </StudyStackNavigator.Navigator>
);

const PracticeStack = () => (
  <PracticeStackNavigator.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <PracticeStackNavigator.Screen
      name="PruebaPracticaHome"
      component={PruebaPracticaScreenModerno || PruebaPracticaScreen}
    />
    <PracticeStackNavigator.Screen
      name="CategoryPracticeHome"
      component={CategoryPracticeScreenModerno || CategoryPracticeScreen}
    />
    <PracticeStackNavigator.Screen name="CategoryPractice" component={CategoryPracticeScreen} />
    <PracticeStackNavigator.Screen name="RandomPractice" component={RandomPracticeScreen} />
    <PracticeStackNavigator.Screen name="IncorrectPractice" component={IncorrectPracticeScreen} />
    <PracticeStackNavigator.Screen name="MarkedPractice" component={MarkedPracticeScreen} />
    <PracticeStackNavigator.Screen
      name="QuestionTypePracticeHome"
      component={QuestionTypePracticeScreenModerno || QuestionTypePracticeScreen}
    />
    <PracticeStackNavigator.Screen
      name="Random20PracticeHome"
      component={Random20PracticeScreenModerno || Random20PracticeScreen}
    />
    <PracticeStackNavigator.Screen
      name="EntrevistaAIHome"
      component={AIInterviewN400ScreenModerno || EntrevistaAIScreen}
    />
    <PracticeStackNavigator.Screen
      name="PhotoMemoryHome"
      component={PhotoMemoryScreenModerno || PhotoMemoryScreen}
    />
    <PracticeStackNavigator.Screen
      name="VocabularioHome"
      component={VocabularioScreenModernoV2 || VocabularioScreen}
    />
    <PracticeStackNavigator.Screen name="ExamenHome" component={ExamenScreen} />
    <PracticeStackNavigator.Screen
      name="SpacedRepetitionPractice"
      component={SpacedRepetitionPracticeScreen}
    />
  </PracticeStackNavigator.Navigator>
);

const AppTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: string = 'home';
        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Study') {
          iconName = focused ? 'book' : 'book-outline';
        } else if (route.name === 'Practice') {
          iconName = focused ? 'pencil-box' : 'pencil-box-outline';
        }
        return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#1E40AF', // Azul profesional
      tabBarInactiveTintColor: '#999',
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopColor: '#eee',
        borderTopWidth: 1,
        height: 60,
        paddingBottom: 6,
        paddingTop: 6,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      },
    })}
  >
    <Tab.Screen
      name="Home"
      component={HomeScreenModerno || HomeScreenRedesign || HomeScreen}
      options={{ tabBarLabel: 'Inicio' }}
    />
    <Tab.Screen name="Study" component={StudyStack} options={{ tabBarLabel: 'Estudio' }} />
    <Tab.Screen name="Practice" component={PracticeStack} options={{ tabBarLabel: 'Práctica' }} />
  </Tab.Navigator>
);

// Determinar qué componente usar para Home
const HomeComponent = Platform.OS === 'web' ? DashboardScreen : HomeScreen;

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const [onboardingModule, setOnboardingModule] = useState<{
    Onboarding: React.ComponentType<any> | null;
    useOnboardingStatus: (() => { isCompleted: boolean; isLoading: boolean }) | null;
  } | null>(null);
  const [hasShownSplash, setHasShownSplash] = useState(false);
  const [showSplash, setShowSplash] = useState(true); // Mostrar splash al inicio
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const routeNameRef = useRef<string | undefined>();

  // IMPORTANTE: Llamar useOnboardingStatusSafe ANTES de cualquier return condicional
  // para cumplir con las reglas de los hooks de React
  const { isCompleted: onboardingCompleted, isLoading: onboardingLoading } = useOnboardingStatusSafe();

  // Cargar Onboarding de forma lazy solo cuando hay usuario autenticado
  useEffect(() => {
    if (Platform.OS === 'web') {
      // No cargar Onboarding en web
      return;
    }
    
    // Cargar Onboarding cuando hay usuario autenticado y no está cargando
    if (!loading && user && !onboardingModule) {
      const module = loadOnboarding();
      setOnboardingModule(module);
    }
  }, [loading, user, onboardingModule]);

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
    // El onboarding se ocultará automáticamente porque onboardingCompleted cambiará
    // Este callback solo confirma que se completó
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
              component={SubscriptionScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}