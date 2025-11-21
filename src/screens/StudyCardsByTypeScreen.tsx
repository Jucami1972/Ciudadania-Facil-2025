// src/screens/StudyCardsByTypeScreen.tsx

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { questions, Question } from '../data/questions';
import { NavigationProps } from '../types/navigation';
import FlipCard from '../components/FlipCard';
import { useSectionProgress } from '../hooks/useSectionProgress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getQuestionsByType, QUESTION_TYPES } from '../services/questionTypesService';
import { questionAudioMap } from '../assets/audio/questions/questionsMap';
import { answerAudioMap } from '../assets/audio/answers/answersMap';

const { width } = Dimensions.get('window');

interface StudyCardsByTypeRouteParams {
  questionType: string;
  typeName: string;
  typeNameEn: string;
}

const StudyCardsByTypeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const routeParams = route.params as StudyCardsByTypeRouteParams;
  const { questionType, typeName, typeNameEn } = routeParams;
  const flipCardRef = useRef<any>(null);

  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // Filtrar preguntas por tipo
  const filteredQuestions = useMemo(() => {
    const questionsByType = getQuestionsByType(questionType);
    return questionsByType;
  }, [questionType]);

  // Crear ID único para la sección
  const sectionId = `question_type_${questionType}`;
  
  // Hook para manejar progreso de la sección
  const {
    currentIndex,
    showProgressModal,
    isLoading: progressLoading,
    updateCurrentIndex,
    continueFromSaved,
    restartFromBeginning,
    viewAllQuestions,
    closeProgressModal,
  } = useSectionProgress(sectionId, filteredQuestions.length);

  // Cargar preguntas marcadas
  useEffect(() => {
    const loadMarkedQuestions = async () => {
      try {
        const markedData = await AsyncStorage.getItem('@practice:marked');
        if (markedData) {
          setMarkedQuestions(new Set(JSON.parse(markedData)));
        }
      } catch (error) {
        console.error('Error loading marked questions:', error);
      }
    };
    loadMarkedQuestions();
  }, []);

  const stopAudio = async () => {
    if (!sound) return;
    try {
      const status = await sound.getStatusAsync().catch(() => null);
      if (status && 'isLoaded' in status && status.isLoaded) {
        if ('isPlaying' in status && status.isPlaying) {
          await sound.stopAsync();
        }
        sound.setOnPlaybackStatusUpdate(null);
        await sound.unloadAsync();
      }
    } catch (error) {
      // Silenciar error
    } finally {
      setSound(null);
      setIsPlaying(false);
    }
  };

  // Detener audio cuando cambia la pregunta o se resetea la tarjeta
  useEffect(() => {
    stopAudio();
    setIsFlipped(false);
    // Detener audio cuando se resetea la tarjeta
    if (flipCardRef.current) {
      flipCardRef.current.reset();
    }
  }, [currentIndex]);

  if (filteredQuestions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Estudio por Tipo</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No hay preguntas disponibles</Text>
        </View>
      </SafeAreaView>
    );
  }

  const current = filteredQuestions[currentIndex];
  const isMarked = markedQuestions.has(current.id);

  // NO marcar pregunta vista para progreso global
  // El progreso de "estudio por tipo" es independiente del progreso de "tarjetas de estudio"
  // Solo se guarda el progreso local de la sección usando useSectionProgress

  const playAudio = async () => {
    try {
      await stopAudio();
      
      if (!current.id) return;
      
      const audioMap = isFlipped ? answerAudioMap : questionAudioMap;
      const module = audioMap[current.id];
      
      if (!module) {
        Alert.alert('Audio no disponible', 'No hay audio disponible para esta pregunta.');
        return;
      }
      
      const { sound: newSound } = await Audio.Sound.createAsync(module);
      setSound(newSound);
      setIsPlaying(true);
      
      await newSound.playAsync();
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && !status.isPlaying && !status.isBuffering) {
          setIsPlaying(false);
          setSound(null);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setSound(null);
    }
  };

  const handleAudioToggle = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playAudio();
    }
  };

  const handleLanguageToggle = () => {
    setLanguage(prev => prev === 'en' ? 'es' : 'en');
  };

  const handleCardFlip = (flipped: boolean) => {
    setIsFlipped(flipped);
    stopAudio(); // Detener audio al voltear
  };

  const handlePreviousCard = () => {
    if (currentIndex > 0) {
      updateCurrentIndex(currentIndex - 1);
      if (flipCardRef.current) {
        flipCardRef.current.reset();
      }
    }
  };

  const handleNextCard = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      updateCurrentIndex(currentIndex + 1);
      if (flipCardRef.current) {
        flipCardRef.current.reset();
      }
    } else {
      Alert.alert(
        'Fin de las Preguntas',
        'Has completado todas las preguntas de este tipo.',
        [
          {
            text: 'Volver',
            onPress: () => navigation.goBack(),
          },
          {
            text: 'Repetir',
            onPress: () => {
              updateCurrentIndex(0);
              if (flipCardRef.current) {
                flipCardRef.current.reset();
              }
            },
          },
        ]
      );
    }
  };

  const handleToggleMark = async () => {
    const newMarked = new Set(markedQuestions);
    if (isMarked) {
      newMarked.delete(current.id);
    } else {
      newMarked.add(current.id);
    }
    setMarkedQuestions(newMarked);
    
    try {
      await AsyncStorage.setItem('@practice:marked', JSON.stringify([...newMarked]));
    } catch (error) {
      console.error('Error saving marked question:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{typeName}</Text>
          <Text style={styles.headerSubtitle}>{typeNameEn}</Text>
        </View>
        <TouchableOpacity onPress={handleLanguageToggle} style={styles.languageButton}>
          <Text style={styles.languageText}>{language.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {filteredQuestions.length}
          </Text>
          <TouchableOpacity onPress={handleToggleMark} style={styles.markButton}>
            <MaterialCommunityIcons 
              name={isMarked ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color={isMarked ? "#f59e0b" : "#6b7280"} 
            />
          </TouchableOpacity>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((currentIndex + 1) / filteredQuestions.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.cardContainer}>
        <FlipCard
          ref={flipCardRef}
          frontContent={{
            number: current.id,
            question: current.questionEs,
            questionEn: current.questionEn,
          }}
          backContent={{
            answer: current.answerEs,
            answerEn: current.answerEn,
          }}
          language={language}
          isImportant={current.asterisk}
          onFlip={handleCardFlip}
        />
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePreviousCard}
          disabled={currentIndex === 0}
        >
          <MaterialCommunityIcons 
            name="chevron-left" 
            size={20} 
            color={currentIndex === 0 ? '#d1d5db' : '#1E40AF'} // Azul profesional 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.audioButton}
          onPress={handleAudioToggle}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons 
            name={isPlaying ? 'stop' : 'play'} 
            size={20} 
            color="#1E40AF" // Azul profesional 
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, currentIndex === filteredQuestions.length - 1 && styles.navButtonDisabled]}
          onPress={handleNextCard}
          disabled={currentIndex === filteredQuestions.length - 1}
        >
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={20} 
            color={currentIndex === filteredQuestions.length - 1 ? '#d1d5db' : '#1E40AF'} // Azul profesional 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1E40AF', // Azul profesional
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
  },
  languageText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  progressContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  markButton: {
    padding: 4,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1E40AF', // Azul profesional
    borderRadius: 2,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  audioButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E40AF', // Azul profesional
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(124, 77, 255, 0.15)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default StudyCardsByTypeScreen;

