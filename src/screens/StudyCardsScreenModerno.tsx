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
import { questions } from '../data/questions';
import { StudyCardsRouteProp, NavigationProps } from '../types/navigation';
import FlipCard from '../components/FlipCard';
import { useSectionProgress } from '../hooks/useSectionProgress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { questionAudioMap } from '../assets/audio/questions/questionsMap';
import { answerAudioMap } from '../assets/audio/answers/answersMap';
import WebLayout from '../components/layout/WebLayout';
import { useIsWebDesktop } from '../hooks/useIsWebDesktop';
import { usePremium } from '../context/PremiumContext';
import ProgressModal from '../components/ProgressModal';
import { audioManager } from '../services/AudioManagerService';
import { SectionNavigationService, NextSectionInfo } from '../services/SectionNavigationService';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const StudyCardsScreenModerno = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<StudyCardsRouteProp>();
  const isWebDesktop = useIsWebDesktop();
  const { category, title, subtitle, blockRange, blockTitle } = route.params as any; // Cast as any because it's a new parameter
  const flipCardRef = useRef<any>(null);
  const { isPremium } = usePremium();

  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  
  const [showNextSectionDialog, setShowNextSectionDialog] = useState(false);
  const [nextSectionInfo, setNextSectionInfo] = useState<NextSectionInfo | null>(null);

  // Filtrar preguntas por categoría y subcategoría, aplicando bloque si existe
  const filteredQuestions = useMemo(() => {
    let qlist = questions.filter(
      (q) => q.category === category && q.subcategory === subtitle
    );
    if (blockRange) {
       qlist = qlist.slice(blockRange[0], blockRange[1]);
    }
    return qlist;
  }, [category, subtitle, blockRange]);

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
  } = useSectionProgress(sectionId, filteredQuestions.length);

  const stopAudio = useCallback(async () => {
    try {
      await audioManager.stopCurrentAudio();
    } catch (error) {
      console.log('Audio stop ignored from StudyCardsScreenModerno:', error);
    } finally {
      setIsPlaying(false);
    }
  }, []);

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
  }, [currentIndex, stopAudio]);

  const current = filteredQuestions.length > 0 ? filteredQuestions[currentIndex] : null;
  const isMarked = current ? markedQuestions.has(current.id) : false;

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

  // Early return después de todos los hooks
  if (filteredQuestions.length === 0 || !current) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{blockTitle || subtitle || 'Tarjetas de Estudio'}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No hay preguntas disponibles</Text>
        </View>
      </SafeAreaView>
    );
  }

  const playAudio = useCallback(async () => {
    try {
      if (!current?.id) return;

      await stopAudio();

      const audioMap = isFlipped ? answerAudioMap : questionAudioMap;
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
      console.error('Error playing audio in StudyCardsScreenModerno:', error);
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
      const isLastInSection = SectionNavigationService.isLastQuestionInSection(current.id);
      
      if (isLastInSection) {
        const nextSection = SectionNavigationService.getNextSection(current.id);
        
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

  const handleContinueToNextSection = async () => {
    if (!nextSectionInfo) return;
    
    await stopAudio();
    setShowNextSectionDialog(false);
    
    navigation.replace('StudyCards', {
      category: nextSectionInfo.category as any,
      title: nextSectionInfo.title,
      subtitle: nextSectionInfo.subcategory,
      questionRange: nextSectionInfo.questionRange,
    });
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

  const content = (
    <>
      {!isWeb && (
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
        {!isPremium && current.id > 20 ? (
          <View style={styles.lockedCardContainer}>
            <View style={styles.lockedCardContent}>
              <MaterialCommunityIcons name="lock" size={64} color="#F59E0B" />
              <Text style={styles.lockedCardTitle}>Pregunta Premium</Text>
              <Text style={styles.lockedCardText}>
                La pregunta {current.id} es parte de las 100 preguntas oficiales completas.
                Actualízate a Premium para acceder a esta y todas las demás preguntas, además de desbloquear modos de práctica avanzados.
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

  // Web móvil o app móvil: usar SafeAreaView (diseño idéntico)
  return (
    <SafeAreaView style={styles.safeArea}>
      {content}
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
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
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  dialogSectionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4F46E5', // Primary Indigo
    textAlign: 'center',
    marginBottom: 24,
  },
  dialogButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogButtonCancel: {
    backgroundColor: '#f3f4f6',
  },
  dialogButtonConfirm: {
    backgroundColor: '#4F46E5', // Primary Indigo
  },
  dialogButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  dialogButtonTextConfirm: {
    color: 'white',
  },
});

export default StudyCardsScreenModerno;
