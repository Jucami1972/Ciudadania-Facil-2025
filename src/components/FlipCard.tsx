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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
  onFlip?: (isFlipped: boolean) => void;
}

interface FlipCardHandle {
  reset: () => void;
  playAudio: () => void;
  stopAudio: () => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const FlipCard = forwardRef<FlipCardHandle, FlipCardProps>(
  ({ frontContent, backContent, language, isImportant = false, onFlip }, ref) => {
    const anim = useRef(new Animated.Value(0)).current;
    const flipped = useRef(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

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
      const newFlippedState = !flipped.current;
      Animated.spring(anim, {
        toValue: flipped.current ? 0 : 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
      flipped.current = newFlippedState;
      setIsFlipped(newFlippedState);
      stopAudio(); // Detener el audio al voltear
      // Notificar al componente padre
      if (onFlip) {
        onFlip(newFlippedState);
      }
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
      // Notificar al componente padre
      if (onFlip) {
        onFlip(false);
      }
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
                <Text key={index} style={[style, { color: '#FFE87C', fontWeight: '700', textShadowColor: 'rgba(0, 0, 0, 0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }]}>
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
        <TouchableOpacity 
          onPress={flip} 
          style={[
            styles.flipContainer,
            isWeb && isHovered && styles.flipContainerHovered,
          ]}
          onMouseEnter={() => isWeb && setIsHovered(true)}
          onMouseLeave={() => isWeb && setIsHovered(false)}
        >
          {/* FRENTE */}
          <Animated.View
            style={[styles.face, { transform: [{ perspective: 1000 }, { rotateY: frontDeg }], zIndex: flipped.current ? 0 : 1 }]}
          >
            {/* LADO FRONTAL - GRADIENTE MORADO */}
            <LinearGradient 
              colors={['#A277FF', '#7C4DFF']} 
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={[styles.gradient, isImportant && styles.important]}
            >
              <View style={styles.labelRow}>
                <Text style={styles.sideLabel}>
                  {language === 'en' ? `Question #${frontContent.number || ''}` : `Pregunta #${frontContent.number || ''}`}
                </Text>
              </View>
              {frontContent.number != null && (
                <View style={styles.numberBox}>
                  <Text style={styles.numberText}>#{frontContent.number}</Text>
                </View>
              )}
              <BlurView intensity={10} tint="light" style={styles.contentBackground}>
                <ScrollView contentContainerStyle={styles.scrollInner}>
                  <Text style={[styles.questionText, { fontSize: getFontSize(qText) }]}>{qText}</Text>
                </ScrollView>
              </BlurView>
              <Text style={styles.instruction}>Toca para girar / Tap to flip</Text>
            </LinearGradient>
          </Animated.View>

          {/* REVERSO */}
          <Animated.View
            style={[styles.face, { transform: [{ perspective: 1000 }, { rotateY: backDeg }], position: 'absolute', top: 0 }]}
          >
            {/* LADO POSTERIOR - GRADIENTE MORADO OSCURO */}
            <LinearGradient 
              colors={['#6D28D9', '#9333EA', '#A855F7']} 
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              locations={[0, 0.5, 1]}
              style={[styles.gradient, isImportant && styles.important]}
            >
              <View style={styles.labelRow}>
                <Text style={styles.sideLabel}>{language === 'en' ? 'Answer' : 'Respuesta'}</Text>
              </View>
              {frontContent.number != null && (
                <View style={styles.numberBox}>
                  <Text style={styles.numberText}>#{frontContent.number}</Text>
                </View>
              )}
              <BlurView intensity={10} tint="light" style={styles.contentBackground}>
                <ScrollView contentContainerStyle={styles.scrollInner}>
                  {renderTextWithPreferredOptions(aText, [styles.answerText, { fontSize: getFontSize(aText) }])}
                </ScrollView>
              </BlurView>
              <Text style={styles.instruction}>Toca para regresar / Tap to flip back</Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: width * 0.92,
    minHeight: 450,
    maxHeight: 1200,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 20,
    position: 'relative',
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 8,
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 900,
        minHeight: 600,
        maxHeight: 900,
        marginTop: 0,
        marginBottom: 48,
        paddingHorizontal: 0,
      },
    }),
  },
  flipContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 28,
    height: '100%',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        borderRadius: 32,
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  flipContainerHovered: {
    ...Platform.select({
      web: {
        transform: [{ scale: 1.01 }],
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  face: {
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: 28,
  },
  gradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    height: '100%',
    ...Platform.select({
      web: {
        padding: 48,
      },
    }),
  },
  important: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    alignSelf: 'center',
  },
  sideLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.3,
  },
  numberBox: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  numberText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 14,
    fontWeight: '700',
  },
  contentBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 20,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        paddingTop: 40,
        paddingBottom: 48,
        paddingHorizontal: 48,
        minHeight: 400,
        borderRadius: 28,
        borderWidth: 2,
      },
    }),
  },
  scrollInner: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    flexGrow: 1,
    minHeight: 300,
    ...Platform.select({
      web: {
        padding: 16,
        minHeight: 350,
      },
    }),
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.1,
    ...Platform.select({
      web: {
        fontSize: 28,
        lineHeight: 40,
        fontWeight: '700',
      },
    }),
  },
  answerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.1,
    ...Platform.select({
      web: {
        fontSize: 24,
        lineHeight: 36,
        fontWeight: '700',
      },
    }),
  },
  instruction: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
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