/**
 * Servicio de Repetición Espaciada (Spaced Repetition System - SRS)
 * Implementa el algoritmo SM-2 (SuperMemo 2) adaptado para preguntas de ciudadanía
 * 
 * El algoritmo aumenta el intervalo entre repeticiones cuando una pregunta
 * se responde correctamente, optimizando la memorización a largo plazo.
 */

export interface SRSData {
  questionId: number;
  easeFactor: number; // Factor de facilidad (inicia en 2.5)
  interval: number; // Intervalo en días hasta la próxima repetición
  repetitions: number; // Número de repeticiones correctas consecutivas
  lastReviewDate: Date | null; // Fecha de la última revisión
  nextReviewDate: Date | null; // Fecha de la próxima revisión programada
  quality: number; // Calidad de la respuesta (0-5, donde 5 es perfecto)
}

/**
 * Calidad de respuesta según el algoritmo SM-2
 * 5: Respuesta perfecta, recordada sin esfuerzo
 * 4: Respuesta correcta con un poco de esfuerzo
 * 3: Respuesta correcta con dificultad
 * 2: Respuesta incorrecta pero recordada después de ver la respuesta
 * 1: Respuesta incorrecta y difícil de recordar
 * 0: Respuesta completamente olvidada
 */
export type ResponseQuality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Servicio para gestionar la repetición espaciada
 */
export class SpacedRepetitionService {
  // Factor de facilidad inicial (SM-2)
  private static readonly INITIAL_EASE_FACTOR = 2.5;
  
  // Intervalos iniciales en días (SM-2)
  private static readonly INITIAL_INTERVALS = [1, 6]; // Primera y segunda repetición

  /**
   * Obtiene o crea datos SRS para una pregunta
   */
  static getSRSData(questionId: number, storedData?: SRSData): SRSData {
    if (storedData) {
      return {
        ...storedData,
        lastReviewDate: storedData.lastReviewDate
          ? new Date(storedData.lastReviewDate)
          : null,
        nextReviewDate: storedData.nextReviewDate
          ? new Date(storedData.nextReviewDate)
          : null,
      };
    }

    // Datos iniciales para una pregunta nueva
    return {
      questionId,
      easeFactor: this.INITIAL_EASE_FACTOR,
      interval: 0, // Se mostrará inmediatamente
      repetitions: 0,
      lastReviewDate: null,
      nextReviewDate: null,
      quality: 0,
    };
  }

  /**
   * Calcula la próxima revisión basada en la calidad de la respuesta
   * Implementa el algoritmo SM-2
   */
  static calculateNextReview(
    currentData: SRSData,
    quality: ResponseQuality
  ): SRSData {
    const newData = { ...currentData };
    newData.quality = quality;
    newData.lastReviewDate = new Date();

    // Si la calidad es menor a 3, reiniciar el proceso
    if (quality < 3) {
      newData.repetitions = 0;
      newData.interval = this.INITIAL_INTERVALS[0]; // 1 día
      newData.easeFactor = Math.max(1.3, newData.easeFactor - 0.2);
    } else {
      // Respuesta correcta: aumentar intervalo
      if (newData.repetitions === 0) {
        newData.interval = this.INITIAL_INTERVALS[0]; // 1 día
      } else if (newData.repetitions === 1) {
        newData.interval = this.INITIAL_INTERVALS[1]; // 6 días
      } else {
        // Calcular nuevo intervalo basado en el factor de facilidad
        newData.interval = Math.round(
          newData.interval * newData.easeFactor
        );
      }

      newData.repetitions += 1;

      // Ajustar factor de facilidad según la calidad
      const easeFactorChange = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
      newData.easeFactor = Math.max(1.3, newData.easeFactor + easeFactorChange);
    }

    // Calcular fecha de próxima revisión
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + newData.interval);
    newData.nextReviewDate = nextDate;

    return newData;
  }

  /**
   * Determina si una pregunta está lista para ser revisada
   */
  static isReadyForReview(srsData: SRSData): boolean {
    // Si nunca ha sido revisada, está lista
    if (!srsData.nextReviewDate) {
      return true;
    }

    // Si la fecha de próxima revisión ya pasó, está lista
    const now = new Date();
    return now >= srsData.nextReviewDate;
  }

  /**
   * Obtiene preguntas que están listas para revisión
   */
  static getQuestionsReadyForReview(
    allQuestions: Array<{ id: number }>,
    srsDataMap: Map<number, SRSData>
  ): number[] {
    const readyQuestions: number[] = [];

    for (const question of allQuestions) {
      const srsData = srsDataMap.get(question.id);
      if (!srsData || this.isReadyForReview(srsData)) {
        readyQuestions.push(question.id);
      }
    }

    return readyQuestions;
  }

  /**
   * Convierte calidad de respuesta booleana a escala 0-5
   */
  static convertBooleanToQuality(isCorrect: boolean, timeSpent: number): ResponseQuality {
    if (!isCorrect) {
      return 0; // Respuesta incorrecta
    }

    // Respuesta correcta: calidad basada en tiempo
    // Menos tiempo = mejor calidad (más fácil de recordar)
    if (timeSpent < 5000) {
      return 5; // Muy rápido, recordado fácilmente
    } else if (timeSpent < 10000) {
      return 4; // Rápido, con poco esfuerzo
    } else if (timeSpent < 20000) {
      return 3; // Normal, con algo de esfuerzo
    } else {
      return 2; // Lento, con dificultad
    }
  }

  /**
   * Obtiene el intervalo en días hasta la próxima revisión
   */
  static getDaysUntilNextReview(srsData: SRSData): number {
    if (!srsData.nextReviewDate) {
      return 0;
    }

    const now = new Date();
    const diff = srsData.nextReviewDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Obtiene un mensaje descriptivo del estado de la pregunta
   */
  static getReviewStatusMessage(srsData: SRSData): string {
    if (!srsData.nextReviewDate) {
      return 'Nueva pregunta';
    }

    const daysUntil = this.getDaysUntilNextReview(srsData);

    if (daysUntil <= 0) {
      return 'Lista para revisar';
    } else if (daysUntil === 1) {
      return 'Revisar mañana';
    } else if (daysUntil <= 7) {
      return `Revisar en ${daysUntil} días`;
    } else if (daysUntil <= 30) {
      const weeks = Math.ceil(daysUntil / 7);
      return `Revisar en ${weeks} semana${weeks > 1 ? 's' : ''}`;
    } else {
      const months = Math.ceil(daysUntil / 30);
      return `Revisar en ${months} mes${months > 1 ? 'es' : ''}`;
    }
  }
}

