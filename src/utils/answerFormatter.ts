/**
 * Utilidades para formatear respuestas (convertir entre string y array)
 * Facilita la transición de strings con \n a arrays de strings
 */

/**
 * Convierte un string con saltos de línea (\n) a un array de strings
 * Útil para respuestas que tienen múltiples partes
 */
export const stringToArray = (text: string): string[] => {
  if (!text) return [];
  
  // Dividir por saltos de línea y limpiar
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
};

/**
 * Convierte un array de strings a un string con saltos de línea
 * Útil para compatibilidad hacia atrás
 */
export const arrayToString = (arr: string[]): string => {
  if (!arr || arr.length === 0) return '';
  return arr.join('\n');
};

/**
 * Formatea un array de respuestas para renderización con viñetas
 * Retorna un array listo para usar en componentes de lista
 */
export const formatAnswerForDisplay = (answer: string | string[]): string[] => {
  if (Array.isArray(answer)) {
    return answer;
  }
  return stringToArray(answer);
};

/**
 * Obtiene la primera respuesta (útil para validación simple)
 */
export const getPrimaryAnswer = (answer: string | string[]): string => {
  if (Array.isArray(answer)) {
    return answer[0] || '';
  }
  // Si es string, obtener la primera línea
  const lines = stringToArray(answer);
  return lines[0] || answer;
};

/**
 * Verifica si una respuesta contiene múltiples partes
 */
export const hasMultipleParts = (answer: string | string[]): boolean => {
  if (Array.isArray(answer)) {
    return answer.length > 1;
  }
  return answer.includes('\n');
};

