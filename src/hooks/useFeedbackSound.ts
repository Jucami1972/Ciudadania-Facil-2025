/**
 * Hook para reproducir sonidos de feedback (correcto/incorrecto)
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Reproducir feedback táctil y/o sonoro
const playFeedback = async (type: 'success' | 'error') => {
  try {
    // Feedback táctil (vibración) - siempre disponible en móvil
    if (Platform.OS !== 'web') {
      if (type === 'success') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
    
    // Nota: Para sonidos reales, se necesitarían archivos de audio
    // que se pueden agregar a assets/audio/feedback/ y reproducir con expo-av
    // Por ahora, usamos solo feedback táctil que es más confiable
  } catch (error) {
    console.warn('Error playing feedback:', error);
  }
};

export const useFeedbackSound = () => {
  const playSuccessSound = async () => {
    await playFeedback('success');
  };

  const playErrorSound = async () => {
    await playFeedback('error');
  };

  return {
    playSuccessSound,
    playErrorSound,
  };
};

