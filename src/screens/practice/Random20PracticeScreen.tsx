// src/screens/practice/Random20PracticeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { NavigationProps } from '../../types/navigation';
import {
  getRandomQuestionsByCategory,
  PracticeQuestion,
  detectRequiredQuantity,
} from '../../data/practiceQuestions';
import { questionAudioMap } from '../../assets/audio/questions/questionsMap';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';

type QuestionMode = 'text-text' | 'voice-text';

interface LocalPracticeQuestion extends PracticeQuestion {
  mode: QuestionMode;
}

const STORAGE_KEYS = {
  INCORRECT_QUESTIONS: '@practice:random20_incorrect',
  MARKED_QUESTIONS: '@practice:random20_marked',
};

const Random20PracticeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const [questions, setQuestions] = useState<LocalPracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [incorrectQuestions, setIncorrectQuestions] = useState<Set<number>>(new Set());
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [fadeAnim] = useState(new Animated.Value(0));

  const { 
    isRecording, 
    isSupported: voiceSupported,
    startRecording, 
    stopRecording 
  } = useVoiceRecognition({
    onSpeechResult: (text) => {
      setUserAnswer(text);
    },
    onError: (error) => {
      Alert.alert('Error de Voz', error);
    },
  });

  useEffect(() => {
    loadInitialQuestions();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (started && questions.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [started, questions]);

  const loadInitialQuestions = () => {
    // Obtener 20 preguntas distribuidas: 7 gobierno, 7 historia, 6 símbolos
    const govQuestions = getRandomQuestionsByCategory('government', 7);
    const histQuestions = getRandomQuestionsByCategory('history', 7);
    const symQuestions = getRandomQuestionsByCategory('symbols_holidays', 6);
    
    const allQuestions = [...govQuestions, ...histQuestions, ...symQuestions]
      .map(q => ({
        ...q,
        mode: Math.random() < 0.5 ? 'text-text' : 'voice-text' as QuestionMode,
      }))
      .sort(() => Math.random() - 0.5) as LocalPracticeQuestion[];

    setQuestions(allQuestions);
  };

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

  const isAnswerCorrect = (userAnswer: string, correctAnswer: string): boolean => {
    const cleanUserAnswer = cleanText(userAnswer);
    const cleanCorrectAnswer = cleanText(correctAnswer);
    
    const correctOptions = cleanCorrectAnswer
      .split(/[,•\n]/)
      .map(opt => cleanText(opt))
      .filter(opt => opt.length > 0);
    
    return correctOptions.some(option => 
      cleanUserAnswer === option || 
      cleanUserAnswer.includes(option) ||
      option.includes(cleanUserAnswer)
    );
  };

  const handleStart = () => {
    setStarted(true);
    setCurrentIndex(0);
    setScore(0);
    setUserAnswer('');
    setIsCorrect(null);
  };

  const handleAnswerSubmit = async () => {
    if (!questions[currentIndex] || !userAnswer.trim()) return;

    const correct = isAnswerCorrect(userAnswer, questions[currentIndex].answer);
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
    } else {
      const newIncorrect = new Set(incorrectQuestions);
      newIncorrect.add(questions[currentIndex].id);
      setIncorrectQuestions(newIncorrect);
      
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.INCORRECT_QUESTIONS,
          JSON.stringify([...newIncorrect])
        );
      } catch (error) {
        console.error('Error saving incorrect question:', error);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setIsCorrect(null);
    } else {
      // Práctica completada
      setCompleted(true);
      Alert.alert(
        '¡Práctica Completada!',
        `Puntuación: ${score}/${questions.length}\n${score >= 12 ? '¡Aprobado! (60% o más)' : 'Intenta de nuevo'}`,
        [
          { text: 'Ver Resultados', onPress: () => navigation.navigate('Home') },
          { text: 'Intentar de Nuevo', onPress: () => handleStart() }
        ]
      );
    }
  };

  const handlePlayAudio = async () => {
    const current = questions[currentIndex];
    if (!current || current.mode !== 'voice-text') return;

    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      const audioFile = questionAudioMap[current.id];
      if (audioFile) {
        const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
        setSound(newSound);
        await newSound.playAsync();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'No se pudo reproducir el audio');
    }
  };

  const currentQuestion = questions[currentIndex];

  if (!started) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Práctica de 20 Preguntas</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.introContainer}>
          <MaterialCommunityIcons name="play-circle" size={80} color={colors.primary.main} />
          <Text style={styles.introTitle}>Simula el Examen Real</Text>
          <Text style={styles.introDescription}>
            20 preguntas aleatorias distribuidas por categorías
          </Text>
          <Text style={styles.introRules}>
            • 7 preguntas de Gobierno Americano{'\n'}
            • 7 preguntas de Historia Americana{'\n'}
            • 6 preguntas de Símbolos y Feriados{'\n'}
            {'\n'}Pasa con 12 respuestas correctas (60%)
          </Text>

          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <LinearGradient
              colors={['#270483', '#8146cc']}
              style={styles.startButtonGradient}
            >
              <Text style={styles.startButtonText}>Comenzar Práctica</Text>
              <MaterialCommunityIcons name="play" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (completed) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resultados</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.completedContainer}>
          <MaterialCommunityIcons name="check-circle" size={80} color="#4CAF50" />
          <Text style={styles.completedTitle}>Práctica Completada</Text>
          <Text style={styles.completedScore}>
            {score}/{questions.length}
          </Text>
          <Text style={styles.completedPercentage}>
            {Math.round((score / questions.length) * 100)}%
          </Text>
          <Text style={styles.completedStatus}>
            {score >= 12 ? '¡Aprobado! 🎉' : 'Intenta de nuevo'}
          </Text>
          
          <View style={styles.completedButtons}>
            <TouchableOpacity 
              style={styles.completedButton} 
              onPress={() => navigation.navigate('Home')}
            >
              <MaterialCommunityIcons name="home" size={20} color="white" />
              <Text style={styles.completedButtonText}>Ir al Inicio</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.completedButton, styles.retryButton]} 
              onPress={() => {
                setCompleted(false);
                handleStart();
              }}
            >
              <MaterialCommunityIcons name="reload" size={20} color={colors.primary.main} />
              <Text style={[styles.completedButtonText, { color: colors.primary.main }]}>
                Intentar de Nuevo
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            Alert.alert(
              'Salir de la práctica',
              '¿Estás seguro de que quieres salir? Se perderá tu progreso.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Salir', style: 'destructive', onPress: () => navigation.goBack() }
              ]
            );
          }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Pregunta {currentIndex + 1} de {questions.length}
            </Text>
            <Text style={styles.scoreText}>Puntuación: {score}/{currentIndex + 1}</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
            <View style={styles.questionModeBadge}>
              <MaterialCommunityIcons
                name={currentQuestion.mode === 'voice-text' ? 'microphone' : 'text'}
                size={16}
                color={colors.primary.main}
              />
              <Text style={styles.questionModeText}>
                {currentQuestion.mode === 'voice-text' ? 'Pregunta de Voz' : 'Pregunta de Texto'}
              </Text>
            </View>

            {currentQuestion.mode === 'voice-text' ? (
              <View style={styles.audioContainer}>
                <TouchableOpacity style={styles.audioButton} onPress={handlePlayAudio}>
                  <MaterialCommunityIcons name="play-circle" size={32} color={colors.primary.main} />
                  <Text style={styles.audioButtonText}>Reproducir Pregunta</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.questionText}>{currentQuestion.question}</Text>
            )}

            <View style={styles.answerContainer}>
              <Text style={styles.answerLabel}>Tu Respuesta:</Text>
              <TextInput
                style={styles.answerInput}
                value={userAnswer}
                onChangeText={setUserAnswer}
                placeholder="Escribe tu respuesta..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {userAnswer.trim() && (
              <TouchableOpacity style={styles.submitButton} onPress={handleAnswerSubmit}>
                <Text style={styles.submitButtonText}>Confirmar Respuesta</Text>
              </TouchableOpacity>
            )}

            {isCorrect !== null && (
              <View style={styles.resultContainer}>
                <LinearGradient
                  colors={isCorrect ? ['#4CAF50', '#388E3C'] : ['#F44336', '#D32F2F']}
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

                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <Text style={styles.nextButtonText}>
                    {currentIndex < questions.length - 1 ? 'Siguiente' : 'Finalizar'}
                  </Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.dark,
  },
  scoreText: {
    fontSize: 14,
    color: colors.text.light,
    fontWeight: '600',
    marginTop: 4,
  },
  introContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.dark,
    marginTop: 20,
    marginBottom: 12,
  },
  introDescription: {
    fontSize: 16,
    color: colors.text.light,
    textAlign: 'center',
    marginBottom: 24,
  },
  introRules: {
    fontSize: 14,
    color: colors.text.light,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  startButton: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  questionModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  questionModeText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.main,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.dark,
    marginBottom: 20,
    lineHeight: 26,
  },
  audioContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  audioButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
  },
  answerContainer: {
    marginTop: 20,
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.dark,
    marginBottom: 12,
  },
  answerInput: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    color: colors.text.dark,
  },
  submitButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 20,
  },
  resultGradient: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  resultText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  correctAnswerText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.dark,
    marginTop: 20,
    marginBottom: 12,
  },
  completedScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary.main,
    marginBottom: 8,
  },
  completedPercentage: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.text.light,
    marginBottom: 12,
  },
  completedStatus: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.dark,
    marginBottom: 32,
  },
  completedButtons: {
    width: '100%',
    maxWidth: 300,
    marginTop: 24,
  },
  completedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: colors.primary.main,
  },
  completedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default Random20PracticeScreen;

