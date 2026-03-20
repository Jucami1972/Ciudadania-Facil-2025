// src/constants/categories.ts
export const CATEGORIES = {
  GOVERNMENT: 'government',
  HISTORY: 'history',
  CIVICS: 'civics',
} as const;

export type CategoryType = typeof CATEGORIES[keyof typeof CATEGORIES];

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  [CATEGORIES.GOVERNMENT]: 'Gobierno Americano',
  [CATEGORIES.HISTORY]: 'Historia Americana',
  [CATEGORIES.CIVICS]: 'Educación Cívica',
};
