/**
 * QuestionBank - Base de datos de las 128 preguntas oficiales del USCIS
 */

import { Question } from '../types';
import { questions } from '../data/questions';

export class QuestionBank {
  private questions: Question[] = questions;

  /**
   * Obtiene todas las preguntas
   */
  getAllQuestions(): Question[] {
    return this.questions;
  }

  /**
   * Obtiene una pregunta por ID
   */
  getQuestionById(id: number): Question | undefined {
    return this.questions.find(q => q.id === id);
  }

  /**
   * Obtiene preguntas aleatorias que no se hayan usado
   */
  getRandomQuestions(count: number, excludeIds: number[] = []): Question[] {
    const available = this.questions.filter(q => !excludeIds.includes(q.id));
    
    if (available.length === 0) {
      return [];
    }

    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Obtiene una pregunta aleatoria que no se haya usado
   */
  getRandomQuestion(excludeIds: number[] = []): Question | undefined {
    const available = this.questions.filter(q => !excludeIds.includes(q.id));
    
    if (available.length === 0) {
      return undefined;
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }

  /**
   * Valida si una respuesta es correcta
   */
  validateAnswer(questionId: number, userAnswer: string): boolean {
    const question = this.getQuestionById(questionId);
    if (!question) {
      return false;
    }

    const correctAnswer = Array.isArray(question.answerEn)
      ? question.answerEn
      : [question.answerEn];

    const normalizedUserAnswer = userAnswer.toLowerCase().trim();
    
    // Verificar si la respuesta del usuario contiene palabras clave de la respuesta correcta
    return correctAnswer.some(answer => {
      const normalizedCorrect = answer.toLowerCase().trim();
      
      // Función para normalizar texto (remover puntuación, espacios extra, etc.)
      const normalizeText = (text: string): string => {
        return text
          .replace(/[.,;:!?()[\]{}]/g, '')  // Remover toda puntuación
          .replace(/[-\s]+/g, ' ')          // Reemplazar guiones y espacios múltiples con un espacio
          .trim();
      };
      
      // Extraer números de ambas respuestas
      const extractNumbers = (text: string): number[] => {
        const matches = text.match(/\d+/g);
        return matches ? matches.map(Number) : [];
      };
      
      const userNumbers = extractNumbers(normalizedUserAnswer);
      const correctNumbers = extractNumbers(normalizedCorrect);
      
      // Si hay números en ambas, comparar números primero
      if (userNumbers.length > 0 && correctNumbers.length > 0) {
        const numberMatch = userNumbers.some(num => correctNumbers.includes(num));
        if (numberMatch) {
          return true; // Si los números coinciden, aceptar inmediatamente
        }
      }
      
      // Normalizar texto para comparación
      const normalizedUser = normalizeText(normalizedUserAnswer);
      const normalizedCorrectText = normalizeText(normalizedCorrect);
      
      // Comparación exacta después de normalización
      if (normalizedUser === normalizedCorrectText) {
        return true;
      }
      
      // Si la respuesta es corta, verificar si contiene las palabras clave principales
      if (normalizedCorrectText.length < 30) {
        // Extraer palabras significativas (más de 2 caracteres)
        const userWords = normalizedUser.split(/\s+/).filter(w => w.length > 2);
        const correctWords = normalizedCorrectText.split(/\s+/).filter(w => w.length > 2);
        
        // Si todas las palabras clave están presentes, aceptar
        if (correctWords.length > 0) {
          const allWordsMatch = correctWords.every(word => 
            userWords.some(uw => uw.includes(word) || word.includes(uw))
          );
          if (allWordsMatch) {
            return true;
          }
        }
        
        // Verificar si contiene palabras clave importantes
        const importantKeywords = correctWords.filter(w => w.length > 4);
        if (importantKeywords.length > 0) {
          return importantKeywords.some(keyword => normalizedUser.includes(keyword));
        }
      }
      
      // Para respuestas largas, verificar palabras clave
      const keywords = normalizedCorrectText.split(/\s+/).filter(w => w.length > 3);
      return keywords.some(keyword => normalizedUser.includes(keyword));
    });
  }

  /**
   * Obtiene el número total de preguntas
   */
  getTotalQuestions(): number {
    return this.questions.length;
  }
}

// Singleton instance
export const questionBank = new QuestionBank();

