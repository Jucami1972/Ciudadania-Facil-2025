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
  StatusBar,
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationProps } from '../../types/navigation';
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
  const insets = useSafeAreaInsets();
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answeredQuestion, setAnsweredQuestion] = useState<{ id: number; text: string; answer: string } | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState<{ answer: string; correct: boolean } | null>(null);
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

  const handleAnswerSubmit = () => {
    if (!currentQuestion || !userAnswer.trim()) return;

    const correct = isAnswerCorrect(
      userAnswer,
      currentQuestion.answer,
      currentQuestion.question.text
    );

    // Guardar datos de la pregunta y diferir handleAnswer hasta "Siguiente"
    setAnsweredQuestion({
      id: currentQuestion.id,
      text: currentQuestion.question.text,
      answer: currentQuestion.answer,
    });
    setIsCorrect(correct);
    setPendingAnswer({ answer: userAnswer, correct });
  };

  const handleNext = async () => {
    // Avanzar al siguiente AHORA que el usuario ya vio el resultado
    if (pendingAnswer) {
      await handleAnswer(pendingAnswer.answer, pendingAnswer.correct);
    }
    setUserAnswer('');
    setIsCorrect(null);
    setAnsweredQuestion(null);
    setPendingAnswer(null);
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
    setAnsweredQuestion(null);
    setPendingAnswer(null);
  };

  if (!currentQuestion) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.mainContainer}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E40AF" />
            <Text style={styles.loadingText}>Cargando preguntas para repaso...</Text>
          </View>
        </View>
      </View>
    );
  }

  const srsStatus = currentQuestionSRS
    ? getSRSStatusMessage(currentQuestion.id)
    : 'Nueva pregunta';

  return (
    <View style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#1E3A8A', '#1E40AF', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 8 }]}
          >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel="Volver atrás"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
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
              <MaterialCommunityIcons name="home" size={22} color="white" />
            </TouchableOpacity>
            </View>
          </LinearGradient>
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
                  <MaterialCommunityIcons name="brain" size={18} color="#1E40AF" />
                  <Text style={styles.srsStatusText}>{srsStatus}</Text>
                </View>
              )}

              <PracticeQuestionCard
                question={answeredQuestion ? answeredQuestion.text : currentQuestion.question.text}
                questionNumber={answeredQuestion ? answeredQuestion.id : currentQuestion.id}
                mode="text-text"
                onPlayAudio={playAudio}
              />

              {isCorrect !== null && answeredQuestion && (
                <AnswerResultCard
                  isCorrect={isCorrect}
                  correctAnswer={answeredQuestion.answer}
                  userAnswer={pendingAnswer?.answer}
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
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
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
    color: '#6B7280',
    textAlign: 'center',
  },
  practiceArea: {
    flex: 1,
    position: 'relative',
  },
  practiceContent: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(30, 64, 175, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  srsStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
    flex: 1,
  },
  bottomSpacer: {
    height: 160,
    minHeight: 160,
  },
});

export default SpacedRepetitionPracticeScreen;

