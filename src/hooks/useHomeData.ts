/**
 * Hook personalizado para manejar toda la lógica de datos del HomeScreen
 * Centraliza la carga de progreso, estadísticas, rachas y métricas diarias
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  VIEWED_QUESTIONS: '@study:viewed',
  LAST_STUDY_DATE: '@study:lastDate',
  STREAK: '@study:streak',
  DAILY_QUESTIONS: '@study:dailyQuestions',
  DAILY_TIME: '@study:dailyTime',
  DAILY_GOAL: '@study:dailyGoal',
} as const;

const DEFAULT_DAILY_GOAL = 10;
const TOTAL_QUESTIONS = 100;

interface HomeData {
  progress: number;
  completedQuestions: number;
  totalQuestions: number;
  streak: number;
  dailyGoal: number;
  questionsToday: number;
  timeSpentToday: number;
  isLoading: boolean;
  error: string | null;
}

interface StudyModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  progress: number;
  route: string;
}

/**
 * Calcula la racha de días consecutivos de estudio
 */
const calculateStreak = (lastStudyDate: string | null, currentStreak: number): number => {
  if (!lastStudyDate) {
    return 1;
  }

  try {
    const lastDate = new Date(lastStudyDate);
    const today = new Date();
    
    // Normalizar a medianoche para comparación precisa
    today.setHours(0, 0, 0, 0);
    lastDate.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Ya estudió hoy, mantener la racha actual
      return currentStreak;
    } else if (diffDays === 1) {
      // Estudió ayer, incrementar racha
      return currentStreak + 1;
    } else {
      // Más de un día sin estudiar, resetear racha
      return 1;
    }
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 1;
  }
};

/**
 * Obtiene estadísticas del día actual
 */
const getDailyStats = async (): Promise<{ questions: number; time: number }> => {
  try {
    const today = new Date().toDateString();
    const dailyData = await AsyncStorage.getItem(`${STORAGE_KEYS.DAILY_QUESTIONS}_${today}`);
    
    if (dailyData) {
      const parsed = JSON.parse(dailyData);
      return {
        questions: parsed.questions || 0,
        time: parsed.time || 0,
      };
    }
    return { questions: 0, time: 0 };
  } catch (error) {
    console.error('Error getting daily stats:', error);
    return { questions: 0, time: 0 };
  }
};

/**
 * Actualiza estadísticas del día actual
 */
const updateDailyStats = async (questions: number, time: number): Promise<void> => {
  try {
    const today = new Date().toDateString();
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.DAILY_QUESTIONS}_${today}`,
      JSON.stringify({ questions, time, date: today })
    );
  } catch (error) {
    console.error('Error updating daily stats:', error);
  }
};

/**
 * Hook principal para datos del Home
 */
export const useHomeData = () => {
  const [data, setData] = useState<HomeData>({
    progress: 0,
    completedQuestions: 0,
    totalQuestions: TOTAL_QUESTIONS,
    streak: 1,
    dailyGoal: DEFAULT_DAILY_GOAL,
    questionsToday: 0,
    timeSpentToday: 0,
    isLoading: true,
    error: null,
  });

  const [studyModules, setStudyModules] = useState<StudyModule[]>([
    {
      id: 'cards',
      title: 'Tarjetas de Estudio',
      description: 'Aprende las 100 preguntas',
      icon: 'cards',
      color: '#1E40AF',
      progress: 0,
      route: 'StudyHome',
    },
    {
      id: 'type',
      title: 'Estudio por Tipo',
      description: '¿Quién?, ¿Qué?, ¿Cuándo?',
      icon: 'format-list-numbered',
      color: '#8B5CF6',
      progress: 0,
      route: 'QuestionTypePracticeHome',
    },
  ]);

  /**
   * Carga todos los datos necesarios
   */
  const loadData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Cargar en paralelo
      const [
        viewedRaw,
        lastStudyDate,
        streakCount,
        dailyGoal,
        dailyStats,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.VIEWED_QUESTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_STUDY_DATE),
        AsyncStorage.getItem(STORAGE_KEYS.STREAK),
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_GOAL),
        getDailyStats(),
      ]);

      // Procesar preguntas vistas
      const viewed = new Set<number>(viewedRaw ? JSON.parse(viewedRaw) : []);
      const completedQuestions = viewed.size;
      const progress = Math.max(0, Math.min(100, Math.round((completedQuestions / TOTAL_QUESTIONS) * 100)));

      // Calcular racha
      const currentStreak = parseInt(streakCount || '1', 10);
      const newStreak = calculateStreak(lastStudyDate, currentStreak);

      // Actualizar racha si cambió
      if (newStreak !== currentStreak) {
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.STREAK, newStreak.toString()),
          AsyncStorage.setItem(STORAGE_KEYS.LAST_STUDY_DATE, new Date().toISOString()),
        ]);
      }

      // Cargar meta diaria
      const goal = dailyGoal ? parseInt(dailyGoal, 10) : DEFAULT_DAILY_GOAL;

      // Actualizar estado
      setData({
        progress,
        completedQuestions,
        totalQuestions: TOTAL_QUESTIONS,
        streak: newStreak,
        dailyGoal: goal,
        questionsToday: dailyStats.questions,
        timeSpentToday: dailyStats.time,
        isLoading: false,
        error: null,
      });

      // Actualizar progreso de módulos
      setStudyModules(prev =>
        prev.map(m => (m.id === 'cards' ? { ...m, progress } : m))
      );
    } catch (error: any) {
      console.error('Error loading home data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error?.message || 'Error al cargar datos',
      }));
    }
  }, []);

  /**
   * Resetea el progreso
   */
  const resetProgress = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.VIEWED_QUESTIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_STUDY_DATE),
        AsyncStorage.removeItem(STORAGE_KEYS.STREAK),
      ]);

      setData(prev => ({
        ...prev,
        progress: 0,
        completedQuestions: 0,
        streak: 1,
      }));

      setStudyModules(prev =>
        prev.map(m => (m.id === 'cards' ? { ...m, progress: 0 } : m))
      );

      return true;
    } catch (error) {
      console.error('Error resetting progress:', error);
      return false;
    }
  }, []);

  /**
   * Actualiza la meta diaria
   */
  const updateDailyGoal = useCallback(async (goal: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_GOAL, goal.toString());
      setData(prev => ({ ...prev, dailyGoal: goal }));
    } catch (error) {
      console.error('Error updating daily goal:', error);
    }
  }, []);

  /**
   * Calcula el progreso diario
   */
  const dailyProgress = useMemo(() => {
    return Math.min(100, (data.questionsToday / data.dailyGoal) * 100);
  }, [data.questionsToday, data.dailyGoal]);

  /**
   * Calcula preguntas restantes para la meta
   */
  const remainingQuestions = useMemo(() => {
    return Math.max(0, data.dailyGoal - data.questionsToday);
  }, [data.dailyGoal, data.questionsToday]);

  // Cargar datos al montar
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    ...data,
    studyModules,
    dailyProgress,
    remainingQuestions,
    loadData,
    resetProgress,
    updateDailyGoal,
  };
};

