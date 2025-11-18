/**
 * Servicio para cargar y preparar preguntas para la práctica
 * Extraído de CategoryPracticeScreen.tsx para separar lógica de negocio
 */

import { practiceQuestions, PracticeQuestion, getQuestionsByCategory } from '../data/practiceQuestions';
import { getQuestionsByType, QUESTION_TYPES } from './questionTypesService';
import { shuffleArray } from '../utils/arrayUtils';
import { QuestionStorageService } from './QuestionStorageService';

export type QuestionMode = 'text-text' | 'voice-text';

export interface LocalPracticeQuestion extends PracticeQuestion {
  mode?: QuestionMode;
}

/**
 * Servicio para cargar preguntas por categoría, tipo o modo especial
 */
export class QuestionLoaderService {
  /**
   * Aplica ponderación de dificultad: preguntas 'hard' tienen mayor probabilidad de aparecer
   */
  static applyDifficultyWeight(questions: PracticeQuestion[]): PracticeQuestion[] {
    const weighted: PracticeQuestion[] = [];
    
    questions.forEach(q => {
      const weight = q.difficulty === 'hard' ? 3 : q.difficulty === 'medium' ? 2 : 1;
      // Agregar la pregunta 'weight' veces para aumentar su probabilidad
      for (let i = 0; i < weight; i++) {
        weighted.push(q);
      }
    });
    
    return weighted;
  }

  /**
   * Obtiene todas las preguntas disponibles por categoría o tipo de forma aleatoria
   */
  static async getAllQuestionsByCategory(categoryId: string): Promise<LocalPracticeQuestion[]> {
    console.log('🔍 getAllQuestionsByCategory llamado con categoryId:', categoryId);

    // Verificar si es un tipo de pregunta (who, what, when, etc.) o una categoría (government, history, etc.)
    const isQuestionType = QUESTION_TYPES.some(type => type.id === categoryId);
    const validCategories = ['government', 'history', 'symbols_holidays'];
    const isCategory = validCategories.includes(categoryId);
    const isIncorrect = categoryId === 'incorrect';
    const isMarked = categoryId === 'marked';

    let categoryQuestions: PracticeQuestion[] = [];

    if (isMarked) {
      // Es el modo de preguntas marcadas, cargar desde AsyncStorage
      console.log('🔖 Es modo de preguntas marcadas, cargando desde AsyncStorage');
      const markedIds = await QuestionStorageService.getMarkedQuestions();
      if (markedIds.length > 0) {
        categoryQuestions = practiceQuestions.filter(q => markedIds.includes(q.id));
        console.log('📚 Preguntas marcadas cargadas:', categoryQuestions.length);
      } else {
        console.log('⚠️ No hay preguntas marcadas guardadas');
        return [];
      }
    } else if (isIncorrect) {
      // Es el modo de preguntas incorrectas, cargar desde AsyncStorage
      console.log('❌ Es modo de preguntas incorrectas, cargando desde AsyncStorage');
      const incorrectIds = await QuestionStorageService.getIncorrectQuestions();
      if (incorrectIds.length > 0) {
        categoryQuestions = practiceQuestions.filter(q => incorrectIds.includes(q.id));
        console.log('📚 Preguntas incorrectas cargadas:', categoryQuestions.length);
      } else {
        console.log('⚠️ No hay preguntas incorrectas guardadas');
        return [];
      }
    } else if (isQuestionType) {
      // Es un tipo de pregunta, usar getQuestionsByType y convertir a PracticeQuestion
      console.log('📝 Es un tipo de pregunta, usando getQuestionsByType');
      const questionsByType = getQuestionsByType(categoryId);
      console.log('📚 Preguntas obtenidas de getQuestionsByType:', questionsByType.length);

      // Convertir Question[] a PracticeQuestion[]
      // Manejar respuestas como string o array
      const formatAnswer = (ans: string | string[]): string => {
        if (Array.isArray(ans)) {
          return ans.join('\n');
        }
        return ans;
      };
      
      categoryQuestions = questionsByType.map(q => ({
        id: q.id,
        question: q.questionEs || q.questionEn,
        answer: formatAnswer(q.answerEs || q.answerEn),
        category: q.category,
        difficulty: 'medium' as const, // Dificultad por defecto
      }));
      console.log('✅ Preguntas convertidas a PracticeQuestion:', categoryQuestions.length);
    } else if (isCategory) {
      // Es una categoría válida, usar getQuestionsByCategory
      console.log('📂 Es una categoría, usando getQuestionsByCategory');
      categoryQuestions = getQuestionsByCategory(
        categoryId as 'government' | 'history' | 'symbols_holidays'
      );
      console.log('📚 Preguntas obtenidas de getQuestionsByCategory:', categoryQuestions.length);
    } else {
      console.error('❌ categoryId no es válido:', categoryId);
      return [];
    }

    // Crear array de modos aleatorios (50% text-text, 50% voice-text)
    const modes: QuestionMode[] = [];
    const totalQuestions = categoryQuestions.length;
    const textCount = Math.floor(totalQuestions / 2);
    const voiceCount = totalQuestions - textCount;

    // Llenar array con modos balanceados
    for (let i = 0; i < textCount; i++) {
      modes.push('text-text');
    }
    for (let i = 0; i < voiceCount; i++) {
      modes.push('voice-text');
    }

    // Mezclar los modos aleatoriamente
    const shuffledModes = shuffleArray(modes);

    // Ponderar dificultad: preguntas 'hard' tienen mayor probabilidad
    const weightedQuestions = this.applyDifficultyWeight(categoryQuestions);
    
    // Mezclar las preguntas ponderadas
    const shuffledWeighted = shuffleArray(weightedQuestions);
    
    // Eliminar duplicados manteniendo el orden (las preguntas hard aparecen más veces)
    const uniqueQuestions = Array.from(
      new Map(shuffledWeighted.map(q => [q.id, q])).values()
    );

    // Agregar modo aleatorio a cada pregunta
    const questionsWithMode = uniqueQuestions.map((q, index) => ({
      ...q,
      mode: shuffledModes[index] as QuestionMode,
    }));

    console.log('🎲 Preguntas con modo asignado:', questionsWithMode.length);
    console.log('📊 Distribución de modos:', {
      text: questionsWithMode.filter(q => q.mode === 'text-text').length,
      voice: questionsWithMode.filter(q => q.mode === 'voice-text').length,
    });

    // Mezclar las preguntas aleatoriamente usando Fisher-Yates
    const shuffledQuestions = shuffleArray(questionsWithMode);
    console.log('🔄 Preguntas ordenadas aleatoriamente:', shuffledQuestions.length);

    return shuffledQuestions;
  }
}

