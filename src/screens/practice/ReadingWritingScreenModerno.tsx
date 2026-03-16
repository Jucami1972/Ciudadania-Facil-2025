import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Dimensions,
  Animated,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
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

const { width } = Dimensions.get('window');

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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      {/* Header */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#1E3A8A', '#3B82F6'] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Lectura y Escritura</Text>
              <Text style={styles.headerSubtitle}>Examen de Inglés USCIS</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </LinearGradient>
      </View>

      {!practiceStarted ? (
        // Pantalla de Selección de Modo y Categoría
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity
              style={[styles.modeButton, practiceMode === 'reading' && styles.modeButtonActive]}
              onPress={() => setPracticeMode('reading')}
            >
              <MaterialCommunityIcons 
                name="book-open-page-variant" 
                size={22} 
                color={practiceMode === 'reading' ? '#FFFFFF' : '#6B7280'} 
              />
              <Text style={[styles.modeButtonText, practiceMode === 'reading' && styles.modeButtonTextActive]}>
                Lectura (Reading)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, practiceMode === 'writing' && styles.modeButtonActive]}
              onPress={() => setPracticeMode('writing')}
            >
              <MaterialCommunityIcons 
                name="fountain-pen-tip" 
                size={22} 
                color={practiceMode === 'writing' ? '#FFFFFF' : '#6B7280'} 
              />
              <Text style={[styles.modeButtonText, practiceMode === 'writing' && styles.modeButtonTextActive]}>
                Escritura (Writing)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.instructionsCard}>
            <MaterialCommunityIcons name="lightbulb" size={24} color="#F59E0B" />
            <Text style={styles.instructionsText}>
              {practiceMode === 'reading'
                ? "📖 **Modo Lectura:** Lee la oración en voz alta. Escucha el audio para verificar tu pronunciación."
                : "✍️ **Modo Escritura:** Escucha el audio dictado de la respuesta y escríbelo en la caja de texto."}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Selecciona una Categoría para iniciar:</Text>

          <View style={styles.grid}>
            {subcategories.map((sub) => (
              <TouchableOpacity
                key={sub.id}
                style={styles.subCard}
                onPress={() => startPractice(sub.id)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#EFF6FF', '#DBEAFE'] as [string, string]}
                  style={styles.subIconContainer}
                >
                  <MaterialCommunityIcons name={sub.icon as any} size={32} color="#1D4ED8" />
                </LinearGradient>
                <Text style={styles.subCardName}>{sub.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        // Flujo de Práctica Activa
        <Animated.View style={[styles.practiceContainer, { opacity: fadeAnim }]}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Frase {currentIndex + 1} de {filteredQuestions.length}
            </Text>
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${((currentIndex + 1) / filteredQuestions.length) * 100}%` }
                ]} 
              />
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.cardContent}>
            <View style={styles.questionCard}>
              <Text style={styles.questionInstruction}>
                {practiceMode === 'reading' 
                  ? "Lee la siguiente oración en voz alta:" 
                  : "Escucha el audio y escribe la oración:"}
              </Text>

              {practiceMode === 'reading' ? (
                <View style={{ width: '100%', alignItems: 'center' }}>
                  <View style={styles.textDisplayContainer}>
                    <Text style={styles.targetSentence}>{currentQuestion.questionEn}</Text>
                  </View>
                  
                  <View style={styles.micContainer}>
                    <TouchableOpacity
                      style={[styles.micButton, isRecording && styles.micButtonRecording]}
                      onPress={isRecording ? stopRecording : startRecording}
                      disabled={isTranscribing}
                    >
                      {isTranscribing ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <MaterialCommunityIcons 
                          name={isRecording ? "stop" : "microphone"} 
                          size={32} 
                          color="white" 
                        />
                      )}
                    </TouchableOpacity>
                    <Text style={styles.micHint}>
                      {isRecording ? "Grabando... Toca para detener" : "Toca para evaluar tu pronunciación"}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={{ width: '100%', alignItems: 'center' }}>
                  <View style={styles.textDisplayContainer}>
                    <Text style={styles.questionLabel}>Pregunta de Contexto:</Text>
                    <Text style={styles.targetSentence}>{currentQuestion.questionEn}</Text>
                  </View>
                  
                  <View style={styles.dictationContainer}>
                    <TouchableOpacity 
                      style={styles.playButtonLarge}
                      onPress={() => speakText(currentQuestion.answerEn, true)}
                    >
                      <MaterialCommunityIcons name="volume-high" size={20} color="white" />
                      <Text style={styles.playButtonLargeText}>Escuchar Dictado</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {practiceMode === 'reading' && (
                <TouchableOpacity 
                  style={styles.playButtonOutline}
                  onPress={() => speakText(currentQuestion.questionEn, false)}
                >
                  <MaterialCommunityIcons name="volume-high" size={24} color="#1D4ED8" />
                  <Text style={styles.playButtonOutlineText}>Escuchar Pronunciación</Text>
                </TouchableOpacity>
              )}

              {practiceMode === 'writing' && (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Escribe la respuesta en inglés aquí..."
                    placeholderTextColor="#9CA3AF"
                    value={userInput}
                    onChangeText={setUserInput}
                    multiline
                    autoCapitalize="sentences"
                    editable={!isAnswered}
                  />
                </View>
              )}

              {isAnswered && (
                <View style={[styles.feedbackContainer, isCorrect ? styles.feedbackSuccess : styles.feedbackError]}>
                  <MaterialCommunityIcons 
                    name={isCorrect ? "check-circle" : "alert-circle"} 
                    size={24} 
                    color={isCorrect ? "#059669" : "#DC2626"} 
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.feedbackTitle, { color: isCorrect ? "#059669" : "#DC2626" }]}>
                      {practiceMode === 'reading' 
                        ? (isCorrect ? "¡Excelente Pronunciación!" : "Intenta de nuevo")
                        : (isCorrect ? "¡Correcto!" : "Revisa la respuesta")
                      }
                    </Text>
                    {pronunciationScore !== null && (
                      <Text style={[styles.scoreText, { color: isCorrect ? "#047857" : "#B91C1C" }]}>
                        Precisión: {pronunciationScore}%
                      </Text>
                    )}
                    {transcribedText ? (
                      <Text style={styles.transcribedText}>Dijiste: "{transcribedText}"</Text>
                    ) : null}
                    
                    {recordedUri && practiceMode === 'reading' && (
                      <TouchableOpacity 
                        style={styles.playRecordedButton}
                        onPress={playRecordedAudio}
                      >
                        <MaterialCommunityIcons name="play-circle" size={18} color="#1E3A8A" />
                        <Text style={styles.playRecordedText}>Escuchar Mi Grabación</Text>
                      </TouchableOpacity>
                    )}

                    {!isCorrect && (
                      <Text style={styles.correctionText}>
                        Correcto: "{practiceMode === 'reading' ? currentQuestion.questionEn : currentQuestion.answerEn}"
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Botones de acción inferiores */}
          <View style={styles.bottomActions}>
            {practiceMode === 'writing' && !isAnswered ? (
              <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyAnswer}>
                <Text style={styles.verifyButtonText}>Verificar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {currentIndex === filteredQuestions.length - 1 ? "Finalizar" : "Siguiente"}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
              </TouchableOpacity>
            )}
            
            {practiceMode === 'reading' && !isAnswered && (
              <TouchableOpacity 
                style={[styles.verifyButton, { backgroundColor: '#10B981' }]} 
                onPress={() => {
                  setIsAnswered(true);
                  setIsCorrect(true);
                  setCorrectCount(prev => prev + 1);
                }} 
              >
                <Text style={styles.verifyButtonText}>Ya la leí</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {/* Vista de Resumen / Calificación */}
      {showSummary && (
        <View style={styles.summaryOverlay}>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="trophy" size={64} color="#F59E0B" />
            <Text style={styles.summaryTitle}>¡Práctica Terminada!</Text>
            
            <View style={styles.scoreRow}>
              <Text style={styles.scoreValue}>{correctCount}</Text>
              <Text style={styles.scoreLabel}>de {filteredQuestions.length}</Text>
            </View>

            <Text style={styles.summaryPercentage}>
              {Math.round((correctCount / filteredQuestions.length) * 100)}% de precisión
            </Text>

            <TouchableOpacity 
              style={styles.finishButton}
              onPress={() => {
                setPracticeStarted(false);
                setShowSummary(false);
                setSelectedSubcategory(null);
              }}
            >
              <Text style={styles.finishButtonText}>Finalizar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F4F6' },
  headerContainer: { backgroundColor: '#1E3A8A' },
  header: { paddingHorizontal: 20, paddingBottom: 14 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitleContainer: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: 'white' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  modeToggleContainer: {
    flexDirection: 'row', backgroundColor: 'white', borderRadius: 14, padding: 4, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  modeButton: {
    flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12,
  },
  modeButtonActive: { backgroundColor: '#1E3A8A' },
  modeButtonText: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  modeButtonTextActive: { color: '#FFFFFF' },
  instructionsCard: {
    backgroundColor: '#FEF3C7', padding: 16, borderRadius: 16, flexDirection: 'row', gap: 12, marginBottom: 24,
    borderLeftWidth: 4, borderLeftColor: '#F59E0B',
  },
  instructionsText: { fontSize: 13, color: '#78350f', lineHeight: 18, flex: 1, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  subCard: {
    width: (width - 52) / 2, backgroundColor: 'white', borderRadius: 20, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  subIconContainer: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  subCardName: { fontSize: 13, fontWeight: '700', color: '#1F2937', textAlign: 'center' },

  // --- ACTIVA ---
  practiceContainer: { flex: 1 },
  progressContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  progressText: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  progressBarBg: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3 },
  progressBarFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 3 },
  cardContent: { padding: 20 },
  questionCard: {
    backgroundColor: 'white', borderRadius: 24, padding: 24, shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 3, alignItems: 'center',
  },
  questionInstruction: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 20, textAlign: 'center' },
  textDisplayContainer: {
    backgroundColor: '#F3F4F6', padding: 20, borderRadius: 16, width: '100%', marginBottom: 24, alignItems: 'center',
  },
  questionLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  targetSentence: { fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center', lineHeight: 28 },
  playButtonOutline: {
    flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: 2, borderColor: '#1D4ED8',
    borderRadius: 30, paddingVertical: 12, paddingHorizontal: 20, marginBottom: 20,
  },
  playButtonOutlineText: { color: '#1D4ED8', fontWeight: '700', fontSize: 14 },
  dictationContainer: { alignItems: 'center', marginBottom: 24, width: '100%' },
  playButtonLarge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E3A8A', paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 30, gap: 8, shadowColor: '#1E3A8A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  playButtonLargeText: { color: 'white', fontWeight: '700', fontSize: 14 },
  audioHint: { fontSize: 12, color: '#6B7280', marginTop: 8, fontWeight: '500' },
  inputContainer: { width: '100%', marginBottom: 20 },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 16,
    padding: 16, fontSize: 16, color: '#111827', textAlignVertical: 'top', minHeight: 100, fontWeight: '600',
  },
  feedbackContainer: {
    flexDirection: 'row', gap: 12, padding: 16, borderRadius: 16, width: '100%', marginTop: 10,
  },
  feedbackSuccess: { backgroundColor: '#ECFDF5', borderColor: '#10B981', borderWidth: 1 },
  feedbackError: { backgroundColor: '#FEF2F2', borderColor: '#EF4444', borderWidth: 1 },
  feedbackTitle: { fontSize: 15, fontWeight: '700' },
  correctionText: { fontSize: 13, color: '#4B5563', marginTop: 4, lineHeight: 18 },
  bottomActions: {
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 30 : 20, paddingTop: 12, backgroundColor: 'white',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 8,
  },
  verifyButton: {
    backgroundColor: '#1E3A8A', paddingVertical: 14, borderRadius: 16, alignItems: 'center',
  },
  verifyButtonText: { color: 'white', fontSize: 16, fontWeight: '800' },
  nextButton: {
    backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 16, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  nextButtonText: { color: 'white', fontSize: 16, fontWeight: '800' },

  // --- NUEVOS ESTILOS MIC ---
  micContainer: { alignItems: 'center', marginBottom: 20, width: '100%' },
  micButton: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  micButtonRecording: { backgroundColor: '#EF4444', transform: [{ scale: 1.1 }] },
  micHint: { fontSize: 12, color: '#6B7280', marginTop: 8, fontWeight: '600', textAlign: 'center' },
  scoreText: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  transcribedText: { fontSize: 13, color: '#4B5563', fontStyle: 'italic', marginTop: 4 },
  
  // --- NUEVOS ESTILOS REPRODUCCIÓN ---
  playRecordedButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 12, marginTop: 10, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#BFDBFE',
  },
  playRecordedText: { color: '#1E3A8A', fontSize: 13, fontWeight: '700' },

  // --- NUEVOS ESTILOS RESUMEN ---
  summaryOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  summaryCard: {
    backgroundColor: 'white', borderRadius: 24, padding: 30, width: '100%', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 8,
  },
  summaryTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 12, marginBottom: 20 },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 6 },
  scoreValue: { fontSize: 48, fontWeight: '900', color: '#1E3A8A' },
  scoreLabel: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  summaryPercentage: { fontSize: 14, color: '#059669', fontWeight: '700', marginBottom: 24 },
  finishButton: {
    backgroundColor: '#1E3A8A', paddingVertical: 14, width: '100%', borderRadius: 16, alignItems: 'center',
  },
  finishButtonText: { color: 'white', fontSize: 16, fontWeight: '800' },
});

export default ReadingWritingScreenModerno;
