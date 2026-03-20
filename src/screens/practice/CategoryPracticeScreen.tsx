// src/screens/practice/CategoryPracticeScreen.tsx
// REFACTORIZADO: Componente dividido en servicios y componentes más pequeños
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationProps } from '../../types/navigation';
import { colors } from '../../constants/colors';
import { QuestionLoaderService, LocalPracticeQuestion, QuestionMode } from '../../services/QuestionLoaderService';
import { QuestionStorageService } from '../../services/QuestionStorageService';
import { isAnswerCorrect } from '../../utils/answerValidation';
import { useQuestionAudio } from '../../hooks/useQuestionAudio';
import { ProgressHeader } from '../../components/practice/ProgressHeader';
import { PracticeQuestionCard } from '../../components/practice/PracticeQuestionCard';
import { AnswerResultCard } from '../../components/practice/AnswerResultCard';
import { FloatingAnswerInput } from '../../components/practice/FloatingAnswerInput';
import { MarkQuestionBanner } from '../../components/practice/MarkQuestionBanner';
import { useSectionProgress } from '../../hooks/useSectionProgress';
import ProgressModal from '../../components/ProgressModal';
import { SectionNavigationService } from '../../services/SectionNavigationService';
import { audioManager } from '../../services/AudioManagerService';
import { questions } from '../../data/questions';

interface Category {
  id: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  gradient: [string, string];
  description: string;
}

const categories: Category[] = [
  {
    id: 'government',
    title: 'Gobierno Americano',
    icon: 'bank',
    gradient: ['#1e88e5', '#1976d2'],
    description: 'Preguntas sobre el gobierno y la democracia',
  },
  {
    id: 'history',
    title: 'Historia Americana',
    icon: 'book-open-page-variant',
    gradient: ['#9c27b0', '#7b1fa2'],
    description: 'Preguntas sobre la historia de Estados Unidos',
  },
  {
    id: 'civics',
    title: 'Educación Cívica',
    icon: 'school',
    gradient: ['#4caf50', '#388e3c'],
    description: 'Preguntas sobre educación cívica y geografía',
  },
];

const CategoryPracticeScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const routeParams = route.params as { questionType?: string };
  const initializedFromParams = useRef(false);
  const insets = useSafeAreaInsets();

  // Estado principal
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    routeParams?.questionType || null
  );
  const [currentQuestion, setCurrentQuestion] = useState<LocalPracticeQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [incorrectQuestions, setIncorrectQuestions] = useState<Set<number>>(new Set());
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [showMarkQuestionDialog, setShowMarkQuestionDialog] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<LocalPracticeQuestion[]>([]);
  const [showNextSectionDialog, setShowNextSectionDialog] = useState(false);
  const [nextSectionInfo, setNextSectionInfo] = useState<{ category: string; subcategory: string; title: string } | null>(null);

  // Hook para audio
  const { playAudio } = useQuestionAudio(currentQuestion?.id || null);

  // Estado para rastrear la sección actual basada en la pregunta
  const [currentSectionId, setCurrentSectionId] = useState<string>('');
  
  // Hook para manejar progreso de la sección
  // El sectionId se actualiza cuando cambia la pregunta actual para reflejar su subcategoría
  const {
    currentIndex: savedIndex,
    showProgressModal,
    isLoading: progressLoading,
    updateCurrentIndex,
    continueFromSaved,
    restartFromBeginning,
    viewAllQuestions,
    closeProgressModal,
    saveProgress,
  } = useSectionProgress(currentSectionId || 'practice_default', totalQuestions || 1);

  // Cargar datos persistentes al iniciar
  useEffect(() => {
    loadPersistedData();
  }, []);

  // Auto-hide del resultado después de un tiempo
  // IMPORTANTE: NO ocultar automáticamente si es la última pregunta de una sección
  // para permitir que el usuario pueda presionar "Siguiente" y ver el diálogo
  useEffect(() => {
    if (isCorrect !== null && currentQuestion) {
      // Verificar si es la última pregunta de su sección
      const isLastInSection = SectionNavigationService.isLastQuestionInSection(currentQuestion.id);
      
      // Solo auto-ocultar si NO es la última pregunta de la sección
      if (!isLastInSection) {
        const timer = setTimeout(() => {
          if (isCorrect) {
            setIsCorrect(null);
          }
        }, isCorrect ? 3000 : 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [isCorrect, currentQuestion]);

  // Inicializar práctica automáticamente si viene una categoría desde navegación
  useEffect(() => {
    if (
      routeParams?.questionType &&
      !currentQuestion &&
      !initializedFromParams.current
    ) {
      initializedFromParams.current = true;
      handleCategorySelect(routeParams.questionType).catch(error => {
        console.error('Error initializing practice:', error);
        Alert.alert('Error', 'No se pudieron cargar las preguntas');
      });
    }
  }, [routeParams?.questionType, currentQuestion]);

  // Función para cargar datos persistentes
  const loadPersistedData = async () => {
    const data = await QuestionStorageService.loadPersistedData();
    setIncorrectQuestions(data.incorrectQuestions);
    setMarkedQuestions(data.markedQuestions);
  };

  // Función para obtener el ID de sección basado en la pregunta actual
  const getSectionIdForQuestion = (questionId: number): string => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return '';
    
    // Crear ID único basado en categoría y subcategoría
    const sectionId = `practice_${question.category}_${question.subcategory}`.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    return sectionId;
  };

  // Actualizar sectionId cuando cambia la pregunta actual
  // Esto también carga el progreso guardado para esa sección
  useEffect(() => {
    if (currentQuestion) {
      const sectionId = getSectionIdForQuestion(currentQuestion.id);
      if (sectionId && sectionId !== currentSectionId) {
        console.log('📝 Actualizando sectionId a:', sectionId, 'para pregunta ID:', currentQuestion.id);
        setCurrentSectionId(sectionId);
        // El hook useSectionProgress se actualizará automáticamente cuando cambie currentSectionId
        // y cargará el progreso guardado para esa sección
      }
    }
  }, [currentQuestion, currentSectionId]);

  // Función para seleccionar categoría
  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setScore(0);
    setUserAnswer('');
    setIsCorrect(null);
    setShowNextSectionDialog(false);
    setNextSectionInfo(null);

    const categoryQuestions = await QuestionLoaderService.getAllQuestionsByCategory(categoryId);
    if (categoryQuestions.length > 0) {
      setShuffledQuestions(categoryQuestions);
      setTotalQuestions(categoryQuestions.length);
      
      // IMPORTANTE: Establecer el sectionId ANTES de establecer currentQuestion
      // Esto permite que el hook useSectionProgress cargue el progreso correctamente
      const firstQuestion = categoryQuestions[0];
      const firstSectionId = getSectionIdForQuestion(firstQuestion.id);
      
      if (firstSectionId) {
        console.log('📝 Estableciendo sectionId inicial:', firstSectionId);
        setCurrentSectionId(firstSectionId);
        
        // Esperar a que el hook cargue el progreso antes de establecer la pregunta
        // Usar un pequeño delay para asegurar que el hook haya procesado el cambio
        setTimeout(() => {
          // El hook useSectionProgress ya habrá cargado el progreso y mostrado el modal si existe
          // Por ahora, establecer la primera pregunta
          // Si hay progreso guardado, el modal lo manejará
          setCurrentQuestion(firstQuestion);
          setQuestionIndex(0);
          updateCurrentIndex(0);
        }, 200);
      } else {
        setCurrentQuestion(firstQuestion);
        setQuestionIndex(0);
        updateCurrentIndex(0);
      }
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Alert.alert(
        'Sin preguntas',
        'No hay preguntas disponibles para este tipo. Por favor, selecciona otro tipo de pregunta.',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedCategory(null);
              setCurrentQuestion(null);
            },
          },
        ]
      );
    }
  };

  // Función para enviar respuesta
  const handleAnswerSubmit = async () => {
    if (!currentQuestion || !userAnswer.trim()) return;

    const correct = isAnswerCorrect(userAnswer, currentQuestion.answer, currentQuestion.question);
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
    } else {
      // Guardar pregunta incorrecta
      const newIncorrectQuestions = new Set(incorrectQuestions);
      newIncorrectQuestions.add(currentQuestion.id);
      setIncorrectQuestions(newIncorrectQuestions);
      await QuestionStorageService.saveIncorrectQuestion(
        currentQuestion.id,
        newIncorrectQuestions
      );

      // Mostrar diálogo para marcar pregunta después de un delay
      setTimeout(() => {
        setShowMarkQuestionDialog(true);
      }, 2000);
    }
    
    // Guardar progreso después de responder (índice actual)
    // Esto asegura que el progreso se guarde incluso si el usuario no presiona "Siguiente"
    if (questionIndex >= 0 && currentSectionId) {
      saveProgress(questionIndex);
      updateCurrentIndex(questionIndex);
      console.log('💾 Progreso guardado después de responder, índice:', questionIndex, 'sección:', currentSectionId);
    }
  };

  // Función para avanzar a la siguiente pregunta
  // Lógica similar a StudyCardsScreen: primero verifica si hay más preguntas,
  // luego verifica si es la última de la sección para mostrar diálogo
  const handleNextQuestion = async () => {
    console.log('🚀 ========== handleNextQuestion INICIADO ==========');
    console.log('📋 Parámetros de entrada:');
    console.log('  - selectedCategory:', selectedCategory);
    console.log('  - shuffledQuestions.length:', shuffledQuestions.length);
    console.log('  - currentQuestion:', currentQuestion ? `ID ${currentQuestion.id}` : 'null');
    console.log('  - questionIndex:', questionIndex);
    console.log('  - totalQuestions:', totalQuestions);
    
    if (!selectedCategory || shuffledQuestions.length === 0 || !currentQuestion) {
      console.log('❌ ERROR: No se puede avanzar - faltan datos');
      Alert.alert('Error', 'No se puede avanzar. Faltan datos necesarios.');
      return;
    }

    // Detener audio antes de avanzar
    try {
      await audioManager.stopCurrentAudio();
      console.log('🔇 Audio detenido');
    } catch (error) {
      console.log('⚠️ Error al detener audio:', error);
    }

    const nextIndex = questionIndex + 1;
    console.log('📊 nextIndex calculado:', nextIndex);

    // PRIMERO: Verificar si hay más preguntas en el array mezclado
    if (nextIndex < shuffledQuestions.length) {
      console.log('✅ Hay más preguntas en el array. Avanzando normalmente...');
      // Hay más preguntas en el array, avanzar normalmente
      const nextQuestion = shuffledQuestions[nextIndex];
      console.log('➡️ Siguiente pregunta:', nextQuestion ? `ID ${nextQuestion.id}` : 'null');
      
      // Verificar si la nueva pregunta pertenece a una sección diferente
      const nextSectionId = getSectionIdForQuestion(nextQuestion.id);
      if (nextSectionId && nextSectionId !== currentSectionId) {
        console.log('📝 Cambiando de sección:', currentSectionId, '→', nextSectionId);
        setCurrentSectionId(nextSectionId);
      }
      
      setQuestionIndex(nextIndex);
      updateCurrentIndex(nextIndex);
      setCurrentQuestion(nextQuestion);
      setUserAnswer('');
      setIsCorrect(null);
      setShowMarkQuestionDialog(false);
      
      // IMPORTANTE: Guardar progreso DESPUÉS de avanzar
      // Esto guarda la nueva posición donde está el usuario
      if (nextSectionId || currentSectionId) {
        const sectionToSave = nextSectionId || currentSectionId;
        // Usar el saveProgress del hook, pero necesitamos guardar para la sección correcta
        saveProgress(nextIndex);
        updateCurrentIndex(nextIndex);
        console.log('💾 Progreso guardado para nueva posición:', nextIndex, 'sección:', sectionToSave);
      }

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
      
      console.log('✅ Avanzado a siguiente pregunta exitosamente');
    } else {
      // Es la última pregunta del array mezclado
      console.log('🏁 Es la última pregunta del array mezclado');
      console.log('🔍 Verificando si es última de sección...');
      
      // SEGUNDO: Verificar si la pregunta actual es la última de su sección
      // y si hay una siguiente sección disponible
      const isLastInSection = SectionNavigationService.isLastQuestionInSection(currentQuestion.id);
      console.log('📊 ¿Es última de sección?', isLastInSection);
      console.log('📊 Pregunta ID:', currentQuestion.id);
      
      if (isLastInSection) {
        console.log('✅ Es la última pregunta de su sección');
        const nextSection = SectionNavigationService.getNextSection(currentQuestion.id);
        console.log('➡️ Siguiente sección encontrada:', nextSection);
        
        if (nextSection && nextSection.exists) {
          console.log('✅ Hay siguiente sección disponible:', nextSection.subcategory);
          console.log('📝 Configurando información de siguiente sección...');
          
          setNextSectionInfo({
            category: nextSection.category,
            subcategory: nextSection.subcategory,
            title: nextSection.title,
          });
          
          console.log('📝 Mostrando diálogo...');
          setShowNextSectionDialog(true);
          console.log('✅ showNextSectionDialog establecido a: true');
          console.log('✅ Diálogo debería estar visible ahora');
          return; // Mostrar diálogo y no avanzar
        } else {
          console.log('⚠️ No hay siguiente sección disponible');
        }
      } else {
        console.log('ℹ️ No es la última pregunta de su sección');
      }
      
      // No hay más preguntas ni secciones disponibles
      console.log('🏁 Mostrando alerta de práctica completada');
      Alert.alert(
        'Práctica Completada',
        `Puntuación: ${score}/${totalQuestions}`,
        [
          { text: 'Volver a Categorías', onPress: () => handleCategorySelect(selectedCategory) },
          { text: 'Finalizar', onPress: () => setSelectedCategory(null) },
        ]
      );
    }
    
    console.log('🚀 ========== handleNextQuestion FINALIZADO ==========');
  };

  // Función para continuar a la siguiente sección
  const handleContinueToNextSection = async () => {
    if (!nextSectionInfo) return;
    
    // Detener audio
    await audioManager.stopCurrentAudio();
    
    // Limpiar progreso de la sección actual
    setShowNextSectionDialog(false);
    
    // Cargar preguntas de la siguiente sección
    // Mapear subcategoría a categoría si es necesario
    const categoryMap: Record<string, string> = {
      'A: Principios de la Democracia Americana': 'government',
      'B: Sistema de Gobierno': 'government',
      'C: Derechos y Responsabilidades': 'government',
      'A: Período Colonial e Independencia': 'history',
      'B: Siglo XIX (1800s)': 'history',
      'C: Historia Reciente': 'history',
      'A: Geografía': 'civics',
      'B: Símbolos': 'civics',
      'C: Días Festivos': 'civics',
    };
    
    // Obtener preguntas de la siguiente sección
    const nextSectionQuestions = questions.filter(
      q => q.category === nextSectionInfo.category && q.subcategory === nextSectionInfo.subcategory
    );
    
    if (nextSectionQuestions.length > 0) {
      // Convertir a LocalPracticeQuestion
      const practiceQuestions = nextSectionQuestions.map(q => ({
        id: q.id,
        question: q.questionEn || q.questionEs,
        answer: q.answerEn || q.answerEs,
        category: q.category,
        difficulty: 'medium' as const,
        mode: 'text-text' as QuestionMode,
      }));
      
      setSelectedCategory(nextSectionInfo.category);
      setShuffledQuestions(practiceQuestions);
      setTotalQuestions(practiceQuestions.length);
      setQuestionIndex(0);
      updateCurrentIndex(0);
      setCurrentQuestion(practiceQuestions[0]);
      setScore(0);
      setUserAnswer('');
      setIsCorrect(null);
      setNextSectionInfo(null);
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Alert.alert(
        'Práctica Completada',
        `Puntuación: ${score}/${totalQuestions}`,
        [
          { text: 'Volver a Categorías', onPress: () => setSelectedCategory(null) },
          { text: 'Finalizar', onPress: () => setSelectedCategory(null) },
        ]
      );
    }
  };

  // Función para repetir pregunta
  const handleRepeatQuestion = () => {
    setUserAnswer('');
    setIsCorrect(null);
  };

  // Función para marcar/desmarcar pregunta
  const toggleMarkedQuestion = async () => {
    if (!currentQuestion) return;

    const newMarkedQuestions = await QuestionStorageService.toggleMarkedQuestion(
      currentQuestion.id,
      markedQuestions
    );
    setMarkedQuestions(newMarkedQuestions);
    setShowMarkQuestionDialog(false);
  };

  // Obtener título de categoría
  const getCategoryTitle = () => {
    return categories.find(c => c.id === selectedCategory)?.title || 'Práctica';
  };

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
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                accessibilityLabel="Volver atrás"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Práctica</Text>
                <Text style={styles.headerSubtitle}>Por Categoría</Text>
              </View>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.navigate('Home')}
                accessibilityLabel="Ir al inicio"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="home" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

      {!selectedCategory && (
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleCategorySelect(category.id)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={category.gradient}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.categoryTitle}>
                  {category.title.split(' ')[0]}
                  {'\n'}
                  {category.title.split(' ')[1]}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedCategory && !currentQuestion && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <Text style={styles.loadingText}>Cargando preguntas...</Text>
        </View>
      )}

      {selectedCategory && currentQuestion && (
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
                  categoryTitle={getCategoryTitle()}
                  currentQuestion={questionIndex + 1}
                  totalQuestions={totalQuestions}
                  score={score}
                  onChangeCategory={() => {
                    setSelectedCategory(null);
                    setCurrentQuestion(null);
                    setUserAnswer('');
                  }}
                />

                <PracticeQuestionCard
                  question={currentQuestion.question}
                  mode={currentQuestion.mode}
                  onPlayAudio={playAudio}
                />

                {/* SIEMPRE mostrar AnswerResultCard cuando hay una respuesta, sin importar si es la última pregunta */}
                {isCorrect !== null && currentQuestion && (
                  <View style={{ zIndex: 10, elevation: 10 }}>
                    <AnswerResultCard
                      isCorrect={isCorrect}
                      correctAnswer={currentQuestion.answer}
                      onRepeat={handleRepeatQuestion}
                      onNext={() => {
                        console.log('🔘 ========== BOTÓN SIGUIENTE PRESIONADO ==========');
                        console.log('🔘 Botón Siguiente presionado para pregunta ID:', currentQuestion.id);
                        console.log('📊 Estado al presionar:');
                        console.log('  - questionIndex:', questionIndex);
                        console.log('  - totalQuestions:', totalQuestions);
                        console.log('  - shuffledLength:', shuffledQuestions.length);
                        console.log('  - nextIndex sería:', questionIndex + 1);
                        console.log('  - ¿Hay más preguntas?:', questionIndex + 1 < shuffledQuestions.length);
                        handleNextQuestion();
                      }}
                    />
                  </View>
                )}
                
                {/* Debug: Verificar si el botón debería estar visible */}
                {__DEV__ && (
                  <View style={{ padding: 10, backgroundColor: '#fff3cd', marginTop: 10, borderRadius: 8, borderWidth: 2, borderColor: '#ffc107' }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold' }}>🔍 DEBUG ESTADO:</Text>
                    <Text style={{ fontSize: 12 }}>isCorrect: {isCorrect !== null ? (isCorrect ? 'true' : 'false') : 'null'}</Text>
                    <Text style={{ fontSize: 12 }}>questionIndex: {questionIndex}</Text>
                    <Text style={{ fontSize: 12 }}>shuffledQuestions.length: {shuffledQuestions.length}</Text>
                    <Text style={{ fontSize: 12 }}>nextIndex sería: {questionIndex + 1}</Text>
                    <Text style={{ fontSize: 12 }}>¿Hay más preguntas?: {questionIndex + 1 < shuffledQuestions.length ? 'SÍ' : 'NO'}</Text>
                    <Text style={{ fontSize: 12 }}>¿AnswerResultCard visible?: {isCorrect !== null ? 'SÍ' : 'NO'}</Text>
                  </View>
                )}
                
                {/* Debug: Mostrar información de la pregunta actual */}
                {__DEV__ && currentQuestion && (
                  <View style={{ padding: 10, backgroundColor: '#f0f0f0', marginTop: 10, borderRadius: 8 }}>
                    <Text style={{ fontSize: 12 }}>ID: {currentQuestion.id}</Text>
                    <Text style={{ fontSize: 12 }}>Index: {questionIndex + 1}/{totalQuestions}</Text>
                    <Text style={{ fontSize: 12 }}>Es última de sección: {SectionNavigationService.isLastQuestionInSection(currentQuestion.id) ? 'SÍ' : 'NO'}</Text>
                  </View>
                )}

                {showMarkQuestionDialog && (
                  <MarkQuestionBanner
                    isMarked={markedQuestions.has(currentQuestion.id)}
                    onToggle={toggleMarkedQuestion}
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
      )}

      {!selectedCategory && (
        <View style={styles.noSelectionContainer}>
          <MaterialCommunityIcons name="help-circle-outline" size={48} color="#d1d5db" />
          <Text style={styles.noSelectionText}>Selecciona una categoría para comenzar</Text>
        </View>
      )}

      {/* Modal de progreso guardado - se muestra cuando hay progreso guardado en la sección actual */}
      {selectedCategory && currentSectionId && currentQuestion && (
        <ProgressModal
          visible={showProgressModal && !progressLoading}
          onClose={closeProgressModal}
          onContinue={() => {
            console.log('✅ Usuario eligió continuar desde pregunta:', savedIndex + 1);
            continueFromSaved();
            // Permitir continuar desde savedIndex >= 0 (incluyendo 0)
            if (savedIndex >= 0 && shuffledQuestions.length > 0 && savedIndex < shuffledQuestions.length) {
              // Continuar desde donde quedó
              console.log('➡️ Continuando desde índice:', savedIndex, 'pregunta ID:', shuffledQuestions[savedIndex]?.id);
              setQuestionIndex(savedIndex);
              setCurrentQuestion(shuffledQuestions[savedIndex]);
              updateCurrentIndex(savedIndex);
              
              // Actualizar sectionId si es necesario
              const questionSectionId = getSectionIdForQuestion(shuffledQuestions[savedIndex].id);
              if (questionSectionId) {
                setCurrentSectionId(questionSectionId);
              }
            } else {
              // Si el índice guardado no es válido, empezar desde el inicio
              console.log('⚠️ Índice guardado no válido, empezando desde el inicio');
              setQuestionIndex(0);
              setCurrentQuestion(shuffledQuestions[0]);
              updateCurrentIndex(0);
            }
          }}
          onRestart={() => {
            console.log('🔄 Usuario eligió empezar desde el inicio');
            restartFromBeginning();
            if (shuffledQuestions.length > 0) {
              setQuestionIndex(0);
              setCurrentQuestion(shuffledQuestions[0]);
              updateCurrentIndex(0);
              
              // Actualizar sectionId
              const questionSectionId = getSectionIdForQuestion(shuffledQuestions[0].id);
              if (questionSectionId) {
                setCurrentSectionId(questionSectionId);
              }
            }
          }}
          onViewAll={viewAllQuestions}
          sectionName={SectionNavigationService.getCurrentSection(currentQuestion.id)?.subcategory || getCategoryTitle()}
          currentQuestion={savedIndex + 1}
          totalQuestions={totalQuestions}
        />
      )}

      {/* Diálogo para continuar a la siguiente sección */}
      <Modal
        visible={showNextSectionDialog}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowNextSectionDialog(false);
          setNextSectionInfo(null);
        }}
      >
        {nextSectionInfo && (
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogContainer}>
              <Text style={styles.dialogTitle}>¿Continuar a la siguiente sección?</Text>
              <Text style={styles.dialogMessage}>
                Has completado esta sección. ¿Deseas continuar a:
              </Text>
              <Text style={styles.dialogSectionName}>{nextSectionInfo.subcategory}</Text>
              <View style={styles.dialogButtons}>
                <TouchableOpacity
                  style={[styles.dialogButton, styles.dialogButtonCancel]}
                  onPress={() => {
                    setShowNextSectionDialog(false);
                    setNextSectionInfo(null);
                  }}
                >
                  <Text style={styles.dialogButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dialogButton, styles.dialogButtonConfirm]}
                  onPress={handleContinueToNextSection}
                >
                  <Text style={[styles.dialogButtonText, styles.dialogButtonTextConfirm]}>Continuar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
    flex: 0,
    marginTop: 0,
  },
  categoryCard: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxWidth: 150,
    minHeight: 80,
  },
  gradient: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    height: 80,
    justifyContent: 'center',
  },
  categoryTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 16,
  },
  practiceArea: {
    flex: 1,
    backgroundColor: 'transparent',
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 0,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: colors.text.light,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 160,
    minHeight: 160,
  },
  noSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noSelectionText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogSectionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF', // Azul profesional
    marginBottom: 24,
    textAlign: 'center',
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  dialogButtonCancel: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dialogButtonConfirm: {
    backgroundColor: '#1E40AF',
  },
  dialogButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dialogButtonTextConfirm: {
    color: 'white',
  },
});

export default CategoryPracticeScreen;

