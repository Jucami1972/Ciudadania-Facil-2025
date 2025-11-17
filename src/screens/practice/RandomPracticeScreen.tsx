// src/screens/practice/RandomPracticeScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { NavigationProps } from '../../types/navigation';
import { colors } from '../../constants/colors';
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
    const symbolsHolidaysQuestions = getQuestionsByCategory('symbols_holidays');
    
    // Combinar todas las preguntas
    const allQuestions = [
      ...governmentQuestions,
      ...historyQuestions,
      ...symbolsHolidaysQuestions
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color="#1f2937" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Práctica</Text>
              <Text style={styles.headerSubtitle}>Aleatoria</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Cargando preguntas...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.headerSubtitle}>Aleatoria</Text>
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
              <View style={styles.practiceInfo}>
                <View style={styles.practiceHeaderRow}>
                  <Text style={styles.practiceTitle} numberOfLines={1}>
                    Examen de 20 Preguntas
                  </Text>
                  <TouchableOpacity
                    style={styles.changeCategoryPill}
                    onPress={() => {
                      initializePractice();
                    }}
                  >
                    <MaterialCommunityIcons name="refresh" size={14} color={colors.primary.main} />
                    <Text style={styles.changeCategoryText}>Reiniciar</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.practiceStats}>
                  <View style={styles.practiceStat}>
                    <Text style={styles.practiceStatLabel}>Pregunta</Text>
                    <Text style={styles.practiceStatValue}>
                      {questionIndex + 1}/{totalQuestions}
                    </Text>
                  </View>
                  <View style={styles.practiceStat}>
                    <Text style={styles.practiceStatLabel}>Puntuación</Text>
                    <Text style={styles.practiceStatValue}>
                      {score}/{totalQuestions}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.questionCard}>
                <View style={styles.questionModeChip}>
                  <MaterialCommunityIcons
                    name={currentQuestion.mode?.includes('voice') ? 'microphone' : 'text'}
                    size={14}
                    color={colors.primary.main}
                  />
                  <Text style={styles.questionModeTextChip}>{getQuestionModeText(currentQuestion.mode || 'text-text')}</Text>
                </View>

                {currentQuestion.mode === 'voice-text' ? (
                  <View style={styles.audioContainer}>
                    <TouchableOpacity style={styles.audioButton} onPress={handlePlayAudioQuestion}>
                      <MaterialCommunityIcons name="play-circle" size={20} color="#fff" />
                      <Text style={styles.audioButtonText}>Escuchar</Text>
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
                  <View style={[styles.resultHeader, { backgroundColor: isCorrect ? '#22c55e' : '#ef4444' }]}>
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
                      <MaterialCommunityIcons name="replay" size={16} color={colors.primary.main} />
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
                    <Text style={styles.markBannerSubtitle}>
                      Guárdala para repasar luego
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.markBannerButton} onPress={toggleMarkedQuestion}>
                    <Text style={styles.markBannerButtonText}>
                      {markedQuestions.has(currentQuestion.id) ? 'Quitar' : 'Marcar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Espacio para el cuadro flotante */}
              <View style={styles.bottomSpacer} />
            </ScrollView>
          </Animated.View>

          {/* Cuadro de respuesta flotante */}
          {isCorrect === null && (
            <View style={styles.floatingAnswerContainer}>
              <Text style={styles.answerLabel}>Tu respuesta</Text>
              <TextInput
                style={styles.answerInput}
                value={userAnswer}
                onChangeText={setUserAnswer}
                placeholder="Escribe tu respuesta aquí..."
                placeholderTextColor="#9ca3af"
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
    width: 36,
    height: 36,
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
  practiceArea: {
    flex: 1,
    backgroundColor: 'transparent',
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderWidth: 0,
    borderColor: 'transparent',
    position: 'relative',
  },
  practiceContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  floatingAnswerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerInput: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    maxHeight: 100,
    color: '#111827',
    backgroundColor: '#f9fafb',
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 10,
    backgroundColor: colors.primary.main,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
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
    paddingBottom: 180, // Espacio para el cuadro flotante
    gap: 16,
  },
  practiceInfo: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  practiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  practiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  changeCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  changeCategoryText: {
    color: colors.primary.main,
    fontWeight: '600',
    fontSize: 11,
  },
  practiceStats: {
    flexDirection: 'row',
    gap: 8,
  },
  practiceStat: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  practiceStatLabel: {
    fontSize: 10,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '600',
  },
  practiceStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 3,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    gap: 10,
  },
  questionModeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(124,58,237,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  questionModeTextChip: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary.main,
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
    fontWeight: '500',
  },
  audioContainer: {
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  audioButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  voiceInstruction: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  resultHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  correctAnswerContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  correctAnswerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  correctAnswerValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 18,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary.main,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  markBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    padding: 10,
    borderRadius: 12,
    gap: 8,
  },
  markBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 1,
  },
  markBannerSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
  },
  markBannerButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  markBannerButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f59e0b',
  },
  bottomSpacer: {
    height: 160, // Espacio para el cuadro flotante
    minHeight: 160,
  },
});

export default RandomPracticeScreen;
