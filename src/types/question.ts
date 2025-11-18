// src/types/question.ts

// Tipos de práctica
export type PracticeType = 'written' | 'oral';
export type PracticeInputMode = 'visual' | 'audio';

export type PracticeMode = 'random' | 'category' | 'incorrect' | 'marked' | 'spaced_repetition';

// Tipos básicos
export type QuestionCategory = 
  | 'Gobierno Americano'
  | 'Historia Americana'
  | 'Educación Cívica';

export type QuestionSubcategory = 
  | 'Principios de la Democracia'
  | 'Sistema de Gobierno'
  | 'Derechos y Responsabilidades'
  | 'Período Colonial e Independencia'
  | '1800s'
  | 'Historia Reciente'
  | 'Geografía'
  | 'Símbolos'
  | 'Días Festivos';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

// Interfaces para medios
export interface QuestionMedia {
  url: string;
  type: 'image' | 'audio' | 'video';
  caption?: string;
  transcription?: string;
}

// Interfaz para las opciones de respuesta múltiple
export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

// Interfaz principal para preguntas
export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  category: string;
  section: string;
  
  // Contenido de la pregunta
  question: {
    text: string;
    translation?: string;
    audio?: string;
    visual?: string;
  };
  
  // Respuesta
  answer: string;
  answerTranslation?: string;
  audioAnswer?: string;
  
  // Metadatos
  difficulty: QuestionDifficulty;
  tags?: string[];
  
  // Contenido adicional
  explanation?: string;
  explanationTranslation?: string;
  media?: QuestionMedia[];
  
  // Datos de seguimiento
  statistics?: {
    timesAnswered: number;
    timesCorrect: number;
    averageTime: number;
    lastAnswered?: Date;
  };
  
  // Datos de Repetición Espaciada (SRS)
  srsData?: {
    questionId: number;
    easeFactor: number;
    interval: number; // días
    repetitions: number;
    lastReviewDate: string | null; // ISO string para serialización
    nextReviewDate: string | null; // ISO string para serialización
    quality: number;
  };
}

// Interfaz para respuestas de usuario
export interface QuestionAnswer {
  questionId: number;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  timestamp: Date;
  mode: PracticeMode;
}

// Interfaz para estadísticas de preguntas
export interface QuestionStats {
  correct: number;
  incorrect: number;
  total: number;
  score: number;
  averageTime: number;
}

// Interfaz para el historial de preguntas
export interface QuestionHistory {
  questionId: number;
  attempts: QuestionAnswer[];
  stats: QuestionStats;
}

// Interfaz para filtros de preguntas
export interface QuestionFilters {
  categories?: QuestionCategory[];
  subcategories?: QuestionSubcategory[];
  difficulty?: QuestionDifficulty;
  tags?: string[];
  answered?: boolean;
  correct?: boolean;
  marked?: boolean;
}

// Interfaz para ordenamiento de preguntas
export interface QuestionSorting {
  field: keyof Question | 'successRate' | 'lastAttempt';
  direction: 'asc' | 'desc';
}

// Interfaz para la configuración de la práctica
export interface PracticeConfig {
  mode: PracticeMode;
  category?: QuestionCategory;
  subcategory?: QuestionSubcategory;
  questionCount?: number;
  difficulty?: QuestionDifficulty;
  includeIncorrect?: boolean;
  includeMarked?: boolean;
  useSpacedRepetition?: boolean; // Activar SRS para este modo
}

// Interfaz para el estado de la práctica
export interface PracticeState {
  currentQuestion: Question | null;
  mode: PracticeMode;
  progress: {
    current: number;
    total: number;
    percentage: number;
    timeElapsed: number;
  };
  stats: {
    correct: number;
    incorrect: number;
    skipped: number;
    totalTime: number;
    averageTime: number;
  };
}

export interface PracticeSession {
  correctAnswers: number;
  incorrectAnswers: Set<number>;
  answers: QuestionAnswer[];
  currentQuestionIndex: number;
  isComplete: boolean;
  startTime: Date;
  currentMode: PracticeMode;
  questions: Question[];
  markedQuestions: Set<number>;
}
