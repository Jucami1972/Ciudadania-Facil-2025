import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  AccessibilityInfo,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { questions } from '../data/questions';
import { StudyCardsRouteProp, NavigationProps } from '../types/navigation';
import { CATEGORIES, CategoryType, CATEGORY_LABELS } from '../constants/categories';
import { colors, sectionGradients } from '../constants/colors';
import { spacing, radius, shadow } from '../constants/spacing';
import { fontSize, fontWeight, lineHeight } from '../constants/typography';
import FlipCard from '../components/FlipCard';
import ProgressModal from '../components/ProgressModal';
import { useSectionProgress } from '../hooks/useSectionProgress';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Constantes
const GRADIENTS = {
  GOVERNMENT: ['#9057e3', '#5e13b3'] as [string, string],
  HISTORY: ['#a51890', '#6c1e74'] as [string, string],
  SYMBOLS_HOLIDAYS: ['#9057e3', '#5e13b3'] as [string, string],
  DEFAULT: ['#5637A4', '#9747FF'] as [string, string],
};

type Props = {
  route: StudyCardsRouteProp;
};

const StudyCardsScreen: React.FC<Props> = ({ route }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();
  const { category, title, subtitle } = route.params;
  const flipCardRef = useRef<any>(null);

  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const toastAnimation = useRef(new Animated.Value(0)).current;

  const filteredQuestions = useMemo(() => {
    return questions.filter(
      (q) => q.category === category && q.subcategory === subtitle
    );
  }, [category, subtitle]);

  // Crear ID único para la sección
  const sectionId = `${category}_${subtitle}`.replace(/\s+/g, '_');
  
  // Hook para manejar progreso de la sección
  const {
    currentIndex,
    showProgressModal,
    isLoading: progressLoading,
    updateCurrentIndex,
    continueFromSaved,
    restartFromBeginning,
    viewAllQuestions,
    closeProgressModal,
  } = useSectionProgress(sectionId, filteredQuestions.length);

  if (filteredQuestions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>No hay preguntas disponibles</Text>
      </SafeAreaView>
    );
  }

  const current = filteredQuestions[currentIndex];
  
  // Sincronizar el estado de reproducción con el componente FlipCard
  useEffect(() => {
    const interval = setInterval(() => {
      if (flipCardRef.current) {
        setIsPlaying(flipCardRef.current.isPlaying);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [currentIndex]);

  // Resetear el estado de reproducción cuando cambie la pregunta
  useEffect(() => {
    setIsPlaying(false);
  }, [currentIndex]);

  // Marcar pregunta vista para progreso global de estudio
  useEffect(() => {
    const markViewed = async () => {
      try {
        if (!current) return;
        const key = '@study:viewed';
        const existing = await AsyncStorage.getItem(key);
        const set = new Set<number>(existing ? JSON.parse(existing) : []);
        if (!set.has(current.id)) {
          set.add(current.id);
          await AsyncStorage.setItem(key, JSON.stringify(Array.from(set)));
        }
      } catch (e) {
        // no-op: progreso es best-effort
      }
    };
    markViewed();
  }, [current?.id]);

  // Detener el audio cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (flipCardRef.current) {
        flipCardRef.current.stopAudio();
      }
    };
  }, []);

  const getCategoryGradient = (): [string, string] => {
    if (title === 'Gobierno Americano') return GRADIENTS.GOVERNMENT;
    if (title === 'Historia Americana') return GRADIENTS.HISTORY;
    if (title === 'Educación Cívica') return GRADIENTS.SYMBOLS_HOLIDAYS;
    return GRADIENTS.DEFAULT;
  };

  const handleLanguageChange = (newLanguage: 'en' | 'es') => {
    setLanguage(newLanguage);
    setIsPlaying(false); // Resetear el estado de reproducción al cambiar idioma
    // No resetear la tarjeta para mantener la misma cara (pregunta o respuesta)
    // El cambio de idioma se aplicará automáticamente al contenido
  };

  const getPreviousSubcategory = () => {
    try {
      // Primero intentamos encontrar la subcategoría anterior en la misma categoría
      const currentSubcategory = subtitle;
      const allSubcategories = questions
        .filter((q) => q.category === category)
        .map((q) => q.subcategory)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();

      const currentIndex = allSubcategories.indexOf(currentSubcategory);
      if (currentIndex > 0) {
        const previousSubcategory = allSubcategories[currentIndex - 1];
        const questionsInSubcategory = questions.filter(
          (q) => q.category === category && q.subcategory === previousSubcategory
        );
        
        if (questionsInSubcategory.length > 0) {
          const firstId = Math.min(...questionsInSubcategory.map((q) => q.id));
          const lastId = Math.max(...questionsInSubcategory.map((q) => q.id));
          
          return {
            category,
            title: CATEGORY_LABELS[category],
            subcategory: previousSubcategory,
            range: `${firstId}-${lastId}`,
          };
        }
      }

      // Si no hay subcategorías anteriores en la categoría actual, buscamos la última subcategoría de la categoría anterior
      const allCategories: CategoryType[] = [CATEGORIES.GOVERNMENT, CATEGORIES.HISTORY, CATEGORIES.SYMBOLS_HOLIDAYS];
      const currentCategoryIndex = allCategories.indexOf(category);
      if (currentCategoryIndex > 0) {
        const previousCategory = allCategories[currentCategoryIndex - 1];
        const previousCategoryQuestions = questions.filter((q) => q.category === previousCategory);
        
        if (previousCategoryQuestions.length > 0) {
          // Obtenemos todas las subcategorías de la categoría anterior
          const previousSubcategories = previousCategoryQuestions
            .map((q) => q.subcategory)
            .filter((value, index, self) => self.indexOf(value) === index)
            .sort();
          
          if (previousSubcategories.length > 0) {
            // Tomamos la última subcategoría
            const lastSubcategory = previousSubcategories[previousSubcategories.length - 1];
            const questionsInSubcategory = questions.filter(
              (q) => q.category === previousCategory && q.subcategory === lastSubcategory
            );
            
            if (questionsInSubcategory.length > 0) {
              const firstId = Math.min(...questionsInSubcategory.map((q) => q.id));
              const lastId = Math.max(...questionsInSubcategory.map((q) => q.id));
              
              return {
                category: previousCategory,
                title: CATEGORY_LABELS[previousCategory],
                subcategory: lastSubcategory,
                range: `${firstId}-${lastId}`,
              };
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting previous subcategory:', error);
      return null;
    }
  };

  const showToastMessage = (message: string, onConfirm: () => void) => {
    setToastMessage(message);
    setPendingNavigation(() => onConfirm);
    setShowToast(true);
    Animated.timing(toastAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleConfirm = () => {
    Animated.timing(toastAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowToast(false);
      if (pendingNavigation) {
        pendingNavigation();
      }
    });
  };

  const handleCancel = () => {
    Animated.timing(toastAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowToast(false);
      setPendingNavigation(null);
    });
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      updateCurrentIndex(currentIndex - 1);
      if (flipCardRef.current) {
        flipCardRef.current.reset();
      }
    } else {
      const previousSubcategory = getPreviousSubcategory();
      if (previousSubcategory) {
        const navigateToPrevious = () => {
          try {
            navigation.replace('StudyCards', {
              category: previousSubcategory.category,
              title: previousSubcategory.title,
              subtitle: previousSubcategory.subcategory,
              questionRange: previousSubcategory.range,
            });
          } catch (error) {
            console.error('Error navigating to previous subcategory:', error);
          }
        };

        showToastMessage(
          '¿Deseas ir al tema anterior?',
          navigateToPrevious
        );
      }
    }
  };

  const getNextSubcategory = () => {
    try {
      // Primero intentamos encontrar la siguiente subcategoría en la misma categoría
      const currentSubcategory = subtitle;
      const allSubcategories = questions
        .filter((q) => q.category === category)
        .map((q) => q.subcategory)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();

      const currentIndex = allSubcategories.indexOf(currentSubcategory);
      if (currentIndex < allSubcategories.length - 1) {
        const nextSubcategory = allSubcategories[currentIndex + 1];
        const questionsInSubcategory = questions.filter(
          (q) => q.category === category && q.subcategory === nextSubcategory
        );
        
        if (questionsInSubcategory.length > 0) {
          const firstId = Math.min(...questionsInSubcategory.map((q) => q.id));
          const lastId = Math.max(...questionsInSubcategory.map((q) => q.id));
          
          return {
            category,
            title: CATEGORY_LABELS[category],
            subcategory: nextSubcategory,
            range: `${firstId}-${lastId}`,
          };
        }
      }

      // Si no hay más subcategorías en la categoría actual, buscamos la siguiente categoría
      const allCategories: CategoryType[] = [CATEGORIES.GOVERNMENT, CATEGORIES.HISTORY, CATEGORIES.SYMBOLS_HOLIDAYS];
      const currentCategoryIndex = allCategories.indexOf(category);
      if (currentCategoryIndex < allCategories.length - 1) {
        const nextCategory = allCategories[currentCategoryIndex + 1];
        const nextCategoryQuestions = questions.filter((q) => q.category === nextCategory);
        
        if (nextCategoryQuestions.length > 0) {
          const firstSubcategory = nextCategoryQuestions[0].subcategory;
          const questionsInSubcategory = questions.filter(
            (q) => q.category === nextCategory && q.subcategory === firstSubcategory
          );
          
          if (questionsInSubcategory.length > 0) {
            const firstId = Math.min(...questionsInSubcategory.map((q) => q.id));
            const lastId = Math.max(...questionsInSubcategory.map((q) => q.id));
            
            return {
              category: nextCategory,
              title: CATEGORY_LABELS[nextCategory],
              subcategory: firstSubcategory,
              range: `${firstId}-${lastId}`,
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting next subcategory:', error);
      return null;
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      updateCurrentIndex(currentIndex + 1);
      if (flipCardRef.current) {
        flipCardRef.current.reset();
      }
    } else {
      const nextSubcategory = getNextSubcategory();
      if (nextSubcategory) {
        const navigateToNext = async () => {
          try {
            // Detener el audio antes de navegar a la siguiente subcategoría
            if (flipCardRef.current) {
              await flipCardRef.current.stopAudio();
            }
            navigation.replace('StudyCards', {
              category: nextSubcategory.category,
              title: nextSubcategory.title,
              subtitle: nextSubcategory.subcategory,
              questionRange: nextSubcategory.range,
            });
          } catch (error) {
            console.error('Error navigating to next subcategory:', error);
          }
        };

        showToastMessage(
          '¿Deseas ir al siguiente tema?',
          navigateToNext
        );
      } else {
        showToastMessage(
          '¡Has completado todas las categorías!',
          async () => {
            // Detener el audio antes de ir al home
            if (flipCardRef.current) {
              await flipCardRef.current.stopAudio();
            }
            navigation.navigate('Home');
          }
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={async () => {
              // Detener el audio antes de volver atrás
              if (flipCardRef.current) {
                await flipCardRef.current.stopAudio();
              }
              navigation.goBack();
            }}
            accessibilityLabel="Volver atrás"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tarjetas de Estudio</Text>
          <TouchableOpacity 
            style={styles.homeButton} 
            onPress={async () => {
              // Detener el audio antes de ir al home
              if (flipCardRef.current) {
                await flipCardRef.current.stopAudio();
              }
              navigation.navigate('Home');
            }}
            accessibilityLabel="Ir al inicio"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="home" size={20} color={colors.text.dark} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.categoryText}>{subtitle || title}</Text>
          <View style={styles.questionContainer}>
            <Text style={styles.questionLabel}>Pregunta</Text>
            <Text style={styles.questionNumber}>
              {currentIndex + 1} de {filteredQuestions.length}
            </Text>
          </View>
        </View>
        <View style={styles.progressInfo}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentIndex + 1) / filteredQuestions.length) * 100}%` },
              ]}
            />
          </View>
        </View>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, language === 'en' && styles.toggleActive]}
            onPress={() => handleLanguageChange('en')}
            accessibilityLabel="Cambiar a inglés"
            accessibilityRole="button"
            accessibilityState={{ selected: language === 'en' }}
          >
            <Text style={language === 'en' ? styles.toggleTextActive : styles.toggleTextInactive}>
              English
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, language === 'es' && styles.toggleActive]}
            onPress={() => handleLanguageChange('es')}
            accessibilityLabel="Cambiar a español"
            accessibilityRole="button"
            accessibilityState={{ selected: language === 'es' }}
          >
            <Text style={language === 'es' ? styles.toggleTextActive : styles.toggleTextInactive}>
              Español
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.explanationButton}
          onPress={() =>
            navigation.navigate('Explanation', {
              explanationEs: current.explanationEs,
              explanationEn: current.explanationEn,
              questionTitle: language === 'es' ? current.questionEs : current.questionEn,
            })
          }
          accessibilityLabel="Ver explicación"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="information-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <FlipCard
          ref={flipCardRef}
          frontContent={{
            number: current.id,
            question: current.questionEs,
            questionEn: current.questionEn,
          }}
          backContent={{
            answer: current.answerEs,
            answerEn: current.answerEn,
          }}
          language={language}
          isImportant={current.asterisk}
        />
      </ScrollView>

      <View style={styles.navContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && !getPreviousSubcategory() && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentIndex === 0 && !getPreviousSubcategory()}
          accessibilityLabel="Tema anterior"
          accessibilityRole="button"
          accessibilityState={{ disabled: currentIndex === 0 && !getPreviousSubcategory() }}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Botón de audio centrado */}
        <TouchableOpacity
          style={[styles.navButton, styles.audioButton]}
          onPress={() => {
            if (flipCardRef.current) {
              flipCardRef.current.playAudio();
              // Sincronizar el estado local con el estado del componente FlipCard
              setTimeout(() => {
                if (flipCardRef.current) {
                  setIsPlaying(flipCardRef.current.isPlaying);
                }
              }, 100);
            }
          }}
          accessibilityLabel={isPlaying ? "Detener audio" : "Reproducir audio"}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons 
            name={isPlaying ? "stop" : "play"} 
            size={28} 
            color="#fff" 
          />
        </TouchableOpacity>

        {showToast && (
          <Animated.View 
            style={[
              styles.toast,
              {
                opacity: toastAnimation,
                transform: [
                  {
                    translateY: toastAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.toastText}>{toastMessage}</Text>
            <View style={styles.toastButtons}>
              <TouchableOpacity 
                style={[styles.toastButton, styles.cancelButton]} 
                onPress={handleCancel}
              >
                <Text style={styles.toastButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toastButton, styles.confirmButton]} 
                onPress={handleConfirm}
              >
                <Text style={styles.toastButtonText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNext}
          accessibilityLabel={
            currentIndex === filteredQuestions.length - 1
              ? "Ir al siguiente tema"
              : "Siguiente pregunta"
          }
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal de progreso guardado */}
      <ProgressModal
        visible={showProgressModal}
        onClose={closeProgressModal}
        onContinue={continueFromSaved}
        onRestart={restartFromBeginning}
        onViewAll={viewAllQuestions}
        sectionName={subtitle || title}
        currentQuestion={currentIndex + 1}
        totalQuestions={filteredQuestions.length}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  header: {
    backgroundColor: '#F5F5F5',
    paddingBottom: 4,
    ...shadow.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 48 : 52,
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 6 : 8,
    paddingBottom: Platform.OS === 'ios' ? 6 : 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  homeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: Platform.OS === 'web' ? fontSize.lg : fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.dark,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.neutral.card,
    ...shadow.sm,
    marginTop: spacing.xs,
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  categoryText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary.main,
    flex: 1,
    marginRight: spacing.md,
    lineHeight: 18,
  },
  questionContainer: {
    alignItems: 'flex-end',
  },
  questionLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary.main,
    marginBottom: 2,
  },
  questionNumber: {
    fontSize: fontSize.sm,
    color: colors.primary.light,
  },
  progressInfo: {
    width: '100%',
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.neutral.divider,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: radius.sm,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.neutral.card,
    ...shadow.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    minHeight: 60,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    backgroundColor: colors.neutral.divider,
    overflow: 'hidden',
  },
  toggleButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: colors.primary.main,
  },
  toggleTextActive: {
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
  },
  toggleTextInactive: {
    color: colors.text.dark,
    fontWeight: fontWeight.medium,
  },
  explanationButton: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 60,
    paddingHorizontal: spacing.md,
    minHeight: height * 0.5,
  },
  cardContainer: {
    width: '100%',
    minHeight: 300,
    maxHeight: 500,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.lg,
  },
  cardContent: {
    flex: 1,
    padding: spacing.xl,
  },
  answerScrollView: {
    flex: 1,
  },
  answerText: {
    fontSize: fontSize.lg,
    color: colors.text.dark,
    textAlign: 'center',
    lineHeight: 28,
    paddingVertical: spacing.md,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.neutral.card,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.divider,
    ...shadow.sm,
    position: 'relative',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#5637A4',
    width: 60,
    height: 60,
  },
  audioButton: {
    backgroundColor: '#FF6B6B',
    width: 60,
    height: 60,
  },
  navButtonDisabled: {
    backgroundColor: colors.neutral.divider,
  },
  toast: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -100 }],
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: spacing.sm,
    borderRadius: radius.lg,
    width: 250,
    alignItems: 'center',
    zIndex: 1,
    top: -60,
  },
  toastText: {
    color: '#fff',
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  toastButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: spacing.xs,
  },
  toastButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    minWidth: 100,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  confirmButton: {
    backgroundColor: '#2645ca',
  },
  toastButtonText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  errorText: {
    padding: spacing.xl,
    textAlign: 'center',
    color: colors.text.dark,
    fontSize: fontSize.lg,
  }
});

export default StudyCardsScreen;

