// src/data/questionCategories.ts
// Sistema de categorización inteligente de preguntas basado en patrones

import { PracticeQuestion } from './practiceQuestions';

export type QuestionTypeCategory = 
  | 'what'      // Preguntas que empiezan con "What"
  | 'who'       // Preguntas que empiezan con "Who"
  | 'when'      // Preguntas que empiezan con "When"
  | 'why'       // Preguntas que empiezan con "Why"
  | 'where'     // Preguntas que empiezan con "Where"
  | 'how'       // Preguntas que empiezan con "How"
  | 'name'      // Preguntas que empiezan con "Name"
  | 'which'     // Preguntas que empiezan con "Which"
  | 'how_many'  // Preguntas "How many"
  | 'how_long'  // Preguntas "How long"

export type AnswerTypeCategory =
  | 'dates'           // Respuestas que son fechas (1776, 1920, etc.)
  | 'names_people'    // Respuestas que son nombres de personas
  | 'names_places'    // Respuestas que son nombres de lugares
  | 'wars'            // Respuestas sobre guerras
  | 'documents'       // Respuestas sobre documentos (Constitution, Declaration, etc.)
  | 'numbers'         // Respuestas numéricas (100, 27, etc.)
  | 'concepts'        // Respuestas conceptuales (Democracy, Freedom, etc.)
  | 'amendments'      // Respuestas sobre enmiendas
  | 'branches'        // Respuestas sobre ramas del gobierno
  | 'rights'          // Respuestas sobre derechos

export interface QuestionCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  questionType?: QuestionTypeCategory;
  answerType?: AnswerTypeCategory;
  filter: (question: PracticeQuestion) => boolean;
}

// Detectar si una respuesta es una fecha
const isDateAnswer = (answer: string): boolean => {
  const datePattern = /\b(17|18|19|20)\d{2}\b/; // Años entre 1700-2099
  return datePattern.test(answer);
};

// Detectar si una respuesta es un número
const isNumberAnswer = (answer: string): boolean => {
  const numberWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
    'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred', 'thousand'];
  const lowerAnswer = answer.toLowerCase();
  
  // Verificar si contiene palabras numéricas comunes o números
  return /\b\d+\b/.test(answer) || numberWords.some(word => lowerAnswer.includes(word));
};

// Detectar si una respuesta menciona una guerra
const isWarAnswer = (answer: string): boolean => {
  const warKeywords = ['war', 'revolution', 'battle', 'conflict'];
  const lowerAnswer = answer.toLowerCase();
  return warKeywords.some(keyword => lowerAnswer.includes(keyword));
};

// Detectar si una respuesta menciona documentos
const isDocumentAnswer = (answer: string): boolean => {
  const docKeywords = ['constitution', 'declaration', 'amendment', 'federalist', 'papers', 'bill of rights'];
  const lowerAnswer = answer.toLowerCase();
  return docKeywords.some(keyword => lowerAnswer.includes(keyword));
};

// Detectar si una respuesta es un nombre de persona
const isPersonNameAnswer = (answer: string): boolean => {
  // Nombres comunes de figuras históricas y políticas
  const personPattern = /^[A-Z][a-z]+ [A-Z]\.? [A-Z][a-z]+|^[A-Z][a-z]+ [A-Z][a-z]+$/;
  // O nombres conocidos
  const knownNames = ['Thomas Jefferson', 'George Washington', 'Abraham Lincoln', 'Franklin Roosevelt',
    'Benjamin Franklin', 'James Madison', 'Alexander Hamilton', 'Susan B. Anthony', 'John G. Roberts'];
  return personPattern.test(answer) || knownNames.some(name => answer.includes(name));
};

// Detectar el tipo de pregunta por la primera palabra
const getQuestionType = (question: string): QuestionTypeCategory | null => {
  const lowerQuestion = question.toLowerCase().trim();
  if (lowerQuestion.startsWith('what')) return 'what';
  if (lowerQuestion.startsWith('who')) return 'who';
  if (lowerQuestion.startsWith('when')) return 'when';
  if (lowerQuestion.startsWith('why')) return 'why';
  if (lowerQuestion.startsWith('where')) return 'where';
  if (lowerQuestion.startsWith('name')) return 'name';
  if (lowerQuestion.startsWith('which')) return 'which';
  if (lowerQuestion.startsWith('how many')) return 'how_many';
  if (lowerQuestion.startsWith('how long')) return 'how_long';
  if (lowerQuestion.startsWith('how')) return 'how';
  return null;
};

