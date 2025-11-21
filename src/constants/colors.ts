export const homeGradients = {
  study: ['#1E40AF', '#3B82F6'] as const, // Azul profesional
  practice: ['#1E3A8A', '#2563EB'] as const, // Azul más oscuro
  exam: ['#1B5E20', '#4CAF50'] as const, // Verde (mantener para diferenciar)
} as const;

export const sectionGradients = {
  GobiernoAmericano: ['#1E40AF', '#3B82F6'] as const, // Azul profesional
  HistoriaAmericana: ['#1E3A8A', '#2563EB'] as const, // Azul oscuro
  EducacionCivica: ['#1E40AF', '#60A5FA'] as const, // Azul con acento claro
} as const;

export const colors = {
  primary: {
    main: '#1E40AF', // Azul 800 - Profesional y confiable
    light: '#3B82F6', // Azul 500 - Más claro para acentos
    dark: '#1E3A8A', // Azul 900 - Más oscuro para profundidad
    gradient: ['#1E40AF', '#3B82F6'] as const, // Gradiente profesional
  },
  secondary: {
    yellow: '#FFCB1F',
    white: '#FFFFFF',
    accent: '#2645ca',
  },
  text: {
    dark: '#1A1A1A',
    light: '#666666',
    primary: '#FFFFFF',
  },
  surface: {
    main: '#FFFFFF',
    light: '#F5F5F5',
    dark: '#E5E5EA',
  },
  neutral: {
    background: '#F5F5F5',
    card: '#FFFFFF',
    divider: '#E5E5E5',
  },
  ui: {
    success: '#4CAF50',
    error: '#FF3B30',
    warning: '#FFC107',
    info: '#2196F3',
    disabled: '#BDBDBD',
  },
  progress: {
    border: '#2C8BFF',
    background: '#FFFFFF',
  },
  error: {
    main: '#FF3B30',
    light: '#FF6B6B',
  },
  shadow: 'rgba(0, 0, 0, 0.15)',
} as const;
