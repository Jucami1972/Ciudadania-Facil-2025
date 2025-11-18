/**
 * Servicio para manejar dictado de voz (voice-to-text)
 * Permite a los usuarios responder preguntas hablando en lugar de escribir
 */

import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import Voice from '@react-native-voice/voice';

export interface DictationConfig {
  language?: string; // 'en-US', 'es-ES', etc.
  continuous?: boolean; // Seguir escuchando después de pausas
  interimResults?: boolean; // Mostrar resultados parciales
}

export class AudioDictationService {
  private static isListening: boolean = false;
  private static onResultCallback: ((text: string) => void) | null = null;
  private static onErrorCallback: ((error: Error) => void) | null = null;

  /**
   * Inicializa el servicio de dictado
   */
  static async initialize(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        // Verificar si el reconocimiento de voz está disponible
        const available = await Voice.isAvailable();
        if (!available) {
          console.warn('Voice recognition not available on this device');
        }
      }
    } catch (error) {
      console.error('Error initializing dictation service:', error);
    }
  }

  /**
   * Inicia el reconocimiento de voz
   */
  static async startListening(
    config: DictationConfig = {},
    onResult?: (text: string) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    if (this.isListening) {
      await this.stopListening();
    }

    this.onResultCallback = onResult || null;
    this.onErrorCallback = onError || null;

    try {
      if (Platform.OS === 'web') {
        // En web, usar Web Speech API
        console.log('Voice recognition not fully supported on web');
        return;
      }

      // Configurar callbacks
      Voice.onSpeechStart = () => {
        this.isListening = true;
        console.log('Speech recognition started');
      };

      Voice.onSpeechResults = (e) => {
        if (e.value && e.value.length > 0) {
          const text = e.value[0];
          if (this.onResultCallback) {
            this.onResultCallback(text);
          }
        }
      };

      Voice.onSpeechError = (e) => {
        const error = new Error(e.error?.message || 'Speech recognition error');
        if (this.onErrorCallback) {
          this.onErrorCallback(error);
        }
        this.isListening = false;
      };

      Voice.onSpeechEnd = () => {
        this.isListening = false;
      };

      // Iniciar reconocimiento
      await Voice.start(
        config.language || 'en-US',
        {
          EXTRA_LANGUAGE_MODEL: 'free_form',
          EXTRA_MAX_RESULTS: 1,
          EXTRA_PARTIAL_RESULTS: config.interimResults || false,
        }
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      if (this.onErrorCallback) {
        this.onErrorCallback(err);
      }
      this.isListening = false;
    }
  }

  /**
   * Detiene el reconocimiento de voz
   */
  static async stopListening(): Promise<void> {
    try {
      if (Platform.OS !== 'web' && this.isListening) {
        await Voice.stop();
        await Voice.cancel();
        this.isListening = false;
      }
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  }

  /**
   * Verifica si el reconocimiento de voz está disponible
   */
  static async isAvailable(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false; // Web Speech API requiere configuración adicional
    }
    try {
      return await Voice.isAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Obtiene los idiomas disponibles
   */
  static async getAvailableLanguages(): Promise<string[]> {
    try {
      if (Platform.OS !== 'web') {
        return await Voice.getSupportedLanguages();
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Reproduce texto como audio (text-to-speech)
   */
  static async speak(text: string, language: string = 'en'): Promise<void> {
    try {
      await Speech.speak(text, {
        language,
        pitch: 1.0,
        rate: 0.9, // Ligeramente más lento para mejor comprensión
      });
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  }

  /**
   * Detiene la reproducción de audio
   */
  static async stopSpeaking(): Promise<void> {
    try {
      await Speech.stop();
    } catch (error) {
      console.error('Error stopping speech:', error);
    }
  }
}

