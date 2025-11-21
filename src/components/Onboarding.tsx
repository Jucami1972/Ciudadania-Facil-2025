// src/components/Onboarding.tsx
// Versión refactorizada con estructura exacta especificada
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  Image,
  ImageBackground,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvent, AnalyticsEvent } from '../utils/analytics';

const { width, height } = Dimensions.get('window');

// --- CONFIGURACIÓN DE LOS PASOS ---
interface OnboardingStep {
  id: string;
  image: string;
  title: string;
  description: string;
  features?: (string | { icon: string; text: string; color: string })[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    image: 'onboarding1.webp',
    title: '¡Tu Ciudadanía Te Espera!',
    description: 'Domina el examen con la app #1: 128 preguntas y 10+ formas de estudio interactivas.',
  },
  {
    id: 'smart-study',
    image: 'onboarding2.webp',
    title: 'Estudia Eficiente.\nAhorra Tiempo',
    description: 'Nuestro sistema de aprendizaje adaptativo prioriza lo que debes repasar. Concéntrate solo en lo esencial y retén más.',
    features: [
      { icon: 'brain', text: 'Repetición espaciada inteligente', color: '#0F62FE' },
      { icon: 'volume-high', text: 'Audio profesional en inglés', color: '#0F62FE' },
      { icon: 'cards', text: 'Tarjetas en inglés y español', color: '#0F62FE' },
    ],
  },
  {
    id: 'practice-modes',
    image: 'onboarding3.webp',
    title: 'Domina con Flexibilidad.',
    description: 'Nunca te aburras de estudiar. Elige entre más de 10 métodos para practicar a tu ritmo, incluyendo simulacros y enfoque en tus fallos.',
    features: [
      { icon: 'dice-5', text: 'Exámenes aleatorios de 20', color: '#1E40AF' },
      { icon: 'lightbulb-on', text: 'Memoria fotográfica visual', color: '#1E40AF' },
      { icon: 'target', text: 'Práctica enfocada en errores', color: '#1E40AF' },
    ],
  },
  {
    id: 'achieve-goals',
    image: 'onboarding4.webp',
    title: 'Guía Tu Progreso hacia el Éxito.',
    description: 'Convierte el estudio en un hábito. Nuestro sistema te mantiene motivado con rachas, logros y estadísticas claras de tu avance diario.',
    features: [
      { icon: 'fire', text: 'Sistema de rachas diarias', color: '#1E40AF' },
      { icon: 'trophy', text: 'Badges y logros', color: '#1E40AF' },
      { icon: 'chart-bar', text: 'Estadísticas detalladas', color: '#1E40AF' },
      { icon: 'star', text: 'Progreso visual en tiempo real', color: '#1E40AF' },
    ],
  },
  {
    id: 'ai-interview',
    image: 'onboarding1.webp',
    title: 'Simula la Entrevista Real',
    description: 'Practica la conversación N-400 con nuestra IA avanzada. Recibe feedback de pronunciación y fluidez al instante.',
  },
];

const STORAGE_KEY = '@onboarding:completed';

interface OnboardingProps {
  onComplete: () => void;
}

// --- Mapa de imágenes (fuera del componente para evitar recreación) ---
const IMAGE_MAP: Record<string, any> = {
  'onboarding1.webp': require('../assets/imagenonboarding/onboarding1.webp'),
  'onboarding2.webp': require('../assets/imagenonboarding/onboarding2.webp'),
  'onboarding3.webp': require('../assets/imagenonboarding/onboarding3.webp'),
  'onboarding4.webp': require('../assets/imagenonboarding/onboarding4.webp'),
};

// --- Componente de Imagen de Fondo ---
const OnboardingImage: React.FC<{ imageName: string; stepIndex: number }> = ({ imageName, stepIndex }) => {
  const source = IMAGE_MAP[imageName];
  
  if (__DEV__) {
    console.log(`🖼️ [OnboardingImage] stepIndex: ${stepIndex}, imageName: ${imageName}, source exists: ${!!source}`);
  }
  
  if (!source) {
    console.warn(`⚠️ Imagen no encontrada: ${imageName}, usando onboarding1.webp como fallback`);
    return (
      <Image
        source={IMAGE_MAP['onboarding1.webp']}
        style={styles.backgroundImage}
        resizeMode="cover"
        key={`fallback-${stepIndex}`}
      />
    );
  }

  return (
    <Image
      source={source}
      style={styles.backgroundImage}
      resizeMode="cover"
      key={`img-${stepIndex}-${imageName}`} // Key único con stepIndex para forzar re-render
    />
  );
};

