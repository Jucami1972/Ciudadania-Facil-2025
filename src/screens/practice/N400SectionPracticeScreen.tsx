// src/screens/practice/N400SectionPracticeScreen.tsx

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { audioManager } from '../../services/AudioManagerService';
import {
  n400Categories,
  n400Protocol,
  n400Definitions,
  getAllN400Questions,
  getN400QuestionsByCategory,
  N400Question,
  N400Category,
  N400ProtocolPhrase,
  N400Definition,
} from '../../data/n400FormPractice';

// Audio maps
import { n400AudioMap } from '../../assets/audio/n400/n400AudioMap';

type RouteParams = {
  N400SectionPractice: {
    categoryId: string;
    mode: 'study' | 'quick';
  };
};

const { width } = Dimensions.get('window');

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Generate 4 comprehension options — 1 correct + 3 distractors
function generateOptions(
  correctQuestion: N400Question,
  allQuestions: N400Question[]
): { text: string; isCorrect: boolean }[] {
  const getOptionText = (q: N400Question) => q.questionEs || q.contextEs;

  const distractors = shuffle(
    allQuestions.filter(q => q.id !== correctQuestion.id)
  ).slice(0, 3);

  const options = shuffle([
    { text: getOptionText(correctQuestion), isCorrect: true },
    ...distractors.map(d => ({ text: getOptionText(d), isCorrect: false })),
  ]);

  return options;
}

type Step = 'listen' | 'comprehend' | 'result';

