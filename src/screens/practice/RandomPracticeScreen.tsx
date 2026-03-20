// src/screens/practice/RandomPracticeScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  Animated,
  Dimensions,
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
import { colors } from '../../constants/colors';
import { designSystem } from '../../config/designSystem';
import { questionAudioMap } from '../../assets/audio/questions/questionsMap';
import { getQuestionsByCategory, PracticeQuestion } from '../../data/practiceQuestions';

const { width } = Dimensions.get('window');

// Constantes para almacenamiento
const STORAGE_KEYS = {
  INCORRECT_QUESTIONS: '@practice:random_incorrect',
  MARKED_QUESTIONS: '@practice:random_marked',
} as const;

type QuestionMode = 'text-text' | 'voice-text';

// Interfaz local que extiende PracticeQuestion para incluir el modo
interface LocalPracticeQuestion extends PracticeQuestion {
  mode?: QuestionMode;
}

const RandomPracticeScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const insets = useSafeAreaInsets();
  const [currentQuestion, setCurrentQuestion] = useState<LocalPracticeQuestion | null>(null);
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
  const [shuffledQuestions, setShuffledQuestions] = useState<LocalPracticeQuestion[]>([]);
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

  // Función para obtener 20 preguntas aleatorias de TODAS las categorías
  const getRandomQuestions = (): LocalPracticeQuestion[] => {
    console.log('🔍 getRandomQuestions: Obteniendo 20 preguntas aleatorias de todas las categorías');
    
    // Obtener preguntas de todas las categorías
    const governmentQuestions = getQuestionsByCategory('government');
    const historyQuestions = getQuestionsByCategory('history');
    const civicsQuestions = getQuestionsByCategory('civics');
    
    // Combinar todas las preguntas
    const allQuestions = [
      ...governmentQuestions,
      ...historyQuestions,
      ...civicsQuestions
    ];
    
    console.log('📚 Total de preguntas disponibles:', allQuestions.length);
    
    // Crear array de modos aleatorios (50% text-text, 50% voice-text)
    const modes: QuestionMode[] = [];
    const textCount = 10;
    const voiceCount = 10;
    
    // Llenar array con modos balanceados
    for (let i = 0; i < textCount; i++) {
      modes.push('text-text');
    }
    for (let i = 0; i < voiceCount; i++) {
      modes.push('voice-text');
    }
    
    // Mezclar los modos aleatoriamente
    const shuffledModes = shuffleArray(modes);
    
    // Mezclar todas las preguntas y tomar 20
    const shuffledAllQuestions = shuffleArray(allQuestions);
    const selectedQuestions = shuffledAllQuestions.slice(0, 20);
    
    // Agregar modo aleatorio a cada pregunta
    const questionsWithMode = selectedQuestions.map((q, index) => ({
      ...q,
      mode: shuffledModes[index] as QuestionMode
    }));
    
    console.log('🎲 20 preguntas seleccionadas con modo asignado');
    console.log('📊 Distribución de modos:', {
      text: questionsWithMode.filter(q => q.mode === 'text-text').length,
      voice: questionsWithMode.filter(q => q.mode === 'voice-text').length
    });
    
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

  // Función para limpiar texto removiendo símbolos, corchetes y asteriscos
  const cleanText = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[•·\-\*]/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Función INTELIGENTE para comparar respuestas con limpieza de texto
  const isAnswerCorrect = (userAnswer: string, correctAnswer: string, questionText: string): boolean => {
    const cleanUserAnswer = cleanText(userAnswer);
    const cleanCorrectAnswer = cleanText(correctAnswer);
    
    // Dividir la respuesta correcta en opciones (separadas por comas o saltos de línea)
    const correctOptions = cleanCorrectAnswer
      .split(/[,•\n]/)
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);
    
    // Verificar si la respuesta del usuario coincide con alguna opción
    const isMatch = correctOptions.some(option => {
      const normalizedOption = cleanText(option);
      return cleanUserAnswer === normalizedOption || 
             cleanUserAnswer.includes(normalizedOption) ||
             normalizedOption.includes(cleanUserAnswer);
    });
    
    return isMatch;
  };

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

  const getQuestionModeText = (mode: QuestionMode): string => {
    switch (mode) {
      case 'text-text': return 'Pregunta de texto - Respuesta de texto';
      case 'voice-text': return 'Pregunta de voz - Respuesta de texto';
      default: return '';
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

                <View style={styles.questionCard}>
                  <View style={styles.questionModeChip}>
                    <MaterialCommunityIcons
                      name={currentQuestion.mode?.includes('voice') ? 'microphone' : 'text'}
                      size={14}
                      color={designSystem.colors.brand.primary}
                    />
                    <Text style={styles.questionModeTextChip}>{getQuestionModeText(currentQuestion.mode || 'text-text')}</Text>
                  </View>

                  {currentQuestion.mode === 'voice-text' ? (
                    <View style={styles.audioContainer}>
                      <TouchableOpacity style={styles.audioButton} onPress={handlePlayAudioQuestion}>
                        <MaterialCommunityIcons name="play-circle" size={20} color="#fff" />
                        <Text style={styles.audioButtonText}>Escuchar pregunta</Text>
                      </TouchableOpacity>
                      <Text style={styles.voiceInstruction}>Escribe tu respuesta después de escuchar</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.questionLabel}>Pregunta</Text>
                      <Text style={styles.questionText}>{currentQuestion.question}</Text>
                    </>
                  )}
                </View>

                {isCorrect !== null && (
                  <View style={styles.resultCard}>
                    <View style={[styles.resultHeader, { backgroundColor: isCorrect ? designSystem.colors.functional.success : designSystem.colors.functional.error }]}>
                      <MaterialCommunityIcons
                        name={isCorrect ? 'check-circle' : 'close-circle'}
                        size={22}
                        color="#fff"
                      />
                      <Text style={styles.resultHeaderText}>
                        {isCorrect ? '¡Correcto!' : 'Incorrecto'}
                      </Text>
                    </View>
                    <View style={styles.correctAnswerContainer}>
                      <Text style={styles.correctAnswerLabel}>Respuesta correcta</Text>
                      <Text style={styles.correctAnswerValue}>{currentQuestion.answer}</Text>
                    </View>
                    <View style={styles.resultActions}>
                      <TouchableOpacity style={styles.secondaryButton} onPress={handleRepeatQuestion}>
                        <MaterialCommunityIcons name="replay" size={16} color={designSystem.colors.brand.primary} />
                        <Text style={styles.secondaryButtonText}>Repetir</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.primaryButton} onPress={handleNextQuestion}>
                        <Text style={styles.primaryButtonText}>Siguiente</Text>
                        <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
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
              <View style={styles.floatingAnswerContainer}>
                <Text style={styles.answerLabel}>Tu respuesta</Text>
                <TextInput
                  style={styles.answerInput}
                  value={userAnswer}
                  onChangeText={setUserAnswer}
                  placeholder="Escribe tu respuesta aquí..."
                  placeholderTextColor={designSystem.colors.text.tertiary}
                  multiline
                  textAlignVertical="top"
                />
                {userAnswer.trim().length > 0 && (
                  <TouchableOpacity style={styles.submitButton} onPress={handleAnswerSubmit}>
                    <Text style={styles.submitButtonText}>Confirmar respuesta</Text>
                  </TouchableOpacity>
                )}
              </View>
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
  questionCard: {
    backgroundColor: designSystem.colors.background.primary,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.md,
    gap: designSystem.spacing.sm + 2,
    ...designSystem.shadows.sm,
  },
  questionModeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(30, 64, 175, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: designSystem.borderRadius.full,
    gap: 5,
  },
  questionModeTextChip: {
    fontSize: 11,
    fontWeight: '600',
    color: designSystem.colors.brand.primary,
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: designSystem.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 15,
    color: designSystem.colors.text.primary,
    lineHeight: 22,
    fontWeight: '500',
  },
  audioContainer: {
    alignItems: 'center',
    backgroundColor: designSystem.colors.background.secondary,
    padding: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
    gap: designSystem.spacing.sm,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designSystem.colors.brand.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: designSystem.borderRadius.full,
    gap: 8,
  },
  audioButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  voiceInstruction: {
    fontSize: 12,
    color: designSystem.colors.text.secondary,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: designSystem.colors.background.primary,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.md,
    gap: designSystem.spacing.md,
    ...designSystem.shadows.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
    gap: 8,
  },
  resultHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  correctAnswerContainer: {
    backgroundColor: designSystem.colors.background.secondary,
    padding: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
  },
  correctAnswerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: designSystem.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  correctAnswerValue: {
    fontSize: 14,
    color: designSystem.colors.text.primary,
    fontWeight: '600',
    lineHeight: 20,
  },
  resultActions: {
    flexDirection: 'row',
    gap: designSystem.spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: designSystem.colors.background.secondary,
    paddingVertical: 12,
    borderRadius: designSystem.borderRadius.md,
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: designSystem.colors.brand.primary,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: designSystem.colors.brand.primary,
    paddingVertical: 12,
    borderRadius: designSystem.borderRadius.md,
    gap: 6,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  floatingAnswerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: designSystem.colors.background.primary,
    paddingHorizontal: designSystem.spacing.md,
    paddingTop: designSystem.spacing.md,
    paddingBottom: designSystem.spacing.md,
    ...designSystem.shadows.lg,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: designSystem.colors.text.primary,
    marginBottom: designSystem.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerInput: {
    borderWidth: 1.5,
    borderColor: designSystem.colors.border.light,
    borderRadius: designSystem.borderRadius.md,
    padding: designSystem.spacing.md,
    fontSize: 14,
    minHeight: 70,
    maxHeight: 100,
    color: designSystem.colors.text.primary,
    backgroundColor: designSystem.colors.background.secondary,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: designSystem.spacing.sm + 2,
    backgroundColor: designSystem.colors.brand.primary,
    paddingVertical: 14,
    borderRadius: designSystem.borderRadius.md,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
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
