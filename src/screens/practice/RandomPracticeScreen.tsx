// src/screens/RandomPracticeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors } from '../../constants/colors';
import { spacing, radius, shadow } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';
import { getRandomQuestionsByCategory, detectRequiredQuantity, detectQuestionType } from '../../data/practiceQuestions';
import { questionAudioMap } from '../../assets/audio/questions/questionsMap';

// Tipos para la práctica aleatoria
type QuestionMode = 'text-text' | 'voice-text';

interface PracticeQuestion {
  id: number;
  question: string;
  answer: string;
  mode: QuestionMode;
  category: string;
}

// Claves para AsyncStorage
const STORAGE_KEYS = {
  INCORRECT_QUESTIONS: 'random_incorrect_questions',
  MARKED_QUESTIONS: 'random_marked_questions',
};

const RandomPracticeScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = new Animated.Value(0);

  // Estados para la práctica
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<PracticeQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(new Set());
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [incorrectQuestions, setIncorrectQuestions] = useState<Set<number>>(new Set());
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [showMarkQuestionDialog, setShowMarkQuestionDialog] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);

  const practiceOptions = [
    {
      title: 'Ejercicio de Examen',
      description: '10 preguntas distribuidas por categorías',
      time: '15-20 min',
      questions: 10,
      gradient: ['#4A00E0', '#8E2DE2'],
    },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Actualizar pregunta actual cuando cambie el índice
  useEffect(() => {
    if (practiceQuestions.length > 0 && currentQuestionIndex < practiceQuestions.length) {
      setCurrentQuestion(practiceQuestions[currentQuestionIndex]);
    }
  }, [currentQuestionIndex, practiceQuestions]);

  // Función para obtener preguntas distribuidas por categorías (3-3-4) usando el nuevo archivo
  const getRandomQuestions = (count: number): PracticeQuestion[] => {
    // Obtener preguntas aleatorias de cada categoría usando las nuevas funciones
    const governmentQuestions = getRandomQuestionsByCategory('government', 3);
    const historyQuestions = getRandomQuestionsByCategory('history', 3);
    const symbolsHolidaysQuestions = getRandomQuestionsByCategory('symbols_holidays', 4);
    
    // Agregar modo aleatorio a cada pregunta
    const addModeToQuestions = (questions: any[]): PracticeQuestion[] => {
      return questions.map(q => ({
        ...q,
        mode: (Math.random() > 0.5 ? 'text-text' : 'voice-text') as QuestionMode,
      }));
    };
    
    // Combinar y mezclar todas las preguntas
    const allQuestions = [
      ...addModeToQuestions(governmentQuestions),
      ...addModeToQuestions(historyQuestions),
      ...addModeToQuestions(symbolsHolidaysQuestions)
    ];
    
    return allQuestions.sort(() => Math.random() - 0.5);
  };

  // Función INTELIGENTE para comparar respuestas con detección automática de cantidad
  const isAnswerCorrect = (userAnswer: string, correctAnswer: string, questionText: string): boolean => {
    // Normalizar ambas respuestas
    const userNorm = userAnswer.toLowerCase().trim();
    const correctNorm = correctAnswer.toLowerCase().trim();
    
    console.log('=== DEBUG ANSWER COMPARISON ===');
    console.log('User Answer:', userAnswer);
    console.log('Correct Answer:', correctAnswer);
    console.log('Question Text:', questionText);
    console.log('User Normalized:', userNorm);
    console.log('Correct Normalized:', correctNorm);
    
    // Detectar cantidad requerida automáticamente
    const requiredQuantity = detectRequiredQuantity(questionText);
    const questionType = detectQuestionType(questionText, requiredQuantity);
    
    console.log('Required Quantity:', requiredQuantity);
    console.log('Question Type:', questionType);
    
    // 1. Comparación directa
    if (userNorm === correctNorm) {
      console.log('✅ Direct match found');
      return true;
    }
    
    // 2. Verificar si la respuesta del usuario coincide con alguna opción correcta
    const correctOptions = correctNorm.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
    console.log('Correct options:', correctOptions);
    
    // 3. Para preguntas que requieren múltiples elementos
    if (requiredQuantity > 1) {
      const userAnswers = userNorm.split(',').map(opt => opt.trim()).filter(opt => opt.length > 0);
      console.log('User answers split:', userAnswers);
      
      // Verificar que el usuario dio la cantidad correcta
      if (userAnswers.length !== requiredQuantity) {
        console.log(`❌ User gave ${userAnswers.length} answers, but ${requiredQuantity} required`);
        return false;
      }
      
      // Verificar que cada respuesta del usuario es correcta
      let correctAnswers = 0;
      for (const userAns of userAnswers) {
        for (const correctOpt of correctOptions) {
          if (userAns === correctOpt || 
              (correctOpt.includes('river') && userAns === correctOpt) ||
              (!correctOpt.includes('river') && userAns === correctOpt + ' river')) {
            correctAnswers++;
            break;
          }
        }
      }
      
      const isCorrect = correctAnswers === requiredQuantity;
      console.log(`✅ User got ${correctAnswers}/${requiredQuantity} correct answers`);
      return isCorrect;
    }
    
    // 4. Para preguntas de elección única
    for (const option of correctOptions) {
      console.log('Checking option:', option);
      
      // Comparar directamente
      if (userNorm === option) {
        console.log('✅ Direct match found with option:', option);
        return true;
      }
      
      // Comparar con "River" agregado o removido (para la pregunta de ríos)
      if (option.includes('river') && userNorm === option) {
        console.log('✅ Match found with river:', option);
        return true;
      }
      
      if (!option.includes('river') && userNorm === option + ' river') {
        console.log('✅ Match found adding river:', option + ' river');
        return true;
      }
    }
    
    console.log('❌ No match found');
    console.log('=== END DEBUG ===');
    return false;
  };

  // Función para reproducir audio
  const handlePlayAudioQuestion = async () => {
    if (!currentQuestion || currentQuestion.mode !== 'voice-text') return;
    
    try {
      const audioFile = questionAudioMap[currentQuestion.id];
      if (!audioFile) {
        console.log('No audio file found for question:', currentQuestion.id);
        return;
      }
      
      setIsPlayingAudio(true);
      const { sound } = await Audio.Sound.createAsync(audioFile);
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingAudio(false);
        }
      });
      
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
    }
  };

  // Función para manejar la respuesta
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
        const incorrectArray = Array.from(newIncorrectQuestions);
        await AsyncStorage.setItem(STORAGE_KEYS.INCORRECT_QUESTIONS, JSON.stringify(incorrectArray));
        setShowMarkQuestionDialog(true);
      } catch (error) {
        console.error('Error saving incorrect question:', error);
      }
    }
  };

  // Función para repetir pregunta
  const handleRepeatQuestion = () => {
    setUserAnswer('');
    setIsCorrect(null);
    setShowMarkQuestionDialog(false);
  };

  // Función para saltar pregunta
  const handleSkipQuestion = () => {
    if (!currentQuestion) return;
    
    const newSkippedQuestions = new Set(skippedQuestions);
    newSkippedQuestions.add(currentQuestion.id);
    setSkippedQuestions(newSkippedQuestions);
    setShowSkipDialog(false);
    
    // Ir a la siguiente pregunta
    handleNextQuestion();
  };

  // Función para siguiente pregunta
  const handleNextQuestion = () => {
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setIsCorrect(null);
      setShowMarkQuestionDialog(false);
      setShowSkipDialog(false);
    } else {
      // Práctica completada
      const totalAnswered = practiceQuestions.length - skippedQuestions.size;
      const finalScore = Math.round((score / totalAnswered) * 100);
      
      // Por ahora solo mostrar en consola, después implementar navegación a resultados
      console.log('Práctica completada:', {
        score: finalScore,
        totalQuestions: practiceQuestions.length,
        answeredQuestions: totalAnswered,
        skippedQuestions: skippedQuestions.size,
      });
    }
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
    setShowMarkQuestionDialog(false);
    
    try {
      const markedArray = Array.from(newMarkedQuestions);
      await AsyncStorage.setItem(STORAGE_KEYS.MARKED_QUESTIONS, JSON.stringify(markedArray));
    } catch (error) {
      console.error('Error saving marked question:', error);
    }
  };

  // Función para navegar a preguntas incorrectas
  const navigateToIncorrectQuestions = () => {
    // Por ahora solo mostrar en consola
    console.log('Navegando a preguntas incorrectas');
  };

  // Función para obtener texto del modo de pregunta
  const getQuestionModeText = (mode: QuestionMode): string => {
    switch (mode) {
      case 'text-text': return 'Pregunta de texto';
      case 'voice-text': return 'Pregunta de audio';
      default: return 'Pregunta';
    }
  };

  // Función para obtener colores del feedback
  const getFeedbackColor = (): [string, string] => {
    return isCorrect ? ['#4CAF50', '#45A049'] : ['#F44336', '#D32F2F'];
  };

  const startPractice = async (questionCount: number) => {
    setIsLoading(true);
    try {
      const randomQuestions = getRandomQuestions(questionCount);
      setPracticeQuestions(randomQuestions);
      setSelectedQuestionCount(questionCount);
      setCurrentQuestionIndex(0);
      setScore(0);
      setSkippedQuestions(new Set());
      setUserAnswer('');
      setIsCorrect(null);
      setShowMarkQuestionDialog(false);
      setShowSkipDialog(false);
      
      // Cargar datos guardados
      try {
        const incorrectData = await AsyncStorage.getItem(STORAGE_KEYS.INCORRECT_QUESTIONS);
        const markedData = await AsyncStorage.getItem(STORAGE_KEYS.MARKED_QUESTIONS);
        
        if (incorrectData) {
          setIncorrectQuestions(new Set(JSON.parse(incorrectData)));
        }
        if (markedData) {
          setMarkedQuestions(new Set(JSON.parse(markedData)));
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulación de carga
    } catch (error) {
      console.error('Error starting practice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Volver atrás"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Práctica Aleatoria</Text>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Ir al inicio"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="home" size={24} color={colors.text.dark} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View 
        style={[
          styles.content, 
          { opacity: fadeAnim }
        ]}
      >
        {selectedQuestionCount === null ? (
          // Pantalla de selección de práctica
          <View style={styles.selectionContainer}>
            <View style={styles.selectionHeader}>
              <MaterialCommunityIcons name="dice-multiple" size={48} color={colors.primary.main} />
              <Text style={styles.selectionTitle}>Ejercicio de Examen</Text>
              <Text style={styles.selectionSubtitle}>
                Práctica con preguntas aleatorias distribuidas por categorías
              </Text>
            </View>

            {practiceOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.practiceOptionCard}
                onPress={() => startPractice(option.questions)}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={option.gradient as [string, string]}
                  style={styles.practiceOptionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.practiceOptionContent}>
                    <View style={styles.practiceOptionInfo}>
                      <Text style={styles.practiceOptionTitle}>{option.title}</Text>
                      <Text style={styles.practiceOptionDescription}>{option.description}</Text>
                      <View style={styles.practiceOptionDetails}>
                        <View style={styles.detailItem}>
                          <MaterialCommunityIcons name="format-list-numbered" size={16} color="rgba(255,255,255,0.9)" />
                          <Text style={styles.detailText}>{option.questions} preguntas</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <MaterialCommunityIcons name="clock-outline" size={16} color="rgba(255,255,255,0.9)" />
                          <Text style={styles.detailText}>{option.time}</Text>
                        </View>
                      </View>
                    </View>
                    <MaterialCommunityIcons name="play-circle" size={32} color="white" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          // Área de práctica
          <KeyboardAvoidingView 
            style={styles.practiceContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView 
              style={styles.practiceScroll} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContentContainer}
            >
                             {/* Header de la práctica */}
               <View style={styles.practiceHeader}>
                 {/* Título centrado */}
                 <Text style={styles.practiceTitle}>
                   Ejercicio de Examen
                 </Text>
                 
                 {/* Estadísticas centradas */}
                 <View style={styles.practiceStats}>
                   <View style={styles.statItem}>
                     <MaterialCommunityIcons name="format-list-numbered" size={16} color={colors.primary.main} />
                     <Text style={styles.statText}>
                       Pregunta {currentQuestionIndex + 1} de {practiceQuestions.length}
                     </Text>
                   </View>
                   <View style={styles.statItem}>
                     <MaterialCommunityIcons name="trophy" size={16} color={colors.primary.main} />
                     <Text style={styles.statText}>
                       Puntuación: {score}/{practiceQuestions.length - skippedQuestions.size}
                     </Text>
                   </View>
                 </View>
                 
                 {/* Categoría centrada */}
                 {currentQuestion && (
                   <View style={styles.categoryBadge}>
                     <MaterialCommunityIcons 
                       name={currentQuestion.category === 'government' ? 'bank' : 
                             currentQuestion.category === 'history' ? 'book-open-page-variant' : 'school'} 
                       size={16} 
                       color="white" 
                     />
                     <Text style={styles.categoryText}>
                       {currentQuestion.category === 'government' ? 'Gobierno Americano' : 
                        currentQuestion.category === 'history' ? 'Historia Americana' : 'Educación Cívica'}
                     </Text>
                   </View>
                 )}
               </View>

              {/* Tipo de pregunta */}
              {currentQuestion && (
                <View style={styles.questionTypeContainer}>
                  <MaterialCommunityIcons 
                    name={currentQuestion.mode.includes('voice') ? 'microphone' : 'text'} 
                    size={20} 
                    color={colors.primary.main} 
                  />
                  <Text style={styles.questionTypeText}>
                    {getQuestionModeText(currentQuestion.mode)}
                  </Text>
                </View>
              )}

              {/* Pregunta */}
              {currentQuestion && currentQuestion.mode !== 'voice-text' && (
                <View style={styles.questionCard}>
                  <Text style={styles.questionLabel}>Pregunta</Text>
                  <Text style={styles.questionText}>{currentQuestion.question}</Text>
                </View>
              )}
              
              {/* Audio para preguntas de voz */}
              {currentQuestion && currentQuestion.mode === 'voice-text' && (
                <View style={styles.audioCard}>
                  <TouchableOpacity 
                    style={[styles.audioButton, isPlayingAudio && styles.audioButtonPlaying]}
                    onPress={handlePlayAudioQuestion}
                    disabled={isPlayingAudio}
                  >
                    <MaterialCommunityIcons 
                      name={isPlayingAudio ? 'pause-circle' : 'play-circle'} 
                      size={32} 
                      color={colors.primary.main} 
                    />
                    <Text style={styles.audioButtonText}>
                      {isPlayingAudio ? 'Reproduciendo...' : 'Reproducir Pregunta'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.audioInstruction}>
                    Escucha la pregunta y escribe tu respuesta
                  </Text>
                </View>
              )}

              {/* Área de respuesta */}
              <View style={styles.answerCard}>
                <Text style={styles.answerLabel}>Tu Respuesta</Text>
                <TextInput
                  style={styles.answerInput}
                  value={userAnswer}
                  onChangeText={setUserAnswer}
                  placeholder="Escribe tu respuesta aquí..."
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Botones de acción */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity 
                  style={styles.skipButton}
                  onPress={() => setShowSkipDialog(true)}
                >
                  <MaterialCommunityIcons name="skip-next" size={20} color={colors.text.light} />
                  <Text style={styles.skipButtonText}>Saltar</Text>
                </TouchableOpacity>
                
                {userAnswer.trim() && (
                  <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={handleAnswerSubmit}
                  >
                    <Text style={styles.confirmButtonText}>Confirmar</Text>
                    <MaterialCommunityIcons name="check" size={20} color="white" />
                  </TouchableOpacity>
                )}
              </View>

                             {/* Resultado flotante */}
               {isCorrect !== null && (
                 <View style={styles.resultOverlay}>
                   <View style={styles.resultCard}>
                     <LinearGradient
                       colors={getFeedbackColor()}
                       style={styles.resultGradient}
                     >
                       <MaterialCommunityIcons 
                         name={isCorrect ? 'check-circle' : 'close-circle'} 
                         size={48} 
                         color="white" 
                       />
                       <Text style={styles.resultText}>
                         {isCorrect ? '¡Correcto!' : 'Incorrecto'}
                       </Text>
                       <Text style={styles.correctAnswerText}>
                         Respuesta correcta: {currentQuestion?.answer}
                       </Text>
                     </LinearGradient>
                     
                     <View style={styles.resultActions}>
                       <TouchableOpacity 
                         style={styles.repeatButton}
                         onPress={handleRepeatQuestion}
                       >
                         <MaterialCommunityIcons name="replay" size={20} color={colors.primary.main} />
                         <Text style={styles.repeatButtonText}>Repetir</Text>
                       </TouchableOpacity>
                       
                       <TouchableOpacity 
                         style={styles.nextButton}
                         onPress={handleNextQuestion}
                       >
                         <Text style={styles.nextButtonText}>Siguiente</Text>
                         <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                       </TouchableOpacity>
                     </View>
                   </View>
                 </View>
               )}

              {/* Diálogos */}
              {showMarkQuestionDialog && (
                <View style={styles.dialogOverlay}>
                  <View style={styles.dialogCard}>
                    <MaterialCommunityIcons 
                      name="bookmark-outline" 
                      size={48} 
                      color={colors.primary.main} 
                    />
                    <Text style={styles.dialogTitle}>
                      ¿Marcar pregunta?
                    </Text>
                    <Text style={styles.dialogText}>
                      Puedes marcarla para repasarla más tarde
                    </Text>
                    
                    <View style={styles.dialogButtons}>
                      <TouchableOpacity 
                        style={styles.dialogButtonSecondary}
                        onPress={() => setShowMarkQuestionDialog(false)}
                      >
                        <Text style={styles.dialogButtonTextSecondary}>No, gracias</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.dialogButtonPrimary}
                        onPress={toggleMarkedQuestion}
                      >
                        <Text style={styles.dialogButtonTextPrimary}>
                          {markedQuestions.has(currentQuestion?.id || 0) ? 'Desmarcar' : 'Marcar'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {showSkipDialog && (
                <View style={styles.dialogOverlay}>
                  <View style={styles.dialogCard}>
                    <MaterialCommunityIcons 
                      name="skip-next" 
                      size={48} 
                      color={colors.primary.main} 
                    />
                    <Text style={styles.dialogTitle}>
                      ¿Saltar pregunta?
                    </Text>
                    <Text style={styles.dialogText}>
                      No se contará en tu puntuación final
                    </Text>
                    
                    <View style={styles.dialogButtons}>
                      <TouchableOpacity 
                        style={styles.dialogButtonSecondary}
                        onPress={() => setShowSkipDialog(false)}
                      >
                        <Text style={styles.dialogButtonTextSecondary}>Cancelar</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.dialogButtonPrimary}
                        onPress={handleSkipQuestion}
                      >
                        <Text style={styles.dialogButtonTextPrimary}>Saltar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.bottomSpacer} />
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </Animated.View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Preparando preguntas...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Estilos base
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#F5F5F5',
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  content: {
    flex: 1,
    padding: 16,
  },

  // Estilos para pantalla de selección
  selectionContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  selectionHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  selectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.dark,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  selectionSubtitle: {
    fontSize: 16,
    color: colors.text.light,
    textAlign: 'center',
    lineHeight: 22,
  },
  practiceOptionCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  practiceOptionGradient: {
    padding: 24,
  },
  practiceOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  practiceOptionInfo: {
    flex: 1,
  },
  practiceOptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  practiceOptionDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
    lineHeight: 20,
  },
  practiceOptionDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 4,
  },

  // Estilos para área de práctica
  practiceContainer: {
    flex: 1,
  },
  practiceScroll: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  practiceHeader: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  practiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.dark,
    textAlign: 'center',
    marginBottom: 16,
  },
  practiceStats: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary.main,
    marginLeft: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },

  // Estilos para tipo de pregunta
  questionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 136, 229, 0.08)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 136, 229, 0.15)',
  },
  questionTypeText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.dark,
    fontWeight: '600',
  },

  // Estilos para pregunta
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.light,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 16,
    color: colors.text.dark,
    lineHeight: 22,
    fontWeight: '500',
  },

  // Estilos para audio
  audioCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 12,
  },
  audioButtonPlaying: {
    backgroundColor: 'rgba(30, 136, 229, 0.2)',
  },
  audioButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.primary.main,
    fontWeight: '600',
  },
  audioInstruction: {
    fontSize: 12,
    color: colors.text.light,
    textAlign: 'center',
  },

  // Estilos para respuesta
  answerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.light,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text.dark,
    minHeight: 80,
  },

  // Estilos para botones de acción
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    flex: 1,
    justifyContent: 'center',
  },
  skipButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.text.light,
    fontWeight: '600',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 6,
  },

  // Estilos para resultado flotante
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: '90%',
  },
  resultGradient: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  resultText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  correctAnswerText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.9,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  repeatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  repeatButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.primary.main,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
  },

  // Estilos para diálogos
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialogCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.dark,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogText: {
    fontSize: 14,
    color: colors.text.light,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  dialogButtonSecondary: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  dialogButtonTextSecondary: {
    color: colors.text.light,
    fontSize: 14,
    fontWeight: '600',
  },
  dialogButtonPrimary: {
    backgroundColor: colors.primary.main,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  dialogButtonTextPrimary: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Estilos para loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.dark,
  },

  // Espaciador
  bottomSpacer: {
    height: 100,
  },
});

export default RandomPracticeScreen;
