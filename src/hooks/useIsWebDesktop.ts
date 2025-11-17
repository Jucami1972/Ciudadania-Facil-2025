import { useState, useEffect } from 'react';
import { Platform, Dimensions } from 'react-native';

/**
 * Hook para detectar si estamos en web de escritorio (pantalla grande)
 * vs web móvil (pantalla pequeña) o app móvil nativa
 * 
 * @returns {boolean} true si es web de escritorio (width > 768px), false en caso contrario
 */
export const useIsWebDesktop = (): boolean => {
  const [isWebDesktop, setIsWebDesktop] = useState(() => {
    if (Platform.OS !== 'web') {
      return false;
    }
    const { width } = Dimensions.get('window');
    return width > 768; // Breakpoint típico para móvil/escritorio
  });

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsWebDesktop(window.width > 768);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return isWebDesktop;
};

