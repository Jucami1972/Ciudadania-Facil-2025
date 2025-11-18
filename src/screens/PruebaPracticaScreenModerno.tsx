// src/screens/PruebaPracticaScreenModerno.tsx

import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProps } from '../types/navigation';

interface PracticeOption {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  route: string;
}

const PruebaPracticaScreenModerno = () => {
  const navigation = useNavigation<NavigationProps>();

  const practiceOptions: PracticeOption[] = [
    {
      id: 'category',
      title: 'Práctica por Categoría',
      subtitle: 'Selecciona una categoría',
      description: 'Practica preguntas de una categoría específica',
      icon: 'folder-multiple',
      color: '#7c3aed',
      route: 'CategoryPracticeHome',
    },
    {
      id: 'random',
      title: 'Práctica Aleatoria',
      subtitle: 'Preguntas al azar',
      description: 'Practica con preguntas aleatorias de todo el examen',
      icon: 'shuffle',
      color: '#ec4899',
      route: 'RandomPractice',
    },
    {
      id: 'incorrect',
      title: 'Preguntas Incorrectas',
      subtitle: 'Refuerza lo que fallaste',
      description: 'Revisa las preguntas que respondiste incorrectamente',
      icon: 'alert-circle',
      color: '#ef4444',
      route: 'IncorrectPractice',
    },
    {
      id: 'marked',
      title: 'Preguntas Marcadas',
      subtitle: 'Tus favoritas',
      description: 'Practica las preguntas que marcaste como importantes',
      icon: 'bookmark',
      color: '#f59e0b',
      route: 'MarkedPractice',
    },
    {
      id: 'type',
      title: 'Práctica por Tipo',
      subtitle: '¿Quién?, ¿Qué?, ¿Cuándo?',
      description: 'Practica preguntas agrupadas por tipo de pregunta',
      icon: 'filter-variant',
      color: '#06b6d4',
      route: 'QuestionTypePracticeHome',
    },
    {
      id: 'random20',
      title: 'Examen de 20 Preguntas',
      subtitle: 'Simulación completa',
      description: 'Examen simulado con 20 preguntas aleatorias',
      icon: 'clipboard-check',
      color: '#10b981',
      route: 'Random20PracticeHome',
    },
    {
      id: 'interview',
      title: 'Entrevista AI',
      subtitle: 'Oficial virtual',
      description: 'Practica con un oficial de inmigración AI',
      icon: 'robot-happy',
      color: '#8b5cf6',
      route: 'EntrevistaAIHome',
    },
    {
      id: 'spaced_repetition',
      title: 'Repaso Inteligente',
      subtitle: 'Memorización optimizada',
      description: 'Sistema de repetición espaciada que adapta las preguntas a tu ritmo de aprendizaje',
      icon: 'brain',
      color: '#6366f1',
      route: 'SpacedRepetitionPractice',
    },
  ];

  const handlePracticePress = (option: PracticeOption) => {
    navigation.navigate(option.route as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#1f2937" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Práctica</Text>
            <Text style={styles.headerSubtitle}>Elige tu modo de estudio</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <View style={styles.introIconContainer}>
            <MaterialCommunityIcons name="clipboard-check" size={24} color="#7c3aed" />
          </View>
          <Text style={styles.introTitle}>Elige tu Modo de Práctica</Text>
          <Text style={styles.introSubtitle}>
            Selecciona cómo deseas practicar para mejorar tu desempeño
          </Text>
        </View>

        <View style={styles.optionsList}>
          {practiceOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={() => handlePracticePress(option)}
              activeOpacity={0.85}
            >
              <View style={[styles.optionIconContainer, { backgroundColor: `${option.color}15` }]}>
                <MaterialCommunityIcons name={option.icon as any} size={22} color={option.color} />
              </View>
              <View style={styles.optionContent}>
                <View style={styles.optionHeader}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color="#d1d5db" />
                </View>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <MaterialCommunityIcons name="lightbulb" size={18} color="#f59e0b" />
            <Text style={styles.tipsTitle}>Consejos</Text>
          </View>
          <Text style={styles.tipsText}>
            • Comienza con práctica por categoría para dominar cada tema
          </Text>
          <Text style={styles.tipsText}>
            • Usa preguntas incorrectas para reforzar áreas débiles
          </Text>
          <Text style={styles.tipsText}>
            • Marca preguntas importantes para revisarlas después
          </Text>
          <Text style={styles.tipsText}>
            • Usa Repaso Inteligente para memorización a largo plazo
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 1,
    letterSpacing: 0.1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  introCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  introIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  optionsList: {
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  optionSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 16,
    fontWeight: '500',
  },
  tipsCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350f',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipsText: {
    fontSize: 11,
    color: '#78350f',
    marginBottom: 6,
    lineHeight: 16,
    fontWeight: '500',
  },
});

export default PruebaPracticaScreenModerno;
