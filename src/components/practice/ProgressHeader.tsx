/**
 * Componente para mostrar el progreso y estadísticas de la práctica
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface ProgressHeaderProps {
  categoryTitle: string;
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  onChangeCategory: () => void;
}

export const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  categoryTitle,
  currentQuestion,
  totalQuestions,
  score,
  onChangeCategory,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {categoryTitle}
        </Text>
        <TouchableOpacity style={styles.changeCategoryPill} onPress={onChangeCategory}>
          <MaterialCommunityIcons name="swap-horizontal" size={18} color={colors.primary.main} />
          <Text style={styles.changeCategoryText}>Cambiar</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Pregunta</Text>
          <Text style={styles.statValue}>
            {currentQuestion}/{totalQuestions}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Puntuación</Text>
          <Text style={styles.statValue}>
            {score}/{totalQuestions}
          </Text>
        </View>
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18, // Accesibilidad: texto más grande para títulos
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  changeCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderRadius: 20,
    paddingHorizontal: 12, // Más padding
    paddingVertical: 8, // Área de toque mínimo
    minHeight: 44, // Accesibilidad: mínimo 44x44 dp
    gap: 6, // Más espaciado
  },
  changeCategoryText: {
    color: colors.primary.main,
    fontWeight: '600',
    fontSize: 14, // Accesibilidad: mínimo 14pt
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  statLabel: {
    fontSize: 14, // Accesibilidad: mínimo 14pt
    color: '#4B5563', // Mejor contraste
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18, // Accesibilidad: texto más grande para números importantes
    fontWeight: '700',
    color: '#111827',
    marginTop: 4, // Más espaciado
  },
});

