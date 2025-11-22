import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

// Variable global para almacenar el módulo Voice (cargado lazy)
let Voice: any = null;
let voiceModuleChecked = false;

// Variable global para cachear el resultado de la detección de Expo Go
let isExpoGoCached: boolean | null = null;

// Función helper para detectar si estamos en Expo Go (sin módulos nativos)
const isExpoGo = (): boolean => {
  // Si ya se detectó, usar el resultado cacheado
  if (isExpoGoCached !== null) {
    return isExpoGoCached;
  }

  try {
    // Expo Go tiene Constants.executionEnvironment === 'storeClient'
    // o Constants.appOwnership === 'expo'
    const Constants = require('expo-constants');
    const constants = Constants?.default || Constants;
    const executionEnvironment = constants?.executionEnvironment;
    const appOwnership = constants?.appOwnership;
    
    // Verificar si estamos en Expo Go
    const isExpoGoEnv = executionEnvironment === 'storeClient' || appOwnership === 'expo';
    
    // Cachear el resultado
    isExpoGoCached = isExpoGoEnv;
    
    if (__DEV__) {
      if (isExpoGoEnv) {
        console.log('🔍 Detectado Expo Go - Voice recognition no estará disponible');
      }
    }
    
    return isExpoGoEnv;
  } catch (error: any) {
    // Si no podemos detectar, asumir que no es Expo Go para permitir intentar cargar
    // (mejor intentar y fallar suavemente que bloquear innecesariamente)
    isExpoGoCached = false;
    if (__DEV__) {
      console.warn('⚠️ No se pudo detectar Expo Go:', error?.message || error);
    }
    return false;
  }
};

// Función helper para obtener el módulo Voice de forma segura
const getVoiceModule = (): any => {
  // Si ya se verificó, retornar el resultado cacheado
  if (voiceModuleChecked) {
    return Voice;
  }

  // Marcar que ya se verificó ANTES de intentar cargar el módulo
  voiceModuleChecked = true;

  // En web, nunca está disponible
  if (Platform.OS === 'web') {
    Voice = null;
    return null;
  }

  // Si estamos en Expo Go, NO intentar cargar el módulo nativo (causaría Invariant Violation)
  // Esta verificación debe ser ANTES de cualquier require() del módulo Voice
  const expoGoDetected = isExpoGo();
  if (expoGoDetected) {
    Voice = null;
    if (__DEV__) {
      console.warn('⚠️ @react-native-voice/voice no disponible en Expo Go. Requiere development build.');
      console.warn('ℹ️ La funcionalidad de reconocimiento de voz estará deshabilitada.');
    }
    // RETORNAR INMEDIATAMENTE sin intentar cargar el módulo
    return null;
  }

  // SOLO intentar cargar el módulo si NO estamos en Expo Go
  // Esto evita el "Invariant Violation" en Expo Go
  try {
    // Intentar cargar el módulo solo cuando se necesite
    // Usar require dentro de una función para que no falle en tiempo de carga del módulo
    let voiceModule: any;
    
    try {
      // IMPORTANTE: Este require() SOLO se ejecuta si NO estamos en Expo Go
      // En Expo Go, ya retornamos null arriba, así que nunca llegamos aquí
      voiceModule = require('@react-native-voice/voice');
    } catch (requireError: any) {
      // El require falló completamente
      Voice = null;
      if (__DEV__) {
        console.warn('⚠️ @react-native-voice/voice no disponible. Requiere development build.');
        console.warn('Error en require:', requireError?.message || requireError);
      }
      return null;
    }
    
    // Verificar si voiceModule es undefined, null o no existe
    if (voiceModule === undefined || voiceModule === null || typeof voiceModule !== 'object') {
      Voice = null;
      if (__DEV__) {
        console.warn('⚠️ @react-native-voice/voice no disponible. El módulo está undefined/null.');
      }
      return null;
    }
    
    // Intentar obtener el módulo (puede ser default o el módulo mismo)
    // Verificar primero si tiene la propiedad 'default' antes de acceder
    if (typeof voiceModule === 'object' && 'default' in voiceModule && voiceModule.default) {
      Voice = voiceModule.default;
    } else if (typeof voiceModule === 'object' && voiceModule) {
      Voice = voiceModule;
    } else {
      Voice = null;
    }
    
    // Verificar si Voice sigue siendo null o undefined
    if (!Voice || (typeof Voice !== 'object' && typeof Voice !== 'function')) {
      Voice = null;
      if (__DEV__) {
        console.warn('⚠️ @react-native-voice/voice no disponible. El módulo no es válido.');
      }
    }
    
    return Voice;
  } catch (error: any) {
    // El módulo no está disponible (normal en Expo Go)
    Voice = null;
    if (__DEV__) {
      console.warn('⚠️ @react-native-voice/voice no disponible. Requiere development build.');
      console.warn('Error general:', error?.message || error);
    }
    return null;
  }
};

