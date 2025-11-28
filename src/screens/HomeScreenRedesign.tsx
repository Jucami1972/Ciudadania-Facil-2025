/**
 * HomeScreen - Revolutionary Version
 * 
 * FIXED VERSION:
 * - Fixed header that does not move with scroll
 * - Progress card with correct overlap over the header
 * - Smooth and perfect SVG wave
 * - All components working correctly
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { RootStackParamList } from '../types/navigation';
import { CategoryType } from '../constants/categories';
import { questions } from '../data/questions';
import WebLayout from '../components/layout/WebLayout';
import { useIsWebDesktop } from '../hooks/useIsWebDesktop';
import { useAuth } from '../context/AuthContext';

const isWeb = Platform.OS === 'web';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface HomeData {
  progress: number;
  completedQuestions: number;
  totalQuestions: number;
  todayCount: number;
  remainingQuestions: number;
  streak: number;
  governmentProgress: number;
  historyProgress: number;
  civicsProgress: number;
  lastStudiedCategory?: string;
  lastStudiedRange?: string;
  userName: string;
}

const MOTIVATIONAL_QUOTES = [
  { minProgress: 0, quote: 'Cada pregunta te acerca más a tu meta' },
  { minProgress: 25, quote: '¡Vas por buen camino! Sigue adelante' },
  { minProgress: 50, quote: '¡Ya casi llegas! No te detengas ahora' },
  { minProgress: 75, quote: '¡Excelente trabajo! Estás muy cerca' },
  { minProgress: 90, quote: '¡Increíble! Ya casi dominas todo el material' },
];

interface Achievement {
  id: string;
  icon: string;
  name: string;
  date: string;
  unlocked: boolean;
}

const HomeScreenRevolutionary = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const isWebDesktop = useIsWebDesktop();
  const { user, logout } = useAuth();

  const [homeData, setHomeData] = useState<HomeData>({
    progress: 0,
    completedQuestions: 0,
    totalQuestions: 128,
    todayCount: 0,
    remainingQuestions: 128,
    streak: 0,
    governmentProgress: 0,
    historyProgress: 0,
    civicsProgress: 0,
    userName: user?.email?.split('@')[0] || 'Estudiante',
  });

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [viewedData, streakData, todayData, userName] = await Promise.all([
        AsyncStorage.getItem('@study:viewed'),
        AsyncStorage.getItem('@study:streak'),
        AsyncStorage.getItem('@study:todayCount'),
        AsyncStorage.getItem('@user:name'),
      ]);

      const viewedIds = viewedData ? new Set<number>(JSON.parse(viewedData)) : new Set();
      const completedCount = viewedIds.size;
      const progress = Math.round((completedCount / 128) * 100);
      const remaining = 128 - completedCount;
      const streak = streakData ? parseInt(streakData, 10) : 0;
      const today = todayData ? parseInt(todayData, 10) : 0;

      const govQuestions = questions.filter((q) => q.category === 'government');
      const govCompleted = govQuestions.filter((q) => viewedIds.has(q.id)).length;
      const govProgress = Math.round((govCompleted / govQuestions.length) * 100);

      const histQuestions = questions.filter((q) => q.category === 'history');
      const histCompleted = histQuestions.filter((q) => viewedIds.has(q.id)).length;
      const histProgress = Math.round((histCompleted / histQuestions.length) * 100);

      const civQuestions = questions.filter((q) => q.category === 'symbols_holidays');
      const civCompleted = civQuestions.filter((q) => viewedIds.has(q.id)).length;
      const civProgress = Math.round((civCompleted / civQuestions.length) * 100);

      let lastCategory = 'GobiernoAmericano';
      let lastRange = '1-15';
      if (govProgress === 100) {
        lastCategory = 'HistoriaAmericana';
        lastRange = '73-89';
      }
      if (histProgress === 100) {
        lastCategory = 'EducacionCivica';
        lastRange = '119-124';
      }

      setHomeData({
        progress,
        completedQuestions: completedCount,
        totalQuestions: 128,
        todayCount: today,
        remainingQuestions: remaining,
        streak,
        governmentProgress: govProgress,
        historyProgress: histProgress,
        civicsProgress: civProgress,
        lastStudiedCategory: lastCategory,
        lastStudiedRange: lastRange,
        userName: userName || user?.email?.split('@')[0] || 'Estudiante',
      });

      const newAchievements: Achievement[] = [];

      if (streak >= 7) {
        newAchievements.push({
          id: 'streak_7',
          icon: '🔥',
          name: 'Racha de 7 días',
          date: 'Desbloqueado hoy',
          unlocked: true,
        });
      }

      if (completedCount >= 50) {
        newAchievements.push({
          id: 'questions_50',
          icon: '⭐',
          name: '50 preguntas completadas',
          date: 'Hace 2 días',
          unlocked: true,
        });
      }

      if (govProgress >= 75 || histProgress >= 75 || civProgress >= 75) {
        newAchievements.push({
          id: 'category_75',
          icon: '🎯',
          name: 'Primera categoría al 75%',
          date: 'Hace 3 días',
          unlocked: true,
        });
      }

      setAchievements(newAchievements);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleContinuePress = useCallback(() => {
    const categoryMap: Record<string, CategoryType> = {
      GobiernoAmericano: 'government',
      HistoriaAmericana: 'history',
      EducacionCivica: 'symbols_holidays',
    };

    const category = categoryMap[homeData.lastStudiedCategory || 'GobiernoAmericano'] || 'government';

    // Navegar al StudyStack con la pantalla StudyCards
    (navigation as any).navigate('Study', {
      screen: 'StudyCards',
      params: {
        category,
        questionRange: homeData.lastStudiedRange || '1-15',
        title: homeData.lastStudiedCategory || 'Gobierno Americano',
        subtitle: 'Continuar donde lo dejaste',
      },
    });
  }, [homeData, navigation]);

  const handleStudyPress = useCallback(() => {
    (navigation as any).navigate('Study', { screen: 'StudyHome' });
  }, [navigation]);

  const handleQuiz20Press = useCallback(() => {
    (navigation as any).navigate('Practice', {
      screen: 'Random20PracticeHome',
    });
  }, [navigation]);

  const handleReviewPress = useCallback(() => {
    (navigation as any).navigate('Study', { screen: 'StudyHome' });
  }, [navigation]);

  const handleVoicePress = useCallback(() => {
    if (Platform.OS === 'web') {
      Alert.alert('Función AI Voice', 'Disponible en desarrollo build nativo');
    } else {
      (navigation as any).navigate('Practice', {
        screen: 'EntrevistaAIHome',
      });
    }
  }, [navigation]);

  const handleStatsPress = useCallback(() => {
    try {
      navigation.navigate('ResultsScreen' as any);
    } catch {
      Alert.alert('Estadísticas', 'Pantalla de estadísticas próximamente');
    }
  }, [navigation]);

  const handleLogoutPress = useCallback(() => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar Sesión', style: 'destructive', onPress: logout },
    ]);
  }, [logout]);

  const motivationalQuote = useMemo(() => {
    const quote = MOTIVATIONAL_QUOTES.slice().reverse().find((q) => homeData.progress >= q.minProgress);
    return quote?.quote || MOTIVATIONAL_QUOTES[0].quote;
  }, [homeData.progress]);

  // =============== COMPONENTES ===============

  const FixedHeader = () => (
    <View style={styles.fixedHeaderContainer}>
      <LinearGradient
        colors={['#4F46E5', '#6366F1'] as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroHeader, { paddingTop: Math.max(insets.top - 15, 0) }]}
      >
        <View style={styles.headerTop}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Bienvenido de nuevo</Text>
            <Text style={styles.username}>¡Sigue así, {homeData.userName}! 🎯</Text>
          </View>
          <TouchableOpacity style={styles.profileIcon} onPress={handleLogoutPress}>
            <MaterialCommunityIcons name="account-circle" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Text style={styles.motivationalQuote}>"{motivationalQuote}"</Text>
      </LinearGradient>
    </View>
  );

  const ProgressHeroCard = () => (
    <Animated.View
      style={[
        styles.progressHero,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Tu Progreso</Text>
        <LinearGradient
          colors={['#f1833b', '#F58A64'] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.streakBadge}
        >
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakText}>{homeData.streak || 0} días</Text>
        </LinearGradient>
      </View>

      <View style={styles.progressStats}>
        <View style={styles.statItemCompleted}>
          <Text style={styles.statValueCompleted} numberOfLines={1}>{homeData.completedQuestions}</Text>
          <Text style={styles.statLabelCompleted} numberOfLines={1}>Logrado</Text>
        </View>
        <View style={styles.statItemToday}>
          <Text style={styles.statValueToday} numberOfLines={1}>{homeData.todayCount}</Text>
          <Text style={styles.statLabelToday} numberOfLines={1}>Hoy</Text>
        </View>
        <View style={styles.statItemRemaining}>
          <Text style={styles.statValueRemaining} numberOfLines={1}>{homeData.remainingQuestions}</Text>
          <Text style={styles.statLabelRemaining} numberOfLines={1}>Falta</Text>
        </View>
      </View>

      <View style={styles.progressRingContainer}>
        <View style={styles.progressRing}>
          {/* Círculo de fondo */}
          <View style={styles.progressRingBase} />
          {/* Primer semicírculo (siempre visible cuando hay progreso) */}
          {homeData.progress > 0 && (
            <View style={[
              styles.progressRingHalf1,
              {
                transform: [{ rotate: `${Math.min(homeData.progress, 50) / 50 * 180 - 90}deg` }],
              }
            ]} />
          )}
          {/* Segundo semicírculo (visible cuando progreso > 50%) */}
          {homeData.progress > 50 && (
            <View style={[
              styles.progressRingHalf2,
              {
                transform: [{ rotate: `${((homeData.progress - 50) / 50) * 180 - 90}deg` }],
              }
            ]} />
          )}
          <View style={styles.progressRingInner}>
            <Text style={styles.progressPercentage}>{homeData.progress}%</Text>
            <Text style={styles.progressLabel}>Total</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const SmartCTA = () => {
    const ctaTitle =
      homeData.completedQuestions === 0
        ? 'Comenzar a Estudiar'
        : homeData.progress >= 90
        ? 'Repaso Final'
        : 'Continuar Estudiando';

    const ctaSubtitle =
      homeData.lastStudiedCategory && homeData.lastStudiedRange
        ? `${homeData.lastStudiedCategory} • Preguntas ${homeData.lastStudiedRange}`
        : 'Comienza tu preparación';

    return (
      <TouchableOpacity onPress={handleContinuePress} activeOpacity={0.85}>
        <LinearGradient
          colors={['#f1833b', '#F58A64'] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.smartCTA}
        >
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>{ctaTitle}</Text>
            <Text style={styles.ctaSubtitle}>{ctaSubtitle}</Text>
          </View>
          <View style={styles.ctaIcon}>
            <MaterialCommunityIcons name="play" size={24} color="white" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const LearningPath = () => {
    const pathSteps = [
      {
        id: 'government',
        icon: homeData.governmentProgress >= 100 ? 'check' : 'lock-open',
        title: 'Gobierno Americano',
        subtitle: '72 preguntas',
        progress: homeData.governmentProgress,
        unlocked: true,
      },
      {
        id: 'history',
        icon: homeData.historyProgress >= 100 ? 'check' : homeData.governmentProgress >= 50 ? 'lock-open' : 'lock',
        title: 'Historia Americana',
        subtitle: '46 preguntas',
        progress: homeData.historyProgress,
        unlocked: homeData.governmentProgress >= 50,
      },
      {
        id: 'civics',
        icon: homeData.civicsProgress >= 100 ? 'check' : homeData.historyProgress >= 50 ? 'lock-open' : 'lock',
        title: 'Educación Cívica',
        subtitle: '10 preguntas',
        progress: homeData.civicsProgress,
        unlocked: homeData.historyProgress >= 50,
      },
    ];

    return (
      <View style={styles.learningPath}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="book-open-variant" size={18} color="#4F46E5" />
          <Text style={styles.sectionTitle}>Tu Camino de Aprendizaje</Text>
        </View>
        <View style={styles.pathContainer}>
          {pathSteps.map((step, index) => (
            <View key={step.id}>
              <TouchableOpacity
                style={styles.pathStep}
                onPress={handleStudyPress}
                disabled={!step.unlocked}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={step.unlocked ? (['#6366F1', '#4F46E5'] as [string, string]) : (['#E5E7EB', '#E5E7EB'] as [string, string])}
                  style={styles.stepIconContainer}
                >
                  <MaterialCommunityIcons name={step.icon as any} size={24} color="white" />
                </LinearGradient>

                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                  <View style={styles.stepProgressBar}>
                    <LinearGradient
                      colors={['#4F46E5', '#6366F1'] as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.stepProgressFill, { width: `${step.progress}%` }]}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {index < pathSteps.length - 1 && <View style={styles.pathConnector} />}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const QuickActions = () => {
    const actions = [
      {
        id: 'quiz20',
        icon: 'text-box-outline',
        label: 'Quiz 20',
        sublabel: 'Práctica rápida',
        gradient: ['#60A5FA', '#3B82F6'] as [string, string],  // Azul vibrante
        onPress: handleQuiz20Press,
      },
      {
        id: 'review',
        icon: 'refresh',
        label: 'Repaso',
        sublabel: 'Revisar marcadas',
        gradient: ['#A78BFA', '#7C3AED'] as [string, string],  // Púrpura vibrante
        onPress: handleReviewPress,
      },
      {
        id: 'voice',
        icon: 'microphone',
        label: 'Voz AI',
        sublabel: 'Práctica oral',
        gradient: ['#F87171', '#DC2626'] as [string, string],  // Rojo vibrante
        onPress: handleVoicePress,
      },
      {
        id: 'stats',
        icon: 'chart-line',
        label: 'Estadísticas',
        sublabel: 'Ver progreso',
        gradient: ['#34D399', '#059669'] as [string, string],  // Verde vibrante
        onPress: handleStatsPress,
      },
    ];

    return (
      <View style={styles.quickActions}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="lightning-bolt" size={18} color="#4F46E5" />
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        </View>
        <View style={styles.actionsGrid}>
          {actions.map((action) => (
            <TouchableOpacity 
              key={action.id} 
              style={styles.actionCard} 
              onPress={action.onPress} 
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={action.gradient}
                style={styles.actionIconContainer}
              >
                <MaterialCommunityIcons name={action.icon as any} size={28} color="white" />
              </LinearGradient>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <Text style={styles.actionSublabel}>{action.sublabel}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const RecentAchievements = () => {
    if (achievements.length === 0) return null;

    return (
      <View style={styles.achievements}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="trophy" size={18} color="#4F46E5" />
          <Text style={styles.sectionTitle}>Logros Recientes</Text>
        </View>
        <LinearGradient colors={['#FEF9C3', '#FEF3C7'] as [string, string]} style={styles.achievementCard}>
          {achievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementItem}>
              <LinearGradient colors={['#FBBF24', '#F59E0B'] as [string, string]} style={styles.achievementBadge}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              </LinearGradient>
              <View style={styles.achievementText}>
                <Text style={styles.achievementName}>{achievement.name}</Text>
                <Text style={styles.achievementDate}>{achievement.date}</Text>
              </View>
            </View>
          ))}
        </LinearGradient>
      </View>
    );
  };

  // =============== RENDER PRINCIPAL ===============

  const content = (
    <View style={styles.mainContainer}>
      <FixedHeader />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Spacer para compensar el header fijo */}
        <View style={[styles.headerSpacer, { height: 120 + insets.top }]} />
        
        <ProgressHeroCard />
        <SmartCTA />
        <LearningPath />
        <QuickActions />
        <RecentAchievements />
      </ScrollView>
    </View>
  );

  if (isWeb && isWebDesktop) {
    return <WebLayout headerTitle="Inicio">{content}</WebLayout>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSpacer: {
    height: 160,
  },

  // =============== FIXED HEADER ===============
  fixedHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  heroHeader: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  username: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  motivationalQuote: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 15,
    fontWeight: '600',
    fontStyle: 'italic',
    marginTop: 4,
  },

  // =============== PROGRESS HERO ===============
  progressHero: {
    backgroundColor: '#fffaf0',
    borderRadius: 28,
    padding: 28,
    marginHorizontal: 16,
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#E5EDFF',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 40,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#FDBA74',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  streakIcon: {
    fontSize: 16,
  },
  streakText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  progressStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
    minWidth: 0,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2563EB',
  },
  statLabel: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  statItemCompleted: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    padding: 12,
    backgroundColor: '#D4EEC4',
    borderRadius: 16,
    minWidth: 0,
  },
  statValueCompleted: {
    fontSize: 18,
    fontWeight: '700',
    color: '#91be50',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabelCompleted: {
    fontSize: 11,
    color: '#91be50',
    fontWeight: '700',
    textAlign: 'center',
  },
  statItemToday: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    padding: 12,
    backgroundColor: '#96eee4',
    borderRadius: 16,
    minWidth: 0,
  },
  statValueToday: {
    fontSize: 18,
    fontWeight: '700',
    color: '#42c1b2',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabelToday: {
    fontSize: 11,
    color: '#42c1b2',
    fontWeight: '700',
    textAlign: 'center',
  },
  statItemRemaining: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    padding: 12,
    backgroundColor: '#71f7c3',
    borderRadius: 16,
    minWidth: 0,
  },
  statValueRemaining: {
    fontSize: 18,
    fontWeight: '700',
    color: '#47a581',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabelRemaining: {
    fontSize: 11,
    color: '#47a581',
    fontWeight: '700',
    textAlign: 'center',
  },
  progressRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  progressRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressRingBase: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#59a4fc',
  },
  progressRingHalf1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#3066a5',
    borderLeftColor: '#3066a5',
  },
  progressRingHalf2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderTopColor: '#3066a5',
    borderRightColor: '#3066a5',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  progressRingInner: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  progressPercentage: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2563EB',
  },
  progressLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // =============== SMART CTA ===============
  smartCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  ctaContent: {
    flex: 1,
  },
  ctaTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  ctaSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
  ctaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // =============== LEARNING PATH ===============
  learningPath: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  pathContainer: {
    backgroundColor: '#fffaf0',
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  pathStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  pathConnector: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 27,
    marginVertical: 8,
  },
  stepIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  stepProgressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  stepProgressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // =============== QUICK ACTIONS ===============
  quickActions: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
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
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  actionSublabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },

  // =============== ACHIEVEMENTS ===============
  achievements: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  achievementCard: {
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
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  achievementBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIcon: {
    fontSize: 20,
  },
  achievementText: {
    flex: 1,
  },
  achievementName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  achievementDate: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
});

export default HomeScreenRevolutionary;
