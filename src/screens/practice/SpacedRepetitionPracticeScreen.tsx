/**
 * Pantalla de Repaso Inteligente usando Repetición Espaciada (SRS)
 * Muestra preguntas basadas en el algoritmo SM-2 para optimizar la memorización
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProps } from '../../types/navigation';
import { colors } from '../../constants/colors';
import { questions } from '../../data/questions';
import { usePracticeSession } from '../../hooks/usePracticeSession';
import { isAnswerCorrect } from '../../utils/answerValidation';
import { SpacedRepetitionService } from '../../services/SpacedRepetitionService';
import { ProgressHeader } from '../../components/practice/ProgressHeader';
import { PracticeQuestionCard } from '../../components/practice/PracticeQuestionCard';
import { AnswerResultCard } from '../../components/practice/AnswerResultCard';
import { FloatingAnswerInput } from '../../components/practice/FloatingAnswerInput';
import { useQuestionAudio } from '../../hooks/useQuestionAudio';

const SpacedRepetitionPracticeScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Convertir questions a formato compatible con usePracticeSession
  // Manejar respuestas como string o array
  const formatAnswer = (ans: string | string[]): string => {
    if (Array.isArray(ans)) {
      return ans.join('\n');
    }
    return ans;
  };
  
  const practiceQuestions = questions.map(q => ({
    id: q.id,
    text: q.questionEn,
    options: [],
    correctAnswer: formatAnswer(q.answerEn),
    category: q.category,
    section: q.subcategory,
    question: {
      text: q.questionEn,
      translation: q.questionEs,
    },
    answer: formatAnswer(q.answerEn),
    answerTranslation: formatAnswer(q.answerEs),
    difficulty: 'medium' as const,
  }));

  const {
    currentQuestion,
    isComplete,
    progress,
    stats,
    handleAnswer,
    currentQuestionSRS,
    getSRSStatusMessage,
  } = usePracticeSession({
    mode: 'spaced_repetition',
    questions: practiceQuestions,
    questionCount: 20,
  });

  const { playAudio } = useQuestionAudio(currentQuestion?.id || null);

  useEffect(() => {
    if (currentQuestion) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [currentQuestion]);

  useEffect(() => {
    if (isComplete) {
      Alert.alert(
        'Repaso Completado',
        `Has completado tu sesión de repaso inteligente.\n\nPuntuación: ${stats.correct}/${stats.total}\nPrecisión: ${stats.score.toFixed(1)}%`,
        [
          {
            text: 'Continuar',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  }, [isComplete, stats]);

  const handleAnswerSubmit = async () => {
    if (!currentQuestion || !userAnswer.trim()) return;

    const correct = isAnswerCorrect(
      userAnswer,
      currentQuestion.answer,
      currentQuestion.question.text
    );
    setIsCorrect(correct);

    // Calcular tiempo (simulado, en producción usar timer real)
    const timeSpent = 5000; // 5 segundos por defecto

    await handleAnswer(userAnswer, correct);
  };

  const handleNext = () => {
    setUserAnswer('');
    setIsCorrect(null);
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
  };

  const handleRepeat = () => {
    setUserAnswer('');
    setIsCorrect(null);
  };

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Cargando preguntas para repaso...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const srsStatus = currentQuestionSRS
    ? getSRSStatusMessage(currentQuestion.id)
    : 'Nueva pregunta';

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
            <Text style={styles.headerTitle}>Repaso Inteligente</Text>
            <Text style={styles.headerSubtitle}>Memorización optimizada</Text>
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
              <ProgressHeader
                categoryTitle="Repaso Inteligente"
                currentQuestion={progress.current}
                totalQuestions={progress.total}
                score={stats.correct}
                onChangeCategory={() => navigation.goBack()}
              />

              {srsStatus && (
                <View style={styles.srsStatusCard}>
                  <MaterialCommunityIcons name="brain" size={18} color={colors.primary.main} />
                  <Text style={styles.srsStatusText}>{srsStatus}</Text>
                </View>
              )}

              <PracticeQuestionCard
                question={currentQuestion.question.text}
                mode="text-text"
                onPlayAudio={playAudio}
              />

              {isCorrect !== null && (
                <AnswerResultCard
                  isCorrect={isCorrect}
                  correctAnswer={currentQuestion.answer}
                  onRepeat={handleRepeat}
                  onNext={handleNext}
                />
              )}

              <View style={styles.bottomSpacer} />
            </ScrollView>
          </Animated.View>

          {isCorrect === null && (
            <FloatingAnswerInput
              value={userAnswer}
              onChangeText={setUserAnswer}
              onSubmit={handleAnswerSubmit}
            />
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
    position: 'relative',
  },
  practiceContent: {
    flex: 1,
    backgroundColor: 'transparent',
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
    paddingBottom: 180,
    gap: 16,
  },
  srsStatusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  srsStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.main,
    flex: 1,
  },
  bottomSpacer: {
    height: 160,
    minHeight: 160,
  },
});

export default SpacedRepetitionPracticeScreen;

