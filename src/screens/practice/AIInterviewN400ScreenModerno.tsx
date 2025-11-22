// src/screens/practice/AIInterviewN400ScreenModerno.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import * as DocumentPicker from 'expo-document-picker';
import { NavigationProps } from '../../types/navigation';
import aiInterviewN400Service, { N400FormData, InterviewContext } from '../../services/aiInterviewN400Service';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import WebLayout from '../../components/layout/WebLayout';
import { useIsWebDesktop } from '../../hooks/useIsWebDesktop';

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
  const [n400Loaded, setN400Loaded] = useState(false);
  const [n400FileName, setN400FileName] = useState<string | null>(null);
  const [n400FormData, setN400FormData] = useState<N400FormData | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [waitingForAutoMessage, setWaitingForAutoMessage] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const startInterview = async () => {
    if (!applicantName.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre');
      return;
    }

    setIsLoading(true);

    try {
      // Extraer children del n400FormData si existe, o usar 0
      const childrenCount = n400FormData?.children ? n400FormData.children.length : 0;
      
      // Calcular edad desde fecha de nacimiento si está disponible
      let applicantAge = 30;
      if (n400FormData?.dateOfBirth) {
        try {
          const birthYear = new Date(n400FormData.dateOfBirth).getFullYear();
          applicantAge = new Date().getFullYear() - birthYear;
        } catch {
          applicantAge = 30;
        }
      }
      
      const context: InterviewContext = {
        applicantName,
        applicantAge,
        countryOfOrigin: n400FormData?.countryOfBirth || 'Desconocido',
        yearsInUS: n400FormData?.yearsInUS || 5,
        currentOccupation: n400FormData?.currentOccupation || 'Desconocido',
        maritalStatus: n400FormData?.maritalStatus || 'Desconocido',
        children: childrenCount,
        n400FormData: n400FormData || undefined,
      };

      const session = await aiInterviewN400Service.initializeSession(context);
      
      // Si hay datos del N-400, cargarlos en la sesión
      if (n400FormData && session) {
        await aiInterviewN400Service.loadN400FormData(session.sessionId, n400FormData);
      }
      setSessionId(session.sessionId);

      const initialMessages = aiInterviewN400Service.getSessionMessages(session.sessionId);
      const formattedMessages = initialMessages.map((m) => ({
        role: m.role as 'officer' | 'applicant',
        content: m.content,
        timestamp: m.timestamp,
        shouldSpeak: m.shouldSpeak,
      }));
      setMessages(formattedMessages);

      setSessionStarted(true);

      // SIEMPRE reproducir automáticamente el saludo del oficial
      // El agente debe hablar automáticamente desde el inicio
      if (initialMessages.length > 0) {
        await speakMessage(initialMessages[0].content);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar la entrevista');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickN400 = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setN400FileName(file.name);
      setN400Loaded(true);

      // Nota: En una aplicación real, aquí se procesaría el PDF para extraer los datos
      // Por ahora, simulamos la extracción de datos básicos
      // En producción, usarías una librería como react-native-pdf o un servicio backend
      // Simulación de datos extraídos del N-400
      // En producción, esto se haría con un servicio de OCR o procesamiento de PDF
      const extractedData: N400FormData = {
        fullName: applicantName || 'Nombre del solicitante',
        currentAddress: '123 Main Street',
        city: 'Los Angeles',
        state: 'California',
        zipCode: '90001',
        currentOccupation: 'Ingeniero',
        maritalStatus: 'Soltero',
        yearsInUS: 5,
        // Más campos se pueden agregar aquí
      };

      setN400FormData(extractedData);
      // Mensaje silencioso - solo actualizar el estado visual
      // El usuario verá que el PDF está cargado por el cambio en el botón
    } catch (error) {
      console.error('Error loading N-400:', error);
      Alert.alert('Error', 'Could not load the document');
    }
  };

  // Función para convertir números a palabras en inglés (para mejor pronunciación TTS)
  const numberToWords = (num: number): string => {
    if (num === 0) return 'zero';
    if (num === 1) return 'one';
    if (num === 2) return 'two';
    if (num === 3) return 'three';
    if (num === 4) return 'four';
    if (num === 5) return 'five';
    if (num === 6) return 'six';
    if (num === 7) return 'seven';
    if (num === 8) return 'eight';
    if (num === 9) return 'nine';
    if (num === 10) return 'ten';
    if (num === 11) return 'eleven';
    if (num === 12) return 'twelve';
    if (num === 13) return 'thirteen';
    if (num === 14) return 'fourteen';
    if (num === 15) return 'fifteen';
    if (num === 16) return 'sixteen';
    if (num === 17) return 'seventeen';
    if (num === 18) return 'eighteen';
    if (num === 19) return 'nineteen';
    if (num === 20) return 'twenty';
    if (num < 30) return `twenty-${numberToWords(num - 20)}`;
    if (num < 40) return `thirty-${numberToWords(num - 30)}`;
    if (num < 100) return `${numberToWords(Math.floor(num / 10) * 10)}-${numberToWords(num % 10)}`;
    if (num === 100) return 'one hundred';
    if (num === 200) return 'two hundred';
    if (num === 300) return 'three hundred';
    if (num === 400) return 'four hundred';
    if (num < 1000) {
      const hundreds = Math.floor(num / 100);
      const remainder = num % 100;
      return remainder === 0 
        ? `${numberToWords(hundreds)} hundred`
        : `${numberToWords(hundreds)} hundred ${numberToWords(remainder)}`;
    }
    // Para números más grandes, devolver el número original
    return num.toString();
  };

  // Función para preparar el texto para TTS en inglés correcto
  // Convierte números y términos técnicos a su pronunciación en inglés
  const prepareTextForTTS = (text: string): string => {
    let processedText = text;
    
    // CRÍTICO: Reemplazar "N-400" por "N four hundred" para pronunciación correcta
    processedText = processedText.replace(/\bN-400\b/gi, 'N four hundred');
    processedText = processedText.replace(/\bN 400\b/gi, 'N four hundred');
    
    // Convertir números de 3 dígitos (400, 128, etc.) a palabras
    processedText = processedText.replace(/\b400\b/g, 'four hundred');
    processedText = processedText.replace(/\b128\b/g, 'one hundred twenty-eight');
    processedText = processedText.replace(/\b200\b/g, 'two hundred');
    processedText = processedText.replace(/\b300\b/g, 'three hundred');
    
    // Convertir números de 2 dígitos comunes
    processedText = processedText.replace(/\b10\b/g, 'ten');
    processedText = processedText.replace(/\b20\b/g, 'twenty');
    processedText = processedText.replace(/\b30\b/g, 'thirty');
    processedText = processedText.replace(/\b40\b/g, 'forty');
    processedText = processedText.replace(/\b50\b/g, 'fifty');
    processedText = processedText.replace(/\b60\b/g, 'sixty');
    processedText = processedText.replace(/\b70\b/g, 'seventy');
    processedText = processedText.replace(/\b80\b/g, 'eighty');
    processedText = processedText.replace(/\b90\b/g, 'ninety');
    
    // Convertir números de 1 dígito (solo si están aislados, no en medio de palabras)
    processedText = processedText.replace(/\b0\b/g, 'zero');
    processedText = processedText.replace(/\b1\b/g, 'one');
    processedText = processedText.replace(/\b2\b/g, 'two');
    processedText = processedText.replace(/\b3\b/g, 'three');
    processedText = processedText.replace(/\b4\b/g, 'four');
    processedText = processedText.replace(/\b5\b/g, 'five');
    processedText = processedText.replace(/\b6\b/g, 'six');
    processedText = processedText.replace(/\b7\b/g, 'seven');
    processedText = processedText.replace(/\b8\b/g, 'eight');
    processedText = processedText.replace(/\b9\b/g, 'nine');
    
    // Remover comillas que pueden causar problemas en TTS
    processedText = processedText.replace(/['"]/g, '');
    
    // Normalizar espacios múltiples y limpiar
    processedText = processedText.replace(/\s+/g, ' ').trim();
    
    return processedText;
  };

  // Función para verificar si TTS está disponible
  const checkTTSAvailability = async (): Promise<boolean> => {
    try {
      // Intentar verificar si Speech está disponible
      if (!Speech || typeof Speech.speak !== 'function') {
        if (__DEV__) {
          console.warn('⚠️ expo-speech no está disponible');
        }
        return false;
      }
      
      // En Expo Go, verificar si funciona haciendo una prueba silenciosa
      if (Platform.OS !== 'web') {
        try {
          const Constants = require('expo-constants');
          const constants = Constants?.default || Constants;
          const isExpoGo = constants?.executionEnvironment === 'storeClient' || constants?.appOwnership === 'expo';
          
          if (isExpoGo) {
            // En Expo Go, expo-speech puede no funcionar
            if (__DEV__) {
              console.warn('⚠️ expo-speech puede tener limitaciones en Expo Go');
            }
            // Aún así intentamos usarlo, puede funcionar en algunos casos
            return true;
          }
        } catch (e) {
          // Si no podemos detectar, asumir que funciona
        }
      }
      
      return true;
    } catch (error) {
      if (__DEV__) {
        console.warn('⚠️ Error verificando TTS:', error);
      }
      return false;
    }
  };

  // Función para hablar un mensaje
  const speakMessage = async (text: string): Promise<void> => {
    // Verificar si TTS está disponible
    const ttsAvailable = await checkTTSAvailability();
    if (!ttsAvailable) {
      if (__DEV__) {
        console.warn('⚠️ TTS no disponible, el mensaje no se hablará');
      }
      return;
    }

    // Detener cualquier speech previo
    try {
      Speech.stop();
      // Dar un pequeño delay para asegurar que se detuvo
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // Ignorar errores al detener
    }

    // Preparar el texto para TTS correcto
    const processedText = prepareTextForTTS(text);
    
    if (!processedText || processedText.trim().length === 0) {
      if (__DEV__) {
        console.warn('⚠️ Texto vacío para TTS');
      }
      return;
    }

    return new Promise((resolve) => {
      setIsSpeaking(true);
      
      // Timeout de seguridad: si después de 10 segundos no se ha completado, resolver
      const timeoutId = setTimeout(() => {
        if (__DEV__) {
          console.warn('⚠️ TTS timeout, forzando resolución');
        }
        setIsSpeaking(false);
        resolve();
      }, 10000);
      
      try {
        // Configuración de TTS optimizada para inglés correcto
        const speechOptions: any = {
          language: 'en-US', // Idioma inglés americano - CRÍTICO para pronunciación correcta
          rate: 0.85, // Velocidad normal (0.0 a 1.0)
          pitch: 1.0, // Tono normal (0.5 a 2.0)
          volume: 1.0, // Volumen máximo
          onStart: () => {
            clearTimeout(timeoutId);
            if (__DEV__) {
              console.log('🔊 TTS iniciado en inglés:', processedText.substring(0, 50));
            }
          },
          onDone: () => {
            clearTimeout(timeoutId);
            setIsSpeaking(false);
            resolve();
          },
          onStopped: () => {
            clearTimeout(timeoutId);
            setIsSpeaking(false);
            resolve();
          },
          onError: (error: any) => {
            clearTimeout(timeoutId);
            console.error('❌ Error en TTS:', error);
            if (__DEV__) {
              console.warn('💡 El TTS puede no estar disponible en Expo Go. Considera usar un development build.');
            }
            setIsSpeaking(false);
            resolve();
          },
        };

        // Solo agregar quality si está disponible (puede no estar en todas las plataformas)
        try {
          if (Speech.VoiceQuality && Speech.VoiceQuality.Enhanced) {
            speechOptions.quality = Speech.VoiceQuality.Enhanced;
          }
        } catch (e) {
          // Quality puede no estar disponible en todas las plataformas
        }

        // Intentar hablar
        Speech.speak(processedText, speechOptions);
      } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('❌ Error iniciando TTS:', error?.message || error);
        if (__DEV__) {
          console.warn('💡 expo-speech puede no estar disponible en Expo Go. Requiere un development build para funcionar correctamente.');
        }
        setIsSpeaking(false);
        resolve();
      }
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
        await startRecording('es-ES'); // Español de España, o 'en-US' para inglés
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
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Entrevista AI</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          style={styles.container} 
          contentContainerStyle={styles.centerContent}
        >
          <View style={styles.welcomeCard}>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name="robot-happy" size={64} color="#1E40AF" />
            </View>
            <Text style={styles.welcomeTitle}>Entrevista de Ciudadanía</Text>
            <Text style={styles.welcomeSubtitle}>
              Practica con un oficial de inmigración AI que simula una entrevista real del USCIS.
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="keyboard" size={20} color="#1E40AF" />
                <Text style={styles.featureText}>Responde escribiendo (voz opcional)</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="file-pdf-box" size={20} color="#1E40AF" />
                <Text style={styles.featureText}>Carga tu formulario N-400</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="chat" size={20} color="#1E40AF" />
                <Text style={styles.featureText}>Conversación realista</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="volume-high" size={20} color="#1E40AF" />
                <Text style={styles.featureText}>El oficial habla automáticamente</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tu Nombre Completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Juan García"
                value={applicantName}
                onChangeText={setApplicantName}
              />
            </View>

            <TouchableOpacity
              style={styles.n400Button}
              onPress={handlePickN400}
            >
              <MaterialCommunityIcons name="file-pdf-box" size={20} color="#1E40AF" />
              <Text style={styles.n400ButtonText}>
                {n400Loaded 
                  ? (n400FileName ? `N-400: ${n400FileName}` : 'N-400 Cargado ✓')
                  : 'Cargar Formulario N-400 (Opcional)'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={startInterview}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="play" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Comenzar Entrevista</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const content = (
    <>
      {!isWeb && (
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Entrevista en Curso</Text>
          <TouchableOpacity onPress={() => setSessionStarted(false)}>
            <MaterialCommunityIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

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
                name={message.role === 'officer' ? 'robot-happy' : 'account'}
                size={16}
                color={message.role === 'officer' ? '#1E40AF' : '#666'}
              />
              <Text style={styles.messageSender}>
                {message.role === 'officer' ? 'Oficial' : 'Tú'}
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
            <ActivityIndicator color="#1E40AF" />
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
          >
            <MaterialCommunityIcons
              name={isListening ? 'microphone' : 'microphone-outline'}
              size={24}
              color={isListening ? '#ef4444' : (!voiceSupported ? '#9ca3af' : '#1E40AF')}
            />
          </TouchableOpacity>

          <TextInput
            style={styles.messageInput}
            placeholder={isSpeaking ? "Escuchando al oficial..." : "Escribe tu respuesta..."}
            value={userInput}
            onChangeText={setUserInput}
            multiline
            editable={!isLoading && !isSpeaking}
          />

          <TouchableOpacity
            style={[styles.sendButton, (isLoading || isSpeaking || !userInput.trim()) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={isLoading || isSpeaking || !userInput.trim()}
          >
            <MaterialCommunityIcons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#1E40AF', // Azul profesional
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#1E40AF', // Azul profesional
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  container: {
    flex: 1,
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
    shadowColor: '#1E40AF', // Azul profesional
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  featuresList: {
    width: '100%',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  n400Button: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E40AF', // Azul profesional
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  n400ButtonText: {
    color: '#1E40AF', // Azul profesional
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#1E40AF', // Azul profesional
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E40AF', // Azul profesional
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  messagesContainer: {
    flex: 1,
    ...Platform.select({
      web: {
        // maxHeight se maneja con flex en React Native
      },
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
    backgroundColor: '#e0e7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#1E40AF',
  },
  applicantBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1E40AF', // Azul profesional
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
    color: '#6b7280',
  },
  messageText: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
    fontWeight: '500',
  },
  applicantMessageText: {
    color: '#fff',
  },
  loadingBubble: {
    alignSelf: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  speakingIndicator: {
    alignSelf: 'center',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1E40AF', // Azul profesional
  },
  speakingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#1E40AF', // Azul profesional
    fontWeight: '600',
  },
  inputArea: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      web: {
        // position: 'sticky' no es compatible con React Native
        // Se manejará con flex en el contenedor padre
        maxWidth: 1000,
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: 24,
        paddingVertical: 16,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
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
    backgroundColor: '#f0f0f0',
  },
  voiceButtonDisabled: {
    opacity: 0.5,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E40AF', // Azul profesional
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#1E40AF', // Azul profesional
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default AIInterviewN400ScreenModerno;

