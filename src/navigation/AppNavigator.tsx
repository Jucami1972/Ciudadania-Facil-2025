import React, { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types/navigation';
import { trackScreenView, trackSessionStart } from '../utils/analytics';
import Onboarding, { useOnboardingStatus } from '../components/Onboarding';

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
      tabBarActiveTintColor: '#7c3aed',
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
      component={HomeScreenRedesign || HomeScreenModerno || HomeScreen}
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
  const { isCompleted: onboardingCompleted, isLoading: onboardingLoading } = useOnboardingStatus();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const routeNameRef = useRef<string | undefined>();

  // Mostrar onboarding si el usuario está autenticado y no lo ha completado
  useEffect(() => {
    if (!loading && !onboardingLoading && user && onboardingCompleted === false) {
      setShowOnboarding(true);
    }
  }, [loading, onboardingLoading, user, onboardingCompleted]);

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
    setShowOnboarding(false);
  };

  if (loading || onboardingLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  // Mostrar onboarding si es necesario
  if (showOnboarding && user) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
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