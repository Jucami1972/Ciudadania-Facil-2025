// src/screens/practice/SpecificTypePracticeScreen.tsx
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
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { NavigationProps } from '../../types/navigation';
import { colors } from '../../constants/colors';
import { getQuestionsByCategory, questionCategories } from '../../data/questionCategories';
import { PracticeQuestion } from '../../data/practiceQuestions';
import { questionAudioMap } from '../../assets/audio/questions/questionsMap';

interface LocalPracticeQuestion extends PracticeQuestion {
  userAnswer?: string;
  isCorrect?: boolean;
}

const SpecificTypePracticeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const routeParams = route.params as { questionType: string };
  const questionTypeId = routeParams?.questionType;

  const [questions, setQuestions] = useState<LocalPracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [viewMode, setViewMode] = useState<'text' | 'audio'>('text'); // Modo de visualización

  // Obtener información de la categoría
  const category = questionCategories.find(c => c.id === questionTypeId);

  useEffect(() => {
    if (questionTypeId) {
      loadQuestions();
    }
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [questionTypeId]);

  const loadQuestions = () => {
    try {
      const categoryQuestions = getQuestionsByCategory(questionTypeId);
      // Mezclar aleatoriamente
      const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      if (shuffled.length > 0) {
        // Auto-reproducir audio si existe y el modo inicial es audio
        if (shuffled[0].id && questionAudioMap[shuffled[0].id]) {
          // No auto-reproducir, dejar que el usuario decida
        }
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      Alert.alert('Error', 'No se pudieron cargar las preguntas');
      navigation.goBack();
    }
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

  const handleCheckAnswer = () => {
    if (!userAnswer.trim()) {
      Alert.alert('Respuesta requerida', 'Por favor escribe tu respuesta');
      return;
    }

    const current = questions[currentIndex];
    if (!current) return;

    const correct = isAnswerCorrect(userAnswer, current.answer);
    setIsCorrect(correct);
    setShowAnswer(true);

    // Actualizar la pregunta con la respuesta del usuario
    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex] = {
      ...current,
      userAnswer,
      isCorrect: correct,
    };
    setQuestions(updatedQuestions);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserAnswer('');
      setIsCorrect(null);
      setShowAnswer(false);
      
      // Limpiar audio anterior
      if (sound) {
        sound.unloadAsync();
        setSound(null);
      }
      setIsPlayingAudio(false);
    } else {
      // Fin de la práctica
      const correctCount = questions.filter(q => q.isCorrect === true).length;
      Alert.alert(
        '¡Práctica Completada!',
        `Respuestas correctas: ${correctCount}/${questions.length}`,
        [
          { text: 'Volver', onPress: () => navigation.goBack() },
          { text: 'Repetir', onPress: () => {
            setCurrentIndex(0);
            setUserAnswer('');
            setIsCorrect(null);
            setShowAnswer(false);
            loadQuestions();
          }}
        ]
      );
    }
  };

  const handlePlayAudio = async (playAnswer: boolean = false) => {
    const current = questions[currentIndex];
    if (!current || !current.id) return;

    try {
      // Si hay audio reproduciéndose, detenerlo primero
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlayingAudio(false);
        // Si el usuario quiere reproducir de nuevo, continuar
        if (!playAnswer) return;
      }

      // Por ahora usamos el mismo audio para pregunta y respuesta
      // En el futuro se puede agregar audioAnswerMap separado
      const audioFile = questionAudioMap[current.id];
      if (audioFile) {
        setIsPlayingAudio(true);
        const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
        setSound(newSound);
        
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlayingAudio(false);
            newSound.unloadAsync();
            setSound(null);
          }
        });
        
        await newSound.playAsync();
      } else {
        Alert.alert('Audio no disponible', 'Esta pregunta no tiene audio disponible');
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'No se pudo reproducir el audio');
      setIsPlayingAudio(false);
      setSound(null);
    }
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'text' ? 'audio' : 'text');
  };

  if (!category) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Categoría no encontrada</Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{category.title}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={category.color} />
          <Text style={styles.loadingText}>Cargando preguntas...</Text>
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{category.title}</Text>
            <Text style={styles.headerSubtitle}>
              Pregunta {currentIndex + 1} de {questions.length}
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Badge de categoría */}
          <View style={[styles.categoryBadge, { backgroundColor: `${category.color}20` }]}>
            <MaterialCommunityIcons 
              name={category.icon as any} 
              size={20} 
              color={category.color} 
            />
            <Text style={[styles.categoryBadgeText, { color: category.color }]}>
              {category.description}
            </Text>
          </View>

          {/* Controles de visualización */}
          <View style={styles.viewModeContainer}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'text' && styles.viewModeButtonActive,
              ]}
              onPress={() => setViewMode('text')}
            >
              <MaterialCommunityIcons 
                name="text" 
                size={20} 
                color={viewMode === 'text' ? category.color : colors.text.light} 
              />
              <Text
                style={[
                  styles.viewModeText,
                  viewMode === 'text' && { color: category.color },
                ]}
              >
                Texto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'audio' && styles.viewModeButtonActive,
              ]}
              onPress={() => setViewMode('audio')}
            >
              <MaterialCommunityIcons 
                name="headphones" 
                size={20} 
                color={viewMode === 'audio' ? category.color : colors.text.light} 
              />
              <Text
                style={[
                  styles.viewModeText,
                  viewMode === 'audio' && { color: category.color },
                ]}
              >
                Audio
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pregunta */}
          <View style={styles.questionContainer}>
            {viewMode === 'text' ? (
              <>
                <Text style={styles.questionText}>{currentQuestion.question}</Text>
                {currentQuestion.id && questionAudioMap[currentQuestion.id] && (
                  <TouchableOpacity
                    style={[styles.audioToggleButton, { borderColor: category.color }]}
                    onPress={() => setViewMode('audio')}
                  >
                    <MaterialCommunityIcons name="headphones" size={20} color={category.color} />
                    <Text style={[styles.audioToggleText, { color: category.color }]}>
                      Escuchar Pregunta
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.audioQuestionContainer}>
                <TouchableOpacity
                  style={[
                    styles.audioButton,
                    { borderColor: category.color },
                    isPlayingAudio && { backgroundColor: `${category.color}20` },
                  ]}
                  onPress={() => handlePlayAudio(false)}
                  disabled={isPlayingAudio}
                >
                  <MaterialCommunityIcons
                    name={isPlayingAudio ? 'pause-circle' : 'play-circle'}
                    size={48}
                    color={category.color}
                  />
                  <Text style={[styles.audioButtonText, { color: category.color }]}>
                    {isPlayingAudio ? 'Reproduciendo...' : 'Reproducir Pregunta'}
                  </Text>
                </TouchableOpacity>
                {!isPlayingAudio && (
                  <TouchableOpacity
                    style={[styles.textToggleButton, { borderColor: category.color }]}
                    onPress={() => setViewMode('text')}
                  >
                    <MaterialCommunityIcons name="text" size={20} color={category.color} />
                    <Text style={[styles.textToggleText, { color: category.color }]}>
                      Ver como texto
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Campo de respuesta */}
          <View style={styles.answerContainer}>
            <Text style={styles.answerLabel}>Tu Respuesta:</Text>
            <TextInput
              style={[
                styles.answerInput,
                isCorrect === true && styles.answerInputCorrect,
                isCorrect === false && styles.answerInputIncorrect,
              ]}
              value={userAnswer}
              onChangeText={setUserAnswer}
              placeholder="Escribe tu respuesta aquí..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!showAnswer}
            />
          </View>

          {/* Botón de verificar */}
          {!showAnswer && (
            <TouchableOpacity
              style={[
                styles.checkButton,
                { backgroundColor: category.color },
                !userAnswer.trim() && styles.checkButtonDisabled,
              ]}
              onPress={handleCheckAnswer}
              disabled={!userAnswer.trim()}
            >
              <MaterialCommunityIcons name="check-circle" size={20} color="white" />
              <Text style={styles.checkButtonText}>Verificar Respuesta</Text>
            </TouchableOpacity>
          )}

          {/* Resultado */}
          {showAnswer && isCorrect !== null && (
            <View style={styles.resultContainer}>
              <LinearGradient
                colors={
                  isCorrect
                    ? ['#4CAF50', '#388E3C']
                    : ['#F44336', '#D32F2F']
                }
                style={styles.resultGradient}
              >
                <MaterialCommunityIcons
                  name={isCorrect ? 'check-circle' : 'close-circle'}
                  size={48}
                  color="white"
                />
                <Text style={styles.resultText}>
                  {isCorrect ? '¡Correcto! 🎉' : 'Incorrecto ❌'}
                </Text>
                <Text style={styles.correctAnswerLabel}>Respuesta correcta:</Text>
                <Text style={styles.correctAnswerText}>{currentQuestion.answer}</Text>
                
                {/* Botón para escuchar la respuesta */}
                {currentQuestion.id && questionAudioMap[currentQuestion.id] && (
                  <TouchableOpacity
                    style={styles.listenAnswerButton}
                    onPress={handlePlayAudio}
                  >
                    <MaterialCommunityIcons name="volume-high" size={20} color="white" />
                    <Text style={styles.listenAnswerText}>Escuchar Respuesta</Text>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </View>
          )}

          {/* Botón Siguiente */}
          {showAnswer && (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: category.color }]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>
                {currentIndex < questions.length - 1 ? 'Siguiente Pregunta' : 'Finalizar'}
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
            </TouchableOpacity>
          )}
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
  headerSubtitle: {
    fontSize: 12,
    color: colors.text.light,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.light,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryBadgeText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  viewModeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewModeButtonActive: {
    backgroundColor: '#f0f0f0',
  },
  viewModeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.light,
  },
  questionContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 100,
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.dark,
    lineHeight: 26,
  },
  audioQuestionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  audioButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 200,
  },
  audioButtonText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  answerContainer: {
    marginBottom: 16,
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
    minHeight: 120,
    textAlignVertical: 'top',
    color: colors.text.dark,
    backgroundColor: 'white',
  },
  answerInputCorrect: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  answerInputIncorrect: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  checkButtonDisabled: {
    opacity: 0.5,
  },
  checkButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultContainer: {
    marginBottom: 16,
  },
  resultGradient: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  resultText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  correctAnswerLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 12,
  },
  correctAnswerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  listenAnswerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  listenAnswerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  textToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
  },
  textToggleText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  audioToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    alignSelf: 'center',
  },
  audioToggleText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default SpecificTypePracticeScreen;

