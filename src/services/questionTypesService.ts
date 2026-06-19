// src/services/questionTypesService.ts

/**
 * Servicio para clasificar preguntas del examen de ciudadanía por tipo
 * Basado en las 100 preguntas oficiales del USCIS (IDs 1-100)
 * Clasificación explícita por ID para máxima precisión
 * Nota: lógica del examen de 100 preguntas NO debe modificarse.
 */

import { questions, Question } from '../data/questions';
import { questions128 } from '../data/questions128';

export interface QuestionType {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  questionCount: number;
}

// Definición de tipos de preguntas del examen de ciudadanía
export const QUESTION_TYPES: QuestionType[] = [
  {
    id: 'who',
    name: '¿Quién?',
    nameEn: 'Who',
    description: 'Preguntas sobre personas y líderes',
    icon: 'account-multiple',
    color: '#1E40AF',
    questionCount: 0,
  },
  {
    id: 'what',
    name: '¿Qué?',
    nameEn: 'What',
    description: 'Preguntas sobre conceptos y documentos',
    icon: 'help-circle',
    color: '#ec4899',
    questionCount: 0,
  },
  {
    id: 'name',
    name: 'Nombra',
    nameEn: 'Name',
    description: 'Preguntas de nombramiento o selección',
    icon: 'format-list-bulleted',
    color: '#EF4444',
    questionCount: 0,
  },
  {
    id: 'why',
    name: '¿Por qué?',
    nameEn: 'Why',
    description: 'Preguntas sobre razones',
    icon: 'lightbulb',
    color: '#8B5CF6',
    questionCount: 0,
  },
  {
    id: 'how_many',
    name: '¿Cuántos?',
    nameEn: 'How Many',
    description: 'Preguntas sobre cantidades',
    icon: 'numeric',
    color: '#F59E0B',
    questionCount: 0,
  },
  {
    id: 'dates',
    name: 'Fechas',
    nameEn: 'Dates',
    description: 'Preguntas sobre fechas, meses y años',
    icon: 'calendar',
    color: '#06B6D4',
    questionCount: 0,
  },
  {
    id: 'other',
    name: 'Otras',
    nameEn: 'Other',
    description: 'Preguntas que no encajan en las categorías anteriores',
    icon: 'help',
    color: '#64748b',
    questionCount: 0,
  },
];

/**
 * Mapa explícito de clasificación: ID de pregunta → tipo
 * Cada una de las 100 preguntas oficiales está asignada manualmente
 */
