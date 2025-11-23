/**
 * Tests para QuestionStorageService
 * Verifica el almacenamiento persistente de preguntas
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuestionStorageService } from '../../services/QuestionStorageService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('QuestionStorageService', () => {
  beforeEach(() => {
    (AsyncStorage as any).clear();
  });

  describe('saveIncorrectQuestion', () => {
    it('debería guardar una pregunta incorrecta', async () => {
      const incorrectQuestions = new Set<number>();
      
      await QuestionStorageService.saveIncorrectQuestion(1, incorrectQuestions);
      
      const stored = await AsyncStorage.getItem('@practice:incorrect');
      const parsed = stored ? JSON.parse(stored) : [];
      
      expect(parsed).toContain(1);
    });

    it('debería agregar a preguntas existentes sin duplicar', async () => {
      const incorrectQuestions = new Set([1, 2]);
      
      await QuestionStorageService.saveIncorrectQuestion(3, incorrectQuestions);
      
      const stored = await AsyncStorage.getItem('@practice:incorrect');
      const parsed = stored ? JSON.parse(stored) : [];
      
      expect(parsed).toContain(1);
      expect(parsed).toContain(2);
      expect(parsed).toContain(3);
      expect(parsed.length).toBe(3);
    });
  });

  describe('toggleMarkedQuestion', () => {
    it('debería marcar una pregunta no marcada', async () => {
      const markedQuestions = new Set<number>();
      
      const result = await QuestionStorageService.toggleMarkedQuestion(1, markedQuestions);
      
      expect(result.has(1)).toBe(true);
    });

    it('debería desmarcar una pregunta marcada', async () => {
      const markedQuestions = new Set([1]);
      
      const result = await QuestionStorageService.toggleMarkedQuestion(1, markedQuestions);
      
      expect(result.has(1)).toBe(false);
    });
  });

  describe('loadPersistedData', () => {
    it('debería cargar datos guardados correctamente', async () => {
      await AsyncStorage.setItem('@practice:incorrect', JSON.stringify([1, 2, 3]));
      await AsyncStorage.setItem('@practice:marked', JSON.stringify([4, 5]));
      
      const data = await QuestionStorageService.loadPersistedData();
      
      expect(data.incorrectQuestions.has(1)).toBe(true);
      expect(data.incorrectQuestions.has(2)).toBe(true);
      expect(data.incorrectQuestions.has(3)).toBe(true);
      expect(data.markedQuestions.has(4)).toBe(true);
      expect(data.markedQuestions.has(5)).toBe(true);
    });

    it('debería retornar sets vacíos si no hay datos', async () => {
      const data = await QuestionStorageService.loadPersistedData();
      
      expect(data.incorrectQuestions.size).toBe(0);
      expect(data.markedQuestions.size).toBe(0);
    });
  });
});




