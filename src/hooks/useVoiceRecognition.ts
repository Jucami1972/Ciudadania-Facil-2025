import { useState, useEffect, useCallback } from 'react';
import Voice from '@react-native-voice/voice';

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
    if (Voice) {
      checkVoiceSupport();
      setupVoiceListeners();
      return () => {
        cleanupVoiceListeners();
      };
    } else {
      // Si el módulo no está disponible, marcar como no soportado
      // No llamar a onError aquí, solo marcar como no disponible silenciosamente
      setIsSupported(false);
      setError(null); // No establecer error, solo marcar como no soportado
    }
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
