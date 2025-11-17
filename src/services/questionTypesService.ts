// src/services/questionTypesService.ts

/**
 * Servicio para clasificar preguntas del examen de ciudadanía por tipo
 * Basado en las 128 preguntas del USCIS
 */

import { questions, Question } from '../data/questions';

export interface QuestionType {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  pattern: RegExp; // Patrón de búsqueda para identificar el tipo
  questionCount: number;
}

// Definición de tipos de preguntas basados en patrones comunes del examen
// Orden de verificación: primero los más específicos (how long, how many), luego los generales
export const QUESTION_TYPES: QuestionType[] = [
  {
    id: 'who',
    name: '¿Quién?',
    nameEn: 'Who',
    description: 'Preguntas sobre personas y líderes',
    icon: 'account-multiple',
    color: '#7c3aed',
    pattern: /^¿Quién|^Who/i,
    questionCount: 0,
  },
  {
    id: 'what',
    name: '¿Qué?',
    nameEn: 'What',
    description: 'Preguntas sobre conceptos y documentos',
    icon: 'help-circle',
    color: '#ec4899',
    pattern: /^¿Qué|^What/i,
    questionCount: 0,
  },
  {
    id: 'which',
    name: '¿Cuál? / Name One',
    nameEn: 'Which / Name One',
    description: 'Preguntas de selección o nombramiento',
    icon: 'format-list-bulleted',
    color: '#ef4444',
    pattern: /^¿Cuál|^Which|^Name one|^Name two|^Mencione uno|^Mencione dos|^Mencione una|^Mencione/i,
    questionCount: 0,
  },
  {
    id: 'why',
    name: '¿Por qué?',
    nameEn: 'Why',
    description: 'Preguntas sobre razones',
    icon: 'lightbulb',
    color: '#8b5cf6',
    pattern: /^¿Por qué|^Why/i,
    questionCount: 0,
  },
  {
    id: 'how',
    name: '¿Cómo?',
    nameEn: 'How',
    description: 'Preguntas sobre procesos',
    icon: 'cog',
    color: '#06b6d4',
    pattern: /^¿Cómo|^How(?![ \t]many|long)/i,
    questionCount: 0,
  },
  {
    id: 'how_many',
    name: '¿Cuántos?',
    nameEn: 'How Many',
    description: 'Preguntas sobre cantidades',
    icon: 'numeric',
    color: '#f59e0b',
    pattern: /^¿Cuántos|^¿Cuántas|^How many|^How much/i,
    questionCount: 0,
  },
  {
    id: 'how_long',
    name: '¿Cuánto tiempo?',
    nameEn: 'How Long',
    description: 'Preguntas sobre duración',
    icon: 'clock-outline',
    color: '#f97316',
    pattern: /^¿Cuánto tiempo|^¿Por cuánto tiempo|^¿Por cuántos años|^How long/i,
    questionCount: 0,
  },
  {
    id: 'when',
    name: '¿Cuándo?',
    nameEn: 'When',
    description: 'Preguntas sobre fechas',
    icon: 'calendar',
    color: '#06b6d4',
    pattern: /^¿Cuándo|^When/i,
    questionCount: 0,
  },
  {
    id: 'other',
    name: 'Otras',
    nameEn: 'Other',
    description: 'Preguntas que no encajan en las categorías anteriores',
    icon: 'help',
    color: '#64748b',
    pattern: /.*/,
    questionCount: 0,
  },
];

/**
 * Lista de IDs de preguntas que deben clasificarse como "which" (Name one/two/three/five)
 * Solo estas 24 preguntas específicas deben estar en la categoría "which"
 */
