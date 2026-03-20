// src/screens/practice/Random20PracticeScreenModerno.tsx
// Simulador de Entrevista de Ciudadanía — 10 preguntas, audio + voz

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { NavigationProps } from '../../types/navigation';
import { getRandomQuestions } from '../../services/questionTypesService';
import { Question } from '../../data/questions';
import { questionAudioMap } from '../../assets/audio/questions/questionsMap';
import { answerAudioMap } from '../../assets/audio/answers/answersMap';
import { isAnswerCorrect } from '../../utils/answerValidation';
import { audioManager } from '../../services/AudioManagerService';

const TOTAL_QUESTIONS = 10;
const PASS_THRESHOLD = 6;
const MAX_ATTEMPTS = 3;

type AttemptResult = {
  transcript: string;
  recordingUri: string | null;
  isCorrect: boolean;
};

type QuestionResult = {
  questionId: number;
  attempts: AttemptResult[];
  finalCorrect: boolean;
};

interface ExamResult {
  totalQuestions: number;
  correctAnswers: number;
  passed: boolean;
  percentage: number;
  elapsedSeconds: number;
  questionResults: QuestionResult[];
}

const Random20PracticeScreenModerno = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();

  // Exam state
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);

  // Current question state
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [questionCorrect, setQuestionCorrect] = useState(false);

  // Audio playback
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [questionPlayed, setQuestionPlayed] = useState(false);

  // Recording
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [playbackSound, setPlaybackSound] = useState<Audio.Sound | null>(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);

  // Scoring
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Animation
  const [fadeAnim] = useState(new Animated.Value(0));

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      audioManager.stopCurrentAudio().catch(() => {});
      if (playbackSound) playbackSound.unloadAsync().catch(() => {});
    };
  }, []);

  // Timer
  useEffect(() => {
    if (examStarted && !result) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examStarted, result]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load questions on mount
  useEffect(() => {
    const randomQuestions = getRandomQuestions(TOTAL_QUESTIONS);
    setQuestions(randomQuestions);
  }, []);

  const startExam = () => {
    const randomQuestions = getRandomQuestions(TOTAL_QUESTIONS);
    setQuestions(randomQuestions);
    setExamStarted(true);
    setCurrentQuestion(0);
    setResult(null);
    setQuestionResults([]);
    setCorrectCount(0);
    setIncorrectCount(0);
    setElapsedSeconds(0);
    resetQuestionState();
  };

  const resetQuestionState = () => {
    setCurrentAttempt(0);
    setAttempts([]);
    setQuestionAnswered(false);
    setQuestionCorrect(false);
    setIsPlayingQuestion(false);
    setQuestionPlayed(false);
    setTranscribedText('');
    setRecordedUri(null);
    setIsRecording(false);
    setIsTranscribing(false);
    fadeAnim.setValue(0);
  };

  // ========== AUDIO PLAYBACK ==========
  const playQuestionAudio = async () => {
    if (!questions[currentQuestion]) return;
    const questionId = questions[currentQuestion].id;
    const audioFile = questionAudioMap[questionId];

    if (!audioFile) {
      Alert.alert('Error', 'No se encontró el audio de esta pregunta');
      return;
    }

    try {
      setIsPlayingQuestion(true);
      await audioManager.stopCurrentAudio();
      await audioManager.playAudio(audioFile);
      setQuestionPlayed(true);

      // Wait for audio to finish
      const checkInterval = setInterval(() => {
        if (!audioManager.getIsPlaying()) {
          clearInterval(checkInterval);
          setIsPlayingQuestion(false);
        }
      }, 300);
    } catch (error) {
      if (__DEV__) console.error('Error playing question audio:', error);
      setIsPlayingQuestion(false);
    }
  };

  const playAnswerAudio = async () => {
    if (!questions[currentQuestion]) return;
    const questionId = questions[currentQuestion].id;
    const audioFile = answerAudioMap[questionId];
    if (!audioFile) return;

    try {
      await audioManager.stopCurrentAudio();
      await audioManager.playAudio(audioFile);
    } catch (error) {
      if (__DEV__) console.error('Error playing answer audio:', error);
    }
  };

  const playRecordedAudio = async () => {
    if (!recordedUri) return;
    try {
      if (playbackSound) await playbackSound.unloadAsync();
      await audioManager.stopCurrentAudio();

      const { sound } = await Audio.Sound.createAsync(
        { uri: recordedUri },
        { shouldPlay: true }
      );
      setPlaybackSound(sound);
      setIsPlayingRecording(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingRecording(false);
          sound.unloadAsync().catch(() => {});
        }
      });
    } catch (error) {
      if (__DEV__) console.error('Error playing recorded audio:', error);
      setIsPlayingRecording(false);
    }
  };

  // ========== RECORDING ==========
  const startRecording = async () => {
    try {
      await audioManager.stopCurrentAudio();
      if (playbackSound) await playbackSound.unloadAsync();

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permisos', 'Se requieren permisos de micrófono para responder.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      setTranscribedText('');
      setRecordedUri(null);
    } catch (err) {
      if (__DEV__) console.error('Failed to start recording:', err);
      Alert.alert('Error', 'No se pudo iniciar la grabación');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    setIsTranscribing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      if (uri) {
        setRecordedUri(uri);
        await transcribeAudio(uri);
      }
    } catch (err) {
      if (__DEV__) console.error('Failed to stop recording:', err);
      setIsTranscribing(false);
    }
    setRecording(null);
  };

  // ========== TRANSCRIPTION ==========
  const transcribeAudio = async (uri: string) => {
    const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      Alert.alert('Error', 'No se encontró EXPO_PUBLIC_OPENAI_API_KEY');
      setIsTranscribing(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      } as any);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const data = await response.json();
      if (data.text) {
        setTranscribedText(data.text);
        evaluateAnswer(data.text, uri);
      } else {
        Alert.alert('Error', 'No se pudo transcribir el audio. Intenta de nuevo.');
      }
    } catch (err) {
      if (__DEV__) console.error('Transcription error:', err);
      Alert.alert('Error', 'Error al transcribir. Verifica tu conexión.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // ========== EVALUATION ==========
  const evaluateAnswer = (transcript: string, uri: string) => {
    const question = questions[currentQuestion];
    const correctAnswer = question.answerEn;
    const correctStr = Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer;
    const correct = isAnswerCorrect(transcript, correctStr, question.questionEn);

    const attemptResult: AttemptResult = {
      transcript,
      recordingUri: uri,
      isCorrect: correct,
    };

    const newAttempts = [...attempts, attemptResult];
    setAttempts(newAttempts);

    if (correct) {
      // Correct on this attempt
      setQuestionCorrect(true);
      setQuestionAnswered(true);
      setCorrectCount(prev => prev + 1);

      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

      // Check early pass
      const newCorrectCount = correctCount + 1;
      if (newCorrectCount >= PASS_THRESHOLD) {
        setTimeout(() => {
          finishExam([...questionResults, {
            questionId: question.id,
            attempts: newAttempts,
            finalCorrect: true,
          }]);
        }, 1500);
      }
    } else if (newAttempts.length >= MAX_ATTEMPTS) {
      // Out of attempts
      setQuestionAnswered(true);
      setQuestionCorrect(false);
      setIncorrectCount(prev => prev + 1);

      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

      // Check early fail
      const newIncorrectCount = incorrectCount + 1;
      if (newIncorrectCount > TOTAL_QUESTIONS - PASS_THRESHOLD) {
        setTimeout(() => {
          finishExam([...questionResults, {
            questionId: question.id,
            attempts: newAttempts,
            finalCorrect: false,
          }]);
        }, 1500);
      }
    } else {
      // More attempts available
      setCurrentAttempt(prev => prev + 1);
    }
  };

  // ========== NAVIGATION ==========
  const handleNext = () => {
    const question = questions[currentQuestion];
    const newResults: QuestionResult[] = [...questionResults, {
      questionId: question.id,
      attempts,
      finalCorrect: questionCorrect,
    }];
    setQuestionResults(newResults);

    if (currentQuestion < TOTAL_QUESTIONS - 1) {
      setCurrentQuestion(prev => prev + 1);
      resetQuestionState();
    } else {
      finishExam(newResults);
    }
  };

  const finishExam = (finalResults: QuestionResult[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const correct = finalResults.filter(r => r.finalCorrect).length;
    const percentage = Math.round((correct / TOTAL_QUESTIONS) * 100);

    setResult({
      totalQuestions: TOTAL_QUESTIONS,
      correctAnswers: correct,
      passed: correct >= PASS_THRESHOLD,
      percentage,
      elapsedSeconds,
      questionResults: finalResults,
    });
  };

  // ========== RENDER: LOADING ==========
  if (questions.length === 0) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.mainContainer}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          <LinearGradient
            colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 8 }]}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Simulador de Entrevista</Text>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </LinearGradient>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Cargando preguntas...</Text>
          </View>
        </View>
      </View>
    );
  }

  // ========== RENDER: WELCOME ==========
  if (!examStarted) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.mainContainer}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          <LinearGradient
            colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 8 }]}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Simulador de Entrevista</Text>
                <Text style={styles.headerSubtitle}>Examen de Ciudadanía</Text>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.centerContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.welcomeCard}>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="microphone" size={40} color="#1E40AF" />
              </View>
              <Text style={styles.welcomeTitle}>Entrevista Real</Text>
              <Text style={styles.welcomeSubtitle}>
                Simula la entrevista real del examen de ciudadanía. Escucharás las preguntas y responderás con tu voz.
              </Text>

              <View style={styles.rulesContainer}>
                <Text style={styles.rulesTitle}>Cómo funciona</Text>
                <View style={styles.ruleItem}>
                  <View style={styles.ruleBullet}>
                    <Text style={styles.ruleBulletText}>1</Text>
                  </View>
                  <Text style={styles.ruleText}>Escucha la pregunta en audio (en inglés)</Text>
                </View>
                <View style={styles.ruleItem}>
                  <View style={styles.ruleBullet}>
                    <Text style={styles.ruleBulletText}>2</Text>
                  </View>
                  <Text style={styles.ruleText}>Graba tu respuesta hablando en inglés</Text>
                </View>
                <View style={styles.ruleItem}>
                  <View style={styles.ruleBullet}>
                    <Text style={styles.ruleBulletText}>3</Text>
                  </View>
                  <Text style={styles.ruleText}>El sistema transcribe y evalúa tu respuesta</Text>
                </View>
                <View style={styles.ruleItem}>
                  <View style={styles.ruleBullet}>
                    <Text style={styles.ruleBulletText}>4</Text>
                  </View>
                  <Text style={styles.ruleText}>Tienes hasta 3 intentos por pregunta</Text>
                </View>
                <View style={styles.ruleItem}>
                  <View style={[styles.ruleBullet, { backgroundColor: '#DBEAFE' }]}>
                    <MaterialCommunityIcons name="star" size={12} color="#1E40AF" />
                  </View>
                  <Text style={[styles.ruleText, { fontWeight: '700' }]}>
                    Necesitas 6 de 10 correctas para aprobar
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={startExam} activeOpacity={0.8}>
                <MaterialCommunityIcons name="microphone" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Comenzar Entrevista</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // ========== RENDER: RESULTS ==========
  if (result) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.mainContainer}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          <LinearGradient
            colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 8 }]}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Resultados</Text>
                <Text style={styles.headerSubtitle}>Entrevista completada</Text>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </LinearGradient>

          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.centerContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.resultCard}>
              <View style={[styles.resultBadgeContainer, {
                backgroundColor: result.passed ? '#ECFDF5' : '#FEF2F2',
              }]}>
                <MaterialCommunityIcons
                  name={result.passed ? 'check-circle' : 'close-circle'}
                  size={48}
                  color={result.passed ? '#10B981' : '#EF4444'}
                />
                <Text style={[styles.resultBadge, {
                  color: result.passed ? '#10B981' : '#EF4444',
                }]}>
                  {result.passed ? 'APROBADO' : 'REPROBADO'}
                </Text>
              </View>

              <Text style={styles.resultTitle}>
                {result.passed ? '¡Felicidades!' : 'Sigue practicando'}
              </Text>
              <Text style={styles.resultSubtitle}>
                {result.passed
                  ? 'Has aprobado la simulación de entrevista de ciudadanía'
                  : 'Necesitas al menos 6 de 10 respuestas correctas'}
              </Text>

              <View style={styles.scoreContainer}>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreLabel}>Correctas</Text>
                  <Text style={[styles.scoreValue, { color: '#10B981' }]}>
                    {result.correctAnswers}
                  </Text>
                </View>
                <View style={styles.scoreDivider} />
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreLabel}>Incorrectas</Text>
                  <Text style={[styles.scoreValue, { color: '#EF4444' }]}>
                    {result.totalQuestions - result.correctAnswers}
                  </Text>
                </View>
                <View style={styles.scoreDivider} />
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreLabel}>Tiempo</Text>
                  <Text style={[styles.scoreValue, { color: '#1E40AF' }]}>
                    {formatTime(result.elapsedSeconds)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={startExam} activeOpacity={0.8}>
                <MaterialCommunityIcons name="reload" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Intentar de nuevo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Volver</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // ========== RENDER: EXAM IN PROGRESS ==========
  const question = questions[currentQuestion];
  const correctAnswer = question.answerEn;
  const correctStr = Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer;
  const attemptsRemaining = MAX_ATTEMPTS - attempts.length;
  const lastAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;
  const showRetryOption = lastAttempt && !lastAttempt.isCorrect && attemptsRemaining > 0 && !questionAnswered;

  return (
    <View style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient
          colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>
                Pregunta {currentQuestion + 1} de {TOTAL_QUESTIONS}
              </Text>
              <Text style={styles.headerSubtitle}>
                {correctCount} correctas · {incorrectCount} incorrectas
              </Text>
            </View>
            <View style={styles.timerContainer}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#fff" />
              <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {
            width: `${((currentQuestion + 1) / TOTAL_QUESTIONS) * 100}%`,
          }]} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.questionContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Step 1: Play Question Audio */}
          <View style={styles.audioCard}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>PASO 1</Text>
            </View>
            <Text style={styles.audioCardTitle}>Escucha la pregunta</Text>

            <TouchableOpacity
              style={[styles.playButton, isPlayingQuestion && styles.playButtonActive]}
              onPress={playQuestionAudio}
              disabled={isPlayingQuestion || isRecording}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={isPlayingQuestion ? 'volume-high' : 'play-circle'}
                size={32}
                color="#fff"
              />
              <Text style={styles.playButtonText}>
                {isPlayingQuestion ? 'Reproduciendo...' : questionPlayed ? 'Escuchar de nuevo' : 'Escuchar pregunta'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Step 2: Record Answer */}
          {questionPlayed && !questionAnswered && (
            <View style={styles.audioCard}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>
                  PASO 2 {attempts.length > 0 ? `· INTENTO ${attempts.length + 1} DE ${MAX_ATTEMPTS}` : ''}
                </Text>
              </View>
              <Text style={styles.audioCardTitle}>Responde en inglés</Text>

              {!isRecording && !isTranscribing && (!lastAttempt || showRetryOption) && (
                <TouchableOpacity
                  style={styles.recordButton}
                  onPress={startRecording}
                  disabled={isPlayingQuestion}
                  activeOpacity={0.8}
                >
                  <View style={styles.recordDot} />
                  <Text style={styles.recordButtonText}>
                    {showRetryOption ? 'Intentar de nuevo' : 'Grabar respuesta'}
                  </Text>
                </TouchableOpacity>
              )}

              {isRecording && (
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={stopRecording}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="stop-circle" size={28} color="#fff" />
                  <Text style={styles.stopButtonText}>Detener grabación</Text>
                  <View style={styles.recordingIndicator}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingLabel}>GRABANDO</Text>
                  </View>
                </TouchableOpacity>
              )}

              {isTranscribing && (
                <View style={styles.transcribingContainer}>
                  <ActivityIndicator size="small" color="#1E40AF" />
                  <Text style={styles.transcribingText}>Analizando tu respuesta...</Text>
                </View>
              )}

              {/* Show last attempt result (incorrect, can retry) */}
              {showRetryOption && lastAttempt && (
                <View style={styles.attemptResultCard}>
                  <View style={styles.attemptResultHeader}>
                    <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" />
                    <Text style={styles.attemptResultLabel}>Respuesta incorrecta</Text>
                  </View>
                  <Text style={styles.attemptTranscript}>
                    Dijiste: "{lastAttempt.transcript}"
                  </Text>
                  {lastAttempt.recordingUri && (
                    <TouchableOpacity
                      style={styles.playRecordingButton}
                      onPress={() => {
                        setRecordedUri(lastAttempt.recordingUri);
                        playRecordedAudio();
                      }}
                    >
                      <MaterialCommunityIcons
                        name={isPlayingRecording ? 'pause-circle' : 'play-circle'}
                        size={20}
                        color="#1E40AF"
                      />
                      <Text style={styles.playRecordingText}>Escuchar mi grabación</Text>
                    </TouchableOpacity>
                  )}
                  <View style={styles.attemptsRemainingBadge}>
                    <MaterialCommunityIcons name="refresh" size={14} color="#F59E0B" />
                    <Text style={styles.attemptsRemainingText}>
                      {attemptsRemaining} intento{attemptsRemaining !== 1 ? 's' : ''} restante{attemptsRemaining !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Final Result for this question */}
          {questionAnswered && (
            <Animated.View style={[styles.finalResultCard, { opacity: fadeAnim }]}>
              {questionCorrect ? (
                <>
                  <View style={styles.finalResultHeader}>
                    <View style={[styles.finalResultIcon, { backgroundColor: '#D1FAE5' }]}>
                      <MaterialCommunityIcons name="check-circle" size={32} color="#10B981" />
                    </View>
                    <View style={styles.finalResultInfo}>
                      <Text style={[styles.finalResultTitle, { color: '#10B981' }]}>¡Correcto!</Text>
                      <Text style={styles.finalResultAttempts}>
                        En {attempts.length} intento{attempts.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transcriptCard}>
                    <Text style={styles.transcriptLabel}>Tu respuesta:</Text>
                    <Text style={styles.transcriptText}>
                      "{attempts[attempts.length - 1].transcript}"
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.finalResultHeader}>
                    <View style={[styles.finalResultIcon, { backgroundColor: '#FEE2E2' }]}>
                      <MaterialCommunityIcons name="close-circle" size={32} color="#EF4444" />
                    </View>
                    <View style={styles.finalResultInfo}>
                      <Text style={[styles.finalResultTitle, { color: '#EF4444' }]}>Incorrecta</Text>
                      <Text style={styles.finalResultAttempts}>
                        Agotaste los {MAX_ATTEMPTS} intentos
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transcriptCard}>
                    <Text style={styles.transcriptLabel}>Tu última respuesta:</Text>
                    <Text style={styles.transcriptText}>
                      "{attempts[attempts.length - 1].transcript}"
                    </Text>
                  </View>
                </>
              )}

              {/* Show correct answer + audio */}
              <View style={styles.correctAnswerCard}>
                <View style={styles.correctAnswerHeader}>
                  <MaterialCommunityIcons name="check-decagram" size={16} color="#10B981" />
                  <Text style={styles.correctAnswerLabel}>Respuesta correcta</Text>
                </View>
                <Text style={styles.correctAnswerText}>{correctStr}</Text>
                <TouchableOpacity
                  style={styles.listenAnswerButton}
                  onPress={playAnswerAudio}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="volume-high" size={18} color="#1E40AF" />
                  <Text style={styles.listenAnswerText}>Escuchar respuesta correcta</Text>
                </TouchableOpacity>
              </View>

              {/* Playback of user's recording */}
              {attempts[attempts.length - 1].recordingUri && (
                <TouchableOpacity
                  style={styles.playMyRecordingButton}
                  onPress={() => {
                    setRecordedUri(attempts[attempts.length - 1].recordingUri);
                    setTimeout(playRecordedAudio, 100);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={isPlayingRecording ? 'pause-circle' : 'play-circle'}
                    size={20}
                    color="#6B7280"
                  />
                  <Text style={styles.playMyRecordingText}>Escuchar mi grabación</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        {questionAnswered && (
          <View style={styles.navigationContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {currentQuestion < TOTAL_QUESTIONS - 1 ? 'Siguiente pregunta' : 'Ver resultados'}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
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
    backgroundColor: '#F8FAFC',
  },
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
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1E40AF',
    borderRadius: 2,
  },
  container: {
    flex: 1,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  questionContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  // Welcome
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  rulesContainer: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  rulesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ruleBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ruleBulletText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
  },
  ruleText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    lineHeight: 18,
  },
  // Audio card (question + record)
  audioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.8,
  },
  audioCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  playButton: {
    backgroundColor: '#1E40AF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  playButtonActive: {
    backgroundColor: '#3B82F6',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  recordButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  recordDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  stopButton: {
    backgroundColor: '#991B1B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 14,
    gap: 6,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FCA5A5',
  },
  recordingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FCA5A5',
    letterSpacing: 1,
  },
  transcribingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  transcribingText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Attempt result (incorrect, retry available)
  attemptResultCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  attemptResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  attemptResultLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  attemptTranscript: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 10,
  },
  playRecordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  playRecordingText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '600',
  },
  attemptsRemainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  attemptsRemainingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  // Final result for question
  finalResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  finalResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  finalResultIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalResultInfo: {
    flex: 1,
  },
  finalResultTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  finalResultAttempts: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  transcriptCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  transcriptLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  transcriptText: {
    fontSize: 15,
    color: '#111827',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  correctAnswerCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    marginBottom: 12,
  },
  correctAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  correctAnswerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 12,
  },
  listenAnswerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  listenAnswerText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '600',
  },
  playMyRecordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  playMyRecordingText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  // Navigation
  navigationContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#1E40AF',
    paddingVertical: 15,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Results
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  resultBadgeContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  scoreContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  scoreBox: {
    flex: 1,
    alignItems: 'center',
  },
  scoreDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E7EB',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1E40AF',
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {
    color: '#1E40AF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default Random20PracticeScreenModerno;

