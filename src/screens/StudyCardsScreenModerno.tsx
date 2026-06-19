// src/screens/StudyCardsScreenModerno.tsx

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { questions } from '../data/questions';
import { questions128 } from '../data/questions128';
import { useExamMode } from '../context/ExamModeContext';
import { StudyCardsRouteProp, NavigationProps } from '../types/navigation';
import FlipCard from '../components/FlipCard';
import { useSectionProgress } from '../hooks/useSectionProgress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { questionAudioMap } from '../assets/audio/questions/questionsMap';
import { answerAudioMap } from '../assets/audio/answers/answersMap';
import { questionAudioMap128 } from '../assets/audio/exam128/questions/questionsMap128';
import { answerAudioMap128 } from '../assets/audio/exam128/answers/answersMap128';
import WebLayout from '../components/layout/WebLayout';
import { useIsWebDesktop } from '../hooks/useIsWebDesktop';
import { usePremium } from '../context/PremiumContext';
import ProgressModal from '../components/ProgressModal';
import { audioManager } from '../services/AudioManagerService';
import { SectionNavigationService, NextSectionInfo } from '../services/SectionNavigationService';
import { getPracticeMarkedKey, getStudyViewedKey } from '../utils/examModeStorage';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const StudyCardsScreenModerno = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<StudyCardsRouteProp>();
  const isWebDesktop = useIsWebDesktop();
  const { examMode } = useExamMode();
  const { category, title, subtitle, subcategoryKey, blockRange, blockTitle } = route.params;
  const flipCardRef = useRef<any>(null);
  const { isPremium } = usePremium();

  /** Clave para filtrar q.subcategory — puede ser distinta al subtitle de display (128-exam) */
  const filterKey: string = subcategoryKey ?? subtitle;

  /** Seleccionar el set de preguntas según el modo de examen */
  const activeQuestions: any[] = examMode === '128' ? questions128 : questions;

  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [showNextSectionDialog, setShowNextSectionDialog] = useState(false);
  const [nextSectionInfo, setNextSectionInfo] = useState<NextSectionInfo | null>(null);

  // Filtrar preguntas por categoría y subcategoría, aplicando bloque si existe
  const filteredQuestions = useMemo(() => {
    let qlist = (activeQuestions as any[]).filter(
      (q) => q.category === category && q.subcategory === filterKey
    );
    if (blockRange) {
       qlist = qlist.slice(blockRange[0], blockRange[1]);
    }
    return qlist;
  }, [category, filterKey, blockRange, activeQuestions]);

  // Crear ID único para la sección (diferente si es un bloque)
  const sectionId = blockRange 
    ? `${category}_${subtitle}_block_${blockRange[0]}`.replace(/\s+/g, '_')
    : `${category}_${subtitle}`.replace(/\s+/g, '_');
  
  // Hook para manejar progreso de la sección
  const {
    currentIndex,
    lastSavedIndex,
    showProgressModal,
    isLoading: progressLoading,
    updateCurrentIndex,
    continueFromSaved,
    restartFromBeginning,
    viewAllQuestions,
    closeProgressModal,
    clearProgress,
  } = useSectionProgress(sectionId, filteredQuestions.length);

  const stopAudio = useCallback(async () => {
    try {
      await audioManager.stopCurrentAudio();
    } catch (error) {
      if (__DEV__) console.log('Audio stop ignored from StudyCardsScreenModerno:', error);
    } finally {
      setIsPlaying(false);
    }
  }, []);

  // Cargar preguntas marcadas
  useEffect(() => {
    const loadMarkedQuestions = async () => {
      try {
        const markedData = await AsyncStorage.getItem(getPracticeMarkedKey(examMode));
        if (markedData) {
          setMarkedQuestions(new Set(JSON.parse(markedData)));
        }
      } catch (error) {
        if (__DEV__) console.error('Error loading marked questions:', error);
      }
    };
    loadMarkedQuestions();
  }, [examMode]);

  // Detener audio cuando cambia la pregunta o se resetea la tarjeta
  useEffect(() => {
    stopAudio();
    setIsFlipped(false);
    // Detener audio cuando se resetea la tarjeta
    if (flipCardRef.current) {
      flipCardRef.current.reset();
    }
  }, [currentIndex, stopAudio]);

  const current = filteredQuestions.length > 0 ? filteredQuestions[currentIndex] : null;
  const isMarked = current ? markedQuestions.has(current.id) : false;

  // Marcar pregunta vista para progreso global + actualizar racha y conteo diario
  useEffect(() => {
    const markViewed = async () => {
      try {
        if (!current) return;
        const key = getStudyViewedKey(examMode);
        const existing = await AsyncStorage.getItem(key);
        const set = new Set<number>(existing ? JSON.parse(existing) : []);
        if (!set.has(current.id)) {
          set.add(current.id);
          await AsyncStorage.setItem(key, JSON.stringify(Array.from(set)));

          // Actualizar conteo diario
          const todayStr = new Date().toDateString();
          const dailyKey = `@study:dailyQuestions_${todayStr}`;
          const dailyRaw = await AsyncStorage.getItem(dailyKey);
          const dailyStats = dailyRaw ? JSON.parse(dailyRaw) : { questions: 0, time: 0 };
          dailyStats.questions += 1;
          dailyStats.date = todayStr;
          await AsyncStorage.setItem(dailyKey, JSON.stringify(dailyStats));

          // Actualizar racha
          const lastDate = await AsyncStorage.getItem('@study:lastDate');
          const streakRaw = await AsyncStorage.getItem('@study:streak');
          const currentStreak = parseInt(streakRaw || '0', 10);

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          let newStreak = currentStreak;
          if (lastDate) {
            const last = new Date(lastDate);
            last.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 0) {
              newStreak = currentStreak; // Ya estudió hoy
            } else if (diffDays === 1) {
              newStreak = currentStreak + 1; // Día consecutivo
            } else {
              newStreak = 1; // Gap, reiniciar
            }
          } else {
            newStreak = 1; // Primera vez
          }

          await Promise.all([
            AsyncStorage.setItem('@study:streak', newStreak.toString()),
            AsyncStorage.setItem('@study:lastDate', new Date().toISOString()),
          ]);
        }
      } catch (e) {
        // no-op: progreso es best-effort
      }
    };
    markViewed();
  }, [current?.id, examMode]);

  const playAudio = useCallback(async () => {
    try {
      if (!current?.id) return;

      await stopAudio();

      const qAudioMap = examMode === '128' ? questionAudioMap128 : questionAudioMap;
      const aAudioMap = examMode === '128' ? answerAudioMap128 : answerAudioMap;
      const audioMap = isFlipped ? aAudioMap : qAudioMap;
      const module = audioMap[current.id];

      if (!module) {
        Alert.alert('Audio no disponible', 'No hay audio disponible para esta pregunta.');
        return;
      }

      setIsPlaying(true);
      await audioManager.playAudio(module, () => {
        setIsPlaying(false);
      });
    } catch (error) {
      if (__DEV__) console.error('Error playing audio in StudyCardsScreenModerno:', error);
      setIsPlaying(false);
    }
  }, [current, isFlipped, stopAudio]);

  const handleAudioToggle = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      playAudio();
    }
  };

  const handleNextCard = () => {
    if (!current) return;
    
    if (currentIndex < filteredQuestions.length - 1) {
      updateCurrentIndex(currentIndex + 1);
      if (flipCardRef.current) {
        flipCardRef.current.reset();
      }
    } else {
      const isLastInSection = SectionNavigationService.isLastQuestionInSection(current.id, examMode);
      
      if (isLastInSection) {
        const nextSection = SectionNavigationService.getNextSection(current.id, examMode);
        
        if (nextSection && nextSection.exists) {
          setNextSectionInfo(nextSection);
          setShowNextSectionDialog(true);
          return;
        }
      }
      
      Alert.alert(
        'Fin de la Subcategoría',
        'Has completado todas las tarjetas de esta sección.',
        [
          {
            text: 'Volver',
            onPress: () => {
              clearProgress();
              navigation.goBack();
            },
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

  const handleContinueToNextSection = async () => {
    if (!nextSectionInfo) return;
    await stopAudio();
    setShowNextSectionDialog(false);
    await clearProgress();
    navigation.replace('StudyCards', {
      category: nextSectionInfo.category as any,
      title: nextSectionInfo.title,
      subtitle: nextSectionInfo.subcategory,
      questionRange: nextSectionInfo.questionRange,
    });
  };

  const handleRestartSection = () => {
    setShowNextSectionDialog(false);
    setNextSectionInfo(null);
    restartFromBeginning();
  };

  const handlePracticeSection = () => {
    setShowNextSectionDialog(false);
    setNextSectionInfo(null);
    navigation.navigate('Practice', {
      screen: 'CategoryPractice',
      params: { questionType: category, subcategory: filterKey },
    } as any);
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
    if (!current) return;
    try {
      const newMarked = new Set(markedQuestions);
      if (newMarked.has(current.id)) {
        newMarked.delete(current.id);
      } else {
        newMarked.add(current.id);
      }
      setMarkedQuestions(newMarked);
      await AsyncStorage.setItem(
        getPracticeMarkedKey(examMode),
        JSON.stringify([...newMarked])
      );
    } catch (error) {
      if (__DEV__) console.error('Error marking question:', error);
    }
  };

  const handleShowExplanation = () => {
    if (!current) return;
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

  // GUARDIA CRÍTICA: estos checks DEBEN ir antes de que se evalúe el JSX de `content`.
  // Si se colocan después, current.id ya habrá explotado antes de llegar al guard.
  if (progressLoading) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.mainContainer}>
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.header, { paddingTop: insets.top + 8 }]}
            >
              <View style={styles.headerContent}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle}>{blockTitle || subtitle || 'Tarjetas de Estudio'}</Text>
                </View>
                <View style={{ width: 44 }} />
              </View>
            </LinearGradient>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Cargando...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (filteredQuestions.length === 0 || !current) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.mainContainer}>
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.header, { paddingTop: insets.top + 8 }]}
            >
              <View style={styles.headerContent}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                  <Text style={styles.headerTitle}>{blockTitle || subtitle || 'Tarjetas de Estudio'}</Text>
                </View>
                <View style={{ width: 44 }} />
              </View>
            </LinearGradient>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No hay preguntas disponibles</Text>
          </View>
        </View>
      </View>
    );
  }

  const content = (
    <>
      {!isWeb && (
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 8 }]}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle} numberOfLines={2}>
                  {subtitle}
                </Text>
                <Text style={styles.headerSubtitle}>Tarjetas de Estudio</Text>
              </View>
              <TouchableOpacity 
                onPress={handleMarkCard}
                style={styles.bookmarkButton}
              >
                <MaterialCommunityIcons
                  name={isMarked ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={isMarked ? '#FCD34D' : 'rgba(255,255,255,0.7)'}
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

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
        {!isPremium && current!.id > 20 ? (
          <View style={styles.lockedCardContainer}>
            <View style={styles.lockedCardContent}>
              <MaterialCommunityIcons name="lock" size={64} color="#F59E0B" />
              <Text style={styles.lockedCardTitle}>Pregunta Premium</Text>
              <Text style={styles.lockedCardText}>
                Esta pregunta es parte del banco oficial del examen de ciudadanía.
                Actualízate a Premium para acceder a todas las preguntas y desbloquear modos de práctica avanzados.
              </Text>
              <TouchableOpacity
                style={styles.unlockButton}
                onPress={() => navigation.navigate('Subscription' as any)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="crown" size={20} color="#FFF" />
                <Text style={styles.unlockButtonText}>Desbloquear Premium</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
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
        )}
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
          style={styles.navButton}
          onPress={handleNextCard}
        >
          <MaterialCommunityIcons 
            name="chevron-right" 
            size={20} 
            color={'#1E40AF'} // Azul profesional 
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

      {/* Modal de progreso guardado */}
      <ProgressModal
        visible={showProgressModal && !progressLoading}
        onClose={closeProgressModal}
        onContinue={() => {
          continueFromSaved();
        }}
        onRestart={() => {
          restartFromBeginning();
        }}
        onViewAll={viewAllQuestions}
        sectionName={blockTitle || subtitle || title}
        currentQuestion={lastSavedIndex + 1}
        totalQuestions={filteredQuestions.length}
      />

      {/* Modal de fin de sección */}
      <Modal
        visible={showNextSectionDialog}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowNextSectionDialog(false);
          setNextSectionInfo(null);
        }}
      >
        {nextSectionInfo && (
          <TouchableOpacity
            style={styles.sheetOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowNextSectionDialog(false);
              setNextSectionInfo(null);
            }}
          >
            <TouchableOpacity activeOpacity={1} style={styles.bottomSheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>¡Sección completada!</Text>
              <Text style={styles.sheetSubtitle}>
                Siguiente:{' '}
                <Text style={styles.sheetSectionName}>{nextSectionInfo.subcategory}</Text>
              </Text>

              <TouchableOpacity
                style={styles.sheetButtonRestart}
                onPress={handleRestartSection}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="refresh" size={18} color="#1E40AF" />
                <Text style={styles.sheetButtonRestartText}>Volver a estudiar este tema</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetButtonPractice}
                onPress={handlePracticeSection}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="pencil-box-outline" size={18} color="#7C3AED" />
                <Text style={styles.sheetButtonPracticeText}>Practicar este tema</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetButtonContinue}
                onPress={handleContinueToNextSection}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="arrow-right-circle" size={18} color="#fff" />
                <Text style={styles.sheetButtonContinueText}>Continuar a la siguiente</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowNextSectionDialog(false);
                  setNextSectionInfo(null);
                }}
                style={styles.sheetCancelTouch}
              >
                <Text style={styles.sheetCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      </Modal>
    </>
  );

  // Web de escritorio: usar WebLayout con sidebar
  if (isWeb && isWebDesktop) {
    return (
      <WebLayout headerTitle={blockTitle || subtitle || 'Tarjetas de Estudio'}>
        {content}
      </WebLayout>
    );
  }

  // Web móvil o app móvil
  return (
    <View style={styles.safeArea}>
      <View style={styles.mainContainer}>
        {content}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E3A8A',
    ...Platform.select({
      web: {
        alignItems: 'center',
      },
    }),
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  bookmarkButton: {
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
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
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
    color: '#4F46E5', // Primary Indigo
  },
  progressBarBackground: {
    height: 5,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4F46E5', // Primary Indigo
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
        maxWidth: 700,
        padding: 24,
        paddingTop: 20,
        overflow: 'hidden',
        paddingBottom: 32,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
    }),
  },
  lockedCardContainer: {
    width: '100%',
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedCardContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  lockedCardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  lockedCardText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  unlockButton: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
    borderColor: '#4F46E5',
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
    shadowColor: '#4F46E5', // Primary Indigo
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
  // — Bottom-sheet fin de sección —
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    gap: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  sheetSectionName: {
    fontWeight: '700',
    color: '#1E40AF',
  },
  sheetButtonRestart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  sheetButtonRestartText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
  },
  sheetButtonPractice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  sheetButtonPracticeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C3AED',
  },
  sheetButtonContinue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sheetButtonContinueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetCancelTouch: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 2,
  },
  sheetCancelText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
});

export default StudyCardsScreenModerno;
