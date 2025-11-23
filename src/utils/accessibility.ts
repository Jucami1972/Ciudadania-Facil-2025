/**
 * Utilidades de accesibilidad
 * Verificación WCAG y helpers para accesibilidad
 */

import { designSystem } from '../config/designSystem';

/**
 * Convierte un color hexadecimal a RGB
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

/**
 * Calcula la luminancia relativa de un color (WCAG)
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calcula el ratio de contraste entre dos colores (WCAG)
 * https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 */
const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return 1; // Contraste mínimo si no se puede calcular
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Verifica si el contraste cumple con WCAG AA (4.5:1 para texto normal)
 * @param foregroundColor Color del texto
 * @param backgroundColor Color de fondo
 * @param isLargeText Si el texto es grande (18pt+ o 14pt+ bold), requiere 3:1
 * @returns true si cumple con WCAG AA
 */
export const hasAdequateContrast = (
  foregroundColor: string,
  backgroundColor: string,
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foregroundColor, backgroundColor);
  const requiredRatio = isLargeText ? 3 : 4.5; // WCAG AA
  return ratio >= requiredRatio;
};

/**
 * Verifica si el contraste cumple con WCAG AAA (7:1 para texto normal)
 */
export const hasExcellentContrast = (
  foregroundColor: string,
  backgroundColor: string,
  isLargeText: boolean = false
): boolean => {
  const ratio = getContrastRatio(foregroundColor, backgroundColor);
  const requiredRatio = isLargeText ? 4.5 : 7; // WCAG AAA
  return ratio >= requiredRatio;
};

/**
 * Obtiene un color de texto accesible para un fondo dado
 * @param backgroundColor Color de fondo
 * @returns Color de texto que cumple con WCAG AA
 */
export const getAccessibleTextColor = (backgroundColor: string): string => {
  const white = designSystem.colors.text.inverse;
  const black = designSystem.colors.text.primary;

  const whiteContrast = getContrastRatio(white, backgroundColor);
  const blackContrast = getContrastRatio(black, backgroundColor);

  // Preferir el que tenga mejor contraste
  if (whiteContrast >= 4.5) {
    return white;
  }
  if (blackContrast >= 4.5) {
    return black;
  }

  // Si ninguno cumple, retornar el que tenga mejor contraste
  return whiteContrast > blackContrast ? white : black;
};

/**
 * Genera un accessibilityLabel descriptivo para un botón
 */
export const generateAccessibilityLabel = (
  action: string,
  context?: string,
  additionalInfo?: string
): string => {
  let label = action;
  if (context) {
    label += ` ${context}`;
  }
  if (additionalInfo) {
    label += `. ${additionalInfo}`;
  }
  return label;
};

/**
 * Genera un accessibilityHint descriptivo
 */
export const generateAccessibilityHint = (action: string, result?: string): string => {
  let hint = `Presiona para ${action.toLowerCase()}`;
  if (result) {
    hint += `. ${result}`;
  }
  return hint;
};




