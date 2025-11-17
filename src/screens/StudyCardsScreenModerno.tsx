// src/screens/StudyCardsScreenModerno.tsx

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { questions } from '../data/questions';
import { StudyCardsRouteProp, NavigationProps } from '../types/navigation';
import FlipCard from '../components/FlipCard';
import { useSectionProgress } from '../hooks/useSectionProgress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { questionAudioMap } from '../assets/audio/questions/questionsMap';
import { answerAudioMap } from '../assets/audio/answers/answersMap';

const { width } = Dimensions.get('window');

const StudyCardsScreenModerno = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<StudyCardsRouteProp>();
  const { category, title, subtitle } = route.params;
  const flipCardRef = useRef<any>(null);

  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // Filtrar preguntas por categoría y subcategoría
  const filteredQuestions = useMemo(() => {
    return questions.filter(
      (q) => q.category === category && q.subcategory === subtitle
    );
  }, [category, subtitle]);

  // Crear ID único para la sección
  const sectionId = `${category}_${subtitle}`.replace(/\s+/g, '_');
  
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
          <Text style={styles.headerTitle}>Tarjetas de Estudio</Text>
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

  // Marcar pregunta vista para progreso global
  useEffect(() => {
    const markViewed = async () => {
      try {
        if (!current) return;
        const key = '@study:viewed';
        const existing = await AsyncStorage.getItem(key);
        const set = new Set<number>(existing ? JSON.parse(existing) : []);
        if (!set.has(current.id)) {
          set.add(current.id);
          await AsyncStorage.setItem(key, JSON.stringify(Array.from(set)));
        }
      } catch (e) {
        // no-op: progreso es best-effort
      }
    };
    markViewed();
  }, [current?.id]);

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

  const handleNextCard = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      updateCurrentIndex(currentIndex + 1);
      if (flipCardRef.current) {
        flipCardRef.current.reset();
      }
    } else {
      Alert.alert(
        'Fin de la Subcategoría',
        'Has completado todas las tarjetas de esta sección.',
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

  const handlePreviousCard = () => {
    if (currentIndex > 0) {
      updateCurrentIndex(currentIndex - 1);
      if (flipCardRef.current) {
        flipCardRef.current.reset();
      }
    }
  };

  const handleMarkCard = async () => {
    try {
      const newMarked = new Set(markedQuestions);
      if (newMarked.has(current.id)) {
        newMarked.delete(current.id);
      } else {
        newMarked.add(current.id);
      }
      setMarkedQuestions(newMarked);
      await AsyncStorage.setItem(
        '@practice:marked',
        JSON.stringify([...newMarked])
      );
    } catch (error) {
      console.error('Error marking question:', error);
    }
  };

  const handleShowExplanation = () => {
    navigation.navigate('Explanation', {
      explanationEs: current.explanationEs,
      explanationEn: current.explanationEn,
      questionTitle: language === 'es' ? current.questionEs : current.questionEn,
    });
  };

  const handleLanguageToggle = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const handleCardFlip = (isFlipped: boolean) => {
    setIsFlipped(isFlipped);
    stopAudio(); // Detener audio al voltear
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            {subtitle}
          </Text>
          <Text style={styles.headerSubtitle}>Tarjetas de Estudio</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={handleMarkCard}
            style={styles.headerButton}
          >
            <MaterialCommunityIcons
              name={isMarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isMarked ? '#f59e0b' : '#6b7280'}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {filteredQuestions.length}
          </Text>
          <TouchableOpacity onPress={handleLanguageToggle} style={styles.languageButton}>
            <Text style={styles.languageText}>{language.toUpperCase()}</Text>
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
            color={currentIndex === 0 ? '#d1d5db' : '#7C4DFF'} 
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
            color="#7C4DFF" 
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
            color={currentIndex === filteredQuestions.length - 1 ? '#d1d5db' : '#7C4DFF'} 
          />
        </TouchableOpacity>
      </View>

      {/* Botón flotante de explicación */}
      <TouchableOpacity
        style={styles.explanationFloatingButton}
        onPress={handleShowExplanation}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="lightbulb-on-outline" size={22} color="#10B981" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        alignItems: 'center',
      },
    }),
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 1200,
        paddingHorizontal: 32,
        paddingVertical: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      },
    }),
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    zIndex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 1,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 0,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 2,
    letterSpacing: 0.1,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 1200,
        paddingHorizontal: 32,
        paddingVertical: 20,
      },
    }),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  languageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
  },
  languageText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C4DFF',
  },
  progressBarBackground: {
    height: 5,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#A277FF',
    borderRadius: 3,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 1200,
        padding: 32,
        paddingTop: 24,
        paddingBottom: 24,
      },
    }),
  },
  flipCardWrapper: {
    width: '100%',
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 1200,
        paddingHorizontal: 32,
        paddingVertical: 20,
        justifyContent: 'center',
        gap: 24,
      },
    }),
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#A277FF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  navButtonDisabled: {
    opacity: 0.3,
    borderColor: '#d1d5db',
  },
  audioButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(124, 77, 255, 0.15)',
  },
  explanationFloatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#C7F5CE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
});

export default StudyCardsScreenModerno;
