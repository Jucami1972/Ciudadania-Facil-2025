import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Animated,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

import { NavigationProps } from '../../types/navigation';
import { readingWritingQuestions, ReadingWritingQuestion } from '../../data/readingWritingQuestions';
import { readingAudioMap, writingAudioMap } from '../../assets/audio/reading_writing/readingWritingAudioMap';

const ReadingWritingScreenModerno = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();

  // Estados de Configuración / Modos
  const [practiceMode, setPracticeMode] = useState<'reading' | 'writing'>('reading');
  const [practiceStarted, setPracticeStarted] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  // Estados de la Práctica
  const [filteredQuestions, setFilteredQuestions] = useState<ReadingWritingQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Scoring
  const [correctCount, setCorrectCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);

  // Audio Playback State
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Audio Recording (Microphone) State
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);

  const practiceScrollRef = useRef<ScrollView>(null);

  // Cleanup audio on unmount or sound change
  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  // Animaciones
  const [fadeAnim] = useState(new Animated.Value(1));

  const subcategories = [
    { id: 'A: Geography', name: 'Geografía', icon: 'earth' },
    { id: 'B: Rights and Government', name: 'Derechos y Gobierno', icon: 'bank' },
    { id: 'C: History and Presidents', name: 'Historia y Presidentes', icon: 'book-open-blank-variant' },
    { id: 'D: Holidays', name: 'Festividades', icon: 'calendar-star' },
  ];

  const startPractice = (subcategory: string) => {
    // Filtrar preguntas. Todas las preguntas del archivo son compatibles para ambos modos.
    const filtered = readingWritingQuestions.filter(q => q.subcategory === subcategory);
    
    // Barajar aleatorio
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    
    setFilteredQuestions(shuffled);
    setSelectedSubcategory(subcategory);
    setCurrentIndex(0);
    setCorrectCount(0);
    setShowSummary(false);
    setPracticeStarted(true);
    resetQuestionState();
  };

  const resetQuestionState = () => {
    setUserInput('');
    setIsAnswered(false);
    setIsCorrect(null);
    setTranscribedText('');
    setPronunciationScore(null);
    setRecordedUri(null);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const speakText = async (text: string, isAnswer: boolean = false) => {
    const currentItem = filteredQuestions[currentIndex];
    const id = currentItem.id;
    const audioMap = isAnswer ? writingAudioMap : readingAudioMap;

    if (audioMap && audioMap[id]) {
      try {
        if (sound) {
          await sound.unloadAsync();
        }
        const { sound: newSound } = await Audio.Sound.createAsync(audioMap[id]);
        setSound(newSound);
        await newSound.playAsync();
        return;
      } catch (error) {
        console.error("Error playing pre-recorded audio:", error);
      }
    }

    Speech.stop();
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.85, 
    });
  };

  /**
   * 🎤 Grabación de Voz para Pronunciación
   */
  const startRecording = async () => {
    try {
      Speech.stop(); // Detener cualquier audio
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        alert("Se requieren permisos de micrófono para evaluar tu pronunciación.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setPronunciationScore(null);
      setTranscribedText('');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    setIsTranscribing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      
      if (uri) {
        setRecordedUri(uri);
        await transcribeAudio(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setIsTranscribing(false);
    }
    setRecording(null);
  };

  const playRecordedAudio = async () => {
    if (!recordedUri) return;
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordedUri });
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error("Error playing recorded audio:", error);
    }
  };

  const transcribeAudio = async (uri: string) => {
    const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      alert("Error: No se encontró EXPO_PUBLIC_OPENAI_API_KEY");
      setIsTranscribing(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      } as any);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en'); 

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const data = await response.json();
      if (data.text) {
        setTranscribedText(data.text);
        evaluatePronunciation(data.text);
      } else {
        alert("No se pudo transcribir el audio. Intenta de nuevo.");
      }
    } catch (err) {
      console.error('Transcription error', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const evaluatePronunciation = (transcript: string) => {
    const targetText = filteredQuestions[currentIndex].questionEn;
    
    // Limpieza
    const cleanTranscript = transcript.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
    const cleanTarget = targetText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();

    const transcriptWords = cleanTranscript.split(/\s+/);
    const targetWords = cleanTarget.split(/\s+/);

    // Conteo de coincidencias palabra por palabra
    let matches = 0;
    targetWords.forEach(word => {
      if (transcriptWords.includes(word)) {
        matches += 1;
      }
    });

    const score = Math.round((matches / targetWords.length) * 100);
    setPronunciationScore(score);
    setIsAnswered(true);
    const correct = score >= 80;
    setIsCorrect(correct); // 80% o más se considera correcto
    if (correct) {
      setCorrectCount(prev => prev + 1);
    }
  };

  const handleVerifyAnswer = () => {
    if (userInput.trim() === '') return;

    const currentQuestion = filteredQuestions[currentIndex];
    // Almacenamos la frase correcta según el modo
    const targetText = practiceMode === 'reading' ? currentQuestion.questionEn : currentQuestion.answerEn;

    // Validación inteligente: remover puntuación y minúsculas
    const cleanInput = userInput.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
    const cleanTarget = targetText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();

    const correct = cleanInput === cleanTarget;
    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      setCorrectCount(prev => prev + 1);
      Speech.speak("Correct", { language: 'en-US', rate: 1 });
    } else {
      Speech.speak("Try again", { language: 'en-US', rate: 1 });
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetQuestionState();
    } else {
      setShowSummary(true);
    }
  };

  const currentQuestion = filteredQuestions[currentIndex];

  return (
    <View style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        {/* Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#1E3A8A', '#1E40AF', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 8 }]}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity 
                onPress={() => practiceStarted ? (setPracticeStarted(false), setShowSummary(false)) : navigation.goBack()} 
                style={styles.backButton}
              >
                <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Lectura y Escritura</Text>
                <Text style={styles.headerSubtitle}>Examen de Inglés USCIS</Text>
              </View>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Home')} 
                style={styles.backButton}
              >
                <MaterialCommunityIcons name="home" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

      {!practiceStarted ? (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Mode Toggle */}
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity
              style={[styles.modeButton, practiceMode === 'reading' && styles.modeButtonActive]}
              onPress={() => setPracticeMode('reading')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons 
                name="book-open-page-variant" 
                size={20} 
                color={practiceMode === 'reading' ? '#FFFFFF' : '#64748B'} 
              />
              <Text style={[styles.modeButtonText, practiceMode === 'reading' && styles.modeButtonTextActive]}>
                Lectura
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, practiceMode === 'writing' && styles.modeButtonActive]}
              onPress={() => setPracticeMode('writing')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons 
                name="fountain-pen-tip" 
                size={20} 
                color={practiceMode === 'writing' ? '#FFFFFF' : '#64748B'} 
              />
              <Text style={[styles.modeButtonText, practiceMode === 'writing' && styles.modeButtonTextActive]}>
                Escritura
              </Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <View style={styles.instructionsIconWrap}>
              <MaterialCommunityIcons 
                name={practiceMode === 'reading' ? 'book-open-page-variant' : 'fountain-pen-tip'} 
                size={20} 
                color="#1E40AF" 
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.instructionsTitle}>
                {practiceMode === 'reading' ? 'Modo Lectura' : 'Modo Escritura'}
              </Text>
              <Text style={styles.instructionsText}>
                {practiceMode === 'reading'
                  ? "Lee la oración en voz alta y graba tu pronunciación para evaluarla."
                  : "Escucha el dictado y escribe la oración correctamente."}
              </Text>
            </View>
          </View>

          {/* Section Title */}
          <Text style={styles.sectionTitle}>Selecciona una categoría</Text>

          {/* Category Grid */}
          <View style={styles.grid}>
            {subcategories.map((sub) => (
              <TouchableOpacity
                key={sub.id}
                style={styles.subCard}
                onPress={() => startPractice(sub.id)}
                activeOpacity={0.7}
              >
                <View style={styles.subIconContainer}>
                  <MaterialCommunityIcons name={sub.icon as any} size={28} color="#1E40AF" />
                </View>
                <Text style={styles.subCardName}>{sub.name}</Text>
                <View style={styles.subCardArrow}>
                  <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <Animated.View style={[styles.practiceContainer, { opacity: fadeAnim }]}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                Frase {currentIndex + 1} / {filteredQuestions.length}
              </Text>
              <Text style={styles.progressScore}>
                {correctCount} correctas
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <Animated.View 
                style={[styles.progressBarFill, { width: `${((currentIndex + 1) / filteredQuestions.length) * 100}%` }]} 
              />
            </View>
          </View>

          <ScrollView 
            ref={practiceScrollRef}
            contentContainerStyle={styles.cardContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Question Card */}
            <View style={styles.questionCard}>
              <View style={styles.modeChip}>
                <MaterialCommunityIcons 
                  name={practiceMode === 'reading' ? 'book-open-page-variant' : 'fountain-pen-tip'} 
                  size={14} 
                  color="#1E40AF" 
                />
                <Text style={styles.modeChipText}>
                  {practiceMode === 'reading' ? 'Lectura' : 'Escritura'}
                </Text>
              </View>

              <Text style={styles.questionInstruction}>
                {practiceMode === 'reading' 
                  ? "Lee la siguiente oración en voz alta:" 
                  : "Escucha el audio y escribe la oración:"}
              </Text>

              {practiceMode === 'reading' ? (
                <>
                  <View style={styles.sentenceCard}>
                    <Text style={styles.targetSentence}>{currentQuestion.questionEn}</Text>
                  </View>
                  
                  <View style={styles.audioActionsRow}>
                    <TouchableOpacity 
                      style={styles.listenButton}
                      onPress={() => speakText(currentQuestion.questionEn, false)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="volume-high" size={20} color="#1E40AF" />
                      <Text style={styles.listenButtonText}>Escuchar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                      onPress={isRecording ? stopRecording : startRecording}
                      disabled={isTranscribing}
                      activeOpacity={0.7}
                    >
                      {isTranscribing ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <MaterialCommunityIcons 
                          name={isRecording ? "stop" : "microphone"} 
                          size={22} 
                          color="white" 
                        />
                      )}
                      <Text style={styles.recordButtonText}>
                        {isTranscribing ? 'Analizando...' : isRecording ? 'Detener' : 'Grabar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.sentenceCard}>
                    <Text style={styles.sentenceLabel}>Contexto:</Text>
                    <Text style={styles.targetSentence}>{currentQuestion.questionEn}</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.dictateButton}
                    onPress={() => speakText(currentQuestion.answerEn, true)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="volume-high" size={20} color="white" />
                    <Text style={styles.dictateButtonText}>Escuchar Dictado</Text>
                  </TouchableOpacity>

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Escribe lo que escuchaste..."
                      placeholderTextColor="#94A3B8"
                      value={userInput}
                      onChangeText={setUserInput}
                      multiline
                      autoCapitalize="sentences"
                      editable={!isAnswered}
                      onFocus={() => {
                        setTimeout(() => {
                          practiceScrollRef.current?.scrollToEnd({ animated: true });
                        }, 300);
                      }}
                    />
                  </View>
                </>
              )}

              {/* Feedback */}
              {isAnswered && (
                <View style={[styles.feedbackCard, isCorrect ? styles.feedbackSuccess : styles.feedbackError]}>
                  <View style={styles.feedbackHeader}>
                    <MaterialCommunityIcons 
                      name={isCorrect ? "check-circle" : "close-circle"} 
                      size={22} 
                      color={isCorrect ? "#059669" : "#DC2626"} 
                    />
                    <Text style={[styles.feedbackTitle, { color: isCorrect ? "#059669" : "#DC2626" }]}>
                      {practiceMode === 'reading' 
                        ? (isCorrect ? "¡Excelente Pronunciación!" : "Necesitas practicar más")
                        : (isCorrect ? "¡Correcto!" : "Revisa la respuesta")
                      }
                    </Text>
                  </View>
                  {pronunciationScore !== null && (
                    <View style={styles.scoreChip}>
                      <Text style={[styles.scoreChipText, { color: isCorrect ? '#059669' : '#DC2626' }]}>
                        Precisión: {pronunciationScore}%
                      </Text>
                    </View>
                  )}
                  {transcribedText ? (
                    <View style={styles.transcriptRow}>
                      <Text style={styles.transcriptLabel}>Dijiste:</Text>
                      <Text style={styles.transcriptValue}>"{transcribedText}"</Text>
                    </View>
                  ) : null}
                  {recordedUri && practiceMode === 'reading' && (
                    <TouchableOpacity style={styles.playRecordedBtn} onPress={playRecordedAudio}>
                      <MaterialCommunityIcons name="play-circle" size={18} color="#1E40AF" />
                      <Text style={styles.playRecordedBtnText}>Escuchar Mi Grabación</Text>
                    </TouchableOpacity>
                  )}
                  {!isCorrect && (
                    <View style={styles.correctionBox}>
                      <Text style={styles.correctionLabel}>Respuesta correcta:</Text>
                      <Text style={styles.correctionValue}>
                        {practiceMode === 'reading' ? currentQuestion.questionEn : currentQuestion.answerEn}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            {practiceMode === 'writing' && !isAnswered ? (
              <TouchableOpacity style={styles.primaryActionBtn} onPress={handleVerifyAnswer} activeOpacity={0.8}>
                <MaterialCommunityIcons name="check-bold" size={20} color="white" />
                <Text style={styles.primaryActionBtnText}>Verificar</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.actionRow}>
                {practiceMode === 'reading' && !isAnswered && (
                  <TouchableOpacity 
                    style={styles.secondaryActionBtn}
                    onPress={() => {
                      setIsAnswered(true);
                      setIsCorrect(true);
                      setCorrectCount(prev => prev + 1);
                    }}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="check" size={20} color="#1E40AF" />
                    <Text style={styles.secondaryActionBtnText}>Ya la leí</Text>
                  </TouchableOpacity>
                )}
                {isAnswered && (
                  <TouchableOpacity style={styles.nextActionBtn} onPress={handleNext} activeOpacity={0.8}>
                    <Text style={styles.nextActionBtnText}>
                      {currentIndex === filteredQuestions.length - 1 ? "Finalizar" : "Siguiente"}
                    </Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </Animated.View>
      )}

      {/* Summary Overlay */}
      {showSummary && (
        <View style={styles.summaryOverlay}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconWrap}>
              <MaterialCommunityIcons name="trophy" size={48} color="#F59E0B" />
            </View>
            <Text style={styles.summaryTitle}>¡Práctica Completada!</Text>
            
            <View style={styles.summaryScoreCircle}>
              <Text style={styles.summaryScoreValue}>
                {Math.round((correctCount / filteredQuestions.length) * 100)}%
              </Text>
            </View>

            <View style={styles.summaryStatsRow}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{correctCount}</Text>
                <Text style={styles.summaryStatLabel}>Correctas</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{filteredQuestions.length - correctCount}</Text>
                <Text style={styles.summaryStatLabel}>Incorrectas</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{filteredQuestions.length}</Text>
                <Text style={styles.summaryStatLabel}>Total</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.summaryPrimaryBtn}
              onPress={() => {
                setPracticeStarted(false);
                setShowSummary(false);
                setSelectedSubcategory(null);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.summaryPrimaryBtnText}>Volver al Menú</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // === LAYOUT ===
  safeArea: { flex: 1, backgroundColor: '#1E3A8A' },
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },

  // === HEADER ===
  headerContainer: {},
  header: { paddingHorizontal: 20, paddingBottom: 14 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitleContainer: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  // === SELECTION SCREEN ===
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  // Mode Toggle
  modeToggleContainer: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 4, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  modeButton: {
    flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12,
  },
  modeButtonActive: { backgroundColor: '#1E40AF' },
  modeButtonText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  modeButtonTextActive: { color: '#FFFFFF' },

  // Instructions
  instructionsCard: {
    backgroundColor: '#EFF6FF', padding: 16, borderRadius: 16, flexDirection: 'row', gap: 12, marginBottom: 24,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  instructionsIconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#DBEAFE',
    alignItems: 'center', justifyContent: 'center',
  },
  instructionsTitle: { fontSize: 14, fontWeight: '700', color: '#1E40AF', marginBottom: 4 },
  instructionsText: { fontSize: 13, color: '#475569', lineHeight: 19, fontWeight: '500' },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 14 },

  // Grid
  grid: { gap: 12 },
  subCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  subIconContainer: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  subCardName: { fontSize: 15, fontWeight: '600', color: '#1E293B', flex: 1 },
  subCardArrow: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },

  // === PRACTICE FLOW ===
  practiceContainer: { flex: 1 },

  // Progress
  progressContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  progressScore: { fontSize: 13, fontWeight: '700', color: '#059669' },
  progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3 },
  progressBarFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 3 },

  // Card
  cardContent: { padding: 20, paddingBottom: 40 },
  questionCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
    gap: 16,
  },
  modeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  modeChipText: { fontSize: 12, fontWeight: '700', color: '#1E40AF' },
  questionInstruction: { fontSize: 14, fontWeight: '600', color: '#64748B', textAlign: 'center' },

  // Sentence
  sentenceCard: {
    backgroundColor: '#F8FAFC', padding: 20, borderRadius: 16, width: '100%',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  sentenceLabel: {
    fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 8,
  },
  targetSentence: { fontSize: 20, fontWeight: '700', color: '#0F172A', textAlign: 'center', lineHeight: 30 },

  // Audio Buttons
  audioActionsRow: {
    flexDirection: 'row', gap: 10, width: '100%',
  },
  listenButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#EFF6FF', paddingVertical: 14, borderRadius: 14,
    borderWidth: 1.5, borderColor: '#BFDBFE', minHeight: 48,
  },
  listenButtonText: { color: '#1E40AF', fontWeight: '700', fontSize: 14 },
  recordButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 14, minHeight: 48,
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  recordButtonActive: { backgroundColor: '#EF4444' },
  recordButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  // Dictation
  dictateButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
    backgroundColor: '#1E40AF', paddingVertical: 14, borderRadius: 14, minHeight: 48,
    shadowColor: '#1E40AF', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  dictateButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  // Input
  inputContainer: { width: '100%' },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 14,
    padding: 16, fontSize: 16, color: '#0F172A', textAlignVertical: 'top', minHeight: 100, fontWeight: '500',
  },

  // Feedback
  feedbackCard: {
    padding: 16, borderRadius: 16, width: '100%', gap: 10,
  },
  feedbackSuccess: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC', borderWidth: 1 },
  feedbackError: { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedbackTitle: { fontSize: 16, fontWeight: '700' },
  scoreChip: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  scoreChipText: { fontSize: 14, fontWeight: '800' },
  transcriptRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  transcriptLabel: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  transcriptValue: { fontSize: 13, color: '#475569', fontStyle: 'italic', flex: 1 },
  playRecordedBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF',
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  playRecordedBtnText: { color: '#1E40AF', fontSize: 13, fontWeight: '700' },
  correctionBox: {
    backgroundColor: 'rgba(255,255,255,0.6)', padding: 12, borderRadius: 12,
  },
  correctionLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  correctionValue: { fontSize: 15, fontWeight: '600', color: '#0F172A', lineHeight: 22 },

  // Bottom Actions
  bottomActions: {
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 30 : 20, paddingTop: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 8,
  },
  primaryActionBtn: {
    backgroundColor: '#1E40AF', paddingVertical: 16, borderRadius: 14, minHeight: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primaryActionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 10 },
  secondaryActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#EFF6FF', paddingVertical: 16, borderRadius: 14, minHeight: 52,
    borderWidth: 1.5, borderColor: '#BFDBFE',
  },
  secondaryActionBtnText: { color: '#1E40AF', fontSize: 15, fontWeight: '700' },
  nextActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1E40AF', paddingVertical: 16, borderRadius: 14, minHeight: 52,
  },
  nextActionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // === SUMMARY ===
  summaryOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, width: '100%', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 12,
  },
  summaryIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  summaryTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
  summaryScoreCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#EFF6FF',
    borderWidth: 4, borderColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  summaryScoreValue: { fontSize: 28, fontWeight: '900', color: '#1E40AF' },
  summaryStatsRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 28,
    backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, width: '100%',
  },
  summaryStat: { flex: 1, alignItems: 'center' },
  summaryStatValue: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  summaryStatLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginTop: 2 },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#E2E8F0' },
  summaryPrimaryBtn: {
    backgroundColor: '#1E40AF', paddingVertical: 16, width: '100%', borderRadius: 14,
    alignItems: 'center', minHeight: 52,
  },
  summaryPrimaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default ReadingWritingScreenModerno;
