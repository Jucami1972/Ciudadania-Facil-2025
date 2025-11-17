// src/screens/HomeScreenRedesign.tsx
// Rediseño completo UX/UI de la pantalla principal
// Diseñado como un dashboard inteligente que guía el aprendizaje

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Modal,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const CARD_WIDTH = isWeb ? (Math.min(width, 1400) - 96) / 3 : (width - 48) / 2; // 3 columnas en web, 2 en móvil

// ==================== TIPOS ====================
interface StudyModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  progress: number;
  route: string;
}

interface PracticeModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  status: 'completed' | 'in-progress' | 'available';
  route: string;
}

interface Badge {
  id: string;
  title: string;
  icon: string;
  unlocked: boolean;
  description: string;
}

// ==================== COMPONENTES ====================

// Header con saludo personalizado
const HeaderSection = ({ userName, onProfilePress }: { userName: string; onProfilePress: () => void }) => {
  const greetings = [
    '¡Hola',
    'Buenos días',
    'Buenas tardes',
    '¡Bienvenido',
  ];
  const motivationalMessages = [
    '¡Vamos a estudiar juntos!',
    'Cada día te acerca más a tu meta',
    'Tu esfuerzo hoy construye tu futuro',
    'Estás haciendo un gran trabajo',
  ];

  const hour = new Date().getHours();
  let greeting = greetings[0];
  if (hour >= 5 && hour < 12) greeting = greetings[1];
  else if (hour >= 12 && hour < 18) greeting = greetings[2];
  else greeting = greetings[3];

  const message = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerTextContainer}>
          <View style={styles.headerTitleRow}>
            <MaterialCommunityIcons name="book-education" size={20} color="#9B54FF" />
            <Text style={styles.headerAppTitle}>Ciudadanía Fácil</Text>
          </View>
          <Text style={styles.headerGreeting}>
            {greeting} {userName || 'Estudiante'}
          </Text>
          <Text style={styles.headerSubtext}>{message}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
          <MaterialCommunityIcons name="account-circle" size={32} color="#9B54FF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Tarjeta de progreso mejorada
