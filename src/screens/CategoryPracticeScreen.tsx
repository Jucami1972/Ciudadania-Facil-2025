import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { questions } from '../data/questions';
import { questionAudioMap } from '../assets/audio/questions/questionsMap';

const { width, height } = Dimensions.get('window');

interface CategoryPracticeScreenProps {
  route: {
    params: {
      category: 'government' | 'history' | 'civics';
      title: string;
    };
  };
  navigation: any;
}

type QuestionMode = 'text-text' | 'voice-text';

interface PracticeQuestion {
  id: number;
  questionEn: string;
  questionEs: string;
  answerEn: string;
  answerEs: string;
  explanationEn: string;
  explanationEs: string;
  category: string;
  subcategory: string;
  mode: QuestionMode;
}

const CategoryPracticeScreen: React.FC<CategoryPracticeScreenProps> = ({ route, navigation }) => {
  const { category, title } = route.params;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionsForPractice, setQuestionsForPractice] = useState<PracticeQuestion[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMode, setCurrentMode] = useState<QuestionMode>('text-text');
  const [playButtonAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    initializePractice();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [category]);

  const initializePractice = () => {
    // Filtrar preguntas por categoría y seleccionar 10 aleatorias
    const filteredQuestions = questions.filter(q => q.category === category);
    const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, 10).map(q => ({
      ...q,
      mode: getRandomMode(),
      answerEn: Array.isArray(q.answerEn) ? q.answerEn.join(', ') : q.answerEn,
      answerEs: Array.isArray(q.answerEs) ? q.answerEs.join(', ') : q.answerEs,
    }));
    setQuestionsForPractice(selectedQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setTotalAnswered(0);
    setUserAnswer('');
    setShowResult(false);
  };

  const getRandomMode = (): QuestionMode => {
    const modes: QuestionMode[] = ['text-text', 'voice-text'];
    return modes[Math.floor(Math.random() * modes.length)];
  };

  const currentQuestion = questionsForPractice[currentQuestionIndex];

  // Animación del botón de reproducción
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(playButtonAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(playButtonAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      playButtonAnim.setValue(1);
    }
  }, [isPlaying]);

  const playQuestionAudio = async () => {
    if (!currentQuestion) return;

    try {
      // Detener audio anterior si está reproduciéndose
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      const audioFile = questionAudioMap[currentQuestion.id];
      if (!audioFile) {
        Alert.alert('Error', 'No se encontró el archivo de audio para esta pregunta.');
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(audioFile);
      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && !status.isPlaying && !status.isBuffering) {
          setIsPlaying(false);
        }
      });

      await newSound.playAsync();
    } catch (error) {
      console.error('Error reproduciendo audio:', error);
      Alert.alert('Error', 'No se pudo reproducir el audio de la pregunta.');
      setIsPlaying(false);
    }
  };

  const checkAnswer = () => {
    if (!currentQuestion || !userAnswer.trim()) {
      Alert.alert('Error', 'Por favor ingresa una respuesta.');
      return;
    }

    const correct = compareAnswers(userAnswer.trim(), currentQuestion.answerEn);
    setIsCorrect(correct);
    setShowResult(true);
    setTotalAnswered(prev => prev + 1);
    
    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const compareAnswers = (userAnswer: string, correctAnswer: string): boolean => {
    const normalize = (str: string) => str
      .toLowerCase()
      .trim()
      .replace(/[.,!?]/g, '')
      .replace(/\s+/g, ' ');
    
    const normalizedUser = normalize(userAnswer);
    const normalizedCorrect = normalize(correctAnswer);
    
    return normalizedUser === normalizedCorrect;
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questionsForPractice.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setUserAnswer('');
      setShowResult(false);
      setIsCorrect(false);
      
      // Detener audio si está reproduciéndose
      if (sound) {
        sound.stopAsync();
        setIsPlaying(false);
      }
    } else {
      // Mostrar resultados finales
      Alert.alert(
        'Práctica Completada',
        `Puntuación: ${score}/${totalAnswered}`,
        [
          {
            text: 'Nueva Práctica',
            onPress: () => initializePractice()
          },
          {
            text: 'Volver',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  };

  const repeatQuestion = () => {
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(false);
  };

  const getFeedbackColor = (): [string, string] => {
    return isCorrect ? ['#4CAF50', '#4CAF50'] : ['#F44336', '#F44336'];
  };

  const getModeDescription = (mode: QuestionMode): string => {
    switch (mode) {
      case 'text-text':
        return 'Pregunta de texto con respuesta de texto';
      case 'voice-text':
        return 'Pregunta de audio con respuesta de texto';
      default:
        return '';
    }
  };

  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    return (
      <View style={styles.questionContainer}>
        <Text style={styles.modeDescription}>
          {getModeDescription(currentQuestion.mode)}
        </Text>
        
        {currentQuestion.mode === 'text-text' ? (
          // Modo texto-texto: mostrar pregunta escrita
          <Text style={styles.questionText}>
            {currentQuestion.questionEn}
          </Text>
        ) : (
          // Modo voz-texto: mostrar botón de audio
          <View style={styles.audioContainer}>
            <TouchableOpacity
              style={[styles.audioButton, isPlaying && styles.audioButtonPlaying]}
              onPress={isPlaying ? () => {
                if (sound) {
                  sound.stopAsync();
                  setIsPlaying(false);
                }
              } : playQuestionAudio}
            >
              <Animated.View style={{ transform: [{ scale: playButtonAnim }] }}>
                <MaterialCommunityIcons
                  name={isPlaying ? 'stop' : 'play'}
                  size={24}
                  color={isPlaying ? '#fff' : '#023c69'}
                />
              </Animated.View>
              <Text style={[styles.audioButtonText, isPlaying && styles.audioButtonTextPlaying]}>
                {isPlaying ? 'Detener Audio' : 'Reproducir Pregunta'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderResult = () => {
    if (!showResult || !currentQuestion) return null;

    return (
      <View style={styles.resultContainer}>
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
          <Text style={styles.correctAnswer}>
            Respuesta correcta: {currentQuestion.answerEn}
          </Text>
          {currentQuestion.explanationEn && (
            <Text style={styles.explanation}>
              {currentQuestion.explanationEn}
            </Text>
          )}
        </LinearGradient>
      </View>
    );
  };

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Cargando preguntas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
              {title}
            </Text>
            <View style={styles.progressRow}>
              <Text style={styles.progress}>
                Pregunta {currentQuestionIndex + 1} de {questionsForPractice.length}
              </Text>
              <Text style={styles.score}>
                Puntuación: {score}/{totalAnswered}
              </Text>
            </View>
          </View>

          {/* Contenido de la pregunta */}
          {renderQuestionContent()}

          {/* Área de respuesta */}
          <View style={styles.answerContainer}>
            <Text style={styles.answerLabel}>Tu respuesta:</Text>
            <TextInput
              style={styles.answerInput}
              value={userAnswer}
              onChangeText={setUserAnswer}
              placeholder="Escribe tu respuesta aquí..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit={false}
            />
          </View>

          {/* Botones de acción */}
          <View style={styles.actionButtons}>
            {!showResult ? (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={checkAnswer}
                disabled={!userAnswer.trim()}
              >
                <Text style={styles.confirmButtonText}>Confirmar Respuesta</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.resultButtons}>
                <TouchableOpacity
                  style={styles.repeatButton}
                  onPress={repeatQuestion}
                >
                  <Text style={styles.repeatButtonText}>Repetir Pregunta</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={nextQuestion}
                >
                  <Text style={styles.nextButtonText}>
                    {currentQuestionIndex < questionsForPractice.length - 1 ? 'Siguiente' : 'Finalizar'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Resultado */}
          {renderResult()}
          
          {/* Espacio extra para evitar que el teclado tape contenido */}
          <View style={styles.bottomSpacer} />
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30, // Reducido para mejor control
  },
  header: {
    backgroundColor: '#023c69',
    padding: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
    textAlign: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 2,
  },
  progress: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  score: {
    fontSize: 14,
    color: '#ccc',
    fontWeight: '500',
  },
  questionContainer: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modeDescription: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    textAlign: 'center',
  },
  audioContainer: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#023c69',
  },
  audioButtonPlaying: {
    backgroundColor: '#023c69',
    borderColor: '#023c69',
  },
  audioButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#023c69',
    fontWeight: '600',
  },
  audioButtonTextPlaying: {
    color: '#fff',
  },
  answerContainer: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  answerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  answerInput: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fafafa',
    minHeight: 80,
  },
  actionButtons: {
    margin: 15,
  },
  confirmButton: {
    backgroundColor: '#023c69',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  resultButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  repeatButton: {
    backgroundColor: '#666',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  repeatButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    margin: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  resultGradient: {
    padding: 15,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    marginBottom: 10,
  },
  correctAnswer: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  explanation: {
    fontSize: 13,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 18,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
  bottomSpacer: {
    height: 60, // Reducido para optimizar espacio
  },
});

export default CategoryPracticeScreen;
