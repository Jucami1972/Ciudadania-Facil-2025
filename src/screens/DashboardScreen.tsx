import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProps } from '../types/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { PracticeMode } from '../types/question';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { fontSize, fontWeight } from '../constants/typography';
import { spacing, radius } from '../constants/spacing';
import WebLayout from '../components/layout/WebLayout';

const { width } = Dimensions.get('window');

interface CategoryProgress {
  name: string;
  completed: number;
  total: number;
  percentage: number;
  gradient: readonly [string, string];
}

const DashboardScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const [studyProgress, setStudyProgress] = useState<number>(0);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([]);
  const [viewedCount, setViewedCount] = useState<number>(0);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const viewedRaw = await AsyncStorage.getItem('@study:viewed');
        const viewed = new Set<number>(viewedRaw ? JSON.parse(viewedRaw) : []);
        const total = 128;
        const viewedSize = viewed.size;
        setViewedCount(viewedSize);
        const pct = Math.max(0, Math.min(100, Math.round((viewedSize / total) * 100)));
        setStudyProgress(pct);

        // Calcular progreso por categoría
        // Gobierno Americano: preguntas 1-57
        // Historia Americana: preguntas 58-87
        // Símbolos y Feriados: preguntas 88-128
        const govViewed = Array.from(viewed).filter((id) => id >= 1 && id <= 57).length;
        const histViewed = Array.from(viewed).filter((id) => id >= 58 && id <= 87).length;
        const symbolsViewed = Array.from(viewed).filter((id) => id >= 88 && id <= 128).length;

        setCategoryProgress([
          {
            name: 'Gobierno Americano',
            completed: govViewed,
            total: 57,
            percentage: Math.round((govViewed / 57) * 100),
            gradient: ['#270483', '#8146cc'],
          },
          {
            name: 'Historia Americana',
            completed: histViewed,
            total: 30,
            percentage: Math.round((histViewed / 30) * 100),
            gradient: ['#470a56', '#ce32b1'],
          },
          {
            name: 'Símbolos y Feriados',
            completed: symbolsViewed,
            total: 41,
            percentage: Math.round((symbolsViewed / 41) * 100),
            gradient: ['#270483', '#8146cc'],
          },
        ]);
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    };

    const unsubscribe = navigation.addListener('focus', loadProgress);
    loadProgress();
    return unsubscribe;
  }, [navigation]);

  const handlePracticaPress = () => {
    navigation.navigate('PruebaPractica', {
      mode: 'random' as PracticeMode,
      category: 'all',
      section: 'all',
    });
  };

  const getNextSuggestion = () => {
    if (categoryProgress.length === 0) {
      return null;
    }
    const lowestCategory = categoryProgress.reduce((prev, curr) =>
      curr.percentage < prev.percentage ? curr : prev
    );
    return lowestCategory;
  };

  const renderProgressCard = () => {
    const nextCategory = getNextSuggestion();
    const totalQuestions = 128;
    const remainingQuestions = (() => {
      // Preferimos el conteo real si está disponible
      if (viewedCount > 0) {
        return Math.max(0, totalQuestions - viewedCount);
      }
      // Fallback para el primer render cuando aún no cargó AsyncStorage
      const approxViewed = Math.round((studyProgress / 100) * totalQuestions);
      return Math.max(0, totalQuestions - approxViewed);
    })();

    return (
      <View style={styles.progressCard}>
        <Text style={styles.cardTitle}>Progreso General</Text>
        <View style={styles.progressCircle}>
          <Text style={styles.progressText}>{studyProgress}%</Text>
        </View>
        <Text style={styles.progressSubtext}>
          {remainingQuestions} preguntas por estudiar
        </Text>

        {nextCategory && (
          <View style={styles.suggestionBox}>
            <Text style={styles.suggestionTitle}>Siguiente paso sugerido</Text>
            <Text style={styles.suggestionText}>
              Continúa con {nextCategory.name}
            </Text>
            <Text style={styles.suggestionSubtext}>
              {nextCategory.percentage}% completado
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCategoryProgress = () => {
    return (
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Progreso por Categoría</Text>
        {categoryProgress.map((category, index) => (
          <View key={index} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={category.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressBarFill, { width: `${category.percentage}%` }]}
                />
              </View>
            </View>
            <Text style={styles.categoryStats}>
              {category.completed} de {category.total} preguntas
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderQuickActions = () => {
    const actions = [
      {
        label: 'Tarjetas de Estudio',
        icon: '📚',
        onPress: () => navigation.navigate('TarjetasDeEstudio'),
        gradient: ['#270483', '#8146cc'],
      },
      {
        label: 'Prueba Práctica',
        icon: '✍️',
        onPress: handlePracticaPress,
        gradient: ['#470a56', '#ce32b1'],
      },
      {
        label: 'Vocabulario',
        icon: '📖',
        onPress: () => navigation.navigate('Vocabulario'),
        gradient: ['#270483', '#8146cc'],
      },
      {
        label: 'Entrevista AI',
        icon: '🤖',
        onPress: () => navigation.navigate('EntrevistaAI'),
        gradient: ['#470a56', '#ce32b1'],
      },
      {
        label: 'Examen',
        icon: '📝',
        onPress: () => navigation.navigate('Examen'),
        gradient: ['#1B5E20', '#4CAF50'],
      },
    ];

    return (
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Acceso Rápido</Text>
        <View style={styles.actionsGrid}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={action.onPress}
            >
              <LinearGradient
                colors={action.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const content = (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Bienvenido de vuelta</Text>
        <Text style={styles.welcomeSubtitle}>
          Prepárate para el examen de ciudadanía estadounidense 2025
        </Text>
      </View>

      {/* Main Grid */}
      <View style={styles.mainGrid}>
        {/* Left Column - Progress */}
        <View style={styles.leftColumn}>
          {renderProgressCard()}
          {renderCategoryProgress()}
        </View>

        {/* Right Column - Quick Actions */}
        <View style={styles.rightColumn}>
          {renderQuickActions()}
        </View>
      </View>
    </ScrollView>
  );

  if (Platform.OS === 'web') {
    return (
      <WebLayout headerTitle="Dashboard">
        {content}
      </WebLayout>
    );
  }

  // Versión móvil (mantener el diseño actual)
  return (
    <SafeAreaView style={styles.safeArea}>
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Platform.select({ web: 0, default: spacing.lg }),
    paddingBottom: spacing.xxl,
  },
  welcomeSection: {
    marginBottom: spacing.xl,
    ...Platform.select({
      web: {
        paddingHorizontal: 0,
      },
      default: {
        paddingHorizontal: spacing.lg,
      },
    }),
  },
  welcomeTitle: {
    fontSize: Platform.select({ web: 32, default: fontSize.xxxl }),
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: fontSize.lg,
    color: colors.text.light,
    lineHeight: 24,
  },
  mainGrid: {
    ...Platform.select({
      web: {
        flexDirection: 'row',
        gap: spacing.lg,
        alignItems: 'flex-start',
      },
      default: {
        flexDirection: 'column',
      },
    }),
  },
  leftColumn: {
    ...Platform.select({
      web: {
        flex: 1,
        minWidth: 400,
      },
      default: {
        width: '100%',
      },
    }),
  },
  rightColumn: {
    ...Platform.select({
      web: {
        flex: 1,
        minWidth: 400,
      },
      default: {
        width: '100%',
      },
    }),
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral.divider,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      },
    }),
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: colors.primary.main,
    marginBottom: spacing.md,
  },
  progressText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
  },
  progressSubtext: {
    fontSize: fontSize.sm,
    color: colors.text.light,
    marginTop: spacing.sm,
  },
  suggestionBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface.light,
    borderRadius: radius.md,
    width: '100%',
    alignItems: 'center',
  },
  suggestionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.light,
    marginBottom: spacing.xs,
  },
  suggestionText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
    marginBottom: spacing.xs,
  },
  suggestionSubtext: {
    fontSize: fontSize.xs,
    color: colors.text.light,
  },
  categoriesSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
    marginBottom: spacing.md,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral.divider,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  categoryName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.dark,
  },
  categoryPercentage: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary.main,
  },
  progressBarContainer: {
    marginBottom: spacing.xs,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.surface.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryStats: {
    fontSize: fontSize.xs,
    color: colors.text.light,
  },
  quickActionsSection: {
    marginBottom: spacing.lg,
  },
  actionsGrid: {
    ...Platform.select({
      web: {
        flexDirection: 'column',
        gap: spacing.md,
      },
      default: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      },
    }),
  },
  actionCard: {
    ...Platform.select({
      web: {
        width: '100%',
      },
      default: {
        width: '48%',
      },
    }),
    marginBottom: spacing.md,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
  },
  actionIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  actionLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
    flex: 1,
  },
});

export default DashboardScreen;

