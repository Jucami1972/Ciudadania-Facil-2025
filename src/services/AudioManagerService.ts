/**
 * Servicio centralizado para gestionar la reproducción de audio
 * Evita que múltiples audios se reproduzcan simultáneamente
 */

import { Audio } from 'expo-av';

class AudioManagerService {
  private currentSound: Audio.Sound | null = null;
  private isPlaying: boolean = false;

  /**
   * Reproduce un audio, deteniendo cualquier audio anterior
   */
  async playAudio(audioSource: any): Promise<void> {
    try {
      // Detener y limpiar audio anterior si existe
      await this.stopCurrentAudio();

      // Crear y reproducir nuevo audio
      const { sound } = await Audio.Sound.createAsync(audioSource, {
        shouldPlay: true,
        isLooping: false,
        volume: 1.0,
        rate: 1.0,
        shouldCorrectPitch: true,
      });

      this.currentSound = sound;
      this.isPlaying = true;

      // Configurar callback para cuando termine
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            this.isPlaying = false;
            this.currentSound = null;
            sound.unloadAsync().catch(console.error);
          } else if (!status.isPlaying) {
            this.isPlaying = false;
          }
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      this.isPlaying = false;
      this.currentSound = null;
      throw error;
    }
  }

  /**
   * Detiene el audio actual si está reproduciéndose
   */
  async stopCurrentAudio(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch (error) {
        console.error('Error stopping audio:', error);
      } finally {
        this.currentSound = null;
        this.isPlaying = false;
      }
    }
  }

  /**
   * Verifica si hay audio reproduciéndose
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Limpia recursos al desmontar
   */
  async cleanup(): Promise<void> {
    await this.stopCurrentAudio();
  }
}

// Instancia singleton
export const audioManager = new AudioManagerService();

