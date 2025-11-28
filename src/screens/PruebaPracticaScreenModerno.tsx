// src/screens/PruebaPracticaScreenModerno.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProps } from '../types/navigation';

interface PracticeOption {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: [string, string];
  route: string;
}

const PruebaPracticaScreenModerno = () => {
  const navigation = useNavigation<NavigationProps>();
  const insets = useSafeAreaInsets();
  
  // Estado para estadísticas
  const [stats, setStats] = useState({
    completed: 0,
    correct: 0,
    accuracy: 0,
  });

  // Función para cargar estadísticas
  const loadStats = useCallback(async () => {
    try {
      const [viewedData, incorrectData] = await Promise.all([
        AsyncStorage.getItem('@study:viewed'),
        AsyncStorage.getItem('@practice:incorrect'),
      ]);

      const viewedIds = viewedData ? new Set<number>(JSON.parse(viewedData)) : new Set<number>();
      const incorrectIds = incorrectData ? new Set<number>(JSON.parse(incorrectData)) : new Set<number>();

      // Calcular estadísticas
      const completed = viewedIds.size;
      const incorrect = incorrectIds.size;
      const correct = Math.max(0, completed - incorrect);
      
      // Calcular precisión: (correctas / completadas) * 100
      // Si no hay completadas, precisión es 0%
      const accuracy = completed > 0 ? Math.round((correct / completed) * 100) : 0;

      setStats({
        completed,
        correct,
        accuracy,
      });
    } catch (error) {
      console.error('Error loading practice stats:', error);
      setStats({ completed: 0, correct: 0, accuracy: 0 });
    }
  }, []);

  // Resetear el stack cuando esta pantalla recibe focus
  useFocusEffect(
    React.useCallback(() => {
      const state = navigation.getState();
      const practiceState = state.routes.find((r: any) => r.name === 'Practice')?.state;
      
      if (practiceState && practiceState.routes.length > 1 && practiceState.index !== undefined) {
        const currentRoute = practiceState.routes[practiceState.index];
        if (currentRoute?.name !== 'PruebaPracticaHome') {
          (navigation as any).reset({
            index: 0,
            routes: [
              { name: 'Practice', state: { routes: [{ name: 'PruebaPracticaHome' }], index: 0 } }
            ],
          });
        }
      }
      
      // Cargar estadísticas cuando la pantalla recibe focus
      loadStats();
    }, [navigation, loadStats])
  );

  const practiceOptions: PracticeOption[] = [
    {
      id: 'category',
      title: 'Por Categoría',
      subtitle: 'Domina cada tema',
      description: 'Practica preguntas de una categoría específica',
      icon: 'folder-multiple',
      gradient: ['#60A5FA', '#3B82F6'],
      route: 'CategoryPracticeHome',
    },
    {
      id: 'random',
      title: 'Aleatoria',
      subtitle: 'Preguntas al azar',
      description: 'Practica con preguntas aleatorias de todo el examen',
      icon: 'shuffle',
      gradient: ['#ec4899', '#db2777'],
      route: 'RandomPractice',
    },
    {
      id: 'incorrect',
      title: 'Incorrectas',
      subtitle: 'Refuerza lo que fallaste',
      description: 'Revisa las preguntas que respondiste incorrectamente',
      icon: 'alert-circle',
      gradient: ['#ef4444', '#dc2626'],
      route: 'IncorrectPractice',
    },
    {
      id: 'marked',
      title: 'Marcadas',
      subtitle: 'Tus favoritas',
      description: 'Practica las preguntas que marcaste como importantes',
      icon: 'bookmark',
      gradient: ['#f59e0b', '#d97706'],
      route: 'MarkedPractice',
    },
    {
      id: 'type',
      title: 'Por Tipo',
      subtitle: '¿Quién?, ¿Qué?, ¿Cuándo?',
      description: 'Practica preguntas agrupadas por tipo de pregunta',
      icon: 'filter-variant',
      gradient: ['#06b6d4', '#0891b2'],
      route: 'QuestionTypePracticeHome',
    },
    {
      id: 'random20',
      title: 'Examen 20',
      subtitle: 'Simulación completa',
      description: 'Examen simulado con 20 preguntas aleatorias',
      icon: 'clipboard-check',
      gradient: ['#10b981', '#059669'],
      route: 'Random20PracticeHome',
    },
    {
      id: 'interview',
      title: 'Entrevista AI',
      subtitle: 'Oficial virtual',
      description: 'Practica con un oficial de inmigración AI',
      icon: 'robot-happy',
      gradient: ['#6366f1', '#4f46e5'],
      route: 'EntrevistaAIHome',
    },
    {
      id: 'spaced_repetition',
      title: 'Repaso Inteligente',
      subtitle: 'Memorización optimizada',
      description: 'Sistema de repetición espaciada adaptado a tu ritmo',
      icon: 'brain',
      gradient: ['#8B5CF6', '#7C3AED'],
      route: 'SpacedRepetitionPractice',
    },
  ];

  const handlePracticePress = (option: PracticeOption) => {
    navigation.navigate(option.route as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Fixed Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2'] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top - 15, 0) }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Práctica</Text>
            <Text style={styles.headerSubtitle}>Elige tu modo de estudio</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.correct}</Text>
            <Text style={styles.statLabel}>Correctas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.accuracy}%</Text>
            <Text style={styles.statLabel}>Precisión</Text>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="target" size={18} color="#667eea" />
          <Text style={styles.sectionTitle}>Modos de Práctica</Text>
        </View>

        {/* Practice Grid */}
        <View style={styles.practiceGrid}>
          {practiceOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.practiceCard}
              onPress={() => handlePracticePress(option)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={option.gradient}
                style={styles.cardIconContainer}
              >
                <MaterialCommunityIcons name={option.icon as any} size={28} color="white" />
              </LinearGradient>
              <Text style={styles.cardTitle}>{option.title}</Text>
              <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tips Section */}
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="lightbulb" size={18} color="#667eea" />
          <Text style={styles.sectionTitle}>Consejos de Estudio</Text>
        </View>

        <LinearGradient
          colors={['#FEF3C7', '#FDE68A'] as [string, string]}
          style={styles.tipsCard}
        >
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>✓</Text>
            <Text style={styles.tipText}>
              Comienza con práctica por categoría para dominar cada tema
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>✓</Text>
            <Text style={styles.tipText}>
              Usa preguntas incorrectas para reforzar áreas débiles
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>✓</Text>
            <Text style={styles.tipText}>
              Marca preguntas importantes para revisarlas después
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>✓</Text>
            <Text style={styles.tipText}>
              El Repaso Inteligente adapta las preguntas a tu ritmo
            </Text>
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // =============== HEADER ===============
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },

  // =============== CONTAINER ===============
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // =============== STATS BAR ===============
  statsBar: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 10,
    color: '#718096',
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
  },

  // =============== SECTION HEADER ===============
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
  },

  // =============== PRACTICE GRID ===============
  practiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  practiceCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },

  // =============== TIPS CARD ===============
  tipsCard: {
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  tipBullet: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  tipText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 18,
    fontWeight: '500',
    flex: 1,
  },
});

export default PruebaPracticaScreenModerno;