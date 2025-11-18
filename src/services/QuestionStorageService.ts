/**
 * Servicio para manejar el almacenamiento persistente de preguntas
 * Separa la lógica de persistencia de la lógica de negocio
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  INCORRECT_QUESTIONS: '@practice:incorrect',
  MARKED_QUESTIONS: '@practice:marked',
  PRACTICE_STATS: '@practice:stats',
  SRS_DATA: '@practice:srs_data', // Datos de Repetición Espaciada
} as const;

export interface QuestionStorageData {
  incorrectQuestions: Set<number>;
  markedQuestions: Set<number>;
}

/**
 * Servicio para gestionar el almacenamiento de preguntas
 */
export class QuestionStorageService {
  /**
   * Carga las preguntas incorrectas y marcadas desde AsyncStorage
   */
  static async loadPersistedData(): Promise<QuestionStorageData> {
    try {
      const [incorrectData, markedData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.INCORRECT_QUESTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.MARKED_QUESTIONS),
      ]);

      return {
        incorrectQuestions: new Set(incorrectData ? JSON.parse(incorrectData) : []),
        markedQuestions: new Set(markedData ? JSON.parse(markedData) : []),
      };
    } catch (error) {
      console.error('Error loading persisted data:', error);
      return {
        incorrectQuestions: new Set<number>(),
        markedQuestions: new Set<number>(),
      };
    }
  }

  /**
   * Guarda una pregunta incorrecta
   */
  static async saveIncorrectQuestion(questionId: number, incorrectQuestions: Set<number>): Promise<void> {
    try {
      const newIncorrectQuestions = new Set(incorrectQuestions);
      newIncorrectQuestions.add(questionId);
      await AsyncStorage.setItem(
        STORAGE_KEYS.INCORRECT_QUESTIONS,
        JSON.stringify([...newIncorrectQuestions])
      );
    } catch (error) {
      console.error('Error saving incorrect question:', error);
      throw error;
    }
  }

  /**
   * Marca o desmarca una pregunta
   */
  static async toggleMarkedQuestion(
    questionId: number,
    markedQuestions: Set<number>
  ): Promise<Set<number>> {
    try {
      const newMarkedQuestions = new Set(markedQuestions);
      if (newMarkedQuestions.has(questionId)) {
        newMarkedQuestions.delete(questionId);
      } else {
        newMarkedQuestions.add(questionId);
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.MARKED_QUESTIONS,
        JSON.stringify([...newMarkedQuestions])
      );

      return newMarkedQuestions;
    } catch (error) {
      console.error('Error toggling marked question:', error);
      throw error;
    }
  }

  /**
   * Obtiene las preguntas incorrectas guardadas
   */
  static async getIncorrectQuestions(): Promise<number[]> {
    try {
      const incorrectData = await AsyncStorage.getItem(STORAGE_KEYS.INCORRECT_QUESTIONS);
      return incorrectData ? JSON.parse(incorrectData) : [];
    } catch (error) {
      console.error('Error getting incorrect questions:', error);
      return [];
    }
  }

  /**
   * Obtiene las preguntas marcadas guardadas
   */
  static async getMarkedQuestions(): Promise<number[]> {
    try {
      const markedData = await AsyncStorage.getItem(STORAGE_KEYS.MARKED_QUESTIONS);
      return markedData ? JSON.parse(markedData) : [];
    } catch (error) {
      console.error('Error getting marked questions:', error);
      return [];
    }
  }

  /**
   * Guarda datos de Repetición Espaciada (SRS)
   */
  static async saveSRSData(questionId: number, srsData: any): Promise<void> {
    try {
      const allSRSData = await this.getAllSRSData();
      allSRSData[questionId] = srsData;
      await AsyncStorage.setItem(STORAGE_KEYS.SRS_DATA, JSON.stringify(allSRSData));
    } catch (error) {
      console.error('Error saving SRS data:', error);
      throw error;
    }
  }

  /**
   * Obtiene datos SRS para una pregunta específica
   */
  static async getSRSData(questionId: number): Promise<any | null> {
    try {
      const allSRSData = await this.getAllSRSData();
      return allSRSData[questionId] || null;
    } catch (error) {
      console.error('Error getting SRS data:', error);
      return null;
    }
  }

  /**
   * Obtiene todos los datos SRS
   */
  static async getAllSRSData(): Promise<Record<number, any>> {
    try {
      const srsData = await AsyncStorage.getItem(STORAGE_KEYS.SRS_DATA);
      return srsData ? JSON.parse(srsData) : {};
    } catch (error) {
      console.error('Error getting all SRS data:', error);
      return {};
    }
  }
}

