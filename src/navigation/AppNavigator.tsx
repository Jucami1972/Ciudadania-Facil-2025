import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RootStackParamList } from '../types/navigation';

// Pantallas principales
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
import IncorrectPracticeScreen from '../screens/IncorrectPracticeScreen';
import MarkedPracticeScreen from '../screens/MarkedPracticeScreen';
import CategoryPracticeScreen from '../screens/practice/CategoryPracticeScreen';
import RandomPracticeScreen from '../screens/practice/RandomPracticeScreen';

// Wrappers de categorías
import GobiernoAmericanoWrapper from '../wrappers/GobiernoAmericanoWrapper';
import HistoriaAmericanaWrapper from '../wrappers/HistoriaAmericanaWrapper';
import EducacionCivicaWrapper from '../wrappers/EducacionCivicaWrapper';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Determinar qué componente usar para Home
const HomeComponent = Platform.OS === 'web' ? DashboardScreen : HomeScreen;

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      >
        {/* Grupo de pantallas principales */}
        <Stack.Group>
          <Stack.Screen 
            name="Home" 
            component={HomeComponent}
            options={{
              animation: 'fade',
            }}
          />
          <Stack.Screen name="TarjetasDeEstudio" component={StudyScreen} />
          <Stack.Screen name="Subcategorias" component={SubcategoriasScreen} />
        </Stack.Group>

        {/* Grupo de wrappers por categoría */}
        <Stack.Group>
          <Stack.Screen name="GobiernoAmericano" component={GobiernoAmericanoWrapper} />
          <Stack.Screen name="HistoriaAmericana" component={HistoriaAmericanaWrapper} />
          <Stack.Screen name="EducacionCivica" component={EducacionCivicaWrapper} />
        </Stack.Group>

        {/* Grupo de pantallas de estudio y práctica */}
        <Stack.Group>
          <Stack.Screen name="StudyCards" component={StudyCardsScreen} />
          <Stack.Screen name="PruebaPractica" component={PruebaPracticaScreen} />
          <Stack.Screen name="CategoryPractice" component={CategoryPracticeScreen} />
          <Stack.Screen name="RandomPractice" component={RandomPracticeScreen} />
          <Stack.Screen name="IncorrectPractice" component={IncorrectPracticeScreen} />
          <Stack.Screen name="MarkedPractice" component={MarkedPracticeScreen} />
          <Stack.Screen name="Vocabulario" component={VocabularioScreen} />
          <Stack.Screen name="EntrevistaAI" component={EntrevistaAIScreen} />
          <Stack.Screen name="Examen" component={ExamenScreen} />
        </Stack.Group>

        {/* Modal de explicación */}
        <Stack.Group screenOptions={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: false,
          gestureEnabled: true,
        }}>
          <Stack.Screen 
            name="Explanation" 
            component={ExplanationScreen}
          />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}