const WHICH_QUESTION_IDS = [
  3,   // Name one thing the U.S. Constitution does.
  10,  // Name two important ideas from the Declaration...
  16,  // Name the three branches of government.
  20,  // Name one power of the U.S. Congress.
  29,  // Name your U.S. representative.
  41,  // Name one power of the president.
  46,  // The executive branch has many parts. Name one.
  58,  // Name one power that is only for the federal government.
  59,  // Name one power that is only for the states.
  67,  // Name two promises that new citizens make...
  73,  // The colonists came to America for many reasons. Name one.
  77,  // Name one reason why the Americans declared independence...
  80,  // The American Revolution had many important events. Name one.
  81,  // There were 13 original states. Name five.
  83,  // The Federalist Papers... Name one of the writers.
  91,  // Name one war fought by the United States in the 1800s.
  92,  // Name the U.S. war between the North and the South.
  99,  // Name one leader of the women's rights movement...
  100, // Name one war fought by the United States in the 1900s.
  116, // Name one U.S. military conflict after September 11...
  117, // Name one American Indian tribe in the United States.
  118, // Name one example of an American innovation.
  126, // Name three national U.S. holidays.
];

/**
 * Clasifica una pregunta según su tipo
 * La clasificación se basa en la LITERALIDAD de las palabras en INGLÉS
 * Orden de verificación: primero los más específicos, luego los generales
 */
export const classifyQuestion = (question: Question): string => {
  const questionEn = question.questionEn || '';
  
  // PRIORIDAD 1: Verificar si es una de las 24 preguntas específicas de "Name"
  if (WHICH_QUESTION_IDS.includes(question.id)) {
    return 'which';
  }
  
  // PRIORIDAD 2: Buscar palabras interrogativas al final de la pregunta en inglés (preguntas con sentencia)
  // Ejemplo: "The U.S. Constitution starts... What does... mean?"
  const endPatterns = [
    { pattern: /\.\s*What|What does|What is|What are|What was|What did|What do|are in what|is in what/i, type: 'what' },
    { pattern: /\.\s*Why/i, type: 'why' },
    { pattern: /\.\s*Which/i, type: 'which' },
    { pattern: /\.\s*Who/i, type: 'who' },
    { pattern: /\.\s*When/i, type: 'when' },
    { pattern: /\.\s*How long|How long/i, type: 'how_long' },
    { pattern: /\.\s*How many|\.\s*How much/i, type: 'how_many' },
    { pattern: /\.\s*How/i, type: 'how' },
  ];
  
  for (const { pattern, type } of endPatterns) {
    if (pattern.test(questionEn)) {
      return type;
    }
  }
  
  // PRIORIDAD 3: Verificar al inicio de la pregunta en INGLÉS (literalidad)
  // Orden: how_long, how_many, how, which, who, what, why, when
  const typeOrder = ['how_long', 'how_many', 'how', 'which', 'who', 'what', 'why', 'when'];
  
  for (const typeId of typeOrder) {
    const type = QUESTION_TYPES.find(t => t.id === typeId);
    if (type && type.pattern.test(questionEn)) {
      // Si coincide con "which" pero NO está en la lista de IDs permitidos, clasificar como "other"
      if (typeId === 'which' && !WHICH_QUESTION_IDS.includes(question.id)) {
        return 'other';
      }
      return type.id;
    }
  }
  
  // Por defecto, clasificar como "other" (no "what")
  return 'other';
};

/**
 * Obtiene preguntas filtradas por tipo
 */
export const getQuestionsByType = (typeId: string): Question[] => {
  return questions.filter((q) => classifyQuestion(q) === typeId);
};

/**
 * Obtiene preguntas aleatorias (para el examen de 20 preguntas)
 */
export const getRandomQuestions = (count: number = 20): Question[] => {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, questions.length));
};

/**
 * Obtiene estadísticas de preguntas por tipo
 */
export const getQuestionTypeStats = (): QuestionType[] => {
  return QUESTION_TYPES.map((type) => {
    const count = getQuestionsByType(type.id).length;
    return {
      ...type,
      questionCount: count,
    };
  }).filter(type => {
    // Solo mostrar tipos con preguntas
    return type.questionCount > 0;
  });
};

