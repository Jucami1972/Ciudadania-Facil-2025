// src/screens/practice/AIInterviewN400ScreenModerno.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProps } from '../../types/navigation';
import aiInterviewN400Service, { InterviewContext } from '../../services/aiInterviewN400Service';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import WebLayout from '../../components/layout/WebLayout';
import { useIsWebDesktop } from '../../hooks/useIsWebDesktop';
import { USE_BACKEND, BACKEND_URL } from '../../constants/backend';

const isWeb = Platform.OS === 'web';

interface Message {
  role: 'officer' | 'applicant';
  content: string;
  timestamp: Date;
  shouldSpeak?: boolean;
}

const AIInterviewN400ScreenModerno = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProps>();
  const isWebDesktop = useIsWebDesktop();
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [waitingForAutoMessage, setWaitingForAutoMessage] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const welcomeScrollRef = useRef<ScrollView>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [pastSessionCount, setPastSessionCount] = useState(0);

  // Cargar conteo de sesiones pasadas
  useEffect(() => {
    const loadSessionCount = async () => {
      try {
        const data = await AsyncStorage.getItem('@interview:sessions');
        if (data) {
          const sessions = JSON.parse(data);
          setPastSessionCount(Array.isArray(sessions) ? sessions.length : 0);
        }
      } catch {
        // silently ignore
      }
    };
    loadSessionCount();
  }, []);

  // Guardar sesión al terminar
  const saveSession = async () => {
    if (messages.length < 2) return;
    try {
      const session = {
        id: sessionId || Date.now().toString(),
        date: new Date().toISOString(),
        applicantName,
        messageCount: messages.length,
        officerMessages: messages.filter(m => m.role === 'officer').length,
        applicantMessages: messages.filter(m => m.role === 'applicant').length,
      };
      const existing = await AsyncStorage.getItem('@interview:sessions');
      const sessions = existing ? JSON.parse(existing) : [];
      sessions.unshift(session);
      // Mantener últimas 20 sesiones
      const trimmed = sessions.slice(0, 20);
      await AsyncStorage.setItem('@interview:sessions', JSON.stringify(trimmed));
      setPastSessionCount(trimmed.length);
    } catch {
      if (__DEV__) console.error('Error saving interview session');
    }
  };

  const handleEndInterview = async () => {
    Speech.stop();
    await saveSession();
    setSessionStarted(false);
    setMessages([]);
    setSessionId(null);
  };

  // Hook de reconocimiento de voz - siempre se llama (requisito de React)
  const {
    isRecording: isListening,
    isSupported: voiceSupported,
    startRecording,
    stopRecording,
  } = useVoiceRecognition({
    onSpeechResult: (text) => {
      setUserInput(text);
      stopRecording();
    },
    onError: (error) => {
      // No mostrar errores automáticos de disponibilidad
      // Solo mostrar errores reales cuando el usuario intenta usar la voz
      // El mensaje de disponibilidad se maneja en handleVoiceInput
    },
  });

  // Mostrar estado del backend cuando se carga la pantalla
  useEffect(() => {
    if (__DEV__) {
      if (USE_BACKEND) {
        console.log('✅ Backend mode enabled:', BACKEND_URL);
      } else {
        console.log('ℹ️ Using local service (backend disabled)');
      }
    }
  }, []);

  const startInterview = async () => {
    if (!applicantName.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre');
      return;
    }

    setIsLoading(true);
    console.log('🚀 Iniciando entrevista...');

    try {
      const context: InterviewContext = {
        applicantName,
        applicantAge: 30, // Edad por defecto
        countryOfOrigin: 'Desconocido',
        yearsInUS: 5,
        currentOccupation: 'Desconocido',
        maritalStatus: 'Desconocido',
        children: 0,
      };

      console.log('📝 Contexto creado:', { applicantName });
      console.log('🔄 Inicializando sesión...');
      
      const session = await aiInterviewN400Service.initializeSession(context);
      console.log('✅ Sesión inicializada:', session.sessionId);
      setSessionId(session.sessionId);

      console.log('📨 Obteniendo mensajes iniciales...');
      const initialMessages = aiInterviewN400Service.getSessionMessages(session.sessionId);
      console.log('📨 Mensajes obtenidos:', initialMessages.length);
      
      const formattedMessages = initialMessages.map((m) => ({
        role: m.role as 'officer' | 'applicant',
        content: m.content,
        timestamp: m.timestamp,
        shouldSpeak: m.shouldSpeak,
      }));
      setMessages(formattedMessages);

      console.log('✅ Cambiando a pantalla de entrevista...');
      setSessionStarted(true);

      // SIEMPRE reproducir automáticamente el saludo del oficial
      // El agente debe hablar automáticamente desde el inicio
      if (initialMessages.length > 0) {
        console.log('🔊 Reproduciendo saludo...');
        await speakMessage(initialMessages[0].content);
      } else {
        console.warn('⚠️ No hay mensajes iniciales para reproducir');
      }
    } catch (error) {
      console.error('❌ Error al iniciar entrevista:', error);
      Alert.alert('Error', `No se pudo iniciar la entrevista: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };


  // Función para hablar un mensaje
  const speakMessage = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsSpeaking(true);
      Speech.speak(text, {
        language: 'en-US',
        rate: 0.85,
        pitch: 1.0,
        onDone: () => {
          setIsSpeaking(false);
          resolve();
        },
        onStopped: () => {
          setIsSpeaking(false);
          resolve();
        },
        onError: () => {
          setIsSpeaking(false);
          resolve();
        },
      });
    });
  };

  // Función para generar mensaje automático después de una respuesta
  const generateAutoMessage = async () => {
    if (!sessionId || waitingForAutoMessage) return;

    setWaitingForAutoMessage(true);
    setIsLoading(true);

    try {
      const autoMessage = await aiInterviewN400Service.generateNextAutomaticMessage(sessionId);
      
      if (autoMessage) {
        const formattedMessage: Message = {
          role: autoMessage.role as 'officer' | 'applicant',
          content: autoMessage.content,
          timestamp: autoMessage.timestamp,
          shouldSpeak: autoMessage.shouldSpeak,
        };

        setMessages((prev) => [...prev, formattedMessage]);

        // SIEMPRE hablar automáticamente los mensajes del oficial
        await speakMessage(autoMessage.content);

        scrollViewRef.current?.scrollToEnd({ animated: true });
      }
    } catch (error) {
      console.error('Error generando mensaje automático:', error);
    } finally {
      setIsLoading(false);
      setWaitingForAutoMessage(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !sessionId || isSpeaking) return;

    const userMessage: Message = {
      role: 'applicant',
      content: userInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const responseText = userInput;
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await aiInterviewN400Service.processApplicantResponse(
        sessionId,
        responseText
      );

      const officerMessage: Message = {
        role: 'officer',
        content: response.officerResponse,
        timestamp: new Date(),
        shouldSpeak: response.shouldSpeak,
      };

      setMessages((prev) => [...prev, officerMessage]);

      // SIEMPRE reproducir automáticamente la respuesta del oficial
      // El agente debe hablar automáticamente en todos los casos
      await speakMessage(response.officerResponse);

      scrollViewRef.current?.scrollToEnd({ animated: true });

      // Generar mensaje automático después de un breve delay si es necesario
      setTimeout(() => {
        generateAutoMessage();
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la respuesta');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (isListening) {
      stopRecording();
    } else {
      if (!voiceSupported) {
        Alert.alert(
          'Reconocimiento de Voz No Disponible',
          'El reconocimiento de voz requiere un development build y no está disponible en Expo Go.\n\nPuedes continuar la entrevista escribiendo tus respuestas en el campo de texto.',
          [{ text: 'Entendido', style: 'default' }]
        );
        return;
      }
      try {
        await startRecording('en-US'); // Inglés para la entrevista
      } catch (error) {
        Alert.alert('Error', 'No se pudo iniciar el reconocimiento de voz');
      }
    }
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      Speech.stop();
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, []);

  if (!sessionStarted) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.mainContainer}>
          <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
          <LinearGradient
            colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.header, { paddingTop: insets.top + 8 }]}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Entrevista AI</Text>
                <Text style={styles.headerSubtitle}>Simulación USCIS N-400</Text>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </LinearGradient>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
          <ScrollView
            ref={welcomeScrollRef}
            style={styles.container}
            contentContainerStyle={styles.centerContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.welcomeCard}>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="account-tie" size={40} color="#1E40AF" />
              </View>
              <Text style={styles.welcomeTitle}>Entrevista de Ciudadanía</Text>
              <Text style={styles.welcomeSubtitle}>
                Practica con un oficial de inmigración AI que simula una entrevista real del USCIS.
              </Text>

              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Qué incluye</Text>
                <View style={styles.featureItem}>
                  <View style={styles.featureBullet}>
                    <MaterialCommunityIcons name="keyboard" size={16} color="#1E40AF" />
                  </View>
                  <Text style={styles.featureText}>Responde escribiendo (voz opcional)</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureBullet}>
                    <MaterialCommunityIcons name="chat-processing" size={16} color="#1E40AF" />
                  </View>
                  <Text style={styles.featureText}>Conversación realista con AI</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureBullet}>
                    <MaterialCommunityIcons name="volume-high" size={16} color="#1E40AF" />
                  </View>
                  <Text style={styles.featureText}>El oficial habla automáticamente</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureBullet}>
                    <MaterialCommunityIcons name="file-document-check" size={16} color="#1E40AF" />
                  </View>
                  <Text style={styles.featureText}>Fases: identidad, N-400, civismo, juramento</Text>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Tu Nombre Completo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Juan García"
                  placeholderTextColor="#9CA3AF"
                  value={applicantName}
                  onChangeText={setApplicantName}
                  onFocus={() => {
                    setTimeout(() => {
                      welcomeScrollRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                  }}
                />
              </View>

              {pastSessionCount > 0 && (
                <View style={styles.sessionsBadge}>
                  <MaterialCommunityIcons name="history" size={14} color="#6B7280" />
                  <Text style={styles.sessionsText}>
                    {pastSessionCount} {pastSessionCount === 1 ? 'entrevista completada' : 'entrevistas completadas'}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={startInterview}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="play" size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>Comenzar Entrevista</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    );
  }

  const content = (
    <>
      {!isWeb && (
        <LinearGradient
          colors={['#1E3A8A', '#1E40AF', '#3B82F6'] as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Entrevista en Curso</Text>
              <Text style={styles.headerSubtitle}>Responde al oficial</Text>
            </View>
            <TouchableOpacity onPress={handleEndInterview} style={styles.backButton}>
              <MaterialCommunityIcons name="close" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                message.role === 'officer' ? styles.officerBubble : styles.applicantBubble,
              ]}
            >
              <View style={styles.messageHeader}>
                <MaterialCommunityIcons
                  name={message.role === 'officer' ? 'shield-account' : 'account'}
                  size={16}
                  color={message.role === 'officer' ? '#1E40AF' : '#6B7280'}
                />
                <Text style={[
                  styles.messageSender,
                  message.role === 'officer' && { color: '#1E40AF' }
                ]}>
                  {message.role === 'officer' ? 'Oficial USCIS' : 'Tú'}
                </Text>
              </View>
              <Text style={[
                styles.messageText,
                message.role === 'applicant' && styles.applicantMessageText
              ]}>
                {message.content}
              </Text>
            </View>
          ))}
          {isLoading && (
            <View style={styles.loadingBubble}>
              <ActivityIndicator color="#1E40AF" size="small" />
              <Text style={styles.loadingText}>El oficial está pensando...</Text>
            </View>
          )}
          {isSpeaking && (
            <View style={styles.speakingIndicator}>
              <MaterialCommunityIcons name="volume-high" size={16} color="#1E40AF" />
              <Text style={styles.speakingText}>El oficial está hablando...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputArea}>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={[styles.voiceButton, !voiceSupported && styles.voiceButtonDisabled]}
              onPress={handleVoiceInput}
              disabled={isLoading || isSpeaking}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isListening ? 'microphone' : 'microphone-outline'}
                size={24}
                color={isListening ? '#EF4444' : (!voiceSupported ? '#9CA3AF' : '#1E40AF')}
              />
            </TouchableOpacity>

            <TextInput
              style={styles.messageInput}
              placeholder={isSpeaking ? "Escuchando al oficial..." : "Escribe tu respuesta..."}
              placeholderTextColor="#9CA3AF"
              value={userInput}
              onChangeText={setUserInput}
              multiline
              editable={!isLoading && !isSpeaking}
            />

            <TouchableOpacity
              style={[styles.sendButton, (isLoading || isSpeaking || !userInput.trim()) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={isLoading || isSpeaking || !userInput.trim()}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );

  // Web de escritorio: usar WebLayout con sidebar
  if (isWeb && isWebDesktop) {
    return (
      <WebLayout headerTitle="Entrevista AI">
        {content}
      </WebLayout>
    );
  }

  // Web móvil o app móvil
  return (
    <View style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        {content}
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
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
    maxWidth: 480,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureBullet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  sessionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
    alignSelf: 'center',
  },
  sessionsText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#1F2937',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    ...Platform.select({
      web: {},
    }),
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...Platform.select({
      web: {
        padding: 24,
        paddingBottom: 120,
        maxWidth: 1000,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  messageBubble: {
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    maxWidth: '85%',
  },
  officerBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: '#1E40AF',
  },
  applicantBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1E40AF',
    borderRadius: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    color: '#6B7280',
  },
  messageText: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
    fontWeight: '500',
  },
  applicantMessageText: {
    color: '#fff',
  },
  loadingBubble: {
    alignSelf: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  speakingIndicator: {
    alignSelf: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  speakingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
  },
  inputArea: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      web: {
        maxWidth: 1000,
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: 24,
        paddingVertical: 16,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
      },
    }),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#EFF6FF',
  },
  voiceButtonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%' as any,
    ...Platform.select({
      web: {
        maxHeight: '90vh',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E40AF',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  formRow: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1E40AF',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    backgroundColor: '#F8FAFC',
    color: '#1F2937',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default AIInterviewN400ScreenModerno;