const QUESTION_TYPE_MAP: Record<number, string> = {
  // WHO — ¿Quién? (18 preguntas)
  15: 'who',  // Who is in charge of the executive branch?
  16: 'who',  // Who makes federal laws?
  20: 'who',  // Who is one of your state's U.S. Senators now?
  24: 'who',  // Who does a U.S. Senator represent?
  30: 'who',  // If the President can no longer serve, who becomes President?
  31: 'who',  // If both the President and the Vice President can no longer serve, who becomes President?
  32: 'who',  // Who is the Commander in Chief of the military?
  33: 'who',  // Who signs bills to become laws?
  34: 'who',  // Who vetoes bills?
  40: 'who',  // Who is the Chief Justice of the United States now?
  43: 'who',  // Who is the Governor of your state now?
  59: 'who',  // Who lived in America before the Europeans arrived?
  62: 'who',  // Who wrote the Declaration of Independence?
  69: 'who',  // Who is the "Father of Our Country"?
  70: 'who',  // Who was the first President?
  79: 'who',  // Who was President during World War I?
  80: 'who',  // Who was President during the Great Depression and World War II?
  81: 'who',  // Who did the United States fight in World War II?

  // WHAT — ¿Qué? (47 preguntas)
  1: 'what',   // What is the supreme law of the land?
  2: 'what',   // What does the Constitution do?
  3: 'what',   // The idea of self-government... What are these words?
  4: 'what',   // What is an amendment?
  5: 'what',   // What do we call the first ten amendments?
  6: 'what',   // What is one right or freedom from the First Amendment?
  8: 'what',   // What did the Declaration of Independence do?
  9: 'what',   // What are two rights in the Declaration of Independence?
  10: 'what',  // What is freedom of religion?
  11: 'what',  // What is the economic system in the United States?
  12: 'what',  // What is the "rule of law"?
  14: 'what',  // What stops one branch of government from becoming too powerful?
  17: 'what',  // What are the two parts of the U.S. Congress?
  28: 'what',  // What is the name of the President now?
  29: 'what',  // What is the name of the Vice President now?
  35: 'what',  // What does the President's Cabinet do?
  36: 'what',  // What are two Cabinet-level positions?
  37: 'what',  // What does the judicial branch do?
  38: 'what',  // What is the highest court in the United States?
  41: 'what',  // Under our Constitution... What is one power of the federal government?
  42: 'what',  // Under our Constitution... What is one power of the states?
  44: 'what',  // What is the capital of your state?
  45: 'what',  // What are the two major political parties?
  46: 'what',  // What is the political party of the President now?
  47: 'what',  // What is the name of the Speaker of the House?
  49: 'what',  // What is one responsibility only for U.S. citizens?
  51: 'what',  // What are two rights of everyone living in the U.S.?
  52: 'what',  // What do we show loyalty to when we say the Pledge of Allegiance?
  53: 'what',  // What is one promise you make when you become a U.S. citizen?
  55: 'what',  // What are two ways Americans can participate in their democracy?
  58: 'what',  // What is one reason colonists came to America?
  60: 'what',  // What group of people was taken to America and sold as slaves?
  65: 'what',  // What happened at the Constitutional Convention?
  68: 'what',  // What is one thing Benjamin Franklin is famous for?
  71: 'what',  // What territory did the U.S. buy from France in 1803?
  75: 'what',  // What was one important thing that Abraham Lincoln did?
  76: 'what',  // What did the Emancipation Proclamation do?
  77: 'what',  // What did Susan B. Anthony do?
  82: 'what',  // Before he was President, Eisenhower was a general. What war was he in?
  83: 'what',  // During the Cold War, what was the main concern of the U.S.?
  84: 'what',  // What movement tried to end racial discrimination?
  85: 'what',  // What did Martin Luther King, Jr. do?
  86: 'what',  // What major event happened on September 11, 2001?
  89: 'what',  // What ocean is on the West Coast?
  90: 'what',  // What ocean is on the East Coast?
  94: 'what',  // What is the capital of the United States?
  98: 'what',  // What is the name of the national anthem?

  // NAME — Nombra (15 preguntas)
  13: 'name',   // Name one branch or part of the government.
  23: 'name',   // Name your U.S. Representative.
  50: 'name',   // Name one right only for U.S. citizens.
  64: 'name',   // There were 13 original states. Name three.
  67: 'name',   // The Federalist Papers... Name one of the writers.
  72: 'name',   // Name one war fought by the U.S. in the 1800s.
  73: 'name',   // Name the U.S. war between the North and the South.
  74: 'name',   // Name one problem that led to the Civil War.
  78: 'name',   // Name one war fought by the U.S. in the 1900s.
  87: 'name',   // Name one American Indian tribe in the U.S.
  88: 'name',   // Name one of the two longest rivers in the U.S.
  91: 'name',   // Name one U.S. territory.
  92: 'name',   // Name one state that borders Canada.
  93: 'name',   // Name one state that borders Mexico.
  100: 'name',  // Name two national U.S. holidays.

  // WHY — ¿Por qué? (4 preguntas)
  25: 'why',  // Why do some states have more Representatives?
  61: 'why',  // Why did the colonists fight the British?
  96: 'why',  // Why does the flag have 13 stripes?
  97: 'why',  // Why does the flag have 50 stars?

  // HOW MANY — ¿Cuántos? (7 preguntas)
  7: 'how_many',   // How many amendments does the Constitution have?
  18: 'how_many',  // How many U.S. Senators are there?
  19: 'how_many',  // We elect a U.S. Senator for how many years?
  21: 'how_many',  // The House of Representatives has how many voting members?
  22: 'how_many',  // We elect a U.S. Representative for how many years?
  26: 'how_many',  // We elect a President for how many years?
  39: 'how_many',  // How many justices are on the Supreme Court?

  // DATES — Fechas (6 preguntas)
  27: 'dates',  // In what month do we vote for President?
  56: 'dates',  // When is the last day you can send in federal income tax forms?
  57: 'dates',  // When must all men register for the Selective Service?
  63: 'dates',  // When was the Declaration of Independence adopted?
  66: 'dates',  // When was the Constitution written?
  99: 'dates',  // When do we celebrate Independence Day?

  // OTHER — Otras (3 preguntas)
  48: 'other',  // There are four amendments about who can vote. Describe one.
  54: 'other',  // How old do citizens have to be to vote for President?
  95: 'other',  // Where is the Statue of Liberty?
};