const ProgressCard = ({
  progress,
  completedQuestions,
  totalQuestions,
  streak,
  dailyGoal,
  onReset,
}: {
  progress: number;
  completedQuestions: number;
  totalQuestions: number;
  streak: number;
  dailyGoal: number;
  onReset?: () => void;
}) => {
  return (
    <View style={styles.progressCard}>
      <LinearGradient
        colors={['#9B54FF', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.progressGradient}
      >
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.progressLabel}>Tu Progreso</Text>
            <Text style={styles.progressPercentage}>{progress}%</Text>
          </View>
          <View style={styles.progressHeaderRight}>
            <View style={styles.streakContainer}>
              <MaterialCommunityIcons name="fire" size={18} color="#FFD700" />
              <Text style={styles.streakText}>{streak} días</Text>
            </View>
            {onReset && (
              <TouchableOpacity onPress={onReset} style={styles.resetButton}>
                <MaterialCommunityIcons name="refresh" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.progressStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedQuestions}</Text>
            <Text style={styles.statLabel}>de {totalQuestions} preguntas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{dailyGoal}</Text>
            <Text style={styles.statLabel}>meta diaria</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

// Botón principal CTA
const MainCTAButton = ({ onPress }: { onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.mainCTA} onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={['#9B54FF', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.mainCTAGradient}
      >
        <MaterialCommunityIcons name="play-circle" size={28} color="#FFFFFF" />
        <Text style={styles.mainCTAText}>CONTINÚA DONDE QUEDASTE</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Tarjeta de módulo de estudio (grid 2 columnas)
const StudyModuleCard = ({
  module,
  onPress,
}: {
  module: StudyModule;
  onPress: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TouchableOpacity
      style={[
        styles.moduleCard,
        { width: CARD_WIDTH },
        isWeb && isHovered && styles.moduleCardHovered,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      onMouseEnter={() => isWeb && setIsHovered(true)}
      onMouseLeave={() => isWeb && setIsHovered(false)}
    >
      <View style={[styles.moduleIconContainer, { backgroundColor: `${module.color}15` }]}>
        <MaterialCommunityIcons name={module.icon as any} size={24} color={module.color} />
      </View>
      <Text style={styles.moduleTitle}>{module.title}</Text>
      <Text style={styles.moduleDescription} numberOfLines={2}>
        {module.description}
      </Text>
      <View style={styles.moduleProgressContainer}>
        <View style={styles.moduleProgressBar}>
          <View
            style={[
              styles.moduleProgressFill,
              { width: `${module.progress}%`, backgroundColor: module.color },
            ]}
          />
        </View>
        <Text style={styles.moduleProgressText}>{module.progress}%</Text>
      </View>
    </TouchableOpacity>
  );
};

// Tarjeta de práctica
const PracticeModuleCard = ({
  module,
  onPress,
}: {
  module: PracticeModule;
  onPress: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const statusConfig = {
    completed: { icon: 'check-circle', color: '#10B981', label: 'Completado' },
    'in-progress': { icon: 'clock-outline', color: '#F59E0B', label: 'En progreso' },
    available: { icon: 'play-circle', color: '#9B54FF', label: 'Disponible' },
  };

  const config = statusConfig[module.status];

  return (
    <TouchableOpacity
      style={[
        styles.practiceCard,
        { width: CARD_WIDTH },
        isWeb && isHovered && styles.practiceCardHovered,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      onMouseEnter={() => isWeb && setIsHovered(true)}
      onMouseLeave={() => isWeb && setIsHovered(false)}
    >
      <View style={[styles.practiceIconContainer, { backgroundColor: `${module.color}15` }]}>
        <MaterialCommunityIcons name={module.icon as any} size={24} color={module.color} />
      </View>
      <Text style={styles.practiceTitle}>{module.title}</Text>
      <Text style={styles.practiceDescription} numberOfLines={2}>
        {module.description}
      </Text>
      <View style={[styles.practiceStatus, { backgroundColor: `${config.color}15` }]}>
        <MaterialCommunityIcons name={config.icon as any} size={14} color={config.color} />
        <Text style={[styles.practiceStatusText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Badge de gamificación
const BadgeCard = ({ badge }: { badge: Badge }) => {
  return (
    <View
      style={[
        styles.badgeCard,
        { opacity: badge.unlocked ? 1 : 0.4 },
        { width: CARD_WIDTH },
      ]}
    >
      <View
        style={[
          styles.badgeIconContainer,
          {
            backgroundColor: badge.unlocked ? '#9B54FF' : '#E5E7EB',
          },
        ]}
      >
        <MaterialCommunityIcons
          name={badge.icon as any}
          size={20}
          color={badge.unlocked ? '#FFFFFF' : '#9CA3AF'}
        />
      </View>
      <Text style={styles.badgeTitle} numberOfLines={1}>
        {badge.title}
      </Text>
      {!badge.unlocked && (
        <MaterialCommunityIcons name="lock" size={12} color="#9CA3AF" style={styles.badgeLock} />
      )}
    </View>
  );
};

// Botón flotante (FAB) con asistente IA
const AIAssistantFAB = ({ onPress }: { onPress: () => void }) => {
  const [showMenu, setShowMenu] = useState(false);
  const scaleAnim = new Animated.Value(0);

  const quickActions = [
    { icon: 'help-circle', label: 'Explicar pregunta', action: () => {} },
    { icon: 'microphone', label: 'Practicar entrevista', action: () => {} },
    { icon: 'play', label: 'Reanudar examen', action: () => {} },
  ];

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowMenu(!showMenu)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#9B54FF', '#7C3AED']}
          style={styles.fabGradient}
        >
          <MaterialCommunityIcons name="robot" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {showMenu && (
        <Modal
          transparent
          visible={showMenu}
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <TouchableOpacity
            style={styles.fabMenuOverlay}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          >
            <View style={styles.fabMenu}>
              <Text style={styles.fabMenuTitle}>Asistente IA</Text>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.fabMenuItem}
                  onPress={() => {
                    action.action();
                    setShowMenu(false);
                  }}
                >
                  <MaterialCommunityIcons name={action.icon as any} size={20} color="#9B54FF" />
                  <Text style={styles.fabMenuItemText}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
};

// ==================== PANTALLA PRINCIPAL ====================
const HomeScreenRedesign = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  // Estados
  const [progress, setProgress] = useState(5);
  const [completedQuestions, setCompletedQuestions] = useState(6);
  const [totalQuestions] = useState(128);
  const [streak, setStreak] = useState(1);
  const [dailyGoal] = useState(10);

  // Módulos de estudio
  const [studyModules, setStudyModules] = useState<StudyModule[]>([
    {
      id: 'cards',
      title: 'Tarjetas de Estudio',
      description: 'Aprende las 128 preguntas',
      icon: 'cards',
      color: '#9B54FF',
      progress: 5,
      route: 'StudyHome',
    },
    {
      id: 'type',
      title: 'Estudio por Tipo',
      description: '¿Quién?, ¿Qué?, ¿Cuándo?',
      icon: 'format-list-numbered',
      color: '#8B5CF6',
      progress: 0,
      route: 'QuestionTypePracticeHome',
    },
  ]);

  // Módulos de práctica
  const [practiceModules] = useState<PracticeModule[]>([
    {
      id: 'photo',
      title: 'Memoria Fotográfica',
      description: 'Asocia imágenes con preguntas',
      icon: 'image-multiple',
      color: '#10B981',
      status: 'available',
      route: 'PhotoMemoryHome',
    },
    {
      id: 'vocabulary',
      title: 'Vocabulario',
      description: 'Palabras clave con pronunciación',
      icon: 'alphabetical-variant',
      color: '#F59E0B',
      status: 'available',
      route: 'VocabularioHome',
    },
    {
      id: 'interview',
      title: 'Entrevista AI',
      description: 'Simula una entrevista real',
      icon: 'microphone-variant',
      color: '#EF4444',
      status: 'available',
      route: 'EntrevistaAIHome',
    },
    {
      id: 'exam20',
      title: 'Examen 20 Preguntas',
      description: 'Simulación real del examen',
      icon: 'clipboard-check',
      color: '#06B6D4',
      status: 'available',
      route: 'Random20PracticeHome',
    },
  ]);

  // Badges
  const [badges] = useState<Badge[]>([
    {
      id: 'first-day',
      title: 'Primer día',
      icon: 'star',
      unlocked: true,
      description: 'Completaste tu primer día de estudio',
    },
    {
      id: 'week-streak',
      title: 'Racha semanal',
      icon: 'fire',
      unlocked: false,
      description: 'Estudia 7 días seguidos',
    },
    {
      id: 'halfway',
      title: 'A mitad de camino',
      icon: 'trophy',
      unlocked: false,
      description: 'Completa el 50% de las preguntas',
    },
  ]);

  // Cargar progreso
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const viewedRaw = await AsyncStorage.getItem('@study:viewed');
        const viewed = new Set<number>(viewedRaw ? JSON.parse(viewedRaw) : []);
        const pct = Math.max(0, Math.min(100, Math.round((viewed.size / totalQuestions) * 100)));
        setProgress(pct);
        setCompletedQuestions(viewed.size);

        // Cargar racha
        const lastStudyDate = await AsyncStorage.getItem('@study:lastDate');
        const streakCount = await AsyncStorage.getItem('@study:streak');
        if (lastStudyDate) {
          const lastDate = new Date(lastStudyDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          lastDate.setHours(0, 0, 0, 0);
          const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 0) {
            setStreak(parseInt(streakCount || '1', 10));
          } else if (diffDays === 1) {
            const newStreak = parseInt(streakCount || '1', 10) + 1;
            setStreak(newStreak);
            await AsyncStorage.setItem('@study:streak', newStreak.toString());
            await AsyncStorage.setItem('@study:lastDate', new Date().toISOString());
          } else {
            setStreak(1);
            await AsyncStorage.setItem('@study:streak', '1');
            await AsyncStorage.setItem('@study:lastDate', new Date().toISOString());
          }
        } else {
          await AsyncStorage.setItem('@study:lastDate', new Date().toISOString());
          await AsyncStorage.setItem('@study:streak', '1');
        }

        // Actualizar progreso de módulos
        setStudyModules((prev) =>
          prev.map((m) => {
            if (m.id === 'cards') {
              return { ...m, progress: pct };
            }
            return m;
          })
        );
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    };

    const unsubscribe = navigation.addListener('focus', loadProgress);
    loadProgress();
    return unsubscribe;
  }, [navigation, totalQuestions]);

  // Navegación
  const navigateToPracticeStack = (screenName: string) => {
    navigation.navigate('Practice', { screen: screenName });
  };

  const navigateToStudyStack = (screenName: string) => {
    navigation.navigate('Study', { screen: screenName });
  };

  const handleContinuePress = () => {
    // Navegar a la última sección estudiada o a la primera
    navigateToStudyStack('StudyHome');
  };

  const handleModulePress = (module: StudyModule | PracticeModule) => {
    if ('status' in module) {
      // Es un módulo de práctica
      navigateToPracticeStack(module.route);
    } else {
      // Es un módulo de estudio
      navigateToStudyStack(module.route);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: isWeb ? 0 : insets.top }]}>
      <HeaderSection
        userName={user?.email?.split('@')[0] || 'Estudiante'}
        onProfilePress={logout}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de Progreso */}
        <ProgressCard
          progress={progress}
          completedQuestions={completedQuestions}
          totalQuestions={totalQuestions}
          streak={streak}
          dailyGoal={dailyGoal}
          onReset={async () => {
            try {
              await AsyncStorage.removeItem('@study:viewed');
              await AsyncStorage.removeItem('@study:lastDate');
              await AsyncStorage.removeItem('@study:streak');
              setProgress(0);
              setCompletedQuestions(0);
              setStreak(1);
              setStudyModules((prev) =>
                prev.map((m) => {
                  if (m.id === 'cards') {
                    return { ...m, progress: 0 };
                  }
                  return m;
                })
              );
              Alert.alert('Progreso reseteado', 'El contador de progreso ha sido reiniciado a 0.');
            } catch (error) {
              console.error('Error resetting progress:', error);
              Alert.alert('Error', 'No se pudo resetear el progreso.');
            }
          }}
        />

        {/* Botón Principal CTA */}
        <MainCTAButton onPress={handleContinuePress} />

        {/* Sección de Estudio */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="book-open-variant" size={20} color="#9B54FF" />
            <Text style={styles.sectionTitle}>Estudio</Text>
          </View>
          <View style={styles.grid}>
            {studyModules.map((module) => (
              <StudyModuleCard
                key={module.id}
                module={module}
                onPress={() => handleModulePress(module)}
              />
            ))}
          </View>
        </View>

        {/* Sección de Práctica */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="pencil-box" size={20} color="#10B981" />
            <Text style={styles.sectionTitle}>Práctica</Text>
          </View>
          <View style={styles.grid}>
            {practiceModules.map((module) => (
              <PracticeModuleCard
                key={module.id}
                module={module}
                onPress={() => handleModulePress(module)}
              />
            ))}
          </View>
        </View>

        {/* Gamificación - Badges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="trophy" size={20} color="#F59E0B" />
            <Text style={styles.sectionTitle}>Logros</Text>
          </View>
          <View style={styles.grid}>
            {badges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Botón Flotante FAB */}
      <AIAssistantFAB onPress={() => {}} />
    </SafeAreaView>
  );
};

// ==================== ESTILOS ====================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    ...Platform.select({
      web: {
        alignItems: 'center',
      },
    }),
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 1400,
      },
    }),
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    ...Platform.select({
      web: {
        paddingHorizontal: 32,
        paddingTop: 24,
        paddingBottom: 120,
      },
    }),
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 1400,
        alignSelf: 'center',
        paddingHorizontal: 32,
        paddingVertical: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  headerAppTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9B54FF',
    letterSpacing: 0.3,
    ...Platform.select({
      web: {
        fontSize: 20,
      },
    }),
  },
  headerGreeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    ...Platform.select({
      web: {
        fontSize: 28,
      },
    }),
  },
  headerSubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    ...Platform.select({
      web: {
        fontSize: 16,
      },
    }),
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCard: {
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#9B54FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    ...Platform.select({
      web: {
        marginTop: 0,
        marginBottom: 24,
        boxShadow: '0 4px 16px rgba(155, 84, 255, 0.2)',
      },
    }),
  },
  progressGradient: {
    padding: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  progressHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressPercentage: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  mainCTA: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#9B54FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    ...Platform.select({
      web: {
        marginBottom: 32,
        boxShadow: '0 6px 20px rgba(155, 84, 255, 0.3)',
        cursor: 'pointer',
      },
    }),
  },
  mainCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  mainCTAText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
    ...Platform.select({
      web: {
        marginBottom: 40,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
    ...Platform.select({
      web: {
        fontSize: 24,
        marginBottom: 16,
      },
    }),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        gap: 16,
        justifyContent: 'flex-start',
      },
    }),
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        width: CARD_WIDTH,
        marginBottom: 16,
        cursor: 'pointer',
        padding: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
  },
  moduleCardHovered: {
    ...Platform.select({
      web: {
        transform: [{ translateY: -4 }],
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        borderColor: '#9B54FF',
      },
    }),
  },
  moduleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  moduleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
    ...Platform.select({
      web: {
        fontSize: 16,
        marginBottom: 6,
      },
    }),
  },
  moduleDescription: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 14,
    marginBottom: 8,
    ...Platform.select({
      web: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 12,
      },
    }),
  },
  moduleProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  moduleProgressBar: {
    flex: 1,
    height: 3,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 6,
  },
  moduleProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  moduleProgressText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 28,
  },
  practiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        width: CARD_WIDTH,
        marginBottom: 16,
        cursor: 'pointer',
        padding: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
  },
  practiceCardHovered: {
    ...Platform.select({
      web: {
        transform: [{ translateY: -4 }],
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        borderColor: '#10B981',
      },
    }),
  },
  practiceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  practiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
    ...Platform.select({
      web: {
        fontSize: 16,
        marginBottom: 6,
      },
    }),
  },
  practiceDescription: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 14,
    marginBottom: 8,
    ...Platform.select({
      web: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 12,
      },
    }),
  },
  practiceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  practiceStatusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  badgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        width: CARD_WIDTH,
        marginBottom: 16,
        padding: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
  },
  badgeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  badgeLock: {
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#9B54FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
  fabMenu: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    marginHorizontal: 16,
  },
  fabMenuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  fabMenuItemText: {
    fontSize: 15,
    color: '#111827',
    marginLeft: 12,
    fontWeight: '500',
  },
});

export default HomeScreenRedesign;

