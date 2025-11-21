/**
 * Componente para mostrar el resultado de la respuesta (correcto/incorrecto)
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useFeedbackSound } from '../../hooks/useFeedbackSound';

interface AnswerResultCardProps {
  isCorrect: boolean;
  correctAnswer: string;
  onRepeat: () => void;
  onNext: () => void;
}

export const AnswerResultCard: React.FC<AnswerResultCardProps> = ({
  isCorrect,
  correctAnswer,
  onRepeat,
  onNext,
}) => {
  const { playSuccessSound, playErrorSound } = useFeedbackSound();

  // Reproducir sonido cuando se muestra el resultado
  useEffect(() => {
    if (isCorrect) {
      playSuccessSound();
    } else {
      playErrorSound();
    }
  }, [isCorrect]);
  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: isCorrect ? '#22c55e' : '#ef4444' }]}>
        <MaterialCommunityIcons
          name={isCorrect ? 'check-circle' : 'close-circle'}
          size={28} // Accesibilidad: icono más grande para mejor visibilidad
          color="#fff"
        />
        <Text style={styles.headerText}>{isCorrect ? '¡Correcto!' : 'Incorrecto'}</Text>
      </View>
      <View style={styles.correctAnswerContainer}>
        <Text style={styles.correctAnswerLabel}>Respuesta correcta</Text>
        <Text style={styles.correctAnswerValue}>{correctAnswer}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryButton} onPress={onRepeat}>
          <MaterialCommunityIcons name="replay" size={20} color={colors.primary.main} />
          <Text style={styles.secondaryButtonText}>Repetir</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.primaryButton, { opacity: 1 }]} 
          onPress={() => {
            console.log('🔘 AnswerResultCard: Botón Siguiente presionado');
            onNext();
          }}
          activeOpacity={0.8}
          disabled={false}
        >
          <Text style={styles.primaryButtonText}>Siguiente</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
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
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16, // Más padding para mejor visibilidad
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12, // Más espaciado entre icono y texto
    minHeight: 56, // Área más grande para mejor visibilidad
  },
  headerText: {
    fontSize: 20, // Accesibilidad: texto más grande para feedback importante
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5, // Mejor legibilidad
  },
  correctAnswerContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  correctAnswerLabel: {
    fontSize: 14, // Accesibilidad: mínimo 14pt (idealmente 16pt)
    fontWeight: '700',
    color: '#4B5563', // Mejor contraste
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8, // Más espaciado
  },
  correctAnswerValue: {
    fontSize: 18, // Accesibilidad: texto más grande para respuestas importantes
    color: '#111827',
    fontWeight: '600',
    lineHeight: 26, // Mejor legibilidad
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    paddingVertical: 14, // Área de toque mínimo 44dp
    minHeight: 44, // Accesibilidad: mínimo 44x44 dp
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    gap: 8, // Más espaciado entre icono y texto
  },
  secondaryButtonText: {
    fontSize: 16, // Accesibilidad: mínimo 16pt para botones
    fontWeight: '700',
    color: colors.primary.main,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: 14, // Área de toque mínimo 44dp
    minHeight: 44, // Accesibilidad: mínimo 44x44 dp
    borderRadius: 12,
    gap: 8, // Más espaciado entre icono y texto
  },
  primaryButtonText: {
    fontSize: 16, // Accesibilidad: mínimo 16pt para botones
    fontWeight: '700',
    color: '#fff',
  },
});

