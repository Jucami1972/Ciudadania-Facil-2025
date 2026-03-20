/**
 * EstadisticasScreen - Pantalla completa de estadísticas
 *
 * Blue gradient header (brand standard), white cards, full stats breakdown.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { questions } from '../data/questions';
import { useAuth } from '../context/AuthContext';

const EstadisticasScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [stats, setStats] = useState({
    completedQuestions: 0,
    totalQuestions: 100,
    progress: 0,
    streak: 0,
    todayCount: 0,
    governmentTotal: 0,
    governmentCompleted: 0,
    governmentProgress: 0,
    historyTotal: 0,
    historyCompleted: 0,
    historyProgress: 0,
    civicsTotal: 0,
    civicsCompleted: 0,
    civicsProgress: 0,
    incorrectCount: 0,
    markedCount: 0,
    bestStreak: 0,
    daysStudied: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      const todayDateStr = new Date().toDateString();
      const [viewedData, streakData, lastDateData, dailyData, incorrectData, markedData, bestStreakData, daysStudiedData] =
        await Promise.all([
          AsyncStorage.getItem('@study:viewed'),
          AsyncStorage.getItem('@study:streak'),
          AsyncStorage.getItem('@study:lastDate'),
          AsyncStorage.getItem(`@study:dailyQuestions_${todayDateStr}`),
          AsyncStorage.getItem('@practice:incorrect'),
          AsyncStorage.getItem('@practice:marked'),
          AsyncStorage.getItem('@study:bestStreak'),
          AsyncStorage.getItem('@study:daysStudied'),
        ]);

      const viewedIds: Set<number> = viewedData ? new Set(JSON.parse(viewedData)) : new Set();
      const completedCount = viewedIds.size;
      const progress = Math.round((completedCount / 100) * 100);

      // Streak
      let streak = parseInt(streakData || '0', 10);
      if (lastDateData) {
        const lastDate = new Date(lastDateData);
        const todayDate = new Date();
        lastDate.setHours(0, 0, 0, 0);
        todayDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor(
          (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays > 1) streak = 0;
      }

      const dailyStats = dailyData ? JSON.parse(dailyData) : null;
      const todayCount = dailyStats?.questions || 0;

      // Category breakdown
      const govQuestions = questions.filter((q) => q.category === 'government');
      const govCompleted = govQuestions.filter((q) => viewedIds.has(q.id)).length;

      const histQuestions = questions.filter((q) => q.category === 'history');
      const histCompleted = histQuestions.filter((q) => viewedIds.has(q.id)).length;

      const civQuestions = questions.filter((q) => q.category === 'civics');
      const civCompleted = civQuestions.filter((q) => viewedIds.has(q.id)).length;

      // Incorrect & marked
      const incorrectIds: number[] = incorrectData ? JSON.parse(incorrectData) : [];
      const markedIds: number[] = markedData ? JSON.parse(markedData) : [];

      const bestStreak = Math.max(streak, parseInt(bestStreakData || '0', 10));
      const daysStudied = parseInt(daysStudiedData || '0', 10);

      setStats({
        completedQuestions: completedCount,
        totalQuestions: 100,
        progress,
        streak,
        todayCount,
        governmentTotal: govQuestions.length,
        governmentCompleted: govCompleted,
        governmentProgress: govQuestions.length > 0 ? Math.round((govCompleted / govQuestions.length) * 100) : 0,
        historyTotal: histQuestions.length,
        historyCompleted: histCompleted,
        historyProgress: histQuestions.length > 0 ? Math.round((histCompleted / histQuestions.length) * 100) : 0,
        civicsTotal: civQuestions.length,
        civicsCompleted: civCompleted,
        civicsProgress: civQuestions.length > 0 ? Math.round((civCompleted / civQuestions.length) * 100) : 0,
        incorrectCount: incorrectIds.length,
        markedCount: markedIds.length,
        bestStreak,
        daysStudied,
      });
    } catch (error) {
      if (__DEV__) console.error('Error loading stats:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const userName = user?.email?.split('@')[0] || 'Estudiante';

  const CategoryBar = ({
    label,
    completed,
    total,
    progress: pct,
    gradient,
    icon,
  }: {
    label: string;
    completed: number;
    total: number;
    progress: number;
    gradient: [string, string];
    icon: string;
  }) => (
    <View style={styles.categoryRow}>
      <LinearGradient colors={gradient} style={styles.categoryIcon}>
        <MaterialCommunityIcons name={icon as any} size={18} color="white" />
      </LinearGradient>
      <View style={styles.categoryContent}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryLabel}>{label}</Text>
          <Text style={styles.categoryCount}>
            {completed}/{total}
          </Text>
        </View>
        <View style={styles.categoryBarTrack}>
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.categoryBarFill, { width: `${Math.max(pct, 1)}%` }]}
          />
        </View>
        <Text style={styles.categoryPct}>{pct}% completado</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#1E3A8A', '#1E40AF', '#3B82F6']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Estadísticas</Text>
          <View style={{ width: 44 }} />
        </View>
        <Text style={styles.headerSubtitle}>Tu progreso detallado</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Resumen general */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="chart-arc" size={20} color="#1E40AF" />
            <Text style={styles.cardTitle}>Progreso General</Text>
          </View>

          <View style={styles.progressCircleContainer}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressNumber}>{stats.progress}%</Text>
              <Text style={styles.progressLabel}>completado</Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarTrack}>
              <LinearGradient
                colors={['#1E40AF', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${Math.max(stats.progress, 2)}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              {stats.completedQuestions} de {stats.totalQuestions} preguntas
            </Text>
          </View>
        </View>

        {/* Quick stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <LinearGradient colors={['#047857', '#10B981']} style={styles.statIconBg}>
              <MaterialCommunityIcons name="check-circle" size={20} color="white" />
            </LinearGradient>
            <Text style={styles.statValue}>{stats.todayCount}</Text>
            <Text style={styles.statLabel}>Hoy</Text>
          </View>
          <View style={styles.statBox}>
            <LinearGradient colors={['#B45309', '#F59E0B']} style={styles.statIconBg}>
              <MaterialCommunityIcons name="fire" size={20} color="white" />
            </LinearGradient>
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Racha</Text>
          </View>
          <View style={styles.statBox}>
            <LinearGradient colors={['#DC2626', '#F87171']} style={styles.statIconBg}>
              <MaterialCommunityIcons name="close-circle" size={20} color="white" />
            </LinearGradient>
            <Text style={styles.statValue}>{stats.incorrectCount}</Text>
            <Text style={styles.statLabel}>Incorrectas</Text>
          </View>
          <View style={styles.statBox}>
            <LinearGradient colors={['#7C3AED', '#A78BFA']} style={styles.statIconBg}>
              <MaterialCommunityIcons name="bookmark" size={20} color="white" />
            </LinearGradient>
            <Text style={styles.statValue}>{stats.markedCount}</Text>
            <Text style={styles.statLabel}>Marcadas</Text>
          </View>
        </View>

        {/* Desglose por categoría */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="format-list-bulleted" size={20} color="#1E40AF" />
            <Text style={styles.cardTitle}>Desglose por Categoría</Text>
          </View>

          <CategoryBar
            label="Gobierno Americano"
            completed={stats.governmentCompleted}
            total={stats.governmentTotal}
            progress={stats.governmentProgress}
            gradient={['#B45309', '#F59E0B']}
            icon="bank"
          />
          <CategoryBar
            label="Historia Americana"
            completed={stats.historyCompleted}
            total={stats.historyTotal}
            progress={stats.historyProgress}
            gradient={['#047857', '#10B981']}
            icon="book-open-page-variant"
          />
          <CategoryBar
            label="Símbolos y Días Festivos"
            completed={stats.civicsCompleted}
            total={stats.civicsTotal}
            progress={stats.civicsProgress}
            gradient={['#1E40AF', '#3B82F6']}
            icon="flag"
          />
        </View>

        {/* Datos adicionales */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="trophy-outline" size={20} color="#1E40AF" />
            <Text style={styles.cardTitle}>Resumen de Actividad</Text>
          </View>

          <View style={styles.activityRow}>
            <MaterialCommunityIcons name="calendar-check" size={20} color="#64748B" />
            <Text style={styles.activityLabel}>Días estudiados</Text>
            <Text style={styles.activityValue}>{stats.daysStudied}</Text>
          </View>
          <View style={styles.activityRow}>
            <MaterialCommunityIcons name="fire" size={20} color="#64748B" />
            <Text style={styles.activityLabel}>Mejor racha</Text>
            <Text style={styles.activityValue}>{stats.bestStreak} días</Text>
          </View>
          <View style={styles.activityRow}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
            <Text style={styles.activityLabel}>Preguntas restantes</Text>
            <Text style={styles.activityValue}>{100 - stats.completedQuestions}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  // Progress circle
  progressCircleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFF6FF',
    borderWidth: 6,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E40AF',
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: -2,
  },

  // Progress bar
  progressBarContainer: {
    gap: 6,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },

  // Category rows
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
  },
  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  categoryContent: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  categoryCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  categoryBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPct: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Activity rows
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  activityValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
});

export default EstadisticasScreen;
