/**
 * Context para cargar y gestionar las preguntas globalmente
 * Evita recargar las preguntas en cada sesión de práctica
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { questions } from '../data/questions';
import { Question } from '../types/question';

interface QuestionsContextType {
  questions: Question[];
  isLoading: boolean;
  error: string | null;
  refreshQuestions: () => void;
}

const QuestionsContext = createContext<QuestionsContextType | undefined>(undefined);

export const useQuestions = () => {
  const context = useContext(QuestionsContext);
  if (!context) {
    throw new Error('useQuestions must be used within QuestionsProvider');
  }
  return context;
};

interface QuestionsProviderProps {
  children: ReactNode;
}

export const QuestionsProvider: React.FC<QuestionsProviderProps> = ({ children }) => {
  const [questionsData, setQuestionsData] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Convertir questions del formato de datos al formato Question
      // Manejar respuestas como string o array
      const formatAnswer = (ans: string | string[]): string => {
        if (Array.isArray(ans)) {
          return ans.join('\n');
        }
        return ans;
      };
      
      const convertedQuestions: Question[] = questions.map(q => ({
        id: q.id,
        text: q.questionEn,
        options: [],
        correctAnswer: formatAnswer(q.answerEn),
        category: q.category,
        section: q.subcategory,
        question: {
          text: q.questionEn,
          translation: q.questionEs,
        },
        answer: formatAnswer(q.answerEn),
        answerTranslation: formatAnswer(q.answerEs),
        difficulty: 'medium' as const,
      }));
      
      setQuestionsData(convertedQuestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando preguntas');
      console.error('Error loading questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const refreshQuestions = () => {
    loadQuestions();
  };

  return (
    <QuestionsContext.Provider
      value={{
        questions: questionsData,
        isLoading,
        error,
        refreshQuestions,
      }}
    >
      {children}
    </QuestionsContext.Provider>
  );
};

