/**
 * Hook para manejar la reproducción de audio de preguntas
 * Usa AudioManagerService para evitar múltiples audios simultáneos
 */

import { useEffect } from 'react';
import { Alert } from 'react-native';
import { questionAudioMap } from '../assets/audio/questions/questionsMap';
import { audioManager } from '../services/AudioManagerService';

export const useQuestionAudio = (questionId: number | null) => {
  // Limpiar audio al desmontar o cambiar pregunta
  useEffect(() => {
    return () => {
      audioManager.stopCurrentAudio().catch(console.error);
    };
  }, [questionId]);

  const playAudio = async () => {
    if (!questionId) return;

    try {
      console.log('Playing audio for question:', questionId);

      // Crear nuevo audio usando el ID de la pregunta
      const audioFile = questionAudioMap[questionId];
      if (audioFile) {
        console.log('Audio file found:', audioFile);
        // El AudioManagerService se encarga de detener cualquier audio anterior
        await audioManager.playAudio(audioFile);
        console.log('Audio playback started');
      } else {
        console.error('No audio file found for question:', questionId);
        Alert.alert('Error', 'No se encontró el archivo de audio para esta pregunta');
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'No se pudo reproducir el audio');
    }
  };

  return { playAudio };
};

