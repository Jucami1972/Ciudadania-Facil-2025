// src/screens/practice/CategoryPracticeScreen.tsx
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { NavigationProps } from '../../types/navigation';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { questionAudioMap } from '../../assets/audio/questions/questionsMap';
import { practiceQuestions, getQuestionsByCategory, detectRequiredQuantity, detectQuestionType, PracticeQuestion } from '../../data/practiceQuestions';
import { validarRespuesta } from '../../data/conciliacionPreguntas';
import { getQuestionsByCategory as getQuestionsByTypeCategory } from '../../data/questionCategories';
import { getQuestionsByType, QUESTION_TYPES } from '../../services/questionTypesService';

const { width } = Dimensions.get('window');

// Constantes para almacenamiento
const STORAGE_KEYS = {
  INCORRECT_QUESTIONS: '@practice:incorrect',
  MARKED_QUESTIONS: '@practice:marked',
} as const;

interface Category {
  id: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  gradient: [string, string];
  description: string;
}

type QuestionMode = 'text-text' | 'voice-text';

// Interfaz local que extiende PracticeQuestion para incluir el modo
interface LocalPracticeQuestion extends PracticeQuestion {
  mode?: QuestionMode;
}

const CategoryPracticeScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const routeParams = route.params as { questionType?: string };
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
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [incorrectQuestions, setIncorrectQuestions] = useState<Set<number>>(new Set());
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [showMarkQuestionDialog, setShowMarkQuestionDialog] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<LocalPracticeQuestion[]>([]);

  // Función para mezclar array usando Fisher-Yates shuffle (más confiable)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Función para obtener TODAS las preguntas disponibles por categoría o tipo de forma aleatoria
  const getAllQuestionsByCategory = async (categoryId: string): Promise<LocalPracticeQuestion[]> => {
    console.log('🔍 getAllQuestionsByCategory llamado con categoryId:', categoryId);
    
    // Verificar si es un tipo de pregunta (who, what, when, etc.) o una categoría (government, history, etc.)
    const isQuestionType = QUESTION_TYPES.some(type => type.id === categoryId);
    const validCategories = ['government', 'history', 'symbols_holidays'];
    const isCategory = validCategories.includes(categoryId);
    const isIncorrect = categoryId === 'incorrect';
    const isMarked = categoryId === 'marked';
    
    let categoryQuestions: PracticeQuestion[] = [];
    
    if (isMarked) {
      // Es el modo de preguntas marcadas, cargar desde AsyncStorage
      console.log('🔖 Es modo de preguntas marcadas, cargando desde AsyncStorage');
      try {
        const markedData = await AsyncStorage.getItem(STORAGE_KEYS.MARKED_QUESTIONS);
        if (markedData) {
          const markedIds: number[] = JSON.parse(markedData);
          categoryQuestions = practiceQuestions.filter(q => markedIds.includes(q.id));
          console.log('📚 Preguntas marcadas cargadas:', categoryQuestions.length);
        } else {
          console.log('⚠️ No hay preguntas marcadas guardadas');
          return [];
        }
      } catch (error) {
        console.error('Error loading marked questions:', error);
        return [];
      }
    } else if (isIncorrect) {
      // Es el modo de preguntas incorrectas, cargar desde AsyncStorage
      console.log('❌ Es modo de preguntas incorrectas, cargando desde AsyncStorage');
      try {
        const incorrectData = await AsyncStorage.getItem(STORAGE_KEYS.INCORRECT_QUESTIONS);
        if (incorrectData) {
          const incorrectIds: number[] = JSON.parse(incorrectData);
          categoryQuestions = practiceQuestions.filter(q => incorrectIds.includes(q.id));
          console.log('📚 Preguntas incorrectas cargadas:', categoryQuestions.length);
        } else {
          console.log('⚠️ No hay preguntas incorrectas guardadas');
          return [];
        }
      } catch (error) {
        console.error('Error loading incorrect questions:', error);
        return [];
      }
    } else if (isQuestionType) {
      // Es un tipo de pregunta, usar getQuestionsByType y convertir a PracticeQuestion
      console.log('📝 Es un tipo de pregunta, usando getQuestionsByType');
      const questionsByType = getQuestionsByType(categoryId);
      console.log('📚 Preguntas obtenidas de getQuestionsByType:', questionsByType.length);
      
      // Convertir Question[] a PracticeQuestion[]
      categoryQuestions = questionsByType.map(q => ({
        id: q.id,
        question: q.questionEs || q.questionEn,
        answer: q.answerEs || q.answerEn,
        category: q.category,
        difficulty: 'medium' as const, // Dificultad por defecto
      }));
      console.log('✅ Preguntas convertidas a PracticeQuestion:', categoryQuestions.length);
    } else if (isCategory) {
      // Es una categoría válida, usar getQuestionsByCategory
      console.log('📂 Es una categoría, usando getQuestionsByCategory');
      categoryQuestions = getQuestionsByCategory(categoryId as 'government' | 'history' | 'symbols_holidays');
      console.log('📚 Preguntas obtenidas de getQuestionsByCategory:', categoryQuestions.length);
    } else {
      console.error('❌ categoryId no es válido:', categoryId);
      return [];
    }
    
    // Crear array de modos aleatorios (50% text-text, 50% voice-text)
    const modes: QuestionMode[] = [];
    const totalQuestions = categoryQuestions.length;
    const textCount = Math.floor(totalQuestions / 2);
    const voiceCount = totalQuestions - textCount;
    
    // Llenar array con modos balanceados
    for (let i = 0; i < textCount; i++) {
      modes.push('text-text');
    }
    for (let i = 0; i < voiceCount; i++) {
      modes.push('voice-text');
    }
    
    // Mezclar los modos aleatoriamente
    const shuffledModes = shuffleArray(modes);
    
    // Agregar modo aleatorio a cada pregunta
    const questionsWithMode = categoryQuestions.map((q, index) => ({
      ...q,
      mode: shuffledModes[index] as QuestionMode
    }));
    
    console.log('🎲 Preguntas con modo asignado:', questionsWithMode.length);
    console.log('📊 Distribución de modos:', {
      text: questionsWithMode.filter(q => q.mode === 'text-text').length,
      voice: questionsWithMode.filter(q => q.mode === 'voice-text').length
    });
    
    // Mezclar las preguntas aleatoriamente usando Fisher-Yates
    const shuffledQuestions = shuffleArray(questionsWithMode);
    console.log('🔄 Preguntas ordenadas aleatoriamente:', shuffledQuestions.length);
    
    return shuffledQuestions;
  };

  const categories: Category[] = [
    {
      id: 'government',
      title: 'Gobierno Americano',
      icon: 'bank',
      gradient: ['#1e88e5', '#1976d2'],
      description: 'Preguntas sobre el gobierno y la democracia'
    },
    {
      id: 'history',
      title: 'Historia Americana',
      icon: 'book-open-page-variant',
      gradient: ['#9c27b0', '#7b1fa2'],
      description: 'Preguntas sobre la historia de Estados Unidos'
    },
    {
      id: 'civics',
      title: 'Educación Cívica',
      icon: 'school',
      gradient: ['#4caf50', '#388e3c'],
      description: 'Preguntas sobre educación cívica y geografía'
    }
  ];

  const initializedFromParams = useRef(false);

  // Hook para reconocimiento de voz
  const { 
    isRecording, 
    isSupported: voiceSupported, 
    error: voiceError,
    startRecording, 
    stopRecording 
  } = useVoiceRecognition({
    onSpeechResult: (text) => {
      console.log('Voice result received:', text);
      setUserAnswer(text);
    },
    onError: (error) => {
      console.error('Voice recognition error:', error);
      Alert.alert('Error de Voz', error);
    },
    onStart: () => {
      console.log('Voice recognition started');
    },
    onEnd: () => {
      console.log('Voice recognition ended');
    }
  });

  // Cargar preguntas incorrectas y marcadas al iniciar
  useEffect(() => {
    loadPersistedData();
  }, []);

  // Limpiar audio al desmontar
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Auto-hide del resultado después de un tiempo
  useEffect(() => {
    if (isCorrect !== null) {
      console.log('🕐 Auto-hide timer iniciado para:', isCorrect ? 'correcto' : 'incorrecto');
      const timer = setTimeout(() => {
        if (isCorrect) {
          // Si es correcto, auto-hide después de 3 segundos
          console.log('✅ Auto-hiding resultado correcto');
          setIsCorrect(null);
        }
        // Si es incorrecto, se mantiene hasta que el usuario interactúe
      }, isCorrect ? 3000 : 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isCorrect]);

  // Debug: Log cuando cambia el estado de la pregunta
  useEffect(() => {
    console.log('🔄 Estado de pregunta actualizado:', {
      questionIndex,
      currentQuestion: currentQuestion?.id,
      isCorrect,
      userAnswer
    });
  }, [questionIndex, currentQuestion, isCorrect, userAnswer]);

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

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setQuestionIndex(0);
    setScore(0);
    setUserAnswer('');
    setIsCorrect(null);
    
    // Obtener TODAS las preguntas disponibles por categoría de forma aleatoria
    const categoryQuestions = await getAllQuestionsByCategory(categoryId);
    if (categoryQuestions.length > 0) {
      // Guardar las preguntas aleatorias en el estado para mantener el orden durante la sesión
      setShuffledQuestions(categoryQuestions);
      setTotalQuestions(categoryQuestions.length);
      setCurrentQuestion(categoryQuestions[0]);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      // No hay preguntas disponibles
      Alert.alert(
        'Sin preguntas',
        'No hay preguntas disponibles para este tipo. Por favor, selecciona otro tipo de pregunta.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              setSelectedCategory(null);
              setCurrentQuestion(null);
            }
          }
        ]
      );
    }
  };

  // Función para limpiar texto removiendo símbolos, corchetes y asteriscos
  const cleanText = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      // Remover símbolos comunes
      .replace(/[•·\-\*]/g, '')
      // Remover corchetes y su contenido
      .replace(/\[.*?\]/g, '')
      // Remover paréntesis y su contenido
      .replace(/\(.*?\)/g, '')
      // Remover asteriscos
      .replace(/\*/g, '')
      // Remover espacios múltiples
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Función INTELIGENTE para comparar respuestas con limpieza de texto
  const isAnswerCorrect = (userAnswer: string, correctAnswer: string, questionText: string): boolean => {
    console.log('=== VALIDACIÓN CON LIMPIEZA DE TEXTO ===');
    console.log('Question:', questionText);
    console.log('User Answer (original):', userAnswer);
    console.log('Correct Answer (original):', correctAnswer);
    
    // Limpiar ambas respuestas
    const cleanUserAnswer = cleanText(userAnswer);
    const cleanCorrectAnswer = cleanText(correctAnswer);
    
    console.log('User Answer (cleaned):', cleanUserAnswer);
    console.log('Correct Answer (cleaned):', cleanCorrectAnswer);
    
    // Dividir la respuesta correcta en opciones (separadas por comas o saltos de línea)
    const correctOptions = cleanCorrectAnswer
      .split(/[,•\n]/)
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);
    
    console.log('Correct Options:', correctOptions);
    
    // Verificar si la respuesta del usuario coincide con alguna opción
    const isMatch = correctOptions.some(option => {
      const normalizedOption = cleanText(option);
      return cleanUserAnswer === normalizedOption || 
             cleanUserAnswer.includes(normalizedOption) ||
             normalizedOption.includes(cleanUserAnswer);
    });
    
    console.log('Is Match:', isMatch);
    console.log('=== FIN VALIDACIÓN ===');
    
    return isMatch;
  };

  const handleAnswerSubmit = async () => {
    if (!currentQuestion || !userAnswer.trim()) return;
    
    const correct = isAnswerCorrect(userAnswer, currentQuestion.answer, currentQuestion.question);
    setIsCorrect(correct);
    
    if (correct) {
      setScore(prev => prev + 1);
      // Hacer scroll hacia arriba para mostrar el resultado
      setTimeout(() => {
        // El resultado se mostrará automáticamente
      }, 100);
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
      }, 2000); // Mostrar después de 2 segundos para que el usuario vea el resultado
    }
  };

  const handleNextQuestion = () => {
    console.log('=== DEBUG: handleNextQuestion llamado ===');
    console.log('selectedCategory:', selectedCategory);
    console.log('questionIndex actual:', questionIndex);
    console.log('totalQuestions:', totalQuestions);
    console.log('shuffledQuestions length:', shuffledQuestions.length);
    
    if (!selectedCategory || shuffledQuestions.length === 0) {
      console.log('❌ No hay categoría seleccionada o no hay preguntas');
      return;
    }
    
    const nextIndex = questionIndex + 1;
    console.log('Siguiente índice:', nextIndex);
    
    if (nextIndex < shuffledQuestions.length) {
      console.log('✅ Avanzando a la siguiente pregunta');
      console.log('Nueva pregunta:', shuffledQuestions[nextIndex]);
      console.log('Modo de la pregunta:', shuffledQuestions[nextIndex].mode);
      
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
      
      console.log('✅ Estado actualizado - Nueva pregunta cargada');
    } else {
      console.log('🏁 Práctica completada');
      Alert.alert(
        'Práctica Completada',
        `Puntuación: ${score}/${totalQuestions}`,
        [
          { text: 'Volver a Categorías', onPress: () => handleCategorySelect(selectedCategory) },
          { text: 'Finalizar', onPress: () => setSelectedCategory(null) }
        ]
      );
    }
  };

  const handleRepeatQuestion = () => {
    setUserAnswer('');
    setIsCorrect(null);
  };

  const handleVoiceAnswer = async () => {
    // Esta función ya no se usa ya que solo tenemos text-text y voice-text
    return;
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

  // Función para navegar a preguntas incorrectas
  const navigateToIncorrectQuestions = () => {
    navigation.navigate('IncorrectPractice');
  };

  const handlePlayAudioQuestion = async () => {
    if (!currentQuestion || currentQuestion.mode !== 'voice-text') return;
    
    try {
      console.log('Playing audio for question:', currentQuestion.id);
      
      // Detener audio anterior si está reproduciéndose
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      // Crear nuevo audio usando el ID de la pregunta
      const audioFile = questionAudioMap[currentQuestion.id];
      if (audioFile) {
        console.log('Audio file found:', audioFile);
        
        const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
        setSound(newSound);
        
        // Configurar callback para cuando termine
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            console.log('Audio finished playing');
            newSound.unloadAsync();
            setSound(null);
          }
        });
        
        // Reproducir audio
        console.log('Starting audio playback...');
        await newSound.playAsync();
        
      } else {
        console.error('No audio file found for question:', currentQuestion.id);
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

  const getFeedbackColor = (): [string, string] => {
    if (isCorrect === null) return ['#9E9E9E', '#757575'];
    return isCorrect ? ['#4CAF50', '#388E3C'] : ['#F44336', '#D32F2F'];
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
                <View style={styles.practiceInfo}>
                  <View style={styles.practiceHeaderRow}>
                    <Text style={styles.practiceTitle} numberOfLines={1}>
                      {categories.find((c) => c.id === selectedCategory)?.title}
                    </Text>
                    <TouchableOpacity
                      style={styles.changeCategoryPill}
                      onPress={() => {
                        setSelectedCategory(null);
                        setCurrentQuestion(null);
                        setUserAnswer('');
                      }}
                    >
                      <MaterialCommunityIcons name="swap-horizontal" size={14} color={colors.primary.main} />
                      <Text style={styles.changeCategoryText}>Cambiar</Text>
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
      )}

      {/* Mensaje cuando no hay categoría seleccionada */}
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
  categoryDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  
  // ESTILOS OPTIMIZADOS PARA EL ÁREA DE PRÁCTICA - CON CUADRO FLOTANTE
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
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 200, // Espacio para el cuadro flotante
    paddingHorizontal: 16,
    paddingTop: 10,
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
  voiceStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.15)',
  },
  voiceStatusText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  voiceErrorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#F44336',
    fontStyle: 'italic',
    backgroundColor: 'rgba(244, 67, 54, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  bottomSpacer: {
    height: 160, // Espacio para el cuadro flotante
    minHeight: 160,
  },
  
  // Estilos para el diálogo de marcar preguntas
  markQuestionDialog: {
    marginBottom: 24,
  },
  markQuestionGradient: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  markQuestionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  markQuestionText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  markQuestionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  markQuestionNoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    flex: 1,
    justifyContent: 'center',
  },
  markQuestionNoText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  markQuestionYesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 16,
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
  },
  markQuestionYesText: {
    color: '#FF9800',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  viewIncorrectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    width: '100%',
    justifyContent: 'center',
  },
  viewIncorrectText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
    letterSpacing: 0.3,
  },
});

export default CategoryPracticeScreen;
