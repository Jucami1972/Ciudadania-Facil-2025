// src/config/designSystem.ts
// Sistema de diseño unificado para Ciudadanía Fácil 2025
// Proporciona colores, tipografía, espaciado y sombras consistentes en toda la aplicación

export const designSystem = {
  colors: {
    // Identidad de marca (Azul profesional como color principal)
    brand: {
      primary: '#1E40AF',      // Azul profesional - Color principal de la marca
      secondary: '#3B82F6',   // Azul claro - Color secundario
      accent: '#8B5CF6',       // Morado - Para acentos y destacados
      dark: '#1E293B',         // Azul oscuro - Para textos importantes
    },
    
    // Colores funcionales (estados y acciones)
    functional: {
      success: '#10B981',      // Verde - Éxito, completado
      warning: '#F59E0B',      // Amarillo/Naranja - Advertencias, en progreso
      error: '#EF4444',        // Rojo - Errores, peligro
      info: '#06B6D4',         // Cian - Información, ayuda
    },
    
    // Colores neutrales (escala de grises)
    neutral: {
      50: '#F8FAFC',   // Fondo muy claro
      100: '#F1F5F9',  // Fondo claro
      200: '#E2E8F0',  // Borde claro
      300: '#CBD5E1',  // Borde medio
      400: '#94A3B8',  // Texto deshabilitado
      500: '#64748B',  // Texto secundario
      600: '#475569',  // Texto medio
      700: '#334155',  // Texto importante
      800: '#1E293B',  // Texto muy importante
      900: '#0F172A',  // Texto principal
    },
    
    // Colores de texto (semánticos)
    text: {
      primary: '#111827',      // Texto principal (gris muy oscuro)
      secondary: '#6B7280',   // Texto secundario (gris medio)
      tertiary: '#9CA3AF',    // Texto terciario (gris claro)
      inverse: '#FFFFFF',      // Texto sobre fondos oscuros
      disabled: '#94A3B8',    // Texto deshabilitado
    },
    
    // Colores de fondo
    background: {
      primary: '#FFFFFF',      // Fondo principal (blanco)
      secondary: '#F8FAFC',   // Fondo secundario (gris muy claro)
      tertiary: '#F0F4F8',    // Fondo terciario (gris claro)
      overlay: 'rgba(0, 0, 0, 0.5)', // Overlay para modales
    },
    
    // Colores de borde
    border: {
      light: '#E5E7EB',        // Borde claro
      medium: '#CBD5E1',       // Borde medio
      dark: '#94A3B8',         // Borde oscuro
    },
  },
  
  // Tipografía
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 32,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
      letterSpacing: 0,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
    bodyBold: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: 0,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
      letterSpacing: 0,
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
      letterSpacing: 0,
    },
  },
  
  // Espaciado (sistema de 4px)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  // Radio de borde
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  
  // Sombras (elevación)
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
} as const;

// Exportar tipos para TypeScript
export type DesignSystemColors = typeof designSystem.colors;
export type DesignSystemTypography = typeof designSystem.typography;
export type DesignSystemSpacing = typeof designSystem.spacing;
export type DesignSystemBorderRadius = typeof designSystem.borderRadius;
export type DesignSystemShadows = typeof designSystem.shadows;

// Helper para obtener colores con opacidad
export const withOpacity = (color: string, opacity: number): string => {
  // Si el color ya tiene formato rgba o rgb, extraer los valores
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

