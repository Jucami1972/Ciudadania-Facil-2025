import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types/navigation';

// Pantallas de autenticación
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Pantallas legacy (fallback)
import HomeScreen from '../screens/HomeScreen';
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

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <RootStack.Screen name="AuthStack" component={AuthStack} />
        ) : (
          <RootStack.Screen name="AppTabs" component={AppTabNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}