// src/components/Onboarding.tsx
// Componente de onboarding/tutorial para nuevos usuarios
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvent, AnalyticsEvent } from '../utils/analytics';
import { useIsWebDesktop } from '../hooks/useIsWebDesktop';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface OnboardingStep {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    icon: 'book-education',
    title: 'Bienvenido a Ciudadanía Fácil',
    description: 'La forma más fácil de prepararte para el examen de ciudadanía estadounidense. Aprende las 128 preguntas oficiales de manera interactiva.',
    color: '#7C3AED',
  },
  {
    id: 'study',
    icon: 'cards',
    title: 'Tarjetas de Estudio',
    description: 'Estudia con tarjetas interactivas que puedes voltear. Escucha la pronunciación en inglés y español para cada pregunta.',
    color: '#9B54FF',
  },
  {
    id: 'practice',
    icon: 'pencil-box',
    title: 'Practica y Aprende',
    description: 'Pon a prueba tus conocimientos con diferentes modos de práctica: por categoría, aleatorio, o enfocado en tus errores.',
    color: '#10B981',
  },
  {
    id: 'ai',
    icon: 'robot',
    title: 'Entrevista AI',
    description: 'Simula una entrevista real con nuestra IA. Responde preguntas sobre tu formulario N-400 y prepárate para el gran día.',
    color: '#EF4444',
  },
  {
    id: 'progress',
    icon: 'chart-line',
    title: 'Rastrea tu Progreso',
    description: 'Ve cuánto has avanzado, mantén tu racha de estudio y alcanza tus metas diarias. Cada día te acerca más a tu objetivo.',
    color: '#F59E0B',
  },
];

const STORAGE_KEY = '@onboarding:completed';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const scrollViewRef = useRef<ScrollView>(null);
  const isWebDesktop = useIsWebDesktop();

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      // Animación de fade
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      // Scroll automático en web
      if (isWeb && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: nextStep * width, animated: true });
      }

      // Trackear progreso
      trackEvent(AnalyticsEvent.FEATURE_DISCOVERED, {
        feature: 'onboarding',
        step: nextStep,
        step_name: ONBOARDING_STEPS[nextStep].id,
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    trackEvent(AnalyticsEvent.FEATURE_DISCOVERED, {
      feature: 'onboarding',
      action: 'skipped',
      step: currentStep,
    });
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      trackEvent(AnalyticsEvent.FEATURE_DISCOVERED, {
        feature: 'onboarding',
        action: 'completed',
        total_steps: ONBOARDING_STEPS.length,
      });
      onComplete();
    } catch (error) {
      console.error('Error guardando estado de onboarding:', error);
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);

      if (isWeb && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: prevStep * width, animated: true });
      }
    }
  };

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <View style={styles.container}>
      {/* Indicadores de progreso */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= currentStep && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Omitir</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido principal */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {ONBOARDING_STEPS.map((step, index) => (
          <Animated.View
            key={step.id}
            style={[
              styles.stepContainer,
              { opacity: index === currentStep ? fadeAnim : 0 },
            ]}
          >
            <View style={styles.stepContent}>
              {/* Icono */}
              <View style={[styles.iconContainer, { backgroundColor: `${step.color}15` }]}>
                <MaterialCommunityIcons
                  name={step.icon as any}
                  size={isWebDesktop ? 80 : 64}
                  color={step.color}
                />
              </View>

              {/* Título */}
              <Text style={styles.stepTitle}>{step.title}</Text>

              {/* Descripción */}
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Botones de navegación */}
      <View style={styles.navigationContainer}>
        {!isFirstStep && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePrevious}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color="#7C3AED" />
          </TouchableOpacity>
        )}

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[styles.nextButton, isLastStep && styles.nextButtonFinal]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isLastStep ? ['#10B981', '#059669'] : ['#7C3AED', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {isLastStep ? 'Comenzar' : 'Siguiente'}
            </Text>
            {!isLastStep && (
              <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    ...Platform.select({
      web: {
        paddingTop: 40,
        paddingHorizontal: 48,
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  progressDot: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressDotActive: {
    backgroundColor: '#7C3AED',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipButtonText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    ...Platform.select({
      web: {
        flexDirection: 'row',
      },
    }),
  },
  stepContainer: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    ...Platform.select({
      web: {
        width: '100%',
        maxWidth: 800,
        alignSelf: 'center',
      },
    }),
  },
  stepContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    ...Platform.select({
      web: {
        width: 160,
        height: 160,
        borderRadius: 80,
        marginBottom: 48,
      },
    }),
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    ...Platform.select({
      web: {
        fontSize: 36,
        marginBottom: 24,
      },
    }),
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    ...Platform.select({
      web: {
        fontSize: 18,
        lineHeight: 28,
      },
    }),
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    ...Platform.select({
      web: {
        paddingHorizontal: 48,
        paddingBottom: 60,
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 140,
    ...Platform.select({
      web: {
        minWidth: 180,
      },
    }),
  },
  nextButtonFinal: {
    minWidth: 200,
    ...Platform.select({
      web: {
        minWidth: 240,
      },
    }),
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default Onboarding;

/**
 * Hook para verificar si el onboarding ya fue completado
 */
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

  return { isCompleted, isLoading };
};

