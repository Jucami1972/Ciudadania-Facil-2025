import React, {
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useState,
} from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import type { AVPlaybackStatus } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { questionAudioMap } from '../assets/audio/questions/questionsMap';
import { answerAudioMap } from '../assets/audio/answers/answersMap';

interface FlipCardProps {
  frontContent: {
    number?: number;
    question: string;
    questionEn: string;
  };
  backContent: {
    answer: string;
    answerEn: string;
  };
  language: 'en' | 'es';
  isImportant?: boolean;
}

interface FlipCardHandle {
  reset: () => void;
  playAudio: () => void;
  stopAudio: () => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

const { width } = Dimensions.get('window');

const FlipCard = forwardRef<FlipCardHandle, FlipCardProps>(
  ({ frontContent, backContent, language, isImportant = false }, ref) => {
    const anim = useRef(new Animated.Value(0)).current;
    const flipped = useRef(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    // Detener el audio cuando el componente se desmonta o cambia de pregunta
    useEffect(() => {
      return () => {
        stopAudio();
      };
    }, [frontContent.question, frontContent.questionEn]);

    // Detener el audio cuando se voltea la tarjeta
    useEffect(() => {
      if (flipped.current) {
        stopAudio();
      }
    }, [flipped.current]);

    const stopAudio = async () => {
      if (!sound) return;
      try {
        const status = await sound.getStatusAsync().catch(() => null);
        if (status && 'isLoaded' in status && status.isLoaded) {
          if ('isPlaying' in status && status.isPlaying) {
            await sound.stopAsync();
          }
          // Evitar callbacks después de descargar
          sound.setOnPlaybackStatusUpdate(null);
          await sound.unloadAsync();
        }
      } catch (error) {
        // Silenciar error cuando el sonido ya no está cargado
        // Evita: "Cannot complete operation because sound is not loaded"
      } finally {
        setSound(null);
        setIsPlaying(false);
      }
    };

    const frontDeg = anim.interpolate({
      inputRange: [0, 180],
      outputRange: ['0deg', '180deg'],
    });

    const backDeg = anim.interpolate({
      inputRange: [0, 180],
      outputRange: ['180deg', '360deg'],
    });

    const flip = () => {
      Animated.spring(anim, {
        toValue: flipped.current ? 0 : 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
      flipped.current = !flipped.current;
      setIsFlipped(!isFlipped);
      stopAudio(); // Detener el audio al voltear
    };

    const reset = () => {
      Animated.spring(anim, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
      flipped.current = false;
      setIsFlipped(false);
      stopAudio();
    };

    const playQuestionAudio = async () => {
      try {
        if (!frontContent.number) return;
        await stopAudio(); // Detener cualquier audio que esté sonando
        const module = questionAudioMap[frontContent.number];
        
        if (!module) {
          console.error('Audio module not found for question ID:', frontContent.number);
          setIsPlaying(false);
          return;
        }
        
        const { sound: newSound } = await Audio.Sound.createAsync(module);
        setSound(newSound);
        setIsPlaying(true);
        await newSound.playAsync();
        newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (status.isLoaded && !status.isPlaying && !status.isBuffering) {
            setIsPlaying(false);
          }
        });
      } catch (error) {
        console.error('Error playing question audio:', error);
        setIsPlaying(false);
      }
    };

    const playAnswerAudio = async () => {
      try {
        if (!frontContent.number) return;
        await stopAudio(); // Detener cualquier audio que esté sonando
        const module = answerAudioMap[frontContent.number];
        const { sound: newSound } = await Audio.Sound.createAsync(module);
        setSound(newSound);
        setIsPlaying(true);
        await newSound.playAsync();
        newSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (status.isLoaded && !status.isPlaying && !status.isBuffering) {
            setIsPlaying(false);
          }
        });
      } catch (error) {
        console.error('Error playing answer audio:', error);
        setIsPlaying(false);
      }
    };

    useImperativeHandle(ref, () => ({
      reset,
      playAudio: () => {
        if (isPlaying) {
          stopAudio();
        } else {
          isFlipped ? playAnswerAudio() : playQuestionAudio();
        }
      },
      stopAudio,
      isPlaying,
      setIsPlaying,
    }));

    const qText = language === 'en' ? frontContent.questionEn : frontContent.question;
    const aText = language === 'en' ? backContent.answerEn : backContent.answer;

    const getFontSize = (text: string) => {
      const length = text.length;
      if (length > 200) return 14;
      if (length > 100) return 16;
      if (length > 50) return 18;
      return 20;
    };

    const renderTextWithPreferredOptions = (text: string, style: any) => {
      const parts = text.split(/(<preferred>.*?<\/preferred>)/g);
      return (
        <Text style={style}>
          {parts.map((part, index) => {
            if (part.startsWith('<preferred>') && part.endsWith('</preferred>')) {
              const preferredText = part.replace(/<\/?preferred>/g, '');
              return (
                <Text key={index} style={[style, { color: '#FFD700', fontWeight: 'bold' }]}>
                  {preferredText}
                </Text>
              );
            }
            return part;
          })}
        </Text>
      );
    };

    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={flip} style={styles.flipContainer}>
          {/* FRENTE */}
          <Animated.View
            style={[styles.face, { transform: [{ perspective: 1000 }, { rotateY: frontDeg }], zIndex: flipped.current ? 0 : 1 }]}
          >
            <LinearGradient colors={['#9057e3', '#5e13b3']} style={[styles.gradient, isImportant && styles.important]}>
              <View style={styles.labelRow}>
                <Text style={styles.sideLabel}>{language === 'en' ? 'Question' : 'Pregunta'}</Text>
              </View>
              {frontContent.number != null && (
                <View style={styles.numberBox}>
                  <Text style={styles.numberText}>#{frontContent.number}</Text>
                </View>
              )}
              <View style={styles.contentBackground}>
                <ScrollView contentContainerStyle={styles.scrollInner}>
                  <Text style={[styles.questionText, { fontSize: getFontSize(qText) }]}>{qText}</Text>
                </ScrollView>
              </View>
              <Text style={styles.instruction}>Toca para girar / Tap to flip</Text>
            </LinearGradient>
          </Animated.View>

          {/* REVERSO */}
          <Animated.View
            style={[styles.face, { transform: [{ perspective: 1000 }, { rotateY: backDeg }], position: 'absolute', top: 0 }]}
          >
            <LinearGradient colors={['#9057e3', '#5e13b3']} style={[styles.gradient, isImportant && styles.important]}>
              <View style={styles.labelRow}>
                <Text style={styles.sideLabel}>{language === 'en' ? 'Answer' : 'Respuesta'}</Text>
              </View>
              {frontContent.number != null && (
                <View style={styles.numberBox}>
                  <Text style={styles.numberText}>#{frontContent.number}</Text>
                </View>
              )}
              <View style={styles.contentBackground}>
                <ScrollView contentContainerStyle={styles.scrollInner}>
                  {renderTextWithPreferredOptions(aText, [styles.answerText, { fontSize: getFontSize(aText) }])}
                </ScrollView>
              </View>
              <Text style={styles.instruction}>Toca para girar / Tap to flip</Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: width * 0.9,
    minHeight: 450,
    maxHeight: 1200,
    alignSelf: 'center',
    marginTop: 2,
    marginBottom: 16,
    position: 'relative',
    flex: 1,
    paddingBottom: 5, // Asegura espacio para los botones inferiores
  },
  flipContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 30,
    height: '100%',
    position: 'relative',
  },
  face: {
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: 20,
  },
  gradient: {
    flex: 1,
    padding: 18,
    justifyContent: 'space-between',
    height: '100%',
  },
  important: {
    borderWidth: 2,
    borderColor: '#991abe',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    alignSelf: 'center',
  },
  sideLabel: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
  },
  numberBox: {
    position: 'absolute',
    top: 26,
    right: 16,
    backgroundColor: 'rgba(151, 148, 147, 0.42)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  numberText: {
    color: 'rgb(255, 255, 255)',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contentBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingTop: 4,
    paddingBottom: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 200,
  },
  scrollInner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    flexGrow: 1,
    minHeight: 300,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    lineHeight: 22,
  },
  answerText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    lineHeight: 20,
  },
  instruction: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  audioWithFlag: {
    position: 'absolute',
    top: 20,
    left: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  flagImage: {
    width: 48,
    height: 50,
    borderRadius: 24,
    position: 'absolute',
    zIndex: 1,
  },
  audioButtonOnFlag: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  audioButtonActive: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

FlipCard.displayName = 'FlipCard';

export default FlipCard;