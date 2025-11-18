/**
 * Componente para mostrar la pregunta en modo texto o audio
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

export type QuestionMode = 'text-text' | 'voice-text';

interface PracticeQuestionCardProps {
  question: string;
  mode?: QuestionMode;
  onPlayAudio?: () => void;
}

export const PracticeQuestionCard: React.FC<PracticeQuestionCardProps> = ({
  question,
  mode = 'text-text',
  onPlayAudio,
}) => {
  const getQuestionModeText = (mode: QuestionMode): string => {
    switch (mode) {
      case 'text-text':
        return 'Pregunta de texto - Respuesta de texto';
      case 'voice-text':
        return 'Pregunta de voz - Respuesta de texto';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.modeChip}>
        <MaterialCommunityIcons
          name={mode?.includes('voice') ? 'microphone' : 'text'}
          size={14}
          color={colors.primary.main}
        />
        <Text style={styles.modeText}>{getQuestionModeText(mode)}</Text>
      </View>

      {mode === 'voice-text' ? (
        <View style={styles.audioContainer}>
          <TouchableOpacity style={styles.audioButton} onPress={onPlayAudio}>
            <MaterialCommunityIcons name="play-circle" size={20} color="#fff" />
            <Text style={styles.audioButtonText}>Escuchar</Text>
          </TouchableOpacity>
          <Text style={styles.voiceInstruction}>Escribe tu respuesta después de escuchar</Text>
        </View>
      ) : (
        <>
          <Text style={styles.questionLabel}>Pregunta</Text>
          <Text style={styles.questionText}>{question}</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124,58,237,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  modeText: {
    fontSize: 14, // Accesibilidad: mínimo 14pt (idealmente 16pt)
    fontWeight: '600',
    color: colors.primary.main,
  },
  questionLabel: {
    fontSize: 16, // Accesibilidad: mínimo 16pt para texto de cuerpo
    fontWeight: '700',
    color: '#4B5563', // Mejor contraste (5.1:1 sobre blanco)
    marginBottom: 8, // Más espaciado
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 20, // Accesibilidad: 18-20pt para preguntas (adultos mayores)
    color: '#111827',
    lineHeight: 28, // Mejor legibilidad con más espacio
    fontWeight: '500',
  },
  audioContainer: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: 20, // Más padding para área de toque
    paddingVertical: 14, // Área de toque mínimo 44dp
    minHeight: 44, // Accesibilidad: mínimo 44x44 dp
    borderRadius: 20,
    gap: 8,
  },
  audioButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16, // Accesibilidad: mínimo 16pt para botones
    letterSpacing: 0.2,
  },
  voiceInstruction: {
    fontSize: 14, // Accesibilidad: mínimo 14pt
    color: '#4B5563', // Mejor contraste
    textAlign: 'center',
  },
});

