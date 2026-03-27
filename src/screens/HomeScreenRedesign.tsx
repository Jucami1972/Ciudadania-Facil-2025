/**
 * HomeScreen - Redesigned Version
 *
 * Matches approved proposal:
 * - 3-color gradient header (same pattern as Practice screen)
 * - Clean stats bar below header
 * - Horizontal progress bar with brand colors
 * - Brand blue CTA
 * - White cards on neutral background (#F8FAFC)
 * - Correct question counts (57/30/13)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import { RootStackParamList } from '../types/navigation';
import { CategoryType } from '../constants/categories';
import WebLayout from '../components/layout/WebLayout';
import { useIsWebDesktop } from '../hooks/useIsWebDesktop';
import { useAuth } from '../context/AuthContext';
import { useExamMode } from '../context/ExamModeContext';
import { useQuestions } from '../context/QuestionsContext';

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
  lastStudiedSubcategory?: string;
  userName: string;
}

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
  const { examMode, setExamMode } = useExamMode();
  const { questions } = useQuestions();

  const [homeData, setHomeData] = useState<HomeData>({
    progress: 0,
    completedQuestions: 0,
    totalQuestions: questions.length,
    todayCount: 0,
    remainingQuestions: questions.length,
    streak: 0,
    governmentProgress: 0,
    historyProgress: 0,
    civicsProgress: 0,
    lastStudiedSubcategory: examMode === '128' ? 'A: Principios del Gobierno Americano' : 'A: Principios de la Democracia Americana',
    userName: user?.email?.split('@')[0] || 'Estudiante',
  });

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Cargar foto de perfil guardada
  useEffect(() => {
    AsyncStorage.getItem('@user:profilePhoto').then((uri) => {
      if (uri) setProfilePhoto(uri);
    });
  }, []);

  const handlePickProfilePhoto = useCallback(async () => {
    Alert.alert('Foto de Perfil', '¿Cómo deseas actualizar tu foto?', [
      {
        text: 'Tomar Foto',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para tomar tu foto.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setProfilePhoto(uri);
            await AsyncStorage.setItem('@user:profilePhoto', uri);
          }
        },
      },
      {
        text: 'Elegir de Galería',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería de fotos.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setProfilePhoto(uri);
            await AsyncStorage.setItem('@user:profilePhoto', uri);
          }
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, []);

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

      const todayDateStr = new Date().toDateString();
      const [viewedData, streakData, lastDateData, dailyData] = await Promise.all([
        AsyncStorage.getItem('@study:viewed'),
        AsyncStorage.getItem('@study:streak'),
        AsyncStorage.getItem('@study:lastDate'),
        AsyncStorage.getItem(`@study:dailyQuestions_${todayDateStr}`),
      ]);

      const viewedIds = viewedData ? new Set<number>(JSON.parse(viewedData)) : new Set();
      const completedCount = viewedIds.size;
      const progress = Math.round((completedCount / questions.length) * 100);
      const remaining = questions.length - completedCount;

      // Calcular racha correctamente
      const currentStreak = parseInt(streakData || '0', 10);
      let streak = currentStreak;
      if (lastDateData) {
        const lastDate = new Date(lastDateData);
        const todayDate = new Date();
        lastDate.setHours(0, 0, 0, 0);
        todayDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
          // Gap mayor a 1 día, racha se perdió
          streak = 0;
        }
      }

      // Obtener conteo de preguntas estudiadas hoy
      const dailyStats = dailyData ? JSON.parse(dailyData) : null;
      const today = dailyStats?.questions || 0;

      const govQuestions = questions.filter((q) => q.category === 'government');
      const govCompleted = govQuestions.filter((q) => viewedIds.has(q.id)).length;
      const govProgress = Math.round((govCompleted / govQuestions.length) * 100);

      const histQuestions = questions.filter((q) => q.category === 'history');
      const histCompleted = histQuestions.filter((q) => viewedIds.has(q.id)).length;
      const histProgress = Math.round((histCompleted / histQuestions.length) * 100);

      const civQuestions = questions.filter((q) => q.category === 'civics' || q.category === 'symbols_holidays');
      const civCompleted = civQuestions.filter((q) => viewedIds.has(q.id)).length;
      const civProgress = civQuestions.length > 0 ? Math.round((civCompleted / civQuestions.length) * 100) : 0;

      // Mapeo de questionRange a subcategoría correcta (según modo de examen)
      const getSubcategoryFromRange = (range: string, cat: string): string => {
        if (examMode === '128') {
          const rangeMap: Record<string, Record<string, string>> = {
            GobiernoAmericano: {
              '1-15': 'A: Principios del Gobierno Americano',
              '16-62': 'B: Sistema de Gobierno',
              '63-72': 'C: Derechos y Responsabilidades',
            },
            HistoriaAmericana: {
              '73-89': 'A: Período Colonial e Independencia',
              '90-99': 'B: Siglo XIX (1800s)',
              '100-118': 'C: Historia Reciente',
            },
            SymbolsHolidays: {
              '119-124': 'A: Símbolos',
              '125-128': 'B: Días Festivos',
            },
          };
          return rangeMap[cat]?.[range] || rangeMap.GobiernoAmericano['1-15'];
        }
        const rangeMap: Record<string, Record<string, string>> = {
          GobiernoAmericano: {
            '1-12': 'A: Principios de la Democracia Americana',
            '13-47': 'B: Sistema de Gobierno',
            '48-57': 'C: Derechos y Responsabilidades',
          },
          HistoriaAmericana: {
            '58-70': 'A: Período Colonial e Independencia',
            '71-77': 'B: Siglo XIX (1800s)',
            '78-87': 'C: Historia Reciente',
          },
          EducacionCivica: {
            '88-95': 'A: Geografía',
            '96-98': 'B: Símbolos',
            '99-100': 'C: Días Festivos',
          },
        };
        return rangeMap[cat]?.[range] || rangeMap.GobiernoAmericano['1-12'];
      };

      let lastCategory = 'GobiernoAmericano';
      let lastRange = examMode === '128' ? '1-15' : '1-12';
      if (govProgress === 100) {
        lastCategory = 'HistoriaAmericana';
        lastRange = examMode === '128' ? '73-89' : '58-70';
      }
      if (histProgress === 100) {
        lastCategory = examMode === '128' ? 'SymbolsHolidays' : 'EducacionCivica';
        lastRange = examMode === '128' ? '119-124' : '88-95';
      }

      const lastSubcategory = getSubcategoryFromRange(lastRange, lastCategory);

      setHomeData({
        progress,
        completedQuestions: completedCount,
        totalQuestions: questions.length,
        todayCount: today,
        remainingQuestions: remaining,
        streak,
        governmentProgress: govProgress,
        historyProgress: histProgress,
        civicsProgress: civProgress,
        lastStudiedCategory: lastCategory,
        lastStudiedRange: lastRange,
        lastStudiedSubcategory: lastSubcategory,
        userName: user?.email?.split('@')[0] || 'Estudiante',
      });

      const newAchievements: Achievement[] = [];

      // Logros basados en datos reales
      if (completedCount >= 10) {
        newAchievements.push({
          id: 'questions_10',
          icon: '📝',
          name: '10 preguntas estudiadas',
          date: `${completedCount} de ${questions.length} completadas`,
          unlocked: true,
        });
      }

      if (completedCount >= 50) {
        newAchievements.push({
          id: 'questions_50',
          icon: '⭐',
          name: '50 preguntas completadas',
          date: `${completedCount} de ${questions.length} completadas`,
          unlocked: true,
        });
      }

      if (completedCount >= questions.length && questions.length > 0) {
        newAchievements.push({
          id: 'questions_100',
          icon: '🏆',
          name: `¡Las ${questions.length} preguntas!`,
          date: '100% completado',
          unlocked: true,
        });
      }

      if (streak >= 3) {
        newAchievements.push({
          id: 'streak_3',
          icon: '🔥',
          name: `Racha de ${streak} días`,
          date: `${streak} días consecutivos`,
          unlocked: true,
        });
      }

      if (govProgress >= 100) {
        newAchievements.push({
          id: 'gov_complete',
          icon: '🏛️',
          name: 'Gobierno Americano completo',
          date: `${govCompleted}/${govQuestions.length} preguntas`,
          unlocked: true,
        });
      } else if (govProgress >= 50) {
        newAchievements.push({
          id: 'gov_50',
          icon: '🎯',
          name: 'Gobierno al 50%',
          date: `${govCompleted}/${govQuestions.length} preguntas`,
          unlocked: true,
        });
      }

      if (histProgress >= 100) {
        newAchievements.push({
          id: 'hist_complete',
          icon: '📚',
          name: 'Historia Americana completa',
          date: `${histCompleted}/${histQuestions.length} preguntas`,
          unlocked: true,
        });
      }

      if (civProgress >= 100) {
        newAchievements.push({
          id: 'civ_complete',
          icon: '🗽',
          name: 'Educación Cívica completa',
          date: `${civCompleted}/${civQuestions.length} preguntas`,
          unlocked: true,
        });
      }

      if (today >= 5) {
        newAchievements.push({
          id: 'daily_5',
          icon: '💪',
          name: `${today} preguntas hoy`,
          date: 'Sesión de estudio productiva',
          unlocked: true,
        });
      }

      setAchievements(newAchievements);
      setIsLoading(false);
    } catch (error) {
      if (__DEV__) console.error('Error loading data:', error);
      setIsLoading(false);
    }
  }, [user, questions, examMode]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleContinuePress = useCallback(() => {
    const categoryMap: Record<string, CategoryType> = {
      GobiernoAmericano: 'government',
      HistoriaAmericana: 'history',
      EducacionCivica: 'civics',
      SymbolsHolidays: 'symbols_holidays',
    };

    const category = categoryMap[homeData.lastStudiedCategory || 'GobiernoAmericano'] || 'government';

    const subtitle = homeData.lastStudiedSubcategory || (examMode === '128' ? 'A: Principios del Gobierno Americano' : 'A: Principios de la Democracia Americana');
    const titleMap: Record<string, string> = {
      GobiernoAmericano: 'Gobierno Americano',
      HistoriaAmericana: 'Historia Americana',
      EducacionCivica: 'Educación Cívica',
      SymbolsHolidays: 'Símbolos y Feriados',
    };
    const title = titleMap[homeData.lastStudiedCategory || 'GobiernoAmericano'] || 'Gobierno Americano';

    (navigation as any).navigate('Study', {
      screen: 'StudyCards',
      params: {
        category,
        questionRange: homeData.lastStudiedRange || (examMode === '128' ? '1-15' : '1-12'),
        title,
        subtitle,
      },
    });
  }, [homeData, navigation, examMode]);

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
    navigation.navigate('ResultsScreen' as any);
  }, [navigation]);

  const handleLogoutPress = useCallback(() => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar Sesión', style: 'destructive', onPress: logout },
    ]);
  }, [logout]);

  const handleResetProgress = useCallback(() => {
    Alert.alert(
      'Reiniciar Progreso',
      '¿Seguro que quieres borrar todo tu progreso de estudio y práctica? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Reiniciar',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Última Confirmación',
              'Se borrarán todas las preguntas vistas, tu racha, marcadas e incorrectas. ¿Continuar?',
              [
                { text: 'No, Cancelar', style: 'cancel' },
                {
                  text: 'Borrar Todo',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // Claves fijas a eliminar
                      const fixedKeys = [
                        '@study:viewed',
                        '@study:streak',
                        '@study:lastDate',
                        '@study:bestStreak',
                        '@study:daysStudied',
                        '@practice:incorrect',
                        '@practice:marked',
                        '@practice:stats',
                        '@practice:srs_data',
                        '@practice:random_incorrect',
                        '@practice:random_marked',
                        '@practice:random20_incorrect',
                        '@practice:random20_marked',
                      ];
                      // Claves dinámicas de estudio diario
                      const allKeys = await AsyncStorage.getAllKeys();
                      const dailyKeys = allKeys.filter((k) =>
                        k.startsWith('@study:dailyQuestions_')
                      );
                      await AsyncStorage.multiRemove([...fixedKeys, ...dailyKeys]);
                      await loadData();
                      Alert.alert('Listo', 'Tu progreso ha sido reiniciado. ¡Puedes empezar de cero!');
                    } catch (err) {
                      if (__DEV__) console.error('Error resetting progress:', err);
                      Alert.alert('Error', 'No se pudo reiniciar el progreso. Intenta de nuevo.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [loadData]);

  const handleProfileLongPress = useCallback(() => {
    Alert.alert('Opciones', '', [
      {
        text: '📷 Cambiar Foto de Perfil',
        onPress: handlePickProfilePhoto,
      },
      {
        text: '🔄 Reiniciar Progreso',
        style: 'destructive',
        onPress: handleResetProgress,
      },
      {
        text: '🚪 Cerrar Sesión',
        style: 'destructive',
        onPress: handleLogoutPress,
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, [handlePickProfilePhoto, handleResetProgress, handleLogoutPress]);

  // =============== COMPONENTES ===============

  const handleExamModeChipPress = () => {
    Alert.alert(
      'Cambiar Examen',
      examMode === '100'
        ? 'Estás en la versión de 100 preguntas (aplicantes hasta el 19 oct 2025).\n¿Cambiar a la versión de 128 preguntas?'
        : 'Estás en la versión de 128 preguntas (aplicantes después del 20 oct 2025).\n¿Cambiar a la versión de 100 preguntas?',
      [
        {
          text: examMode === '100' ? 'Cambiar a 128 preguntas' : 'Cambiar a 100 preguntas',
          onPress: () => setExamMode(examMode === '100' ? '128' : '100'),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const Header = () => (
    <View style={styles.headerContainer}>
      <LinearGradient
        colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        {/* Fila 1: marca + acciones */}
        <View style={styles.headerTop}>
          <View style={styles.headerBrand}>
            <Image
              source={require('../assets/imagenonboarding/logoapp1.png')}
              style={styles.headerLogo}
            />
            <Text style={styles.headerTitle}>Ciudadanía Fácil</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
              accessibilityLabel="Ajustes"
            >
              <MaterialCommunityIcons name="cog-outline" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handlePickProfilePhoto}
              onLongPress={handleProfileLongPress}
              accessibilityLabel="Foto de perfil. Mantén presionado para ver opciones."
            >
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
              ) : (
                <MaterialCommunityIcons name="account-circle" size={32} color="white" />
              )}
              {homeData.completedQuestions > 0 && (
                <View style={styles.profileBadge}>
                  <MaterialCommunityIcons name="check" size={8} color="white" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        {/* Fila 2: saludo + chip de examen */}
        <View style={styles.headerBottom}>
          <Text style={styles.headerGreeting}>¡Hola, {homeData.userName}!</Text>
          <TouchableOpacity
            style={styles.examChip}
            onPress={handleExamModeChipPress}
            accessibilityLabel={`Examen de ${examMode} preguntas. Toca para cambiar.`}
          >
            <MaterialCommunityIcons
              name={examMode === '100' ? 'clipboard-check-outline' : 'book-open-page-variant-outline'}
              size={13}
              color="#fff"
            />
            <Text style={styles.examChipText}>{examMode} preguntas</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const StatsBar = () => (
    <View style={styles.statsBar}>
      <View style={styles.statsBarItem}>
        <Text style={styles.statsBarValue}>{homeData.completedQuestions}</Text>
        <Text style={styles.statsBarLabel}>Completadas</Text>
      </View>
      <View style={styles.statsBarDivider} />
      <View style={styles.statsBarItem}>
        <Text style={styles.statsBarValue}>{homeData.todayCount}</Text>
        <Text style={styles.statsBarLabel}>Hoy</Text>
      </View>
      <View style={styles.statsBarDivider} />
      <View style={styles.statsBarItem}>
        <Text style={styles.statsBarValue}>{homeData.remainingQuestions}</Text>
        <Text style={styles.statsBarLabel}>Restantes</Text>
      </View>
    </View>
  );

  const ProgressCard = () => (
    <Animated.View
      style={[
        styles.progressCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.progressCardHeader}>
        <Text style={styles.progressCardTitle}>Tu Progreso</Text>
        <LinearGradient
          colors={['#F59E0B', '#FBBF24'] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.streakBadge}
        >
          <Text style={styles.streakIcon}>🔥</Text>
          <Text style={styles.streakText}>{homeData.streak || 0} días</Text>
        </LinearGradient>
      </View>

      <View style={styles.progressInfo}>
        <Text style={styles.progressCount}>
          {homeData.completedQuestions} de {homeData.totalQuestions} preguntas
        </Text>
        <Text style={styles.progressPercent}>{homeData.progress}%</Text>
      </View>

      <View style={styles.progressBarTrack}>
        <LinearGradient
          colors={['#1E40AF', '#3B82F6'] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBarFill, { width: `${Math.max(homeData.progress, 2)}%` }]}
        />
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

    const ctaGradient: [string, string] =
      homeData.completedQuestions === 0
        ? ['#047857', '#10B981']   // Verde — invita a comenzar
        : homeData.progress >= 90
        ? ['#7C3AED', '#A78BFA']   // Púrpura — repaso final especial
        : ['#B45309', '#F59E0B'];  // Naranja — continuar con urgencia

    const categoryDisplayName: Record<string, string> = {
      GobiernoAmericano: 'Gobierno',
      HistoriaAmericana: 'Historia',
      EducacionCivica: 'Cívica',
      SymbolsHolidays: 'Símbolos',
    };

    const ctaSubtitle =
      homeData.lastStudiedCategory && homeData.lastStudiedRange
        ? `${categoryDisplayName[homeData.lastStudiedCategory] || homeData.lastStudiedCategory} • Preguntas ${homeData.lastStudiedRange}`
        : 'Comienza tu preparación';

    return (
      <TouchableOpacity onPress={handleContinuePress} activeOpacity={0.85}>
        <LinearGradient
          colors={ctaGradient}
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
    const govCount = questions.filter(q => q.category === 'government').length;
    const histCount = questions.filter(q => q.category === 'history').length;
    const civCount = questions.filter(q => q.category === 'civics' || q.category === 'symbols_holidays').length;
    const pathSteps = [
      {
        id: 'government',
        icon: 'bank' as const,
        title: 'Gobierno Americano',
        subtitle: `${govCount} preguntas`,
        progress: homeData.governmentProgress,
        completed: homeData.governmentProgress >= 100,
        unlocked: true,
        gradient: ['#B45309', '#F59E0B'] as [string, string],
        lockedGradient: ['#CBD5E1', '#CBD5E1'] as [string, string],
      },
      {
        id: 'history',
        icon: 'book-open-page-variant' as const,
        title: 'Historia Americana',
        subtitle: `${histCount} preguntas`,
        progress: homeData.historyProgress,
        completed: homeData.historyProgress >= 100,
        unlocked: homeData.governmentProgress >= 50,
        gradient: ['#047857', '#10B981'] as [string, string],
        lockedGradient: ['#CBD5E1', '#CBD5E1'] as [string, string],
      },
      {
        id: 'civics',
        icon: 'account-group' as const,
        title: examMode === '128' ? 'Símbolos y Feriados' : 'Educación Cívica',
        subtitle: `${civCount} preguntas`,
        progress: homeData.civicsProgress,
        completed: homeData.civicsProgress >= 100,
        unlocked: homeData.historyProgress >= 50,
        gradient: ['#1E40AF', '#3B82F6'] as [string, string],
        lockedGradient: ['#CBD5E1', '#CBD5E1'] as [string, string],
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
                <View style={{ position: 'relative' }}>
                  <LinearGradient
                    colors={step.unlocked ? step.gradient : step.lockedGradient}
                    style={styles.stepIconContainer}
                  >
                    <MaterialCommunityIcons name={step.icon as any} size={22} color="white" />
                  </LinearGradient>
                  {step.completed && (
                    <View style={styles.completedBadge}>
                      <MaterialCommunityIcons name="check-bold" size={10} color="white" />
                    </View>
                  )}
                </View>

                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                  <View style={styles.stepProgressBar}>
                    <LinearGradient
                      colors={step.gradient}
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
        gradient: ['#1E40AF', '#3B82F6'] as [string, string],
        onPress: handleQuiz20Press,
      },
      {
        id: 'review',
        icon: 'refresh',
        label: 'Repaso',
        sublabel: 'Revisar marcadas',
        gradient: ['#6D28D9', '#8B5CF6'] as [string, string],
        onPress: handleReviewPress,
      },
      {
        id: 'voice',
        icon: 'microphone',
        label: 'Voz AI',
        sublabel: 'Práctica oral',
        gradient: ['#3730A3', '#6366F1'] as [string, string],
        onPress: handleVoicePress,
      },
      {
        id: 'stats',
        icon: 'chart-line',
        label: 'Estadísticas',
        sublabel: 'Ver progreso',
        gradient: ['#047857', '#10B981'] as [string, string],
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
        <View style={styles.achievementCard}>
          {achievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementItem}>
              <LinearGradient
                colors={['#FBBF24', '#F59E0B'] as [string, string]}
                style={styles.achievementBadge}
              >
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
              </LinearGradient>
              <View style={styles.achievementText}>
                <Text style={styles.achievementName}>{achievement.name}</Text>
                <Text style={styles.achievementDate}>{achievement.date}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // =============== RENDER PRINCIPAL ===============

  const content = (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Header />
      <StatsBar />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProgressCard />
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
    <View style={styles.safeArea}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  // =============== LAYOUT ===============
  safeArea: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // =============== HEADER ===============
  headerContainer: {},
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerGreeting: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '500',
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  profileBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  examChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  examChipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // =============== STATS BAR ===============
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statsBarItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statsBarDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  statsBarValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E40AF',
  },
  statsBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },

  // =============== PROGRESS CARD ===============
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  streakIcon: {
    fontSize: 14,
  },
  streakText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E40AF',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },

  // =============== SMART CTA ===============
  smartCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#1E40AF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  ctaContent: {
    flex: 1,
  },
  ctaTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  ctaSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // =============== LEARNING PATH ===============
  learningPath: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  pathContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
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
  pathStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pathConnector: {
    width: 2,
    height: 16,
    backgroundColor: '#E2E8F0',
    marginLeft: 23,
    marginVertical: 6,
  },
  stepIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 6,
  },
  stepProgressBar: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  stepProgressFill: {
    height: '100%',
    borderRadius: 2.5,
  },

  // =============== QUICK ACTIONS ===============
  quickActions: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
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
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  actionSublabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 3,
    textAlign: 'center',
  },

  // =============== ACHIEVEMENTS ===============
  achievements: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
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
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
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
    color: '#111827',
  },
  achievementDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});

export default HomeScreenRevolutionary;
