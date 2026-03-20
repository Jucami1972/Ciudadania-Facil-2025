// src/screens/practice/Random20PracticeScreenModerno.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationProps } from '../../types/navigation';
import { getRandomQuestions } from '../../services/questionTypesService';
import { Question } from '../../data/questions';

interface ExamResult {
  totalQuestions: number;
  correctAnswers: number;
  passed: boolean;
  percentage: number;
  elapsedSeconds: number;
}

const Random20PracticeScreenModerno = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<('correct' | 'incorrect' | null)[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer del examen
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

  useEffect(() => {
    const randomQuestions = getRandomQuestions(20);
    setQuestions(randomQuestions);
    setAnswers(new Array(20).fill(null));
  }, []);

  const startExam = () => {
    setExamStarted(true);
    setCurrentQuestion(0);
    setShowAnswer(false);
    setResult(null);
    setElapsedSeconds(0);
    const randomQuestions = getRandomQuestions(20);
    setQuestions(randomQuestions);
    setAnswers(new Array(20).fill(null));
  };

  const handleSelfAssessment = (knewIt: boolean) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = knewIt ? 'correct' : 'incorrect';
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowAnswer(false);
    } else {
      finishExam(newAnswers);
    }
  };

  const finishExam = (finalAnswers: ('correct' | 'incorrect' | null)[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const correctCount = finalAnswers.filter(a => a === 'correct').length;
    const percentage = Math.round((correctCount / questions.length) * 100);
    const passed = correctCount >= 12;

    setResult({
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      passed,
      percentage,
      elapsedSeconds,
    });
  };

  if (questions.length === 0) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.mainContainer}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          <View style={styles.headerContainer}>
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
                  <Text style={styles.headerTitle}>Examen de 20 Preguntas</Text>
                </View>
                <View style={{ width: 44 }} />
              </View>
            </LinearGradient>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Cargando preguntas...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (!examStarted) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.mainContainer}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          <View style={styles.headerContainer}>
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
                  <Text style={styles.headerTitle}>Examen Simulado</Text>
                  <Text style={styles.headerSubtitle}>20 preguntas aleatorias</Text>
                </View>
                <View style={{ width: 44 }} />
              </View>
            </LinearGradient>
          </View>

          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.centerContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.welcomeCard}>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="clipboard-check" size={48} color="#1E40AF" />
              </View>
              <Text style={styles.welcomeTitle}>¿Estás listo?</Text>
              <Text style={styles.welcomeSubtitle}>
                Simula el examen real de ciudadanía con 20 preguntas aleatorias.
              </Text>

              <View style={styles.rulesContainer}>
                <Text style={styles.rulesTitle}>Instrucciones</Text>
                <View style={styles.ruleItem}>
                  <View style={styles.ruleBullet}>
                    <Text style={styles.ruleBulletText}>1</Text>
                  </View>
                  <Text style={styles.ruleText}>Se muestran 20 preguntas aleatorias del examen oficial</Text>
                </View>
                <View style={styles.ruleItem}>
                  <View style={styles.ruleBullet}>
                    <Text style={styles.ruleBulletText}>2</Text>
                  </View>
                  <Text style={styles.ruleText}>Piensa la respuesta y luego revélala para verificar</Text>
                </View>
                <View style={styles.ruleItem}>
                  <View style={styles.ruleBullet}>
                    <Text style={styles.ruleBulletText}>3</Text>
                  </View>
                  <Text style={styles.ruleText}>Marca si la sabías o no — evalúate honestamente</Text>
                </View>
                <View style={styles.ruleItem}>
                  <View style={[styles.ruleBullet, { backgroundColor: '#DBEAFE' }]}>
                    <MaterialCommunityIcons name="star" size={12} color="#1E40AF" />
                  </View>
                  <Text style={[styles.ruleText, { fontWeight: '700' }]}>Necesitas 12 de 20 correctas para aprobar (60%)</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={startExam} activeOpacity={0.8}>
                <MaterialCommunityIcons name="play" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Comenzar Examen</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  if (result) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.mainContainer}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          <View style={styles.headerContainer}>
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
                  <Text style={styles.headerSubtitle}>Examen completado</Text>
                </View>
                <View style={{ width: 44 }} />
              </View>
            </LinearGradient>
          </View>

          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.centerContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.resultCard}>
              <View style={[styles.resultBadgeContainer, { backgroundColor: result.passed ? '#ECFDF5' : '#FEF2F2' }]}>
                <MaterialCommunityIcons
                  name={result.passed ? 'check-circle' : 'close-circle'}
                  size={48}
                  color={result.passed ? '#10B981' : '#EF4444'}
                />
                <Text style={[styles.resultBadge, { color: result.passed ? '#10B981' : '#EF4444' }]}>
                  {result.passed ? 'APROBADO' : 'REPROBADO'}
                </Text>
              </View>

              <Text style={styles.resultTitle}>
                {result.passed ? '¡Felicidades!' : 'Sigue practicando'}
              </Text>
              <Text style={styles.resultSubtitle}>
                {result.passed
                  ? 'Has aprobado el examen simulado de ciudadanía'
                  : 'Necesitas al menos 12 de 20 respuestas correctas'}
              </Text>

              <View style={styles.scoreContainer}>
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreLabel}>Correctas</Text>
                  <Text style={[styles.scoreValue, { color: result.passed ? '#10B981' : '#EF4444' }]}>
                    {result.correctAnswers}/{result.totalQuestions}
                  </Text>
                </View>
                <View style={styles.scoreDivider} />
                <View style={styles.scoreBox}>
                  <Text style={styles.scoreLabel}>Porcentaje</Text>
                  <Text style={[styles.scoreValue, { color: result.passed ? '#10B981' : '#EF4444' }]}>
                    {result.percentage}%
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

  const question = questions[currentQuestion];
  const currentAnswer = language === 'es' ? question.answerEs : question.answerEn;
  const currentQuestionText = language === 'es' ? question.questionEs : question.questionEn;

  return (
    <View style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.headerContainer}>
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
                  Pregunta {currentQuestion + 1} de {questions.length}
                </Text>
              </View>
              <View style={styles.timerContainer}>
                <MaterialCommunityIcons name="clock-outline" size={14} color="#fff" />
                <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentQuestion + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.questionContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.questionHeader}>
            <View style={styles.questionBadge}>
              <Text style={styles.questionBadgeText}>#{question.id}</Text>
            </View>
            <TouchableOpacity
              style={styles.langToggle}
              onPress={() => setLanguage(language === 'es' ? 'en' : 'es')}
            >
              <Text style={styles.langToggleText}>{language === 'es' ? 'EN' : 'ES'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.questionText}>{currentQuestionText}</Text>

          {showAnswer && (
            <View style={styles.answerCard}>
              <View style={styles.answerLabelRow}>
                <MaterialCommunityIcons name="check-decagram" size={16} color="#10B981" />
                <Text style={styles.answerLabel}>Respuesta correcta</Text>
              </View>
              <Text style={styles.answerText}>{currentAnswer}</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.navigationContainer}>
          {!showAnswer ? (
            <TouchableOpacity
              style={styles.showAnswerButton}
              onPress={() => setShowAnswer(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="eye" size={18} color="#fff" />
              <Text style={styles.showAnswerButtonText}>Mostrar Respuesta</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.wrongButton}
                onPress={() => handleSelfAssessment(false)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="close-circle" size={20} color="#fff" />
                <Text style={styles.assessButtonText}>No la sabía</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.correctButton}
                onPress={() => handleSelfAssessment(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                <Text style={styles.assessButtonText}>La sabía</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
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
    paddingVertical: 24,
  },
  // Welcome screen
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
  // Question screen
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  questionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  langToggle: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  langToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 28,
    letterSpacing: -0.3,
    marginBottom: 24,
  },
  answerCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  answerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  answerText: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 24,
    fontWeight: '500',
  },
  // Navigation / action buttons
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  showAnswerButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  showAnswerButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  wrongButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  correctButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  assessButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
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
  // Results screen
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