interface UseVoiceRecognitionProps {
  onSpeechResult?: (text: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export const useVoiceRecognition = ({
  onSpeechResult,
  onError,
  onStart,
  onEnd
}: UseVoiceRecognitionProps = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cargar el módulo Voice de forma lazy solo cuando se monte el hook
    if (!Voice) {
      Voice = getVoiceModule();
    }

    // Verificar si Voice está disponible
    if (!Voice) {
      setIsSupported(false);
      return;
    }

    // Si Voice está disponible, configurar
    checkVoiceSupport();
    setupVoiceListeners();
    return () => {
      cleanupVoiceListeners();
    };
  }, []);

  const checkVoiceSupport = async () => {
    if (!Voice) {
      setIsSupported(false);
      return;
    }

    try {
      const available = await Voice.isAvailable();
      setIsSupported(available);
      console.log('Voice recognition available:', available);
    } catch (error) {
      console.error('Error checking voice support:', error);
      setIsSupported(false);
    }
  };

  const setupVoiceListeners = () => {
    if (!Voice) return;

    Voice.onSpeechStart = () => {
      console.log('Speech recognition started');
      onStart?.();
    };

    Voice.onSpeechResults = (e: any) => {
      if (e.value && e.value.length > 0) {
        const result = e.value[0];
        console.log('Speech recognition result:', result);
        onSpeechResult?.(result);
      }
    };

    Voice.onSpeechError = (e: any) => {
      console.error('Speech recognition error:', e);
      const errorMsg = e.error?.message || 'Error en el reconocimiento de voz';
      setError(errorMsg);
      onError?.(errorMsg);
      setIsRecording(false);
    };

    Voice.onSpeechEnd = () => {
      console.log('Speech recognition ended');
      setIsRecording(false);
      onEnd?.();
    };
  };

  const cleanupVoiceListeners = () => {
    if (!Voice) return;
    try {
      Voice.destroy().then(() => Voice.removeAllListeners());
    } catch (error) {
      console.error('Error cleaning up voice listeners:', error);
    }
  };

  const startRecording = useCallback(async (language: string = 'en-US') => {
    if (!Voice) {
      const errorMsg = 'El reconocimiento de voz no está disponible. Se requiere un development build para usar esta funcionalidad.';
      setError(errorMsg);
      // Solo llamar a onError si el usuario intentó usar la voz
      onError?.(errorMsg);
      return;
    }

    if (!isSupported) {
      const errorMsg = 'El reconocimiento de voz no está disponible en este dispositivo';
      setError(errorMsg);
      // Solo llamar a onError si el usuario intentó usar la voz
      onError?.(errorMsg);
      return;
    }

    try {
      setError(null);
      setIsRecording(true);
      
      await Voice.start(language);
      console.log('Voice recognition started with language:', language);
    } catch (error: any) {
      console.error('Error starting voice recognition:', error);
      const errorMsg = error?.message || 'Error al iniciar el reconocimiento de voz';
      setError(errorMsg);
      onError?.(errorMsg);
      setIsRecording(false);
    }
  }, [isSupported, onError]);

  const stopRecording = useCallback(async () => {
    if (!Voice) {
      setIsRecording(false);
      return;
    }

    try {
      await Voice.stop();
      console.log('Voice recognition stopped');
      setIsRecording(false);
      onEnd?.();
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
      setIsRecording(false);
    }
  }, [onEnd]);

  const destroy = useCallback(async () => {
    try {
      // Cleanup si es necesario
      setIsRecording(false);
    } catch (error) {
      console.error('Error destroying voice recognition:', error);
    }
  }, []);

  return {
    isRecording,
    isSupported,
    error,
    startRecording,
    stopRecording,
    destroy,
  };
};