/**
 * Clasifica una pregunta según su tipo usando mapa explícito de IDs
 */
export const classifyQuestion = (question: Question): string => {
  return QUESTION_TYPE_MAP[question.id] || 'other';
};

/**
 * Obtiene preguntas filtradas por tipo
 */
export const getQuestionsByType = (typeId: string): Question[] => {
  return questions.filter((q) => classifyQuestion(q) === typeId);
};

/**
 * Fisher-Yates shuffle para obtener preguntas aleatorias
 */
const fisherYatesShuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Obtiene preguntas aleatorias (para el examen de 20 preguntas)
 */
export const getRandomQuestions = (count: number = 20): Question[] => {
  const shuffled = fisherYatesShuffle(questions);
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
  }).filter(type => type.questionCount > 0);
};

// ─── Examen de 128 preguntas — NO tocar lógica de 100 preguntas arriba ──────

/**
 * Auto-clasifica una pregunta del examen de 128 a partir de su texto en inglés.
 * Usa el inicio de la pregunta como indicador del tipo.
 */
export const classifyQuestion128 = (questionText: string): string => {
  const q = (questionText || '').trim().toLowerCase();
  if (q.startsWith('who ') || q.startsWith("who's ") || q === 'who') return 'who';
  if (q.startsWith('what ')) return 'what';
  if (q.startsWith('name ')) return 'name';
  if (q.startsWith('why ')) return 'why';
  if (q.startsWith('how many') || q.startsWith('how long')) return 'how_many';
  if (
    q.startsWith('when ') ||
    q.startsWith('in what month') ||
    q.startsWith('in what year') ||
    q.startsWith('how old')
  ) return 'dates';
  // Preguntas con contexto previo: el tipo aparece después de un punto o signo de interrogación
  if (/[.?]\s+what[\s?]/.test(q)) return 'what';
  if (/[.?]\s+name[\s.]/.test(q)) return 'name';
  if (/[.?]\s+why[\s?]/.test(q)) return 'why';
  if (/[.?]\s+who[\s?']/.test(q)) return 'who';
  if (/[.?]\s+when[\s?]/.test(q)) return 'dates';
  if (/[.?]\s+how many/.test(q) || /[.?]\s+how long/.test(q)) return 'how_many';
  return 'other';
};

/**
 * Obtiene preguntas del examen de 128 filtradas por tipo.
 */
export const getQuestionsByType128 = (typeId: string): any[] => {
  return questions128.filter((q: any) => {
    const text = Array.isArray(q.questionEn) ? q.questionEn[0] : q.questionEn;
    return classifyQuestion128(text) === typeId;
  });
};

/**
 * Obtiene estadísticas de tipos de preguntas para el examen de 128.
 */
export const getQuestionTypeStats128 = (): QuestionType[] => {
  return QUESTION_TYPES.map((type) => ({
    ...type,
    questionCount: getQuestionsByType128(type.id).length,
  })).filter((t) => t.questionCount > 0);
};

/**
 * Obtiene N preguntas aleatorias del pool de 128 preguntas.
 */
export const getRandomQuestions128 = (count: number = 10): any[] => {
  const shuffled = fisherYatesShuffle([...questions128] as any[]);
  return shuffled.slice(0, Math.min(count, questions128.length));
};