// Definir las categorías
export const questionCategories: QuestionCategory[] = [
  {
    id: 'by_question_type',
    title: 'Por Tipo de Pregunta',
    description: 'Categorías basadas en cómo empieza la pregunta',
    icon: 'format-question',
    color: '#1E40AF', // Azul profesional
    filter: () => true, // Esta es una categoría padre
  },
  {
    id: 'what_questions',
    title: 'Preguntas "Qué" (What)',
    description: 'Preguntas que comienzan con "What"',
    icon: 'help-circle',
    color: '#6366f1',
    questionType: 'what',
    filter: (q) => getQuestionType(q.question) === 'what',
  },
  {
    id: 'who_questions',
    title: 'Preguntas "Quién" (Who)',
    description: 'Preguntas que comienzan con "Who"',
    icon: 'account-question',
    color: '#3B82F6', // Azul claro
    questionType: 'who',
    filter: (q) => getQuestionType(q.question) === 'who',
  },
  {
    id: 'when_questions',
    title: 'Preguntas "Cuándo" (When)',
    description: 'Preguntas sobre fechas y momentos históricos',
    icon: 'calendar-question',
    color: '#3B82F6', // Azul claro
    questionType: 'when',
    filter: (q) => getQuestionType(q.question) === 'when',
  },
  {
    id: 'why_questions',
    title: 'Preguntas "Por qué" (Why)',
    description: 'Preguntas que explican razones y causas',
    icon: 'thought-bubble',
    color: '#c084fc',
    questionType: 'why',
    filter: (q) => getQuestionType(q.question) === 'why',
  },
  {
    id: 'how_questions',
    title: 'Preguntas "Cómo/Cuántos" (How)',
    description: 'Preguntas sobre cantidad y procesos',
    icon: 'numeric',
    color: '#d8b4fe',
    questionType: 'how',
    filter: (q) => {
      const type = getQuestionType(q.question);
      return type === 'how' || type === 'how_many' || type === 'how_long';
    },
  },
  {
    id: 'name_questions',
    title: 'Preguntas "Nombra" (Name)',
    description: 'Preguntas que requieren nombrar algo',
    icon: 'card-text',
    color: '#e9d5ff',
    questionType: 'name',
    filter: (q) => getQuestionType(q.question) === 'name',
  },
  {
    id: 'by_answer_type',
    title: 'Por Tipo de Respuesta',
    description: 'Categorías basadas en el tipo de respuesta',
    icon: 'file-document-edit',
    color: '#10b981',
    filter: () => true, // Esta es una categoría padre
  },
  {
    id: 'date_answers',
    title: 'Respuestas con Fechas',
    description: 'Preguntas cuyas respuestas son fechas históricas',
    icon: 'calendar-clock',
    color: '#34d399',
    answerType: 'dates',
    filter: (q) => isDateAnswer(q.answer),
  },
  {
    id: 'person_names',
    title: 'Nombres de Personas',
    description: 'Preguntas sobre figuras históricas y políticas',
    icon: 'account-star',
    color: '#6ee7b7',
    answerType: 'names_people',
    filter: (q) => isPersonNameAnswer(q.answer),
  },
  {
    id: 'wars',
    title: 'Preguntas sobre Guerras',
    description: 'Preguntas sobre conflictos y guerras',
    icon: 'shield-sword',
    color: '#86efac',
    answerType: 'wars',
    filter: (q) => isWarAnswer(q.answer) || isWarAnswer(q.question),
  },
  {
    id: 'documents',
    title: 'Documentos y Enmiendas',
    description: 'Preguntas sobre documentos históricos y enmiendas',
    icon: 'file-document',
    color: '#a7f3d0',
    answerType: 'documents',
    filter: (q) => isDocumentAnswer(q.answer) || isDocumentAnswer(q.question),
  },
  {
    id: 'numbers',
    title: 'Preguntas Numéricas',
    description: 'Preguntas con respuestas numéricas',
    icon: 'calculator',
    color: '#d1fae5',
    answerType: 'numbers',
    filter: (q) => isNumberAnswer(q.answer) && !isDateAnswer(q.answer),
  },
];

// Función para obtener preguntas por categoría
export const getQuestionsByCategory = (categoryId: string): PracticeQuestion[] => {
  const category = questionCategories.find(c => c.id === categoryId);
  if (!category || categoryId === 'by_question_type' || categoryId === 'by_answer_type') {
    return []; // No retornar preguntas para categorías padre
  }
  
  // Importar dinámicamente para evitar dependencia circular
  const { practiceQuestions } = require('./practiceQuestions');
  return practiceQuestions.filter(category.filter);
};

// Función para obtener el conteo de preguntas por categoría
export const getCategoryCount = (categoryId: string): number => {
  if (categoryId === 'by_question_type' || categoryId === 'by_answer_type') {
    return 0; // Las categorías padre no tienen preguntas
  }
  return getQuestionsByCategory(categoryId).length;
};

