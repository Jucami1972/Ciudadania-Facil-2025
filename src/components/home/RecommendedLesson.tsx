/**
 * Componente de lección recomendada optimizado
 */

import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { designSystem } from '../../config/designSystem';

interface RecommendedLessonProps {
  lessonTitle: string;
  questionRange?: string;
  estimatedTime: number;
  onPress: () => void;
}

const RecommendedLesson = memo<RecommendedLessonProps>(({
  lessonTitle,
  questionRange,
  estimatedTime,
  onPress,
}) => {
  // Sistema de ajuste automático de texto según longitud
  const titleStyle = useMemo(() => {
    const length = lessonTitle.length;
    if (length > 25) {
      return [styles.title, styles.titleSmall];
    } else if (length > 18) {
      return [styles.title, styles.titleMedium];
    }
    return [styles.title, styles.titleNormal];
  }, [lessonTitle]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Lección recomendada: ${lessonTitle}`}
      accessibilityHint={`Presiona para comenzar la lección. Tiempo estimado: ${estimatedTime} minutos`}
    >
      <LinearGradient
        colors={['#4F7CFF', '#3B5BDB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <MaterialCommunityIcons
          name="book-open-page-variant"
          size={24}
          color="#FFFFFF"
          style={styles.icon}
        />

        <Text style={styles.label}>SIGUIENTE LECCIÓN</Text>
        <Text style={titleStyle as any} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.7}>
          {lessonTitle}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
});

RecommendedLesson.displayName = 'RecommendedLesson';

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    flex: 0.48,
    aspectRatio: 1,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(30, 64, 175, 0.3)',
      },
    }),
  },
  gradient: {
    padding: 14,
    flex: 1,
    justifyContent: 'flex-start',
    ...Platform.select({
      web: {
        padding: 16,
      },
    }),
  },
  icon: {
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontWeight: '800',
    color: '#FFFFFF',
    flexShrink: 1,
  },
  titleNormal: {
    fontSize: 15,
    lineHeight: 19,
  },
  titleMedium: {
    fontSize: 13,
    lineHeight: 17,
  },
  titleSmall: {
    fontSize: 12,
    lineHeight: 15,
  },
});

export default RecommendedLesson;

