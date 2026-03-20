/**
 * Wrapper sobre questions.tsx para mantener compatibilidad con pantallas
 * que usan la interfaz simplificada PracticeQuestion (campos EN solamente).
 *
 * Fuente canónica de datos: questions.tsx
 */
import { questions as sourceQuestions } from './questions';

// Interfaz simplificada para pantallas de práctica (solo inglés)
export interface PracticeQuestion {
  id: number;
  question: string;
  answer: string;
  category: 'government' | 'history' | 'civics';
  subcategory: string;
}

// Mapeado de Question → PracticeQuestion (campos EN)
export const practiceQuestions: PracticeQuestion[] = sourceQuestions.map(q => ({
  id: q.id,
  question: q.questionEn,
  answer: q.answerEn,
  category: q.category,
  subcategory: q.subcategory,
}));

// Re-exportar la interfaz original para quien la necesite
export type { Question } from './questions';

// Helper: filtrar por categoría
export function getQuestionsByCategory(category: string): PracticeQuestion[] {
  return practiceQuestions.filter(q => q.category === category);
}

// Helper: preguntas aleatorias por categoría (Fisher-Yates shuffle)
export function getRandomQuestionsByCategory(category: string, count: number): PracticeQuestion[] {
  const filtered = getQuestionsByCategory(category);
  const shuffled = [...filtered];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
