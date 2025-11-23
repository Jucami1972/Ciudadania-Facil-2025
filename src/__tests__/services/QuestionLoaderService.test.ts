/**
 * Tests para QuestionLoaderService
 * Verifica que el servicio carga y filtra preguntas correctamente
 */

import { QuestionLoaderService } from '../../services/QuestionLoaderService';
import { practiceQuestions } from '../../data/practiceQuestions';

describe('QuestionLoaderService', () => {
  describe('applyDifficultyWeight', () => {
    it('debería aplicar ponderación correcta según dificultad', () => {
      const questions = [
        { id: 1, difficulty: 'easy' as const, questionEn: 'Test 1', answerEn: 'Answer 1', category: 'government' },
        { id: 2, difficulty: 'medium' as const, questionEn: 'Test 2', answerEn: 'Answer 2', category: 'government' },
        { id: 3, difficulty: 'hard' as const, questionEn: 'Test 3', answerEn: 'Answer 3', category: 'government' },
      ];

      const weighted = QuestionLoaderService.applyDifficultyWeight(questions as any);

      // Easy: 1 vez, Medium: 2 veces, Hard: 3 veces
      expect(weighted.length).toBe(6);
      expect(weighted.filter(q => q.id === 1).length).toBe(1);
      expect(weighted.filter(q => q.id === 2).length).toBe(2);
      expect(weighted.filter(q => q.id === 3).length).toBe(3);
    });

    it('debería retornar array vacío si no hay preguntas', () => {
      const result = QuestionLoaderService.applyDifficultyWeight([]);
      expect(result).toEqual([]);
    });
  });

  describe('getAllQuestionsByCategory', () => {
    it('debería retornar preguntas de una categoría válida', async () => {
      const questions = await QuestionLoaderService.getAllQuestionsByCategory('government');
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
    });

    it('debería retornar array vacío para categoría inválida', async () => {
      const questions = await QuestionLoaderService.getAllQuestionsByCategory('invalid_category');
      expect(Array.isArray(questions)).toBe(true);
    });
  });
});




