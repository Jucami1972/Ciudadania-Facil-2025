/**
 * Tests para SpacedRepetitionService
 * Verifica el algoritmo SM-2 de repetición espaciada
 */

import { SpacedRepetitionService, SRSData, ResponseQuality } from '../../services/SpacedRepetitionService';

describe('SpacedRepetitionService', () => {
  describe('getSRSData', () => {
    it('debería crear datos iniciales para pregunta nueva', () => {
      const data = SpacedRepetitionService.getSRSData(1);
      
      expect(data.questionId).toBe(1);
      expect(data.easeFactor).toBe(2.5);
      expect(data.interval).toBe(0);
      expect(data.repetitions).toBe(0);
      expect(data.lastReviewDate).toBeNull();
      expect(data.nextReviewDate).toBeNull();
    });

    it('debería usar datos almacenados si existen', () => {
      const storedData: SRSData = {
        questionId: 1,
        easeFactor: 2.7,
        interval: 5,
        repetitions: 3,
        lastReviewDate: new Date('2024-01-01'),
        nextReviewDate: new Date('2024-01-06'),
        quality: 4,
      };

      const data = SpacedRepetitionService.getSRSData(1, storedData);
      
      expect(data.easeFactor).toBe(2.7);
      expect(data.interval).toBe(5);
      expect(data.repetitions).toBe(3);
    });
  });

  describe('calculateNextReview', () => {
    it('debería incrementar intervalo para respuesta correcta (quality >= 3)', () => {
      const initialData: SRSData = {
        questionId: 1,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
        lastReviewDate: new Date('2024-01-01'),
        nextReviewDate: new Date('2024-01-02'),
        quality: 3,
      };

      const result = SpacedRepetitionService.calculateNextReview(initialData, 4);
      
      expect(result.interval).toBeGreaterThan(initialData.interval);
      expect(result.repetitions).toBeGreaterThan(initialData.repetitions);
      expect(result.lastReviewDate).toBeInstanceOf(Date);
    });

    it('debería reiniciar para respuesta incorrecta (quality < 3)', () => {
      const initialData: SRSData = {
        questionId: 1,
        easeFactor: 2.5,
        interval: 10,
        repetitions: 5,
        lastReviewDate: new Date('2024-01-01'),
        nextReviewDate: new Date('2024-01-11'),
        quality: 4,
      };

      const result = SpacedRepetitionService.calculateNextReview(initialData, 2);
      
      expect(result.interval).toBe(1); // Reinicia a 1 día
      expect(result.repetitions).toBe(0); // Reinicia repeticiones
    });
  });
});