const N400SectionPracticeScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'N400SectionPractice'>>();
  const insets = useSafeAreaInsets();

  const { categoryId, mode } = route.params;

  // ─── Determine question set ───────────────────────────────────

  const isProtocol = categoryId === 'protocol';
  const isDefinitions = categoryId === 'definitions';
  const isQuickRound = mode === 'quick';

  const category: N400Category | undefined = n400Categories.find(c => c.id === categoryId);

  const questions = useMemo(() => {
    if (isQuickRound) return shuffle(getAllN400Questions()).slice(0, 20);
    if (isProtocol || isDefinitions) return []; // handled separately
    return getN400QuestionsByCategory(categoryId);
  }, [categoryId, isQuickRound, isProtocol, isDefinitions]);

  const allQuestions = useMemo(() => getAllN400Questions(), []);

  // ─── State ────────────────────────────────────────────────────

  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState<Step>('listen');
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVariations, setShowVariations] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showListenHelp, setShowListenHelp] = useState(false);

  const fadeAnim = useState(new Animated.Value(1))[0];

  // Protocol / Definitions state
  const [protoIndex, setProtoIndex] = useState(0);

  // ─── Current item ─────────────────────────────────────────────

  const currentQuestion = questions[currentIndex] as N400Question | undefined;
  const currentProtocol = isProtocol ? n400Protocol[protoIndex] : null;
  const currentDef = isDefinitions ? n400Definitions[protoIndex] : null;
  const totalItems = isProtocol
    ? n400Protocol.length
    : isDefinitions
    ? n400Definitions.length
    : questions.length;

  const currentItemIndex = isProtocol || isDefinitions ? protoIndex : currentIndex;

  const options = useMemo(() => {
    if (!currentQuestion) return [];
    return generateOptions(currentQuestion, allQuestions);
  }, [currentQuestion, allQuestions]);

  // ─── Title ────────────────────────────────────────────────────

  const screenTitle = isQuickRound
    ? 'Ronda Rápida'
    : isProtocol
    ? 'Protocolo'
    : isDefinitions
    ? 'Vocabulario Difícil'
    : category?.title || 'Práctica';

  // ─── Audio playback ───────────────────────────────────────────

  const speakText = useCallback(async (text: string, audioId?: string) => {
    setIsSpeaking(true);
    try {
      // Try pre-generated audio first
      if (audioId && n400AudioMap[audioId]) {
        await audioManager.playAudio(n400AudioMap[audioId]);
        setIsSpeaking(false);
        return;
      }
      // Fallback to TTS
      await Speech.stop();
      Speech.speak(text, {
        language: 'en-US',
        rate: 1.0,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(async () => {
    try {
      await Speech.stop();
      await audioManager.stopCurrentAudio();
    } catch {
      // ignore
    }
    setIsSpeaking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Speech.stop().catch(() => {});
      audioManager.stopCurrentAudio().catch(() => {});
    };
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────

  const handleOptionPress = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    const correct = options[index].isCorrect;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 1);
    setStep('result');
  };

  const handleNext = () => {
    stopSpeaking();
    if (isProtocol || isDefinitions) {
      if (protoIndex < totalItems - 1) {
        setProtoIndex(i => i + 1);
      } else {
        setShowFinishModal(true);
      }
      return;
    }

    if (currentIndex < questions.length - 1) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setCurrentIndex(i => i + 1);
        setStep('listen');
        setSelected(null);
        setIsCorrect(null);
        setShowVariations(false);
        setShowTranslation(false);
        setShowListenHelp(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    } else {
      // Save progress
      saveProgress();
      setShowFinishModal(true);
    }
  };

  const saveProgress = async () => {
    try {
      const raw = await AsyncStorage.getItem('@n400:progress');
      const prog = raw ? JSON.parse(raw) : {};
      if (!isQuickRound && category) {
        prog[category.id] = questions.length;
      }
      await AsyncStorage.setItem('@n400:progress', JSON.stringify(prog));
    } catch {
      // silently ignore
    }
  };

  const handleFinish = () => {
    setShowFinishModal(false);
    navigation.goBack();
  };

  const handleRetryQuestion = () => {
    stopSpeaking();
    setStep('listen');
    setSelected(null);
    setIsCorrect(null);
    setShowVariations(false);
    setShowTranslation(false);
    setShowListenHelp(false);
  };

  // ─── Protocol / Definitions view ───────────────────────────────

  if (isProtocol) {
    const phrase = n400Protocol[protoIndex];
    return (
      <View style={styles.safeArea}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient
          colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => { stopSpeaking(); navigation.goBack(); }} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Protocolo</Text>
            <Text style={styles.headerCounter}>{protoIndex + 1}/{n400Protocol.length}</Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {/* Type badge */}
          <View style={[styles.typeBadge, {
            backgroundColor: phrase.type === 'swearing' ? '#FEF3C7' : phrase.type === 'document' ? '#DBEAFE' : '#F0FDF4'
          }]}>
            <Text style={[styles.typeBadgeText, {
              color: phrase.type === 'swearing' ? '#92400E' : phrase.type === 'document' ? '#1E40AF' : '#166534'
            }]}>
              {phrase.type === 'swearing' ? '⚖️ Juramento' : phrase.type === 'document' ? '📄 Documentos' : '🔄 Transición'}
            </Text>
          </View>

          {/* Phrase card */}
          <View style={styles.phraseCard}>
            <Text style={styles.phraseText}>{phrase.phrase}</Text>
            <TouchableOpacity
              style={styles.listenBtn}
              onPress={() => speakText(phrase.phrase, phrase.id)}
              disabled={isSpeaking}
            >
              <MaterialCommunityIcons
                name={isSpeaking ? 'volume-vibrate' : 'volume-high'}
                size={22}
                color="#1E40AF"
              />
              <Text style={styles.listenBtnText}>
                {isSpeaking ? 'Reproduciendo...' : 'Escuchar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Context in Spanish */}
          <View style={styles.contextCard}>
            <MaterialCommunityIcons name="translate" size={20} color="#1E40AF" />
            <Text style={styles.contextText}>{phrase.contextEs}</Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.nextBtn, protoIndex >= n400Protocol.length - 1 && styles.finishBtn]}
            onPress={handleNext}
          >
            <Text style={styles.nextBtnText}>
              {protoIndex >= n400Protocol.length - 1 ? 'Finalizar' : 'Siguiente'}
            </Text>
            <MaterialCommunityIcons
              name={protoIndex >= n400Protocol.length - 1 ? 'check' : 'arrow-right'}
              size={20}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>

        {renderFinishModal()}
      </View>
    );
  }

  if (isDefinitions) {
    const def = n400Definitions[protoIndex];
    return (
      <View style={styles.safeArea}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient
          colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => { stopSpeaking(); navigation.goBack(); }} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Vocabulario Difícil</Text>
            <Text style={styles.headerCounter}>{protoIndex + 1}/{n400Definitions.length}</Text>
          </View>
        </LinearGradient>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {/* Term */}
          <View style={styles.defTermCard}>
            <Text style={styles.defTerm}>{def.term}</Text>
            <TouchableOpacity
              style={styles.listenBtn}
              onPress={() => speakText(def.term, def.id + '_term')}
              disabled={isSpeaking}
            >
              <MaterialCommunityIcons
                name={isSpeaking ? 'volume-vibrate' : 'volume-high'}
                size={22}
                color="#1E40AF"
              />
            </TouchableOpacity>
          </View>

          {/* Explanation EN */}
          <View style={styles.contextCard}>
            <MaterialCommunityIcons name="book-open-variant" size={20} color="#1E40AF" />
            <Text style={styles.contextText}>{def.explanation}</Text>
          </View>

          {/* Explanation ES */}
          <View style={styles.contextCard}>
            <MaterialCommunityIcons name="translate" size={20} color="#D97706" />
            <Text style={[styles.contextText, { color: '#92400E' }]}>{def.explanationEs}</Text>
          </View>

          {/* N-400 question */}
          <View style={styles.phraseCard}>
            <Text style={styles.defLabel}>Pregunta del N-400:</Text>
            <Text style={styles.phraseText}>{def.n400Question}</Text>
            <TouchableOpacity
              style={styles.listenBtn}
              onPress={() => speakText(def.n400Question, def.id + '_q')}
              disabled={isSpeaking}
            >
              <MaterialCommunityIcons name="volume-high" size={22} color="#1E40AF" />
              <Text style={styles.listenBtnText}>Escuchar pregunta</Text>
            </TouchableOpacity>
          </View>

          {/* Synonyms */}
          <View style={styles.synonymsRow}>
            {def.synonyms.map((s, i) => (
              <View key={i} style={styles.synonymChip}>
                <Text style={styles.synonymText}>{s}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[styles.nextBtn, protoIndex >= n400Definitions.length - 1 && styles.finishBtn]}
            onPress={handleNext}
          >
            <Text style={styles.nextBtnText}>
              {protoIndex >= n400Definitions.length - 1 ? 'Finalizar' : 'Siguiente'}
            </Text>
            <MaterialCommunityIcons
              name={protoIndex >= n400Definitions.length - 1 ? 'check' : 'arrow-right'}
              size={20}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>

        {renderFinishModal()}
      </View>
    );
  }

  // ─── Regular question mode ────────────────────────────────────

  if (!currentQuestion) return null;

  function renderFinishModal() {
    return (
      <Modal visible={showFinishModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <MaterialCommunityIcons name="trophy" size={40} color="#F59E0B" />
            </View>
            <Text style={styles.modalTitle}>
              {isProtocol || isDefinitions ? '¡Sección completada!' : '¡Práctica completada!'}
            </Text>
            {!isProtocol && !isDefinitions && (
              <>
                <Text style={styles.modalScore}>
                  {score}/{questions.length} correctas
                </Text>
                <View style={styles.modalPercent}>
                  <Text style={styles.modalPercentText}>
                    {questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%
                  </Text>
                </View>
              </>
            )}
            <TouchableOpacity style={styles.modalBtn} onPress={handleFinish}>
              <Text style={styles.modalBtnText}>Volver al Inicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <LinearGradient
        colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => { stopSpeaking(); navigation.goBack(); }} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{screenTitle}</Text>
          <Text style={styles.headerCounter}>
            {currentIndex + 1}/{questions.length}
          </Text>
        </View>
        {/* Progress bar */}
        <View style={styles.headerProgress}>
          <View
            style={[
              styles.headerProgressFill,
              { width: `${((currentIndex + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ═══ PASO 1: ESCUCHA (solo audio, sin texto) ═══ */}
          {step === 'listen' && (
            <View style={styles.listenCard}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>1. ESCUCHA</Text>
              </View>

              <Text style={styles.listenInstructions}>
                Escucha lo que dice el oficial de USCIS
              </Text>

              {/* Onda visual */}
              <View style={styles.audioVisual}>
                <MaterialCommunityIcons
                  name={isSpeaking ? 'waveform' : 'microphone'}
                  size={48}
                  color={isSpeaking ? '#3B82F6' : '#94A3B8'}
                />
              </View>

              <View style={styles.audioRow}>
                <TouchableOpacity
                  style={[styles.playButton, isSpeaking && styles.playButtonActive]}
                  onPress={() => speakText(currentQuestion.question, currentQuestion.id)}
                  disabled={isSpeaking}
                >
                  <MaterialCommunityIcons
                    name={isSpeaking ? 'stop' : 'play'}
                    size={28}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.repeatAudioBtn}
                  onPress={() => { stopSpeaking(); speakText(currentQuestion.question, currentQuestion.id); }}
                >
                  <MaterialCommunityIcons name="replay" size={20} color="#1E40AF" />
                  <Text style={styles.repeatAudioText}>Repetir</Text>
                </TouchableOpacity>

              </View>

              {/* Botón de ayuda: revela la pregunta */}
              <TouchableOpacity
                style={styles.listenHelpBtn}
                onPress={() => setShowListenHelp(!showListenHelp)}
              >
                <MaterialCommunityIcons name={showListenHelp ? 'eye-off' : 'help-circle-outline'} size={18} color="#D97706" />
                <Text style={styles.listenHelpBtnText}>
                  {showListenHelp ? 'Ocultar ayuda' : '¿No entendí? Ver pregunta'}
                </Text>
              </TouchableOpacity>

              {showListenHelp && (
                <View style={styles.listenHelpCard}>
                  <Text style={styles.listenHelpLabel}>🇺🇸 En inglés:</Text>
                  <Text style={styles.listenHelpText}>{currentQuestion.question}</Text>
                  {currentQuestion.questionEs && (
                    <>
                      <Text style={[styles.listenHelpLabel, { marginTop: 8 }]}>🇲🇽 En español:</Text>
                      <Text style={styles.listenHelpTextEs}>{currentQuestion.questionEs}</Text>
                    </>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={styles.listenContinueBtn}
                onPress={() => setStep('comprehend')}
              >
                <Text style={styles.listenContinueBtnText}>Ya escuché — Continuar</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* ═══ PASO 2: COMPRENDE (quiz sin texto de pregunta) ═══ */}
          {step === 'comprehend' && (
            <View style={styles.comprehendSection}>
              <Text style={styles.comprehendTitle}>¿Qué te preguntó el oficial?</Text>

              {options.map((opt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.optionCard, selected === i && styles.optionSelected]}
                  onPress={() => handleOptionPress(i)}
                  disabled={selected !== null}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionBullet}>
                    <Text style={styles.optionBulletText}>
                      {String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text style={styles.optionText}>{opt.text}</Text>
                </TouchableOpacity>
              ))}

              {/* Botones de ayuda y repetir audio */}
              <View style={styles.comprehendActions}>
                <TouchableOpacity
                  style={styles.comprehendActionBtn}
                  onPress={() => { stopSpeaking(); speakText(currentQuestion.question, currentQuestion.id); }}
                >
                  <MaterialCommunityIcons name="volume-high" size={18} color="#1E40AF" />
                  <Text style={styles.comprehendActionText}>Repetir audio</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.comprehendActionBtn, styles.helpActionBtn]}
                  onPress={() => setShowHelpModal(true)}
                >
                  <MaterialCommunityIcons name="help-circle" size={18} color="#D97706" />
                  <Text style={[styles.comprehendActionText, { color: '#D97706' }]}>Ayuda</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ═══ PASO 3: RESULTADO ═══ */}
          {step === 'result' && (
            <>
              {/* Resultado correcto/incorrecto */}
              <View style={[styles.resultBanner, isCorrect ? styles.resultBannerCorrect : styles.resultBannerWrong]}>
                <MaterialCommunityIcons
                  name={isCorrect ? 'check-circle' : 'close-circle'}
                  size={24}
                  color={isCorrect ? '#059669' : '#DC2626'}
                />
                <Text style={[styles.resultBannerText, { color: isCorrect ? '#059669' : '#DC2626' }]}>
                  {isCorrect ? '¡Correcto!' : 'Incorrecto'}
                </Text>
              </View>

              {/* Opciones con resultado */}
              <View style={styles.comprehendSection}>
                {options.map((opt, i) => {
                  const isSelectedOpt = selected === i;
                  const showCorrect = opt.isCorrect;
                  const showWrong = isSelectedOpt && !opt.isCorrect;

                  return (
                    <View
                      key={i}
                      style={[
                        styles.optionCard,
                        showCorrect && styles.optionCorrect,
                        showWrong && styles.optionWrong,
                      ]}
                    >
                      <View style={[
                        styles.optionBullet,
                        showCorrect && { backgroundColor: '#059669' },
                        showWrong && { backgroundColor: '#DC2626' },
                      ]}>
                        <Text style={[
                          styles.optionBulletText,
                          (showCorrect || showWrong) && { color: '#FFF' },
                        ]}>
                          {String.fromCharCode(65 + i)}
                        </Text>
                      </View>
                      <Text style={[
                        styles.optionText,
                        showCorrect && { color: '#059669', fontWeight: '600' },
                        showWrong && { color: '#DC2626' },
                      ]}>
                        {opt.text}
                      </Text>
                      {showCorrect && (
                        <MaterialCommunityIcons name="check-circle" size={22} color="#059669" />
                      )}
                      {showWrong && (
                        <MaterialCommunityIcons name="close-circle" size={22} color="#DC2626" />
                      )}
                    </View>
                  );
                })}
              </View>

              <View style={styles.resultSection}>
                {/* Risk badge */}
                {currentQuestion.risk && (
                  <View style={[styles.riskBadge, {
                    backgroundColor: currentQuestion.risk === 'high' ? '#FEE2E2' : currentQuestion.risk === 'medium' ? '#FEF3C7' : '#DCFCE7'
                  }]}>
                    <Text style={[styles.riskBadgeText, {
                      color: currentQuestion.risk === 'high' ? '#991B1B' : currentQuestion.risk === 'medium' ? '#92400E' : '#166534'
                    }]}>
                      {currentQuestion.risk === 'high' ? '🔴 Alto riesgo' : currentQuestion.risk === 'medium' ? '🟡 Riesgo medio' : '🟢 Bajo riesgo'}
                    </Text>
                  </View>
                )}

                {/* Pregunta en inglés — ahora se revela */}
                <View style={styles.revealedQuestionCard}>
                  <Text style={styles.revealedLabel}>El oficial preguntó:</Text>
                  <Text style={styles.revealedQuestionText}>{currentQuestion.question}</Text>
                  <TouchableOpacity
                    style={styles.revealedAudioBtn}
                    onPress={() => speakText(currentQuestion.question, currentQuestion.id)}
                    disabled={isSpeaking}
                  >
                    <MaterialCommunityIcons
                      name={isSpeaking ? 'volume-vibrate' : 'volume-high'}
                      size={20}
                      color="#1E40AF"
                    />
                    <Text style={styles.revealedAudioText}>
                      {isSpeaking ? 'Reproduciendo...' : 'Escuchar de nuevo'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Botón ver traducción (toggle) */}
                {currentQuestion.questionEs && (
                  <>
                    <TouchableOpacity
                      style={styles.showTranslationBtn}
                      onPress={() => setShowTranslation(v => !v)}
                    >
                      <MaterialCommunityIcons name="translate" size={18} color="#1E40AF" />
                      <Text style={styles.showTranslationText}>
                        {showTranslation ? 'Ocultar traducción' : 'Ver traducción'}
                      </Text>
                      <MaterialCommunityIcons
                        name={showTranslation ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#1E40AF"
                      />
                    </TouchableOpacity>
                    {showTranslation && (
                      <View style={styles.translationCard}>
                        <MaterialCommunityIcons name="translate" size={18} color="#1E40AF" />
                        <Text style={styles.translationText}>{currentQuestion.questionEs}</Text>
                      </View>
                    )}
                  </>
                )}

                {/* Answer Guide */}
                {currentQuestion.answerGuide && (
                  <View style={styles.guideCard}>
                    <View style={styles.guideHeader}>
                      <MaterialCommunityIcons name="lightbulb-on" size={18} color="#D97706" />
                      <Text style={styles.guideTitle}>Guía de respuesta</Text>
                    </View>
                    <Text style={styles.guideText}>{currentQuestion.answerGuide}</Text>
                  </View>
                )}

                {/* If Yes */}
                {currentQuestion.ifYes && (
                  <View style={styles.ifYesCard}>
                    <View style={styles.guideHeader}>
                      <MaterialCommunityIcons name="message-check" size={18} color="#059669" />
                      <Text style={styles.ifYesTitle}>Si tu respuesta es SÍ:</Text>
                    </View>
                    <Text style={styles.ifYesText}>{currentQuestion.ifYes}</Text>
                  </View>
                )}

                {/* Must Say Yes Warning */}
                {currentQuestion.mustSayYes && (
                  <View style={styles.warningCard}>
                    <View style={styles.guideHeader}>
                      <MaterialCommunityIcons name="alert" size={18} color="#DC2626" />
                      <Text style={styles.warningTitle}>⚠️ Importante</Text>
                    </View>
                    <Text style={styles.warningText}>{currentQuestion.mustSayYes}</Text>
                  </View>
                )}

                {/* Natural responses */}
                {currentQuestion.naturalResponses.length > 0 && (
                  <View style={styles.responsesCard}>
                    <Text style={styles.responsesTitle}>
                      <MaterialCommunityIcons name="message-reply-text" size={16} color="#1E40AF" /> Respuestas modelo
                    </Text>
                    {currentQuestion.naturalResponses.map((r, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.responseRow}
                        onPress={() => speakText(r)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.responseContent}>
                          <Text style={styles.responseText}>• {r}</Text>
                        </View>
                        <View style={styles.responseAudioBtn}>
                          <MaterialCommunityIcons name="volume-high" size={18} color="#1E40AF" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Expected */}
                <View style={styles.expectedCard}>
                  <Text style={styles.expectedLabel}>Se espera:</Text>
                  <Text style={styles.expectedText}>{currentQuestion.expectedResponseType}</Text>
                </View>

                {/* Variations toggle */}
                {currentQuestion.variations.length > 0 && (
                  <TouchableOpacity
                    style={styles.variationsToggle}
                    onPress={() => setShowVariations(v => !v)}
                  >
                    <MaterialCommunityIcons
                      name={showVariations ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#1E40AF"
                    />
                    <Text style={styles.variationsToggleText}>
                      {showVariations ? 'Ocultar' : 'Ver'} {currentQuestion.variations.length} variaciones
                    </Text>
                  </TouchableOpacity>
                )}

                {showVariations && (
                  <View style={styles.variationsCard}>
                    {currentQuestion.variations.map((v, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.variationRow}
                        onPress={() => speakText(v, `${currentQuestion.id}_v${i + 1}`)}
                      >
                        <MaterialCommunityIcons name="volume-medium" size={16} color="#64748B" />
                        <Text style={styles.variationText}>{v}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Footer */}
      {step === 'result' && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetryQuestion}>
            <MaterialCommunityIcons name="replay" size={18} color="#1E40AF" />
            <Text style={styles.retryBtnText}>Repetir</Text>
          </TouchableOpacity>
          <Text style={styles.scoreText}>{score}/{currentIndex + 1}</Text>
          <TouchableOpacity
            style={[styles.nextBtn, currentIndex >= questions.length - 1 && styles.finishBtn]}
            onPress={handleNext}
          >
            <Text style={styles.nextBtnText}>
              {currentIndex >= questions.length - 1 ? 'Ver resultado' : 'Siguiente'}
            </Text>
            <MaterialCommunityIcons
              name={currentIndex >= questions.length - 1 ? 'check' : 'arrow-right'}
              size={20}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Help Modal */}
      <Modal visible={showHelpModal} transparent animationType="slide">
        <View style={styles.helpModalOverlay}>
          <View style={styles.helpModalCard}>
            <View style={styles.helpModalHeader}>
              <MaterialCommunityIcons name="help-circle" size={24} color="#D97706" />
              <Text style={styles.helpModalTitle}>Ayuda</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)} style={styles.helpModalClose}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.helpModalBody} showsVerticalScrollIndicator={false}>
              {/* Pista del tema */}
              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>📌 Tema de la pregunta</Text>
                <Text style={styles.helpSectionText}>{currentQuestion.contextEs}</Text>
              </View>

              {/* Palabras clave */}
              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>🔑 Palabras clave a escuchar</Text>
                <View style={styles.helpKeywordsRow}>
                  {currentQuestion.question.split(' ')
                    .filter(w => w.length > 3)
                    .slice(0, 5)
                    .map((word, i) => (
                      <View key={i} style={styles.helpKeywordChip}>
                        <Text style={styles.helpKeywordText}>{word.replace(/[?,]/g, '')}</Text>
                      </View>
                    ))
                  }
                </View>
              </View>

              {/* Riesgo */}
              {currentQuestion.risk && (
                <View style={styles.helpSection}>
                  <Text style={styles.helpSectionTitle}>⚡ Nivel de riesgo</Text>
                  <Text style={styles.helpSectionText}>
                    {currentQuestion.risk === 'high'
                      ? '🔴 Alto riesgo — Esta pregunta es crítica. Una respuesta incorrecta puede afectar tu caso.'
                      : currentQuestion.risk === 'medium'
                      ? '🟡 Riesgo medio — Presta atención especial a esta pregunta.'
                      : '🟢 Bajo riesgo — Pregunta de rutina. Responde con confianza.'}
                  </Text>
                </View>
              )}

              {/* Tip */}
              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>💡 Consejo</Text>
                <Text style={styles.helpSectionText}>
                  Escucha con atención las primeras palabras: "What", "Have you", "Do you", "Are you" — te dicen el tipo de pregunta. Si no entendiste, puedes pedir al oficial: "Could you repeat that, please?"
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.helpModalListenBtn}
              onPress={() => { setShowHelpModal(false); stopSpeaking(); speakText(currentQuestion.question, currentQuestion.id); }}
            >
              <MaterialCommunityIcons name="volume-high" size={20} color="#FFFFFF" />
              <Text style={styles.helpModalListenText}>Escuchar de nuevo y cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {renderFinishModal()}
    </View>
  );
};

export default N400SectionPracticeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    minWidth: 40,
    textAlign: 'right',
  },
  headerProgress: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  headerProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 120,
  },
  // ── Step badge ──
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    letterSpacing: 0.5,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // ── Listen card (audio-first) ──
  listenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  listenInstructions: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  audioVisual: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  repeatAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  repeatAudioText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  listenContinueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
  },
  listenContinueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // ── Listen help (reveal question) ──
  listenHelpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  listenHelpBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D97706',
  },
  listenHelpCard: {
    width: '100%',
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  listenHelpLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  listenHelpText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    lineHeight: 22,
  },
  listenHelpTextEs: {
    fontSize: 14,
    fontWeight: '400',
    color: '#64748B',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  // ── Comprehend actions ──
  comprehendActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  comprehendActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flex: 1,
    justifyContent: 'center',
  },
  helpActionBtn: {
    backgroundColor: '#FFFBEB',
  },
  comprehendActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  // ── Result banner ──
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  resultBannerCorrect: {
    backgroundColor: '#ECFDF5',
  },
  resultBannerWrong: {
    backgroundColor: '#FEF2F2',
  },
  resultBannerText: {
    fontSize: 18,
    fontWeight: '700',
  },
  // ── Revealed question card ──
  revealedQuestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  revealedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  revealedQuestionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 26,
    marginBottom: 12,
  },
  revealedAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  revealedAudioText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  // ── Translation toggle ──
  showTranslationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  showTranslationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    flex: 1,
  },
  // ── Retry button ──
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  // ── Help modal ──
  helpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  helpModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
    maxHeight: '75%',
  },
  helpModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  helpModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  helpModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpModalBody: {
    marginBottom: 16,
  },
  helpSection: {
    marginBottom: 16,
  },
  helpSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  helpSectionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 21,
  },
  helpKeywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  helpKeywordChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  helpKeywordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  helpModalListenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 14,
  },
  helpModalListenText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // ── Phrase / question card (protocol/definitions) ──
  phraseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  phraseText: {
    fontSize: 19,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 28,
    marginBottom: 16,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  playButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonActive: {
    backgroundColor: '#DC2626',
  },

  // (continueBtn removed — replaced by listenContinueBtn)
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  listenBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  // ── Context card ──
  contextCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 10,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  contextText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 21,
  },
  // ── Comprehension ──
  comprehendSection: {
    marginBottom: 16,
  },
  comprehendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  optionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  optionCorrect: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  optionWrong: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  optionBullet: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionBulletText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  // ── Result section ──
  resultSection: {
    marginBottom: 16,
  },
  responsesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  responsesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },
  responseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 4,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
  },
  responseContent: {
    flex: 1,
  },
  responseText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 21,
  },
  responseAudioBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  expectedCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  expectedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  expectedText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  variationsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  variationsToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  variationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  variationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  variationText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  // ── Guide / Info cards ──
  translationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  translationText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E40AF',
    lineHeight: 22,
  },
  guideCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  guideText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 21,
  },
  ifYesCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
  ifYesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  ifYesText: {
    fontSize: 14,
    color: '#064E3B',
    lineHeight: 21,
    fontStyle: 'italic',
  },
  warningCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  warningText: {
    fontSize: 14,
    color: '#7F1D1D',
    lineHeight: 21,
  },
  // ── Definitions extras ──
  defTermCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  defTerm: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  defLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  synonymsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  synonymChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  synonymText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  // ── Type badge ──
  typeBadge: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // ── Footer ──
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  finishBtn: {
    backgroundColor: '#059669',
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // ── Finish modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalScore: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 8,
  },
  modalPercent: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 20,
  },
  modalPercentText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E40AF',
  },
  modalBtn: {
    backgroundColor: '#1E40AF',
    borderRadius: 14,
    paddingHorizontal: 30,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
