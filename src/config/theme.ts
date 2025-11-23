import { MD3LightTheme, MD3Theme } from 'react-native-paper';
import { designSystem } from './designSystem';

export const theme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: designSystem.colors.brand.primary,        // #1E40AF - Azul profesional
    secondary: designSystem.colors.brand.secondary,  // #3B82F6 - Azul claro
    background: designSystem.colors.background.primary, // #FFFFFF - Fondo blanco
    surface: designSystem.colors.background.secondary, // #F8FAFC - Superficie de tarjetas
    error: designSystem.colors.functional.error,       // #EF4444 - Color de error
  },
};

// Exportar también el sistema de diseño completo para uso en componentes
export { designSystem };
