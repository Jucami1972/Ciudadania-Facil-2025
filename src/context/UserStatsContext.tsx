/**
 * Context para gestionar estadísticas globales del usuario
 * Evita recargar estadísticas en cada sesión de práctica
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuestionStorageService } from '../services/QuestionStorageService';

interface UserStatsContextType {
  incorrectQuestions: Set<number>;
  markedQuestions: Set<number>;
  isLoading: boolean;
  refreshStats: () => Promise<void>;
  addIncorrectQuestion: (questionId: number) => Promise<void>;
  removeIncorrectQuestion: (questionId: number) => Promise<void>;
  toggleMarkedQuestion: (questionId: number) => Promise<void>;
}

const UserStatsContext = createContext<UserStatsContextType | undefined>(undefined);

export const useUserStats = () => {
  const context = useContext(UserStatsContext);
  if (!context) {
    throw new Error('useUserStats must be used within UserStatsProvider');
  }
  return context;
};

interface UserStatsProviderProps {
  children: ReactNode;
}

export const UserStatsProvider: React.FC<UserStatsProviderProps> = ({ children }) => {
  const [incorrectQuestions, setIncorrectQuestions] = useState<Set<number>>(new Set());
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      
      // Cargar preguntas incorrectas
      const incorrect = await QuestionStorageService.getIncorrectQuestions();
      setIncorrectQuestions(new Set(incorrect));
      
      // Cargar preguntas marcadas
      const marked = await QuestionStorageService.getMarkedQuestions();
      setMarkedQuestions(new Set(marked));
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const refreshStats = async () => {
    await loadStats();
  };

  const addIncorrectQuestion = async (questionId: number) => {
    await QuestionStorageService.addIncorrectQuestion(questionId);
    setIncorrectQuestions(prev => new Set([...prev, questionId]));
  };

  const removeIncorrectQuestion = async (questionId: number) => {
    await QuestionStorageService.removeIncorrectQuestion(questionId);
    setIncorrectQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(questionId);
      return newSet;
    });
  };

  const toggleMarkedQuestion = async (questionId: number) => {
    const newMarked = await QuestionStorageService.toggleMarkedQuestion(
      questionId,
      markedQuestions
    );
    setMarkedQuestions(newMarked);
  };

  return (
    <UserStatsContext.Provider
      value={{
        incorrectQuestions,
        markedQuestions,
        isLoading,
        refreshStats,
        addIncorrectQuestion,
        removeIncorrectQuestion,
        toggleMarkedQuestion,
      }}
    >
      {children}
    </UserStatsContext.Provider>
  );
};

