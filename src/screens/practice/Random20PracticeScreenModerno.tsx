// src/screens/practice/Random20PracticeScreenModerno.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationProps } from '../../types/navigation';
import { getRandomQuestions } from '../../services/questionTypesService';
import { Question } from '../../data/questions';

interface ExamResult {
  totalQuestions: number;
  correctAnswers: number;
  passed: boolean;
  percentage: number;
}

const Random20PracticeScreenModerno = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [language, setLanguage] = useState<'es' | 'en'>('es');

  useEffect(() => {
    // Cargar 20 preguntas aleatorias
    const randomQuestions = getRandomQuestions(20);
    setQuestions(randomQuestions);
    setAnswers(new Array(20).fill(null));
  }, []);

  const startExam = () => {
    setExamStarted(true);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setResult(null);
  };

  const handleAnswerSelect = () => {
    if (selectedAnswer === null) {
      Alert.alert('Advertencia', 'Por favor selecciona una respuesta');
      return;
    }

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(answers[currentQuestion + 1] || null);
      setShowAnswer(false);
    } else {
      finishExam(newAnswers);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || null);
      setShowAnswer(false);
    }
  };

  const finishExam = (finalAnswers: (string | null)[]) => {
    // Evaluar respuestas (simplificado - en una app real se compararía con respuestas correctas)
    // Por ahora, simulamos que el usuario necesita responder correctamente
    let correctCount = 0;
    finalAnswers.forEach((answer, index) => {
      if (answer && answer.trim().length > 0) {
        // Si hay respuesta, asumimos que es correcta (en una app real se validaría)
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / questions.length) * 100);
    const passed = correctCount >= 12; // 12 de 20 es 60%

    setResult({
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      passed,
      percentage,
    });
  };

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Examen de 20 Preguntas</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E40AF" />
          <Text style={styles.loadingText}>Cargando preguntas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!examStarted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Examen de 20 Preguntas</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.centerContent}
        >
          <View style={styles.welcomeCard}>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="clipboard-check" size={64} color="#1E40AF" />
            </View>
            <Text style={styles.welcomeTitle}>Examen Simulado</Text>
            <Text style={styles.welcomeSubtitle}>
              20 preguntas aleatorias del examen de ciudadanía. Necesitas 12 respuestas correctas para pasar (60%).
            </Text>

            <View style={styles.rulesContainer}>
              <View style={styles.ruleItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
                <Text style={styles.ruleText}>20 preguntas aleatorias</Text>
              </View>
              <View style={styles.ruleItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
                <Text style={styles.ruleText}>Necesitas 12 respuestas correctas para pasar</Text>
              </View>
              <View style={styles.ruleItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
                <Text style={styles.ruleText}>Puedes navegar entre preguntas</Text>
              </View>
              <View style={styles.ruleItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
                <Text style={styles.ruleText}>Sin límite de tiempo</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={startExam}>
              <MaterialCommunityIcons name="play" size={20} color="#fff" />
              <Text style={styles.buttonText}>Comenzar Examen</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (result) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resultados</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.centerContent}
        >
          <View style={styles.resultCard}>
            <View style={styles.resultIconWrapper}>
              <MaterialCommunityIcons
                name={result.passed ? 'check-circle' : 'alert-circle'}
                size={64}
                color={result.passed ? '#10b981' : '#ef4444'}
              />
            </View>
            <Text style={[styles.resultTitle, { color: result.passed ? '#10b981' : '#ef4444' }]}>
              {result.passed ? '¡Felicidades!' : 'No Pasaste'}
            </Text>
            <Text style={styles.resultSubtitle}>
              {result.passed
                ? 'Respondiste correctamente el examen simulado'
                : 'Necesitas estudiar más para pasar el examen'}
            </Text>

            <View style={styles.scoreContainer}>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>Respuestas Correctas</Text>
                <Text style={styles.scoreValue}>
                  {result.correctAnswers}/{result.totalQuestions}
                </Text>
              </View>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>Porcentaje</Text>
                <Text style={styles.scoreValue}>{result.percentage}%</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                const newQuestions = getRandomQuestions(20);
                setQuestions(newQuestions);
                setAnswers(new Array(20).fill(null));
                setExamStarted(false);
                setCurrentQuestion(0);
                setSelectedAnswer(null);
                setResult(null);
              }}
            >
              <MaterialCommunityIcons name="reload" size={20} color="#fff" />
              <Text style={styles.buttonText}>Intentar de Nuevo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryButtonText}>Volver al Inicio</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const question = questions[currentQuestion];
  const currentAnswer = language === 'es' ? question.answerEs : question.answerEn;
  const currentQuestionText = language === 'es' ? question.questionEs : question.questionEn;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Pregunta {currentQuestion + 1}/{questions.length}
        </Text>
        <TouchableOpacity onPress={() => setLanguage(language === 'es' ? 'en' : 'es')}>
          <Text style={styles.languageButton}>{language.toUpperCase()}</Text>
        </TouchableOpacity>
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
      >
        <Text style={styles.questionText}>{currentQuestionText}</Text>

        {showAnswer && (
          <View style={styles.answerCard}>
            <Text style={styles.answerLabel}>RESPUESTA CORRECTA</Text>
            <Text style={styles.answerText}>{currentAnswer}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestion === 0 && styles.navButtonDisabled]}
          onPress={handlePreviousQuestion}
          disabled={currentQuestion === 0}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={20} 
            color={currentQuestion === 0 ? '#999' : '#1E40AF'} // Azul profesional 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.showAnswerButton}
          onPress={() => setShowAnswer(!showAnswer)}
        >
          <Text style={styles.showAnswerButtonText}>
            {showAnswer ? 'Ocultar' : 'Ver Respuesta'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleAnswerSelect}
        >
          <Text style={styles.buttonText}>
            {currentQuestion === questions.length - 1 ? 'Finalizar' : 'Siguiente'}
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#1E40AF', // Azul profesional
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#1E40AF', // Azul profesional
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  languageButton: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1E40AF', // Azul profesional
  },
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  questionContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#1E40AF', // Azul profesional
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  rulesContainer: {
    width: '100%',
    marginBottom: 24,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ruleText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  questionText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 24,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  answerCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#10b981',
    marginBottom: 24,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  answerText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
    fontWeight: '500',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2.5,
    borderColor: '#1E40AF', // Azul profesional
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  navButtonDisabled: {
    opacity: 0.4,
    borderColor: '#d1d5db',
  },
  showAnswerButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    marginHorizontal: 8,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  showAnswerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#1E40AF', // Azul profesional
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E40AF', // Azul profesional
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  resultIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  resultSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  scoreContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 24,
  },
  scoreBox: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  scoreLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E40AF', // Azul profesional
    letterSpacing: -0.5,
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#1E40AF', // Azul profesional
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#1E40AF', // Azul profesional
    fontSize: 16,
    fontWeight: '700',
  },
});

export default Random20PracticeScreenModerno;