// --- Componente Principal ---
const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [imageFadeAnim] = useState(new Animated.Value(1));
  const currentStepData = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      
      // Animar fade out de contenido e imagen
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(imageFadeAnim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(nextStep);
        fadeAnim.setValue(0);
        imageFadeAnim.setValue(1);
        // Animar fade in del nuevo contenido e imagen
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(imageFadeAnim, {
            toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      });

      try {
        trackEvent(AnalyticsEvent.FEATURE_DISCOVERED, {
          feature: 'onboarding',
          step: nextStep,
          step_name: ONBOARDING_STEPS[nextStep].id,
        });
      } catch (error) {
        // Ignorar errores de analytics
      }
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      
      // Animar fade out de contenido e imagen
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(imageFadeAnim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(prevStep);
        fadeAnim.setValue(0);
        imageFadeAnim.setValue(1);
        // Animar fade in del nuevo contenido e imagen
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(imageFadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const handleSkip = () => {
    try {
      trackEvent(AnalyticsEvent.FEATURE_DISCOVERED, {
        feature: 'onboarding',
        action: 'skipped',
        step: currentStep,
      });
    } catch (error) {
      // Ignorar errores de analytics
    }
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      try {
        trackEvent(AnalyticsEvent.FEATURE_DISCOVERED, {
          feature: 'onboarding',
          action: 'completed',
          total_steps: ONBOARDING_STEPS.length,
        });
      } catch (error) {
        // Ignorar errores de analytics
      }
      onComplete();
    } catch (error) {
      console.error('Error guardando estado de onboarding:', error);
      onComplete();
    }
  };

  // Debug: verificar qué imagen se está usando
  useEffect(() => {
    const stepImage = ONBOARDING_STEPS[currentStep]?.image;
    console.log(`📱 [DEBUG] Paso actual: ${currentStep}`);
    console.log(`📱 [DEBUG] Step ID: ${ONBOARDING_STEPS[currentStep]?.id}`);
    console.log(`📱 [DEBUG] Imagen del paso: ${stepImage}`);
    console.log(`📱 [DEBUG] currentStepData.image: ${currentStepData.image}`);
    console.log(`📱 [DEBUG] ¿Coinciden? ${stepImage === currentStepData.image}`);
  }, [currentStep, currentStepData]);

  return (
    <View style={styles.container}>
      {/* Imagen de fondo - cubre toda la pantalla */}
      <View style={styles.imageArea}>
        <Animated.View style={{ opacity: imageFadeAnim }} key={`img-container-${currentStep}-${currentStepData.image}`}>
          <Image
            source={IMAGE_MAP[currentStepData.image] || IMAGE_MAP['onboarding1.webp']}
            style={styles.backgroundImage}
            resizeMode="cover"
            key={`direct-img-${currentStep}-${currentStepData.image}`}
          />
        </Animated.View>
      </View>

      {/* Header en la parte superior */}
      <View style={styles.header}>
        {/* Left: Logo y título */}
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../assets/imagenonboarding/logoapp1.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName} numberOfLines={1}>
            Ciudadanía Fácil
          </Text>
        </View>

        {/* Center: Progress dots - centrados en la pantalla */}
        <View style={styles.progressDotsContainer}>
          <View style={styles.progressDots}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                  index === currentStep && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
        </View>

        {/* Right: Skip button */}
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Omitir</Text>
        </TouchableOpacity>
      </View>

      {/* Panel inferior con contenido */}
      <View style={[styles.bottomPanel, (currentStep === 1 || currentStep === 2 || currentStep === 3) && styles.bottomPanelStep2]}>
        <Animated.View style={[styles.contentArea, (currentStep === 1 || currentStep === 2 || currentStep === 3) && styles.contentAreaStep2, { opacity: fadeAnim }]}>
          {/* Título - diferente estilo para pantallas 2, 3 y 4 */}
          {(currentStep === 1 || currentStep === 2 || currentStep === 3) ? (
            <Text style={styles.titleTwoLines}>
              {currentStepData.title}
            </Text>
          ) : (
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.8}>
              {currentStepData.title}
            </Text>
          )}
          
          {/* Descripción - alineada a la izquierda en pantallas 2, 3 y 4 */}
          <Text style={[styles.description, (currentStep === 1 || currentStep === 2 || currentStep === 3) && styles.descriptionStep2]} numberOfLines={3}>
            {currentStepData.description}
          </Text>

          {/* Features cards - para pantallas 2, 3 y 4 */}
          {(currentStep === 1 || currentStep === 2 || currentStep === 3) && currentStepData.features && (
            <View style={styles.featuresContainer}>
              {currentStepData.features.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <View style={styles.featureIconContainer}>
                  <MaterialCommunityIcons
                      name={typeof feature === 'object' ? (feature.icon as any) : (index === 0 ? 'brain' : index === 1 ? 'volume-high' : 'cards')}
                      size={18}
                      color={typeof feature === 'object' ? feature.color : '#0F62FE'}
                    />
                  </View>
                  <Text style={styles.featureText} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.85}>
                    {typeof feature === 'object' ? feature.text : feature}
                  </Text>
                </View>
              ))}
            </View>
          )}

      {/* Botones de navegación */}
          <View style={[styles.navigationRow, currentStep === 0 && styles.navigationRowHidden]}>
            {currentStep > 0 && (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handlePrevious}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="chevron-left" size={40} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
              style={[styles.primaryButton, currentStep > 0 && styles.primaryButtonWithMargin]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.buttonGradient, currentStep > 0 && !isLastStep && styles.buttonGradientRow]}
              >
                <Text style={styles.buttonText}>
                  {isLastStep ? '¡Comenzar mi Plan Personalizado!' : 'Siguiente'}
                </Text>
                {!isLastStep && currentStep > 0 && (
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Botón único para pantalla 1 */}
          {currentStep === 0 && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  ¡COMENZAR MI PLAN PERSONALIZADO!
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  imageArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    zIndex: 10,
    ...Platform.select({
      ios: {
        paddingTop: 50,
      },
      android: {
        paddingTop: 20,
      },
      web: {
        paddingTop: 20,
      },
    }),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    maxWidth: width * 0.45, // Máximo 45% del ancho de pantalla
  },
  logoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 2, // Reducido para que se vea menos blanco
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
    flexShrink: 0,
  },
  progressDotsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: Platform.OS === 'ios' ? 106 : 76, // Debajo del título (paddingTop + altura logo + espacio)
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    width: '100%',
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#888888',
    opacity: 0.6,
  },
  progressDotActive: {
    backgroundColor: '#FFFFFF',
    opacity: 1,
  },
  skipButton: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 50 : 20,
    alignItems: 'flex-end',
    flexShrink: 0,
    minWidth: 50,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#D0D0D0',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
        width: '100%',
      },
  bottomPanelStep2: {
    paddingHorizontal: 24,
    alignItems: 'flex-start',
  },
  contentArea: {
    width: '100%',
    alignItems: 'center',
  },
  contentAreaStep2: {
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    width: '100%',
    ...Platform.select({
      web: {
        fontSize: 24,
      },
    }),
  },
  description: {
    fontSize: 15,
    color: '#E5E5E5',
    textAlign: 'center',
    lineHeight: 20,
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  descriptionStep2: {
    textAlign: 'justify',
    paddingHorizontal: 0,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24, // Aumentar espacio para que se vea completo el texto
  },
  titleTwoLines: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'left',
    marginBottom: 12,
    width: '100%',
    ...Platform.select({
      web: {
        fontSize: 28,
      },
    }),
  },
  primaryButton: {
    width: '92%',
    height: 48,
    borderRadius: 12, // Esquinas curvadas como las tarjetas blancas
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignSelf: 'center',
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonGradientRow: {
    flexDirection: 'row',
    gap: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 20,
    gap: 10,
  },
  featureCard: {
    width: '100%',
    minHeight: 48, // Reducido de 54 a 48
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // Esquinas ligeramente curvadas en lugar de completamente redondas
    borderWidth: 1,
    borderColor: '#E5E7EB', // Borde gris delgado
    paddingHorizontal: 16,
    paddingVertical: 10, // Reducido de 12 a 10
    marginBottom: 8, // Reducido de 10 a 8
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    width: '100%',
  },
  navigationRowHidden: {
    display: 'none',
  },
  backButton: {
    width: 60,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  primaryButtonWithMargin: {
    flex: 1,
    marginLeft: 16,
    height: 48,
  },
});

export default Onboarding;

export const useOnboardingStatus = () => {
  const [isCompleted, setIsCompleted] = React.useState<boolean | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const completed = await AsyncStorage.getItem(STORAGE_KEY);
        setIsCompleted(completed === 'true');
      } catch (error) {
        console.error('Error verificando estado de onboarding:', error);
        setIsCompleted(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  return { 
    isCompleted: isCompleted ?? false,
    isLoading 
  };
};
