/**
 * Servicio para gestionar la navegación entre secciones de preguntas
 */

import { questions } from '../data/questions';

export interface NextSectionInfo {
  category: string;
  subcategory: string;
  title: string;
  questionRange: string;
  exists: boolean;
}

/**
 * Obtiene la siguiente sección basada en la pregunta actual
 */
export class SectionNavigationService {
  /**
   * Obtiene la sección actual de una pregunta por su ID
   */
  static getCurrentSection(questionId: number): { category: string; subcategory: string } | null {
    const question = questions.find(q => q.id === questionId);
    if (!question) return null;
    
    return {
      category: question.category,
      subcategory: question.subcategory,
    };
  }

  /**
   * Obtiene la siguiente sección después de completar una pregunta
   */
  static getNextSection(currentQuestionId: number): NextSectionInfo | null {
    const currentQuestion = questions.find(q => q.id === currentQuestionId);
    if (!currentQuestion) return null;

    const { category, subcategory } = currentQuestion;

    // Obtener todas las subcategorías únicas de la categoría actual
    const allSubcategories = questions
      .filter((q) => q.category === category)
      .map((q) => q.subcategory)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();

    const currentIndex = allSubcategories.indexOf(subcategory);

    // Si hay una siguiente subcategoría en la misma categoría
    if (currentIndex < allSubcategories.length - 1) {
      const nextSubcategory = allSubcategories[currentIndex + 1];
      const questionsInSubcategory = questions.filter(
        (q) => q.category === category && q.subcategory === nextSubcategory
      );

      if (questionsInSubcategory.length > 0) {
        const firstId = Math.min(...questionsInSubcategory.map((q) => q.id));
        const lastId = Math.max(...questionsInSubcategory.map((q) => q.id));

        return {
          category,
          subcategory: nextSubcategory,
          title: this.getCategoryTitle(category),
          questionRange: `${firstId}-${lastId}`,
          exists: true,
        };
      }
    }

    // Si no hay más subcategorías en la categoría actual, buscar la siguiente categoría
    const allCategories: string[] = ['government', 'history', 'symbols_holidays'];
    const currentCategoryIndex = allCategories.indexOf(category);

    if (currentCategoryIndex < allCategories.length - 1) {
      const nextCategory = allCategories[currentCategoryIndex + 1];
      const nextCategoryQuestions = questions.filter((q) => q.category === nextCategory);

      if (nextCategoryQuestions.length > 0) {
        const firstSubcategory = nextCategoryQuestions[0].subcategory;
        const questionsInSubcategory = questions.filter(
          (q) => q.category === nextCategory && q.subcategory === firstSubcategory
        );

        if (questionsInSubcategory.length > 0) {
          const firstId = Math.min(...questionsInSubcategory.map((q) => q.id));
          const lastId = Math.max(...questionsInSubcategory.map((q) => q.id));

          return {
            category: nextCategory,
            subcategory: firstSubcategory,
            title: this.getCategoryTitle(nextCategory),
            questionRange: `${firstId}-${lastId}`,
            exists: true,
          };
        }
      }
    }

    return null;
  }

  /**
   * Verifica si una pregunta es la última de su sección
   */
  static isLastQuestionInSection(questionId: number): boolean {
    const currentQuestion = questions.find(q => q.id === questionId);
    if (!currentQuestion) return false;

    const { category, subcategory } = currentQuestion;
    const questionsInSection = questions.filter(
      (q) => q.category === category && q.subcategory === subcategory
    );

    const maxId = Math.max(...questionsInSection.map((q) => q.id));
    return questionId === maxId;
  }

  /**
   * Obtiene el título de la categoría
   */
  private static getCategoryTitle(category: string): string {
    const titles: Record<string, string> = {
      government: 'Gobierno Americano',
      history: 'Historia Americana',
      symbols_holidays: 'Símbolos y Días Festivos',
    };
    return titles[category] || category;
  }
}

