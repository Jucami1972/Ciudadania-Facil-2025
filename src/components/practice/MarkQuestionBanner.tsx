/**
 * Componente banner para marcar/desmarcar preguntas
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MarkQuestionBannerProps {
  isMarked: boolean;
  onToggle: () => void;
}

export const MarkQuestionBanner: React.FC<MarkQuestionBannerProps> = ({
  isMarked,
  onToggle,
}) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="bookmark-outline" size={20} color="#fff" />
      <View style={styles.content}>
        <Text style={styles.title}>¿Marcar esta pregunta?</Text>
        <Text style={styles.subtitle}>Guárdala para repasar luego</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={onToggle}>
        <Text style={styles.buttonText}>{isMarked ? 'Quitar' : 'Marcar'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    padding: 10,
    borderRadius: 12,
    gap: 8,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f59e0b',
  },
});

