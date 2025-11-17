// src/types/navigation.tsx
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CategoryType } from '../constants/categories';

// Interfaces base
export interface SubCategory {
  title: string;
  subtitle: string;
  questionRange: string;
  category: CategoryType;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  category: CategoryType;
  answers: string[];
  correctAnswer: string;
  explanation: {
    es: string;
    en: string;
  };
}

// Types para categorías específicas
export type GovernmentSubcategory =
  | 'A: Principios de la Democracia Americana'
  | 'B: Sistema de Gobierno'
  | 'C: Derechos y Responsabilidades';

export type PracticeType = 'multiple' | 'written' | 'audio' | 'image';
export type PracticeMode = 'category' | 'random' | 'incorrect' | 'marked';

// Stack Navigator Param List
export type RootStackParamList = {
  // Pantallas de autenticación
  Login: undefined;
  Register: undefined;

  // Navegación principal con tabs
  AuthStack: undefined;
  AppTabs: undefined;

  // Pantallas principales (legacy - mantenidas para compatibilidad)
  Home: undefined;
  Study: undefined;
  TarjetasDeEstudio: undefined;
  Vocabulario: undefined;
  EntrevistaAI: undefined;
  Examen: undefined;
  HistoriaAmericana: undefined;
  EducacionCivica: undefined;
  PruebaPractica: {
    mode: PracticeMode;
    category: string;
    section: string;
  };
  CategoryPractice: {
    questionType?: string;
  };
  QuestionTypePractice: undefined;
  Practice: {
    mode: PracticeMode;
    category: string;
    section: string;
    type: PracticeType;
  };
  PracticeMode: {
    mode: PracticeMode;
    category?: string;
  };
  RandomPractice: undefined;
  Random20Practice: undefined;
  PhotoMemory: undefined;
  IncorrectPractice: undefined;
  MarkedPractice: undefined;

  // Pantallas de estudio (nuevas rutas con tabs)
  StudyHome: undefined;
  Subcategorias: { 
    mainCategory: string; 
    categories: SubCategory[] 
  };
  StudyCards: {
    category: CategoryType;
    title: string;
    subtitle: string;
    questionRange: string;
  };
  StudyCardsByType: {
    questionType: string;
    typeName: string;
    typeNameEn: string;
  };
  Explanation: {
    explanationEs: string;
    explanationEn: string;
    questionTitle: string;
  };

  // Pantallas de práctica (nuevas rutas con tabs)
  PruebaPracticaHome: undefined;
  CategoryPracticeHome: undefined;
  QuestionTypePracticeHome: undefined;
  Random20PracticeHome: undefined;
  EntrevistaAIHome: undefined;
  PhotoMemoryHome: undefined;
  VocabularioHome: undefined;
  ExamenHome: undefined;

  // Pantallas de categorías principales
  GobiernoAmericano: { 
    subcategory: string 
  };

  // Premium
  Subscription: undefined;

  ResultsScreen: undefined;
};

export type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

// Types para rutas específicas
export type GovRouteProp = RouteProp<RootStackParamList, 'GobiernoAmericano'>;
export type ExplanationRouteProp = RouteProp<RootStackParamList, 'Explanation'>;
export type StudyCardsRouteProp = RouteProp<RootStackParamList, 'StudyCards'>;
export type SubcategoriasScreenRouteProp = RouteProp<RootStackParamList, 'Subcategorias'>;
export type PracticeScreenRouteProp = RouteProp<RootStackParamList, 'Practice'>;
export type PruebaPracticaRouteProp = RouteProp<RootStackParamList, 'PruebaPractica'>;
export type PracticeModeScreenRouteProp = RouteProp<RootStackParamList, 'PracticeMode'>;
