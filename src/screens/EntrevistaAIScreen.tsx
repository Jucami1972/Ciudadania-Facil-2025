// src/screens/EntrevistaAIScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { NavigationProps } from '../types/navigation';
import {
  getRandomQuestionsByCategory,
  PracticeQuestion,
} from '../data/practiceQuestions';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

interface InterviewState {
  questions: PracticeQuestion[];
  currentIndex: number;
  userAnswer: string;
  isCorrect: boolean | null;
  score: number;
  started: boolean;
  completed: boolean;
}

const EntrevistaAIScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const [state, setState] = useState<InterviewState>({
    questions: [],
    currentIndex: 0,
    userAnswer: '',
    isCorrect: null,
    score: 0,
    started: false,
    completed: false,
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const {
    isRecording,
    isSupported: voiceSupported,
    startRecording,
    stopRecording,
  } = useVoiceRecognition({
    onSpeechResult: (text) => {
      setState(prev => ({ ...prev, userAnswer: text }));
    },
    onError: (error) => {
      Alert.alert('Error de Voz', error);
    },
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (state.started && state.questions.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [state.started, state.questions]);

  const loadQuestions = () => {
    const govQuestions = getRandomQuestionsByCategory('government', 5);
    const histQuestions = getRandomQuestionsByCategory('history', 5);
    const symQuestions = getRandomQuestionsByCategory('symbols_holidays', 4);
    
    const allQuestions = [...govQuestions, ...histQuestions, ...symQuestions]
      .sort(() => Math.random() - 0.5);
    
    setState(prev => ({ ...prev, questions: allQuestions }));
  };

  const speakQuestion = async (questionText: string) => {
    try {
      setIsSpeaking(true);
      await Speech.speak(questionText, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.8,
        onDone: () => {
          setIsSpeaking(false);
        },
        onError: () => {
          setIsSpeaking(false);
        },
      });
    } catch (error) {
      console.error('Error speaking:', error);
      setIsSpeaking(false);
    }
  };

  const handleStart = () => {
    setState(prev => ({
      ...prev,
      started: true,
      currentIndex: 0,
      score: 0,
      userAnswer: '',
      isCorrect: null,
    }));
    
    // Hablar la primera pregunta
    setTimeout(() => {
      const firstQuestion = state.questions[0];
      if (firstQuestion) {
        speakQuestion(firstQuestion.question);
      }
    }, 500);
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

  const handleAnswerSubmit = () => {
    if (!state.questions[state.currentIndex] || !state.userAnswer.trim()) return;

    const correct = isAnswerCorrect(
      state.userAnswer,
      state.questions[state.currentIndex].answer
    );

    setState(prev => ({
      ...prev,
      isCorrect: correct,
      score: correct ? prev.score + 1 : prev.score,
    }));

    // Hablar feedback
    const feedback = correct ? 'Correct!' : 'Incorrect.';
    Speech.speak(feedback, { language: 'en-US', rate: 0.8 });
  };

  const handleNext = () => {
    if (state.currentIndex < state.questions.length - 1) {
      const nextIndex = state.currentIndex + 1;
      setState(prev => ({
        ...prev,
        currentIndex: nextIndex,
        userAnswer: '',
        isCorrect: null,
      }));
      
      // Hablar la siguiente pregunta
      setTimeout(() => {
        speakQuestion(state.questions[nextIndex].question);
      }, 300);
    } else {
      setState(prev => ({ ...prev, completed: true }));
      const percentage = Math.round((state.score / state.questions.length) * 100);
      Speech.speak(
        `Interview completed. Your score is ${state.score} out of ${state.questions.length}. That is ${percentage} percent.`,
        { language: 'en-US', rate: 0.8 }
      );
    }
  };

  const currentQuestion = state.questions[state.currentIndex];

  if (!state.started) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Entrevista AI</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.introContainer}>
          <MaterialCommunityIcons name="microphone-message" size={80} color={colors.primary.main} />
          <Text style={styles.introTitle}>Entrevista Simulada</Text>
          <Text style={styles.introDescription}>
            Practica con una entrevista de ciudadanía simulada usando reconocimiento de voz
          </Text>
          <Text style={styles.introRules}>
            • Las preguntas se leen en voz alta{'\n'}
            • Responde hablando o escribiendo{'\n'}
            • Recibe retroalimentación inmediata{'\n'}
            • {state.questions.length} preguntas aleatorias
          </Text>

          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <LinearGradient
              colors={['#06b6d4', '#0891b2']}
              style={styles.startButtonGradient}
            >
              <Text style={styles.startButtonText}>Comenzar Entrevista</Text>
              <MaterialCommunityIcons name="microphone" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (state.completed) {
    const percentage = Math.round((state.score / state.questions.length) * 100);
    return (
      <SafeAreaView style={styles.container}>
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
            <Text style={styles.headerTitle}>Entrevista Completada</Text>
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
        <View style={styles.completedContainer}>
          <MaterialCommunityIcons name="check-circle" size={80} color="#4CAF50" />
          <Text style={styles.completedTitle}>Entrevista Completada</Text>
          <Text style={styles.completedScore}>
            {state.score}/{state.questions.length}
          </Text>
          <Text style={styles.completedPercentage}>{percentage}%</Text>
          <TouchableOpacity
            style={styles.restartButton}
            onPress={() => {
              loadQuestions();
              setState({
                questions: [],
                currentIndex: 0,
                userAnswer: '',
                isCorrect: null,
                score: 0,
                started: false,
                completed: false,
              });
            }}
          >
            <Text style={styles.restartButtonText}>Intentar de Nuevo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => {
              Alert.alert(
                'Salir de la entrevista',
                '¿Estás seguro de que deseas salir? Tu progreso no se guardará.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Salir',
                    style: 'destructive',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            }}
            accessibilityLabel="Volver atrás"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Pregunta {state.currentIndex + 1} de {state.questions.length}
            </Text>
            <Text style={styles.scoreText}>Puntuación: {state.score}/{state.currentIndex + 1}</Text>
          </View>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => {
              Alert.alert(
                'Ir al inicio',
                '¿Estás seguro de que deseas ir al inicio? Tu progreso no se guardará.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Ir al inicio',
                    style: 'destructive',
                    onPress: () => navigation.navigate('Home'),
                  },
                ]
              );
            }}
            accessibilityLabel="Ir al inicio"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="home" size={24} color={colors.text.dark} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
          <View style={styles.questionCard}>
            <TouchableOpacity
              style={styles.speakButton}
              onPress={() => speakQuestion(currentQuestion.question)}
              disabled={isSpeaking}
            >
              <MaterialCommunityIcons
                name={isSpeaking ? 'volume-high' : 'volume-high'}
                size={32}
                color={colors.primary.main}
              />
              <Text style={styles.speakButtonText}>
                {isSpeaking ? 'Reproduciendo...' : 'Reproducir Pregunta'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>

          <View style={styles.answerContainer}>
            <Text style={styles.answerLabel}>Tu Respuesta:</Text>
            
            {voiceSupported && (
              <TouchableOpacity
                style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]}
                onPress={() => {
                  if (isRecording) {
                    stopRecording();
                  } else {
                    startRecording();
                  }
                }}
              >
                <MaterialCommunityIcons
                  name={isRecording ? 'microphone' : 'microphone-outline'}
                  size={24}
                  color="white"
                />
                <Text style={styles.voiceButtonText}>
                  {isRecording ? 'Grabando...' : 'Grabar Respuesta'}
                </Text>
              </TouchableOpacity>
            )}

            <TextInput
              style={styles.answerInput}
              value={state.userAnswer}
              onChangeText={(text) => setState(prev => ({ ...prev, userAnswer: text }))}
              placeholder="Escribe tu respuesta o usa el micrófono..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {state.userAnswer.trim() && (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAnswerSubmit}
            >
              <Text style={styles.submitButtonText}>Enviar Respuesta</Text>
            </TouchableOpacity>
          )}

          {state.isCorrect !== null && (
            <View style={styles.resultContainer}>
              <LinearGradient
                colors={state.isCorrect ? ['#4CAF50', '#388E3C'] : ['#F44336', '#D32F2F']}
                style={styles.resultGradient}
              >
                <MaterialCommunityIcons
                  name={state.isCorrect ? 'check-circle' : 'close-circle'}
                  size={48}
                  color="white"
                />
                <Text style={styles.resultText}>
                  {state.isCorrect ? '¡Correcto!' : 'Incorrecto'}
                </Text>
                <Text style={styles.correctAnswerText}>
                  Respuesta: {currentQuestion.answer}
                </Text>
              </LinearGradient>

              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {state.currentIndex < state.questions.length - 1 ? 'Siguiente' : 'Finalizar'}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.dark,
  },
  scoreText: {
    fontSize: 12,
    color: colors.text.light,
    fontWeight: '600',
    marginTop: 2,
  },
  iconButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 20,
  },
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
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  speakButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.dark,
    lineHeight: 26,
  },
  answerContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  answerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.dark,
    marginBottom: 12,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06b6d4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  voiceButtonRecording: {
    backgroundColor: '#F44336',
  },
  voiceButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
    marginBottom: 16,
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
    marginBottom: 24,
  },
  restartButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  restartButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default EntrevistaAIScreen;
