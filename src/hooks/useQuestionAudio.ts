/**
 * Hook para manejar la reproducción de audio de preguntas
 */

import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';
import { questionAudioMap } from '../assets/audio/questions/questionsMap';

export const useQuestionAudio = (questionId: number | null) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Limpiar audio al desmontar o cambiar pregunta
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound, questionId]);

  const playAudio = async () => {
    if (!questionId) return;

    try {
      console.log('Playing audio for question:', questionId);

      // Detener audio anterior si está reproduciéndose
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      // Crear nuevo audio usando el ID de la pregunta
      const audioFile = questionAudioMap[questionId];
      if (audioFile) {
        console.log('Audio file found:', audioFile);

        const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
        setSound(newSound);

        // Configurar callback para cuando termine
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            console.log('Audio finished playing');
            newSound.unloadAsync();
            setSound(null);
          }
        });

        // Reproducir audio
        console.log('Starting audio playback...');
        await newSound.playAsync();
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

