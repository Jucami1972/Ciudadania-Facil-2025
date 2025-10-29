// src/screens/practice/CategoryPracticeScreen.tsx
import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
  const [isAnswerInputFocused, setIsAnswerInputFocused] = useState(false);

  // Función para obtener TODAS las preguntas disponibles por categoría de forma aleatoria
  const getAllQuestionsByCategory = (categoryId: string): LocalPracticeQuestion[] => {
    console.log('🔍 getAllQuestionsByCategory llamado con categoryId:', categoryId);
    
    const categoryQuestions = getQuestionsByCategory(categoryId as 'government' | 'history' | 'symbols_holidays');
    console.log('📚 Preguntas obtenidas de getQuestionsByCategory:', categoryQuestions.length);
    
    // Agregar modo aleatorio a cada pregunta
    const questionsWithMode = categoryQuestions.map(q => ({
      ...q,
      mode: Math.random() < 0.5 ? 'text-text' : 'voice-text' as QuestionMode
    }));
    
    console.log('🎲 Preguntas con modo asignado:', questionsWithMode.length);
    
    // Ordenar aleatoriamente
    const shuffledQuestions = questionsWithMode.sort(() => Math.random() - 0.5);
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

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setQuestionIndex(0);
    setScore(0);
    setUserAnswer('');
    setIsCorrect(null);
    
    // Obtener TODAS las preguntas disponibles por categoría de forma aleatoria
    const categoryQuestions = getAllQuestionsByCategory(categoryId);
    if (categoryQuestions.length > 0) {
      setTotalQuestions(categoryQuestions.length);
      setCurrentQuestion(categoryQuestions[0]);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
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
    
    if (!selectedCategory) {
      console.log('❌ No hay categoría seleccionada');
      return;
    }
    
    const categoryQuestions = getAllQuestionsByCategory(selectedCategory);
    console.log('Preguntas de la categoría:', categoryQuestions.length);
    
    const nextIndex = questionIndex + 1;
    console.log('Siguiente índice:', nextIndex);
    
    if (nextIndex < categoryQuestions.length) {
      console.log('✅ Avanzando a la siguiente pregunta');
      console.log('Nueva pregunta:', categoryQuestions[nextIndex]);
      
      setQuestionIndex(nextIndex);
      setCurrentQuestion(categoryQuestions[nextIndex]);
      setUserAnswer('');
      setIsCorrect(null);
      
      console.log('✅ Estado actualizado - Nueva pregunta cargada');
    } else {
      console.log('🏁 Práctica completada');
      // Practice completed
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
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Práctica por Categoría</Text>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => navigation.navigate('Home')}
            accessibilityLabel="Ir al inicio"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="home" size={24} color={colors.text.dark} />
          </TouchableOpacity>
        </View>
      </View>

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

             {/* ÁREA DE PRÁCTICA - CON CUADRO DE ESCRITURA FLOTANTE */}
       {selectedCategory && currentQuestion && (
         <View style={styles.practiceArea}>
           <Animated.View style={[styles.practiceContent, { opacity: fadeAnim }]}>
             <ScrollView 
               style={styles.practiceScroll} 
               showsVerticalScrollIndicator={false}
               keyboardShouldPersistTaps="always"
               contentContainerStyle={styles.scrollContentContainer}
               automaticallyAdjustKeyboardInsets={false}
               keyboardDismissMode="none"
               showsHorizontalScrollIndicator={false}
             >
              {/* Información de la práctica */}
              <View style={styles.practiceInfo}>
                <Text style={styles.practiceTitle} numberOfLines={1} adjustsFontSizeToFit>
                  Práctica: {categories.find(c => c.id === selectedCategory)?.title}
                </Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressItem}>
                    <Text style={styles.progressLabel}>Pregunta</Text>
                    <Text style={styles.progressValue}>{questionIndex + 1} de {totalQuestions}</Text>
                  </View>
                  <View style={styles.progressItem}>
                    <Text style={styles.progressLabel}>Puntuación</Text>
                    <Text style={styles.progressValue}>{score}/{totalQuestions}</Text>
                  </View>
                </View>
              </View>

              {/* Tipo de pregunta */}
              <View style={styles.questionModeContainer}>
                <MaterialCommunityIcons 
                  name={currentQuestion.mode?.includes('voice') ? 'microphone' : 'text'} 
                  size={20} 
                  color={colors.primary.main} 
                />
                <Text style={styles.questionModeText}>{getQuestionModeText(currentQuestion.mode || 'text-text')}</Text>
              </View>

              {/* Estado del reconocimiento de voz - Solo para voice-text */}
              {currentQuestion.mode === 'voice-text' && (
                <View style={styles.voiceStatusContainer}>
                  <MaterialCommunityIcons 
                    name={voiceSupported ? 'check-circle' : 'alert-circle'} 
                    size={16} 
                    color={voiceSupported ? '#4CAF50' : '#F44336'} 
                  />
                  <Text style={[styles.voiceStatusText, { color: voiceSupported ? '#4CAF50' : '#F44336' }]}>
                    {voiceSupported ? 'Reconocimiento de voz disponible' : 'Reconocimiento de voz no disponible'}
                  </Text>
                  {voiceError && (
                    <Text style={styles.voiceErrorText}>Error: {voiceError}</Text>
                  )}
                </View>
              )}

              {/* Pregunta - SOLO MOSTRAR SI NO ES DE AUDIO (voice-text) */}
              {currentQuestion.mode !== 'voice-text' && (
                <View style={styles.questionContainer}>
                  <Text style={styles.questionLabel}>Pregunta:</Text>
                  <Text style={styles.questionText}>{currentQuestion.question}</Text>
                </View>
              )}
              
              {/* Botón para reproducir audio si es pregunta de voz */}
              {currentQuestion.mode === 'voice-text' && (
                <View style={styles.audioContainer}>
                  <TouchableOpacity 
                    style={styles.audioButton}
                    onPress={handlePlayAudioQuestion}
                  >
                    <MaterialCommunityIcons name="play-circle" size={24} color={colors.primary.main} />
                    <Text style={styles.audioButtonText}>Reproducir Pregunta</Text>
                  </TouchableOpacity>
                  
                  {/* Instrucción para voice-text */}
                  <Text style={styles.voiceInstruction}>
                    Escucha la pregunta y escribe tu respuesta
                  </Text>
                </View>
              )}

                             {/* Área de respuesta - MEJORADA */}
               <View style={[
                 styles.answerContainer,
                 isAnswerInputFocused && styles.answerContainerFocused
               ]}>
                 <Text style={styles.answerLabel}>Tu Respuesta:</Text>
                 
                 {/* Input de texto para respuestas de texto */}
                 <TextInput
                   style={[
                     styles.answerInput,
                     isAnswerInputFocused && styles.answerInputFocused
                   ]}
                   value={userAnswer}
                   onChangeText={setUserAnswer}
                   placeholder="Escribe tu respuesta aquí..."
                   placeholderTextColor="rgba(0, 0, 0, 0.4)"
                   multiline
                   numberOfLines={4}
                   textAlignVertical="top"
                   autoCapitalize="sentences"
                   autoCorrect={true}
                   returnKeyType="done"
                   blurOnSubmit={false}
                   onFocus={() => setIsAnswerInputFocused(true)}
                   onBlur={() => setIsAnswerInputFocused(false)}
                 />
                 
                 {/* Indicador visual de que el input está activo */}
                 {isAnswerInputFocused && (
                   <View style={styles.inputActiveIndicator}>
                     <MaterialCommunityIcons 
                       name="pencil" 
                       size={16} 
                       color={colors.primary.main} 
                     />
                     <Text style={styles.inputActiveText}>Escribiendo...</Text>
                   </View>
                 )}
               </View>

              {/* Botón de confirmar respuesta */}
              {userAnswer.trim() && (
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={handleAnswerSubmit}
                >
                  <Text style={styles.confirmButtonText}>Confirmar Respuesta</Text>
                </TouchableOpacity>
              )}

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
                        Respuesta correcta: {currentQuestion.answer}
                      </Text>
                    </LinearGradient>
                    
                    {/* Botones de acción */}
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
                        onPress={() => {
                          console.log('🔘 Botón Siguiente presionado');
                          handleNextQuestion();
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.nextButtonText}>Siguiente</Text>
                        <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Diálogo para marcar pregunta incorrecta */}
              {showMarkQuestionDialog && (
                <View style={styles.markQuestionDialog}>
                  <LinearGradient
                    colors={['#FF9800', '#F57C00']}
                    style={styles.markQuestionGradient}
                  >
                    <MaterialCommunityIcons 
                      name="bookmark-outline" 
                      size={48} 
                      color="white" 
                    />
                    <Text style={styles.markQuestionTitle}>
                      ¿Quieres marcar esta pregunta?
                    </Text>
                    <Text style={styles.markQuestionText}>
                      Puedes marcarla para repasarla más tarde en "Preguntas Marcadas"
                    </Text>
                    
                    <View style={styles.markQuestionButtons}>
                      <TouchableOpacity 
                        style={styles.markQuestionNoButton}
                        onPress={() => setShowMarkQuestionDialog(false)}
                      >
                        <Text style={styles.markQuestionNoText}>No, gracias</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.markQuestionYesButton}
                        onPress={toggleMarkedQuestion}
                      >
                        <MaterialCommunityIcons name="bookmark-outline" size={20} color="white" />
                        <Text style={styles.markQuestionYesText}>
                          {markedQuestions.has(currentQuestion?.id || 0) ? 'Desmarcar' : 'Marcar'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.viewIncorrectButton}
                      onPress={navigateToIncorrectQuestions}
                    >
                      <MaterialCommunityIcons name="alert-circle" size={20} color="white" />
                      <Text style={styles.viewIncorrectText}>Ver Preguntas Incorrectas</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              )}
              
                             {/* Espacio extra para evitar que el teclado tape contenido */}
               <View style={styles.bottomSpacer} />
             </ScrollView>
           </Animated.View>
           
           {/* CUADRO DE ESCRITURA FLOTANTE - SIEMPRE VISIBLE */}
           <View style={styles.floatingAnswerContainer}>
             <View style={[
               styles.answerContainer,
               isAnswerInputFocused && styles.answerContainerFocused
             ]}>
               <Text style={styles.answerLabel}>Tu Respuesta:</Text>
               
               <TextInput
                 style={[
                   styles.answerInput,
                   isAnswerInputFocused && styles.answerInputFocused
                 ]}
                 value={userAnswer}
                 onChangeText={setUserAnswer}
                 placeholder="Escribe tu respuesta aquí..."
                 placeholderTextColor="rgba(0, 0, 0, 0.4)"
                 multiline
                 numberOfLines={3}
                 textAlignVertical="top"
                 autoCapitalize="sentences"
                 autoCorrect={true}
                 returnKeyType="done"
                 blurOnSubmit={false}
                 onFocus={() => setIsAnswerInputFocused(true)}
                 onBlur={() => setIsAnswerInputFocused(false)}
               />
               
               {/* Indicador visual de que el input está activo */}
               {isAnswerInputFocused && (
                 <View style={styles.inputActiveIndicator}>
                   <MaterialCommunityIcons 
                     name="pencil" 
                     size={16} 
                     color={colors.primary.main} 
                   />
                   <Text style={styles.inputActiveText}>Escribiendo...</Text>
                 </View>
               )}
             </View>
             
             {/* Botón de confirmar respuesta */}
             {userAnswer.trim() && (
               <TouchableOpacity 
                 style={styles.confirmButton}
                 onPress={handleAnswerSubmit}
               >
                 <Text style={styles.confirmButtonText}>Confirmar Respuesta</Text>
               </TouchableOpacity>
             )}
           </View>
         </View>
       )}

      {/* Mensaje cuando no hay categoría seleccionada */}
      {!selectedCategory && (
        <View style={styles.noSelectionContainer}>
          <MaterialCommunityIcons name="help-circle-outline" size={64} color="#ccc" />
          <Text style={styles.noSelectionText}>Selecciona una categoría para comenzar la práctica</Text>
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
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
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
  practiceInfo: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  practiceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.dark,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressLabel: {
    fontSize: 12,
    color: colors.text.light,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 16,
    color: colors.text.dark,
    fontWeight: '700',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    textAlign: 'center',
  },
  questionModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 136, 229, 0.08)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(30, 136, 229, 0.15)',
  },
  questionModeText: {
    marginLeft: 12,
    fontSize: 14,
    color: colors.text.dark,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  questionContainer: {
    marginBottom: 16,
    backgroundColor: '#fafbfc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.dark,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 16,
    color: colors.text.dark,
    lineHeight: 22,
    marginBottom: 16,
    fontWeight: '500',
  },
  audioContainer: {
    marginBottom: 16,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.light,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  audioButtonText: {
    marginLeft: 12,
    color: colors.primary.main,
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  voiceInstruction: {
    fontSize: 14,
    color: colors.text.light,
    textAlign: 'center',
    fontStyle: 'italic',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  answerContainer: {
    marginBottom: 12, // Reducido para el cuadro flotante
    backgroundColor: '#ffffff',
    padding: 12, // Reducido para el cuadro flotante
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(30, 136, 229, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.dark,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerInput: {
    borderWidth: 2,
    borderColor: 'rgba(30, 136, 229, 0.4)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 60, // Más compacto para el cuadro flotante
    textAlignVertical: 'top',
    backgroundColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    color: '#000000',
    fontWeight: '500',
  },
  answerInputFocused: {
    borderColor: 'rgba(30, 136, 229, 0.8)',
    backgroundColor: '#ffffff',
    shadowColor: '#1e88e5',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  answerContainerFocused: {
    borderColor: 'rgba(30, 136, 229, 0.6)',
    backgroundColor: '#f0f8ff',
    shadowColor: '#1e88e5',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  inputActiveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8, // Reducido para el cuadro flotante
    paddingHorizontal: 10, // Reducido para el cuadro flotante
    paddingVertical: 4, // Reducido para el cuadro flotante
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    borderRadius: 10, // Reducido para el cuadro flotante
    alignSelf: 'flex-start',
  },
  inputActiveText: {
    marginLeft: 6,
    fontSize: 11, // Reducido para el cuadro flotante
    color: colors.primary.main,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    padding: 18,
    borderRadius: 16,
    justifyContent: 'center',
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  voiceButtonRecording: {
    backgroundColor: '#f44336',
    shadowColor: '#f44336',
  },
  voiceButtonText: {
    marginLeft: 12,
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  voiceAnswerDisplay: {
    backgroundColor: 'rgba(30, 136, 229, 0.08)',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary.main,
    borderWidth: 1,
    borderColor: 'rgba(30, 136, 229, 0.15)',
  },
  voiceAnswerLabel: {
    fontSize: 12,
    color: colors.text.light,
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  voiceAnswerText: {
    fontSize: 16,
    color: colors.text.dark,
    fontWeight: '600',
    lineHeight: 22,
  },
  confirmButton: {
    backgroundColor: colors.primary.main,
    padding: 12, // Reducido para el cuadro flotante
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 0, // Sin margen inferior en el cuadro flotante
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 13, // Reducido para el cuadro flotante
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  // Estilos para resultado flotante - MEJORADO
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    maxWidth: '90%',
    minWidth: 300,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  resultGradient: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  resultText: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  correctAnswerText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
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
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary.main,
    flex: 1,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  repeatButtonText: {
    marginLeft: 8,
    color: colors.primary.main,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary.main,
    padding: 16,
    borderRadius: 16,
    flex: 1,
    justifyContent: 'center',
    shadowColor: colors.primary.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '700',
    marginRight: 8,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  noSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noSelectionText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
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
    height: 120, // Espacio para el cuadro flotante
    minHeight: 120,
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
