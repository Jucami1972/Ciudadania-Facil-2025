// src/screens/practice/N400SectionPracticeScreen.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { NavigationProps } from '../../types/navigation';
import {
  n400Questions,
  N400Question,
  N400Section,
  n400Sections,
  getQuestionsBySection,
} from '../../data/n400FormPractice';
import { n400AudioMap } from '../../assets/audio/n400/n400AudioMap';

type RouteParams = {
  N400SectionPractice: {
    sectionId: string;
    sectionKey: string;
    sectionTitle: string;
  };
};

const N400SectionPracticeScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<RouteProp<RouteParams, 'N400SectionPractice'>>();
  const insets = useSafeAreaInsets();
  const { sectionId, sectionKey, sectionTitle } = route.params;

  const [questions, setQuestions] = useState<N400Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showVariations, setShowVariations] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Get section color
  const sectionInfo = n400Sections.find((s) => s.id === sectionId || s.key === sectionKey);
  const sectionColor = sectionInfo?.color || '#1E40AF';

  useEffect(() => {
    const qs =
      sectionId === 'all'
        ? [...n400Questions]
        : getQuestionsBySection(sectionId as N400Section);
    setQuestions(qs);
    setCurrentIndex(0);
    setShowAnswer(false);
    setShowVariations(false);
  }, [sectionId]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const currentQuestion = questions[currentIndex];

  const playAudio = useCallback(
    async (audioKey: string) => {
      try {
        // Stop previous
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        const audioSource = n400AudioMap[audioKey];
        if (!audioSource) {
          if (__DEV__) console.warn('Audio not found:', audioKey);
          return;
        }

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound } = await Audio.Sound.createAsync(audioSource, { shouldPlay: true });
        soundRef.current = sound;
        setIsPlaying(true);

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } catch (error) {
        if (__DEV__) console.error('Error playing audio:', error);
        setIsPlaying(false);
      }
    },
    []
  );

  const handlePlayQuestion = () => {
    if (!currentQuestion) return;
    // Audio key = section_key + "_" + number (e.g., "id_1")
    playAudio(currentQuestion.id);
  };

  const handlePlayVariation = (variationIndex: number) => {
    if (!currentQuestion) return;
    playAudio(`${currentQuestion.id}_v${variationIndex + 1}`);
  };

  const handlePlayResponse = () => {
    if (!currentQuestion) return;
    playAudio(`${currentQuestion.id}_resp`);
  };

  const animateTransition = (callback: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      animateTransition(() => {
        setCurrentIndex((prev) => prev + 1);
        setShowAnswer(false);
        setShowVariations(false);
      });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      animateTransition(() => {
        setCurrentIndex((prev) => prev - 1);
        setShowAnswer(false);
        setShowVariations(false);
      });
    }
  };

  if (!currentQuestion) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#718096' }}>No hay preguntas para esta sección.</Text>
      </View>
    );
  }

  // Check which audio files exist for this question
  const hasQuestionAudio = !!n400AudioMap[currentQuestion.id];
  const hasResponseAudio = !!n400AudioMap[`${currentQuestion.id}_resp`];
  const variationsWithAudio = currentQuestion.variations.map(
    (_, i) => !!n400AudioMap[`${currentQuestion.id}_v${i + 1}`]
  );

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={[styles.headerContainer, { backgroundColor: sectionColor }]}>
        <LinearGradient
          colors={[sectionColor, sectionColor + 'CC'] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{sectionTitle}</Text>
              <Text style={styles.headerSubtitle}>
                {currentIndex + 1} de {questions.length}
              </Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((currentIndex + 1) / questions.length) * 100}%` },
              ]}
            />
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Question Card */}
          <View style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={[styles.questionBadge, { backgroundColor: sectionColor + '15' }]}>
                <Text style={[styles.questionBadgeText, { color: sectionColor }]}>
                  Pregunta {currentIndex + 1}
                </Text>
              </View>
              {hasQuestionAudio && (
                <TouchableOpacity
                  onPress={handlePlayQuestion}
                  style={[styles.audioButton, { backgroundColor: sectionColor }]}
                  disabled={isPlaying}
                >
                  <MaterialCommunityIcons
                    name={isPlaying ? 'volume-high' : 'play'}
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.questionText}>{currentQuestion.question}</Text>
            <Text style={styles.questionTextEs}>{currentQuestion.questionEs}</Text>

            {/* Tip */}
            <View style={styles.tipContainer}>
              <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#F59E0B" />
              <Text style={styles.tipText}>{currentQuestion.tipEs}</Text>
            </View>
          </View>

          {/* Show/Hide Answer */}
          <TouchableOpacity
            style={[styles.showAnswerButton, { borderColor: sectionColor }]}
            onPress={() => setShowAnswer(!showAnswer)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={showAnswer ? 'eye-off' : 'eye'}
              size={20}
              color={sectionColor}
            />
            <Text style={[styles.showAnswerText, { color: sectionColor }]}>
              {showAnswer ? 'Ocultar consejo de respuesta' : 'Ver consejo de respuesta'}
            </Text>
          </TouchableOpacity>

          {showAnswer && (
            <View style={styles.answerCard}>
              <Text style={styles.answerLabel}>💬 Consejo de respuesta</Text>
              <Text style={styles.answerText}>{currentQuestion.tip}</Text>
              <Text style={styles.answerTextEs}>{currentQuestion.tipEs}</Text>
              {hasResponseAudio && (
                <TouchableOpacity
                  onPress={handlePlayResponse}
                  style={[styles.playResponseButton, { backgroundColor: sectionColor + '15' }]}
                  disabled={isPlaying}
                >
                  <MaterialCommunityIcons
                    name={isPlaying ? 'volume-high' : 'play-circle'}
                    size={18}
                    color={sectionColor}
                  />
                  <Text style={[styles.playResponseText, { color: sectionColor }]}>
                    Escuchar ejemplo de respuesta
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Variations */}
          {currentQuestion.variations.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.variationsToggle}
                onPress={() => setShowVariations(!showVariations)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={showVariations ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#64748B"
                />
                <Text style={styles.variationsToggleText}>
                  {showVariations ? 'Ocultar variaciones' : `Ver ${currentQuestion.variations.length} variaciones`}
                </Text>
              </TouchableOpacity>

              {showVariations && (
                <View style={styles.variationsCard}>
                  <Text style={styles.variationsLabel}>
                    🔄 Otras formas de hacer esta pregunta:
                  </Text>
                  {currentQuestion.variations.map((v, i) => (
                    <View key={i} style={styles.variationItem}>
                      <Text style={styles.variationText}>"{v}"</Text>
                      {variationsWithAudio[i] && (
                        <TouchableOpacity
                          onPress={() => handlePlayVariation(i)}
                          style={styles.variationAudioBtn}
                          disabled={isPlaying}
                        >
                          <MaterialCommunityIcons
                            name="volume-high"
                            size={16}
                            color={sectionColor}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Navigation Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          onPress={handlePrevious}
          disabled={currentIndex === 0}
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={currentIndex === 0 ? '#CBD5E1' : '#1E40AF'}
          />
          <Text
            style={[styles.navButtonText, currentIndex === 0 && styles.navButtonTextDisabled]}
          >
            Anterior
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerCounter}>
          {currentIndex + 1} / {questions.length}
        </Text>

        <TouchableOpacity
          onPress={handleNext}
          disabled={currentIndex === questions.length - 1}
          style={[
            styles.navButton,
            currentIndex === questions.length - 1 && styles.navButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.navButtonText,
              currentIndex === questions.length - 1 && styles.navButtonTextDisabled,
            ]}
          >
            Siguiente
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={currentIndex === questions.length - 1 ? '#CBD5E1' : '#1E40AF'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
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
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  // ─── QUESTION CARD ──────────────
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  questionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  audioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 26,
    marginBottom: 8,
  },
  questionTextEs: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  // ─── ANSWER ──────────────
  showAnswerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    marginBottom: 16,
  },
  showAnswerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  answerCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 8,
  },
  answerText: {
    fontSize: 15,
    color: '#065F46',
    lineHeight: 22,
    marginBottom: 4,
  },
  answerTextEs: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  playResponseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  playResponseText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // ─── VARIATIONS ──────────────
  variationsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingVertical: 4,
  },
  variationsToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  variationsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  variationsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  variationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  variationText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  variationAudioBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  // ─── FOOTER ──────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  navButtonTextDisabled: {
    color: '#CBD5E1',
  },
  footerCounter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
});

export default N400SectionPracticeScreen;
