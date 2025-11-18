// src/hooks/usePracticeSession.ts
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Question,
  QuestionAnswer,
  QuestionStats,
  PracticeMode,
} from '../types/question';
import { shuffleArray } from '../utils/arrayUtils';
import { SpacedRepetitionService, SRSData, ResponseQuality } from '../services/SpacedRepetitionService';
import { QuestionStorageService } from '../services/QuestionStorageService';

interface UsePracticeSessionProps {
  mode: PracticeMode;
  questions: Question[];
  category?: string;
  section?: string;
  questionCount?: number;
}

interface PracticeSession {
  currentMode: PracticeMode;
  questions: Question[];
  currentQuestionIndex: number;
  correctAnswers: number;
  incorrectAnswers: Set<number>;
  markedQuestions: Set<number>;
  answers: QuestionAnswer[];
  startTime: Date;
  isComplete: boolean;
  srsDataMap?: Map<number, SRSData>; // Mapa de datos SRS por pregunta
}

const STORAGE_KEYS = {
  INCORRECT_QUESTIONS: '@practice:incorrect',
  MARKED_QUESTIONS: '@practice:marked',
  PRACTICE_STATS: '@practice:stats',
  LAST_SESSION: '@practice:lastSession'
} as const;

export const usePracticeSession = ({
  mode,
  questions,
  category,
  section,
  questionCount = 10
}: UsePracticeSessionProps) => {
  const [session, setSession] = useState<PracticeSession>(() => ({
    currentMode: mode,
    questions: [],
    currentQuestionIndex: 0,
    correctAnswers: 0,
    incorrectAnswers: new Set<number>(),
    markedQuestions: new Set<number>(),
    answers: [],
    startTime: new Date(),
    isComplete: false,
    srsDataMap: new Map<number, SRSData>(),
  }));

  // Inicialización y carga de datos persistentes
  useEffect(() => {
    const initializeSession = async () => {
      try {
        await loadPersistedData();
        await initializeQuestions();
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initializeSession();
  }, []);

  const loadPersistedData = async () => {
    try {
      const [incorrectData, markedData, srsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.INCORRECT_QUESTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.MARKED_QUESTIONS),
        QuestionStorageService.getAllSRSData(),
      ]);

      // Convertir datos SRS a Map
      const srsMap = new Map<number, SRSData>();
      if (srsData) {
        Object.entries(srsData).forEach(([questionId, data]: [string, any]) => {
          const srsDataObj = SpacedRepetitionService.getSRSData(
            parseInt(questionId),
            data
          );
          srsMap.set(parseInt(questionId), srsDataObj);
        });
      }

      setSession(prev => ({
        ...prev,
        incorrectAnswers: new Set(JSON.parse(incorrectData || '[]')),
        markedQuestions: new Set(JSON.parse(markedData || '[]')),
        srsDataMap: srsMap,
      }));
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  };

  const initializeQuestions = useCallback(async () => {
    let filteredQuestions = [...questions];

    if (category) {
      filteredQuestions = filteredQuestions.filter(q => q.category === category);
    }
    if (section) {
      filteredQuestions = filteredQuestions.filter(q => q.section === section);
    }

    let selectedQuestions: Question[] = [];

    // Modo de Repetición Espaciada: obtener preguntas listas para revisión
    if (mode === 'spaced_repetition') {
      const srsDataMap = session.srsDataMap || new Map<number, SRSData>();
      
      // Obtener preguntas listas para revisión
      const readyQuestionIds = SpacedRepetitionService.getQuestionsReadyForReview(
        filteredQuestions,
        srsDataMap
      );

      // Si hay preguntas listas, usarlas; si no, usar todas las preguntas nuevas
      if (readyQuestionIds.length > 0) {
        selectedQuestions = filteredQuestions
          .filter(q => readyQuestionIds.includes(q.id))
          .slice(0, questionCount);
      } else {
        // Si no hay preguntas listas, mostrar preguntas nuevas o sin revisar
        selectedQuestions = filteredQuestions
          .filter(q => {
            const srsData = srsDataMap.get(q.id);
            return !srsData || !srsData.nextReviewDate;
          })
          .slice(0, questionCount);
      }

      // Si aún no hay suficientes, completar con preguntas aleatorias
      if (selectedQuestions.length < questionCount) {
        const remaining = questionCount - selectedQuestions.length;
        const usedIds = new Set(selectedQuestions.map(q => q.id));
        const additional = filteredQuestions
          .filter(q => !usedIds.has(q.id))
          .slice(0, remaining);
        selectedQuestions = [...selectedQuestions, ...additional];
      }
    } else {
      // Modos normales: aleatoriedad simple
      selectedQuestions = shuffleArray(filteredQuestions).slice(0, questionCount);
    }

    setSession(prev => ({
      ...prev,
      questions: selectedQuestions
    }));
  }, [questions, category, section, questionCount, mode, session.srsDataMap]);

  // Manejadores de acciones
  const handleAnswer = useCallback(async (answer: string, isCorrect: boolean) => {
    const currentQuestion = session.questions[session.currentQuestionIndex];
    const timeSpent = new Date().getTime() - session.startTime.getTime();

    const questionAnswer: QuestionAnswer = {
      questionId: currentQuestion.id,
      answer: answer,
      isCorrect,
      timeSpent,
      timestamp: new Date(),
      mode: session.currentMode,
    };

    // Actualizar datos SRS si está habilitado
    if (mode === 'spaced_repetition' || session.currentMode === 'spaced_repetition') {
      const srsDataMap = session.srsDataMap || new Map<number, SRSData>();
      const currentSRSData = srsDataMap.get(currentQuestion.id);
      
      // Obtener datos SRS existentes o crear nuevos
      const existingSRSData = currentSRSData 
        ? SpacedRepetitionService.getSRSData(currentQuestion.id, currentSRSData)
        : SpacedRepetitionService.getSRSData(currentQuestion.id);

      // Convertir respuesta a calidad (0-5)
      const quality: ResponseQuality = SpacedRepetitionService.convertBooleanToQuality(
        isCorrect,
        timeSpent
      );

      // Calcular próxima revisión
      const updatedSRSData = SpacedRepetitionService.calculateNextReview(
        existingSRSData,
        quality
      );

      // Actualizar mapa SRS
      const newSRSDataMap = new Map(srsDataMap);
      newSRSDataMap.set(currentQuestion.id, updatedSRSData);

      // Guardar en almacenamiento
      try {
        await QuestionStorageService.saveSRSData(
          currentQuestion.id,
          {
            ...updatedSRSData,
            lastReviewDate: updatedSRSData.lastReviewDate?.toISOString() || null,
            nextReviewDate: updatedSRSData.nextReviewDate?.toISOString() || null,
          }
        );
      } catch (error) {
        console.error('Error saving SRS data:', error);
      }

      setSession(prev => ({
        ...prev,
        srsDataMap: newSRSDataMap,
      }));
    }

    setSession(prev => ({
      ...prev,
      correctAnswers: isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers,
      incorrectAnswers: isCorrect 
        ? prev.incorrectAnswers 
        : new Set([...prev.incorrectAnswers, currentQuestion.id]),
      answers: [...prev.answers, questionAnswer],
      currentQuestionIndex: prev.currentQuestionIndex + 1,
      isComplete: prev.currentQuestionIndex + 1 >= prev.questions.length,
      startTime: new Date() // Reset timer for next question
    }));

    try {
      if (!isCorrect) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.INCORRECT_QUESTIONS,
          JSON.stringify([...session.incorrectAnswers, currentQuestion.id])
        );
      }
      await saveAnswer(questionAnswer);
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  }, [session, mode]);

  const toggleMarked = useCallback(async (questionId: number) => {
    const newMarked = new Set(session.markedQuestions);
    if (newMarked.has(questionId)) {
      newMarked.delete(questionId);
    } else {
      newMarked.add(questionId);
    }

    setSession(prev => ({
      ...prev,
      markedQuestions: newMarked
    }));

    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.MARKED_QUESTIONS,
        JSON.stringify([...newMarked])
      );
    } catch (error) {
      console.error('Error toggling marked question:', error);
    }
  }, [session.markedQuestions]);

  // Getters
  const getCurrentQuestion = useCallback((): Question | null => {
    return session.questions[session.currentQuestionIndex] || null;
  }, [session.questions, session.currentQuestionIndex]);

  const getProgress = useCallback(() => ({
    current: session.currentQuestionIndex + 1,
    total: session.questions.length,
    percentage: ((session.currentQuestionIndex + 1) / session.questions.length) * 100,
    timeElapsed: new Date().getTime() - session.startTime.getTime()
  }), [session.currentQuestionIndex, session.questions.length, session.startTime]);

  const getStats = useCallback(() => ({
    correct: session.correctAnswers,
    incorrect: session.currentQuestionIndex - session.correctAnswers,
    total: session.questions.length,
    score: session.currentQuestionIndex > 0 
      ? (session.correctAnswers / session.currentQuestionIndex) * 100 
      : 0,
    averageTime: session.answers.reduce((acc, curr) => acc + curr.timeSpent, 0) / 
      (session.answers.length || 1)
  }), [session]);

  // Obtener información SRS de la pregunta actual
  const getCurrentQuestionSRS = useCallback((): SRSData | null => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion || !session.srsDataMap) {
      return null;
    }
    return session.srsDataMap.get(currentQuestion.id) || null;
  }, [session.srsDataMap, getCurrentQuestion]);

  // Utilidades
  const saveAnswer = async (answer: QuestionAnswer) => {
    try {
      const existingAnswers = await AsyncStorage.getItem(STORAGE_KEYS.PRACTICE_STATS);
      const answers = existingAnswers ? JSON.parse(existingAnswers) : [];
      answers.push(answer);
      await AsyncStorage.setItem(STORAGE_KEYS.PRACTICE_STATS, JSON.stringify(answers));
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  return {
    // Estado actual
    currentQuestion: getCurrentQuestion(),
    isComplete: session.isComplete,
    
    // Progreso y estadísticas
    progress: getProgress(),
    stats: getStats(),
    
    // Acciones
    handleAnswer,
    toggleMarked,
    
    // Utilidades
    isMarked: useCallback((id: number) => session.markedQuestions.has(id), [session.markedQuestions]),
    isIncorrect: useCallback((id: number) => session.incorrectAnswers.has(id), [session.incorrectAnswers]),
    
    // SRS
    currentQuestionSRS: getCurrentQuestionSRS(),
    getSRSStatusMessage: useCallback((questionId: number) => {
      if (!session.srsDataMap) return null;
      const srsData = session.srsDataMap.get(questionId);
      return srsData ? SpacedRepetitionService.getReviewStatusMessage(srsData) : null;
    }, [session.srsDataMap]),
  };
};

export default usePracticeSession;
