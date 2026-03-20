// src/screens/practice/RandomPracticeScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { NavigationProps } from '../../types/navigation';
import { designSystem } from '../../config/designSystem';
import { questionAudioMap } from '../../assets/audio/questions/questionsMap';
import { questions, Question } from '../../data/questions';
import { isAnswerCorrect } from '../../utils/answerValidation';
import { PracticeQuestionCard } from '../../components/practice/PracticeQuestionCard';
import { AnswerResultCard } from '../../components/practice/AnswerResultCard';
import { FloatingAnswerInput } from '../../components/practice/FloatingAnswerInput';

// Constantes para almacenamiento
const STORAGE_KEYS = {
  INCORRECT_QUESTIONS: '@practice:random_incorrect',
  MARKED_QUESTIONS: '@practice:random_marked',
} as const;

type QuestionMode = 'text-text' | 'voice-text';

// Interfaz local que extiende Question para incluir el modo de práctica
interface LocalQuestion extends Question {
  mode?: QuestionMode;
}

const RandomPracticeScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const insets = useSafeAreaInsets();
  const [currentQuestion, setCurrentQuestion] = useState<LocalQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [totalQuestions] = useState<number>(20);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [incorrectQuestions, setIncorrectQuestions] = useState<Set<number>>(new Set());
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [showMarkQuestionDialog, setShowMarkQuestionDialog] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<LocalQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  // Función para mezclar array usando Fisher-Yates shuffle (más confiable)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Obtener 20 preguntas aleatorias de TODAS las categorías
  const getRandomQuestions = (): LocalQuestion[] => {
    if (__DEV__) console.log('🔍 getRandomQuestions: Obteniendo 20 preguntas aleatorias');
    
    if (__DEV__) console.log('📚 Total de preguntas disponibles:', questions.length);
    
    // 50% text-text, 50% voice-text
    const modes: QuestionMode[] = [
      ...Array(10).fill('text-text'),
      ...Array(10).fill('voice-text'),
    ];
    const shuffledModes = shuffleArray(modes);
    
    // Mezclar todas las preguntas y tomar 20
    const selectedQuestions = shuffleArray([...questions]).slice(0, 20);
    
    const questionsWithMode = selectedQuestions.map((q, index) => ({
      ...q,
      mode: shuffledModes[index] as QuestionMode,
    }));
    
    if (__DEV__) console.log('🎲 20 preguntas seleccionadas con modo asignado');
    
    return questionsWithMode;
  };

  // Cargar preguntas incorrectas y marcadas al iniciar
  useEffect(() => {
    loadPersistedData();
  }, []);

  // Inicializar práctica automáticamente
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initializePractice();
    }
  }, []);

  // Limpiar audio al desmontar
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Función para cargar datos persistentes
  const loadPersistedData = async () => {
    try {
      const [incorrectData, markedData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.INCORRECT_QUESTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.MARKED_QUESTIONS)
      ]);

      if (incorrectData) {
        setIncorrectQuestions(new Set(JSON.parse(incorrectData)));
      }
      if (markedData) {
        setMarkedQuestions(new Set(JSON.parse(markedData)));
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  };

  const initializePractice = async () => {
    setIsLoading(true);
    try {
      // Obtener 20 preguntas aleatorias de todas las categorías
      const randomQuestions = getRandomQuestions();
      if (randomQuestions.length > 0) {
        setShuffledQuestions(randomQuestions);
        setCurrentQuestion(randomQuestions[0]);
        setQuestionIndex(0);
        setScore(0);
        setUserAnswer('');
        setIsCorrect(null);
        
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    } catch (error) {
      console.error('Error initializing practice:', error);
      Alert.alert('Error', 'No se pudieron cargar las preguntas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!currentQuestion || !userAnswer.trim()) return;
    
    const correct = isAnswerCorrect(userAnswer, currentQuestion.answerEn);
    setIsCorrect(correct);
    
    if (correct) {
      setScore(prev => prev + 1);
    } else {
      // Guardar pregunta incorrecta
      const newIncorrectQuestions = new Set(incorrectQuestions);
      newIncorrectQuestions.add(currentQuestion.id);
      setIncorrectQuestions(newIncorrectQuestions);
      
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.INCORRECT_QUESTIONS,
          JSON.stringify([...newIncorrectQuestions])
        );
      } catch (error) {
        console.error('Error saving incorrect question:', error);
      }
      
      // Mostrar diálogo para marcar pregunta después de un delay
      setTimeout(() => {
        setShowMarkQuestionDialog(true);
      }, 2000);
    }
  };

  const handleNextQuestion = () => {
    if (shuffledQuestions.length === 0) return;
    
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
      // Práctica completada
      Alert.alert(
        'Examen Completado',
        `Puntuación: ${score}/${totalQuestions}\n${score >= 12 ? '¡Aprobado! Necesitas 12 correctas para pasar.' : 'No aprobado. Necesitas 12 correctas para pasar.'}`,
        [
          { text: 'Intentar de nuevo', onPress: initializePractice },
          { text: 'Finalizar', onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  const handleRepeatQuestion = () => {
    setUserAnswer('');
    setIsCorrect(null);
  };

  // Función para marcar/desmarcar pregunta
  const toggleMarkedQuestion = async () => {
    if (!currentQuestion) return;
    
    const newMarkedQuestions = new Set(markedQuestions);
    if (newMarkedQuestions.has(currentQuestion.id)) {
      newMarkedQuestions.delete(currentQuestion.id);
    } else {
      newMarkedQuestions.add(currentQuestion.id);
    }
    
    setMarkedQuestions(newMarkedQuestions);
    
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.MARKED_QUESTIONS,
        JSON.stringify([...newMarkedQuestions])
      );
    } catch (error) {
      console.error('Error saving marked question:', error);
    }
    
    setShowMarkQuestionDialog(false);
  };

  const handlePlayAudioQuestion = async () => {
    if (!currentQuestion || currentQuestion.mode !== 'voice-text') return;
    
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      const audioFile = questionAudioMap[currentQuestion.id];
      if (audioFile) {
        const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
        setSound(newSound);
        
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            newSound.unloadAsync();
            setSound(null);
          }
        });
        
        await newSound.playAsync();
      } else {
        Alert.alert('Error', 'No se encontró el archivo de audio para esta pregunta');
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'No se pudo reproducir el audio');
    }
  };

  if (isLoading || !currentQuestion) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.mainContainer}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={['#1E3A8A', '#1E40AF', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.header, { paddingTop: insets.top + 8 }]}
            >
              <View style={styles.headerContent}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle}>Práctica Aleatoria</Text>
                  <Text style={styles.headerSubtitle}>20 preguntas al azar</Text>
                </View>
                <View style={{ width: 44 }} />
              </View>
            </LinearGradient>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={designSystem.colors.brand.primary} />
            <Text style={styles.loadingText}>Cargando preguntas...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#1E3A8A', '#1E40AF', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 8 }]}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Volver atrás"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Práctica Aleatoria</Text>
                <Text style={styles.headerSubtitle}>20 preguntas al azar</Text>
              </View>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.navigate('Home')}
                accessibilityLabel="Ir al inicio"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="home" size={22} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${((questionIndex + 1) / totalQuestions) * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>{questionIndex + 1} de {totalQuestions}</Text>
            </View>
          </LinearGradient>
        </View>

        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.practiceArea}>
            <Animated.View style={[styles.practiceContent, { opacity: fadeAnim }]}>
              <ScrollView
                style={styles.practiceScroll}
                contentContainerStyle={styles.practiceScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Pregunta</Text>
                    <Text style={styles.statValue}>{questionIndex + 1}/{totalQuestions}</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Correctas</Text>
                    <Text style={[styles.statValue, { color: designSystem.colors.functional.success }]}>{score}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={initializePractice}
                    accessibilityLabel="Reiniciar práctica"
                    accessibilityRole="button"
                  >
                    <MaterialCommunityIcons name="refresh" size={18} color={designSystem.colors.brand.primary} />
                  </TouchableOpacity>
                </View>

                <PracticeQuestionCard
                  question={currentQuestion.questionEn}
                  questionNumber={currentQuestion.id}
                  mode={currentQuestion.mode}
                  onPlayAudio={handlePlayAudioQuestion}
                />

                {isCorrect !== null && (
                  <AnswerResultCard
                    isCorrect={isCorrect}
                    correctAnswer={currentQuestion.answerEn}
                    userAnswer={userAnswer}
                    onRepeat={handleRepeatQuestion}
                    onNext={handleNextQuestion}
                  />
                )}

                {showMarkQuestionDialog && (
                  <View style={styles.markBanner}>
                    <MaterialCommunityIcons name="bookmark-outline" size={20} color="#fff" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.markBannerTitle}>¿Marcar esta pregunta?</Text>
                      <Text style={styles.markBannerSubtitle}>Guárdala para repasar luego</Text>
                    </View>
                    <TouchableOpacity style={styles.markBannerButton} onPress={toggleMarkedQuestion}>
                      <Text style={styles.markBannerButtonText}>
                        {markedQuestions.has(currentQuestion.id) ? 'Quitar' : 'Marcar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: designSystem.colors.background.secondary,
  },
  headerContainer: {},
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  progressText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: designSystem.spacing.lg,
  },
  loadingText: {
    marginTop: designSystem.spacing.md,
    fontSize: 15,
    color: designSystem.colors.text.secondary,
    textAlign: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  practiceArea: {
    flex: 1,
    position: 'relative',
  },
  practiceContent: {
    flex: 1,
  },
  practiceScroll: {
    flex: 1,
  },
  practiceScrollContent: {
    paddingHorizontal: designSystem.spacing.md,
    paddingTop: designSystem.spacing.md,
    paddingBottom: 200,
    gap: designSystem.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: designSystem.spacing.sm,
    alignItems: 'center',
  },
  statCard: {
    flex: 1,
    backgroundColor: designSystem.colors.background.primary,
    borderRadius: designSystem.borderRadius.lg,
    paddingVertical: designSystem.spacing.sm + 4,
    alignItems: 'center',
    gap: 2,
    ...designSystem.shadows.sm,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: designSystem.colors.text.primary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: designSystem.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 64, 175, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designSystem.colors.functional.warning,
    padding: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
    gap: designSystem.spacing.sm,
  },
  markBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  markBannerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },
  markBannerButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: designSystem.borderRadius.full,
  },
  markBannerButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: designSystem.colors.functional.warning,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default RandomPracticeScreen;
