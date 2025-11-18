// src/screens/practice/CategoryPracticeScreen.tsx
// REFACTORIZADO: Componente dividido en servicios y componentes más pequeños
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationProps } from '../../types/navigation';
import { colors } from '../../constants/colors';
import { QuestionLoaderService, LocalPracticeQuestion } from '../../services/QuestionLoaderService';
import { QuestionStorageService } from '../../services/QuestionStorageService';
import { isAnswerCorrect } from '../../utils/answerValidation';
import { useQuestionAudio } from '../../hooks/useQuestionAudio';
import { ProgressHeader } from '../../components/practice/ProgressHeader';
import { PracticeQuestionCard } from '../../components/practice/PracticeQuestionCard';
import { AnswerResultCard } from '../../components/practice/AnswerResultCard';
import { FloatingAnswerInput } from '../../components/practice/FloatingAnswerInput';
import { MarkQuestionBanner } from '../../components/practice/MarkQuestionBanner';

interface Category {
  id: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  gradient: [string, string];
  description: string;
}

const categories: Category[] = [
  {
    id: 'government',
    title: 'Gobierno Americano',
    icon: 'bank',
    gradient: ['#1e88e5', '#1976d2'],
    description: 'Preguntas sobre el gobierno y la democracia',
  },
  {
    id: 'history',
    title: 'Historia Americana',
    icon: 'book-open-page-variant',
    gradient: ['#9c27b0', '#7b1fa2'],
    description: 'Preguntas sobre la historia de Estados Unidos',
  },
  {
    id: 'civics',
    title: 'Educación Cívica',
    icon: 'school',
    gradient: ['#4caf50', '#388e3c'],
    description: 'Preguntas sobre educación cívica y geografía',
  },
];

const CategoryPracticeScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const routeParams = route.params as { questionType?: string };
  const initializedFromParams = useRef(false);

  // Estado principal
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    routeParams?.questionType || null
  );
  const [currentQuestion, setCurrentQuestion] = useState<LocalPracticeQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [incorrectQuestions, setIncorrectQuestions] = useState<Set<number>>(new Set());
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [showMarkQuestionDialog, setShowMarkQuestionDialog] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<LocalPracticeQuestion[]>([]);

  // Hook para audio
  const { playAudio } = useQuestionAudio(currentQuestion?.id || null);

  // Cargar datos persistentes al iniciar
  useEffect(() => {
    loadPersistedData();
  }, []);

  // Auto-hide del resultado después de un tiempo
  useEffect(() => {
    if (isCorrect !== null) {
      const timer = setTimeout(() => {
        if (isCorrect) {
          setIsCorrect(null);
        }
      }, isCorrect ? 3000 : 5000);
      return () => clearTimeout(timer);
    }
  }, [isCorrect]);

  // Inicializar práctica automáticamente si viene una categoría desde navegación
  useEffect(() => {
    if (
      routeParams?.questionType &&
      !currentQuestion &&
      !initializedFromParams.current
    ) {
      initializedFromParams.current = true;
      handleCategorySelect(routeParams.questionType).catch(error => {
        console.error('Error initializing practice:', error);
        Alert.alert('Error', 'No se pudieron cargar las preguntas');
      });
    }
  }, [routeParams?.questionType, currentQuestion]);

  // Función para cargar datos persistentes
  const loadPersistedData = async () => {
    const data = await QuestionStorageService.loadPersistedData();
    setIncorrectQuestions(data.incorrectQuestions);
    setMarkedQuestions(data.markedQuestions);
  };

  // Función para seleccionar categoría
  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setQuestionIndex(0);
    setScore(0);
    setUserAnswer('');
    setIsCorrect(null);

    const categoryQuestions = await QuestionLoaderService.getAllQuestionsByCategory(categoryId);
    if (categoryQuestions.length > 0) {
      setShuffledQuestions(categoryQuestions);
      setTotalQuestions(categoryQuestions.length);
      setCurrentQuestion(categoryQuestions[0]);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Alert.alert(
        'Sin preguntas',
        'No hay preguntas disponibles para este tipo. Por favor, selecciona otro tipo de pregunta.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedCategory(null);
              setCurrentQuestion(null);
            },
          },
        ]
      );
    }
  };

  // Función para enviar respuesta
  const handleAnswerSubmit = async () => {
    if (!currentQuestion || !userAnswer.trim()) return;

    const correct = isAnswerCorrect(userAnswer, currentQuestion.answer, currentQuestion.question);
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
    } else {
      // Guardar pregunta incorrecta
      const newIncorrectQuestions = new Set(incorrectQuestions);
      newIncorrectQuestions.add(currentQuestion.id);
      setIncorrectQuestions(newIncorrectQuestions);
      await QuestionStorageService.saveIncorrectQuestion(
        currentQuestion.id,
        newIncorrectQuestions
      );

      // Mostrar diálogo para marcar pregunta después de un delay
      setTimeout(() => {
        setShowMarkQuestionDialog(true);
      }, 2000);
    }
  };

  // Función para avanzar a la siguiente pregunta
  const handleNextQuestion = () => {
    if (!selectedCategory || shuffledQuestions.length === 0) return;

    const nextIndex = questionIndex + 1;

    if (nextIndex < shuffledQuestions.length) {
      setQuestionIndex(nextIndex);
      setCurrentQuestion(shuffledQuestions[nextIndex]);
      setUserAnswer('');
      setIsCorrect(null);
      setShowMarkQuestionDialog(false);

      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Alert.alert(
        'Práctica Completada',
        `Puntuación: ${score}/${totalQuestions}`,
        [
          { text: 'Volver a Categorías', onPress: () => handleCategorySelect(selectedCategory) },
          { text: 'Finalizar', onPress: () => setSelectedCategory(null) },
        ]
      );
    }
  };

  // Función para repetir pregunta
  const handleRepeatQuestion = () => {
    setUserAnswer('');
    setIsCorrect(null);
  };

  // Función para marcar/desmarcar pregunta
  const toggleMarkedQuestion = async () => {
    if (!currentQuestion) return;

    const newMarkedQuestions = await QuestionStorageService.toggleMarkedQuestion(
      currentQuestion.id,
      markedQuestions
    );
    setMarkedQuestions(newMarkedQuestions);
    setShowMarkQuestionDialog(false);
  };

  // Obtener título de categoría
  const getCategoryTitle = () => {
    return categories.find(c => c.id === selectedCategory)?.title || 'Práctica';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Volver atrás"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#1f2937" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Práctica</Text>
            <Text style={styles.headerSubtitle}>Por Categoría</Text>
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('Home')}
            accessibilityLabel="Ir al inicio"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="home" size={20} color="#1f2937" />
          </TouchableOpacity>
        </View>
      </View>

      {!selectedCategory && (
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleCategorySelect(category.id)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={category.gradient}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.categoryTitle}>
                  {category.title.split(' ')[0]}
                  {'\n'}
                  {category.title.split(' ')[1]}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedCategory && !currentQuestion && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Cargando preguntas...</Text>
        </View>
      )}

      {selectedCategory && currentQuestion && (
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.practiceArea}>
            <Animated.View style={[styles.practiceContent, { opacity: fadeAnim }]}>
              <ScrollView
                style={styles.practiceScroll}
                contentContainerStyle={styles.practiceScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <ProgressHeader
                  categoryTitle={getCategoryTitle()}
                  currentQuestion={questionIndex + 1}
                  totalQuestions={totalQuestions}
                  score={score}
                  onChangeCategory={() => {
                    setSelectedCategory(null);
                    setCurrentQuestion(null);
                    setUserAnswer('');
                  }}
                />

                <PracticeQuestionCard
                  question={currentQuestion.question}
                  mode={currentQuestion.mode}
                  onPlayAudio={playAudio}
                />

                {isCorrect !== null && (
                  <AnswerResultCard
                    isCorrect={isCorrect}
                    correctAnswer={currentQuestion.answer}
                    onRepeat={handleRepeatQuestion}
                    onNext={handleNextQuestion}
                  />
                )}

                {showMarkQuestionDialog && (
                  <MarkQuestionBanner
                    isMarked={markedQuestions.has(currentQuestion.id)}
                    onToggle={toggleMarkedQuestion}
                  />
                )}

                <View style={styles.bottomSpacer} />
              </ScrollView>
            </Animated.View>

            {isCorrect === null && (
              <FloatingAnswerInput
                value={userAnswer}
                onChangeText={setUserAnswer}
                onSubmit={handleAnswerSubmit}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      )}

      {!selectedCategory && (
        <View style={styles.noSelectionContainer}>
          <MaterialCommunityIcons name="help-circle-outline" size={48} color="#d1d5db" />
          <Text style={styles.noSelectionText}>Selecciona una categoría para comenzar</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  iconButton: {
    width: 44, // Accesibilidad: mínimo 44x44 dp
    height: 44, // Accesibilidad: mínimo 44x44 dp
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
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    flex: 0,
    marginTop: 0,
  },
  categoryCard: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxWidth: 150,
    minHeight: 80,
  },
  gradient: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    height: 80,
    justifyContent: 'center',
  },
  categoryTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 16,
  },
  practiceArea: {
    flex: 1,
    backgroundColor: 'transparent',
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 0,
    position: 'relative',
  },
  practiceContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  practiceScroll: {
    flex: 1,
    padding: 0,
  },
  practiceScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 180,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.text.light,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 160,
    minHeight: 160,
  },
  noSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noSelectionText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
});

export default CategoryPracticeScreen;

