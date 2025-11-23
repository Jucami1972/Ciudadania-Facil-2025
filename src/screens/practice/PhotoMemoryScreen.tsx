// src/screens/practice/PhotoMemoryScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { NavigationProps } from '../../types/navigation';
import { practiceQuestions, PracticeQuestion } from '../../data/practiceQuestions';

const { width } = Dimensions.get('window');

interface QuestionWithImage extends PracticeQuestion {
  imagePath?: string;
  imageName?: string;
}

// Mapeo de preguntas con imágenes disponibles
const questionsWithImages: QuestionWithImage[] = [
  {
    id: 1,
    question: "What is the form of government of the United States?",
    answer: "Republic",
    category: "government",
    difficulty: "easy",
    imagePath: require('../../assets/bandera.png'),
    imageName: "bandera.png",
  },
  {
    id: 2,
    question: "What is the supreme law of the land?",
    answer: "U.S. Constitution",
    category: "government",
    difficulty: "easy",
    imagePath: require('../../assets/capitolio.png'),
    imageName: "capitolio.png",
  },
  {
    id: 15,
    question: "Who is in charge of the executive branch?",
    answer: "The President",
    category: "government",
    difficulty: "easy",
    imagePath: require('../../assets/citizenship-hero.png'),
    imageName: "citizenship-hero.png",
  },
  // Puedes agregar más preguntas con imágenes aquí
];

const PhotoMemoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<QuestionWithImage[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Seleccionar preguntas aleatorias con imágenes
    const shuffled = [...questionsWithImages].sort(() => Math.random() - 0.5);
    setSelectedQuestions(shuffled.slice(0, Math.min(10, shuffled.length)));
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const currentQuestion = selectedQuestions[currentQuestionIndex];

  const handleNext = () => {
    if (currentQuestionIndex < selectedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      Alert.alert(
        '¡Completado!',
        'Has visto todas las preguntas con imágenes.',
        [
          { text: 'Repetir', onPress: () => {
            setCurrentQuestionIndex(0);
            setShowAnswer(false);
            const shuffled = [...questionsWithImages].sort(() => Math.random() - 0.5);
            setSelectedQuestions(shuffled.slice(0, Math.min(10, shuffled.length)));
          }},
          { text: 'Volver', onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowAnswer(false);
    }
  };

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando preguntas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memoria Fotográfica</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {currentQuestionIndex + 1} de {selectedQuestions.length}
            </Text>
          </View>

          <View style={styles.imageContainer}>
            {currentQuestion.imagePath && (
              <Image
                source={typeof currentQuestion.imagePath === 'string' 
                  ? { uri: currentQuestion.imagePath } 
                  : currentQuestion.imagePath}
                style={styles.image}
                resizeMode="contain"
              />
            )}
            <View style={styles.imageOverlay}>
              <Text style={styles.imageCaption}>Imagen Asociada</Text>
            </View>
          </View>

          <View style={styles.questionCard}>
            <Text style={styles.questionLabel}>Pregunta:</Text>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>

          {showAnswer && (
            <Animated.View style={styles.answerCard}>
              <LinearGradient
                colors={['#4CAF50', '#388E3C']}
                style={styles.answerGradient}
              >
                <MaterialCommunityIcons name="check-circle" size={32} color="white" />
                <Text style={styles.answerLabel}>Respuesta Correcta:</Text>
                <Text style={styles.answerText}>{currentQuestion.answer}</Text>
              </LinearGradient>
            </Animated.View>
          )}

          <TouchableOpacity
            style={styles.showAnswerButton}
            onPress={() => setShowAnswer(!showAnswer)}
          >
            <LinearGradient
              colors={showAnswer ? ['#666', '#444'] : ['#270483', '#8146cc']}
              style={styles.showAnswerGradient}
            >
              <MaterialCommunityIcons
                name={showAnswer ? 'eye-off' : 'eye'}
                size={20}
                color="white"
              />
              <Text style={styles.showAnswerText}>
                {showAnswer ? 'Ocultar Respuesta' : 'Mostrar Respuesta'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentQuestionIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={currentQuestionIndex === 0 ? '#ccc' : colors.primary.main}
          />
          <Text
            style={[
              styles.navButtonText,
              currentQuestionIndex === 0 && styles.navButtonTextDisabled,
            ]}
          >
            Anterior
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={handleNext}>
          <Text style={styles.navButtonText}>
            {currentQuestionIndex < selectedQuestions.length - 1 ? 'Siguiente' : 'Finalizar'}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.primary.main}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.light,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questionContainer: {
    marginBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: colors.text.light,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
  },
  imageCaption: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
  questionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.light,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.dark,
    lineHeight: 26,
  },
  answerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  answerGradient: {
    padding: 24,
    alignItems: 'center',
  },
  answerLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  answerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  showAnswerButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  showAnswerGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  showAnswerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
    marginHorizontal: 8,
  },
  navButtonTextDisabled: {
    color: '#ccc',
  },
});

export default PhotoMemoryScreen;

