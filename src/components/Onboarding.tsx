// src/components/Onboarding.tsx
// Versión PREMIUM con textos optimizados para conversión
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  Image,
  Easing,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvent, AnalyticsEvent } from '../utils/analytics';
import { useIsWebDesktop } from '../hooks/useIsWebDesktop';

// Importar el SVG con manejo de errores
let LogoComponent: React.ComponentType<any> | null = null;

const loadLogo = () => {
  if (LogoComponent !== null) return LogoComponent;
  
  try {
    const svgModule = require('../assets/logoappredondovector.svg');
    LogoComponent = svgModule.default || svgModule;
    console.log('✅ SVG cargado correctamente');
  } catch (error) {
    console.warn('⚠️ No se pudo cargar el SVG, usando PNG como fallback:', error);
    LogoComponent = null;
  }
  
  return LogoComponent;
};

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface OnboardingStep {
  id: string;
  icon: string;
  title: string;
  description: string;
  features?: string[];
  color: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    icon: 'book-education',
    title: 'Bienvenido a Ciudadanía Fácil',
    description: 'La app #1 para aprobar el examen de ciudadanía estadounidense. Domina las 128 preguntas oficiales con más de 10 formas diferentes de estudiar.',
    features: [
      '✨ 10+ formas diferentes de practicar',
      '✅ 128 preguntas oficiales',
      '🎯 Nueva edición 2025',
    ],
    color: '#1E40AF',
  },
  {
    id: 'smart-study',
    icon: 'brain',
    title: 'Aprende de Forma Inteligente',
    description: 'Sistema de repetición espaciada que se adapta a tu ritmo. Tarjetas bilingües con audio profesional en inglés para practicar pronunciación.',
    features: [
      '🎯 Repetición espaciada inteligente',
      '🔊 Audio profesional en inglés',
      '📚 Tarjetas en inglés y español',
    ],
    color: '#1E40AF',
  },
  {
    id: 'practice-modes',
    icon: 'trophy',
    title: '10+ Modos de Práctica Diferentes',
    description: 'Desde exámenes simulados hasta práctica visual con memoria fotográfica. Practica como quieras, cuando quieras.',
    features: [
      '🎲 Exámenes aleatorios de 20',
      '📸 Memoria fotográfica visual',
      '🎯 Práctica enfocada en errores',
      '📝 Práctica por tipo de pregunta',
    ],
    color: '#10B981',
  },
  {
    id: 'achieve-goals',
    icon: 'star',
    title: 'Mantén tu Motivación',
    description: 'Sistema de rachas diarias, badges desbloqueables y estadísticas detalladas. Ve tu progreso día a día hasta conseguir tu ciudadanía.',
    features: [
      '🔥 Sistema de rachas diarias',
      '🏆 Badges y logros',
      '📊 Estadísticas detalladas',
      '✨ Progreso visual en tiempo real',
    ],
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

  // Animaciones con Animated nativo de React Native
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;

  // Animaciones para las features (aparecer una por una)
  const feature1Opacity = useRef(new Animated.Value(0)).current;
  const feature2Opacity = useRef(new Animated.Value(0)).current;
  const feature3Opacity = useRef(new Animated.Value(0)).current;
  const feature4Opacity = useRef(new Animated.Value(0)).current;

  // Efecto de animación
  useEffect(() => {
    if (currentStep === 0) {
      // Animación del logo en pantalla de bienvenida
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Después del logo, animar features
        animateFeatures();
      });
    } else {
      // Reset del logo
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Animar features para otros pasos
      animateFeatures();
    }
  }, [currentStep]);

  const animateFeatures = () => {
    // Reset features
    feature1Opacity.setValue(0);
    feature2Opacity.setValue(0);
    feature3Opacity.setValue(0);
    feature4Opacity.setValue(0);

    // Animar features en secuencia
    Animated.stagger(150, [
      Animated.timing(feature1Opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(feature2Opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(feature3Opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(feature4Opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      
      // CRÍTICO: Primero hacer fade out, LUEGO cambiar el paso, LUEGO fade in
      // Esto asegura que el contenido correcto se muestre
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Cambiar paso DESPUÉS del fade out completo
        setCurrentStep(nextStep);
        
        // Reset fadeAnim a 0 y hacer fade in del nuevo paso
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });

      if (isWeb && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: nextStep * width, animated: true });
      }

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

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);

      if (isWeb && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: prevStep * width, animated: true });
      }
    }
  };

  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // Estilos animados para el logo
  const logoAnimatedStyle = {
    opacity: logoOpacity,
    transform: [{ scale: logoScale }],
  };

  // Array de opacidades de features
  const featureOpacities = [feature1Opacity, feature2Opacity, feature3Opacity, feature4Opacity];

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
        {ONBOARDING_STEPS.map((step, index) => {
          // CRÍTICO: Determinar si este es el paso actual
          const isCurrentStep = index === currentStep;
          
          return (
            <Animated.View
              key={step.id}
              style={[
                styles.stepContainer,
                { 
                  // Solo el paso actual es visible y tiene opacidad animada
                  opacity: isCurrentStep ? fadeAnim : 0,
                  // Ocultar completamente los pasos no actuales sin afectar layout
                  position: isCurrentStep ? 'relative' : 'absolute',
                  width: isCurrentStep ? width : 0,
                  height: isCurrentStep ? 'auto' : 0,
                  overflow: 'hidden',
                },
              ]}
              pointerEvents={isCurrentStep ? 'auto' : 'none'}
              collapsable={!isCurrentStep}
            >
              <View style={styles.stepContent}>
                {/* CRÍTICO: Usar index === 0 en lugar de step.id === 'welcome' para garantizar que solo el primer paso muestre el logo */}
                {index === 0 ? (
                // Pantalla 1: Logo animado
                <Animated.View
                  style={[
                    styles.iconContainer,
                    styles.logoContainer,
                  ]}
                >
                  <Animated.View style={logoAnimatedStyle}>
                    {(() => {
                      const Logo = loadLogo();
                      return Logo ? (
                        <Logo
                          width={isWebDesktop ? 144 : 108}
                          height={isWebDesktop ? 144 : 108}
                          style={styles.logoSVG}
                        />
                      ) : (
                        <Image
                          source={require('../assets/logoapp1.png')}
                          style={styles.logoImage}
                          resizeMode="contain"
                        />
                      );
                    })()}
                  </Animated.View>
                </Animated.View>
              ) : (
                // Pantallas 2, 3, 4: Iconos con colores específicos
                // CRÍTICO: Usar index para determinar el color de fondo en lugar de step.id
                <View style={[
                  styles.iconContainer, 
                  { 
                    backgroundColor: index === 1 ? '#1E40AF15' :  // smart-study
                                   index === 2 ? '#10B98115' :  // practice-modes
                                   index === 3 ? '#F59E0B15' :  // achieve-goals
                                   '#F3F4F6'
                  }
                ]}>
                  <MaterialCommunityIcons
                    name={step.icon as any}
                    size={isWebDesktop ? 80 : 64}
                    color={step.color}
                  />
                </View>
              )}

              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>

              {/* Features animadas */}
              {step.features && step.features.length > 0 && (
                <View style={styles.featuresContainer}>
                  {step.features.map((feature, featureIndex) => (
                    <Animated.View
                      key={featureIndex}
                      style={[
                        styles.featureItem,
                        {
                          opacity: featureOpacities[featureIndex] || 1,
                        },
                      ]}
                    >
                      <Text style={styles.featureText}>{feature}</Text>
                    </Animated.View>
                  ))}
                </View>
              )}
            </View>
          </Animated.View>
        );
        })}
      </ScrollView>

      {/* Botones de navegación */}
      <View style={styles.navigationContainer}>
        {!isFirstStep && (
          <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#1E40AF" />
          </TouchableOpacity>
        )}

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[styles.nextButton, isLastStep && styles.nextButtonFinal]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isLastStep ? ['#10B981', '#059669'] : ['#1E40AF', '#1E3A8A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {isLastStep ? '¡Comienza tu Preparación!' : 'Siguiente'}
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
    backgroundColor: '#1E40AF',
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
    marginBottom: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        width: 160,
        height: 160,
        borderRadius: 80,
        marginBottom: 32,
      },
    }),
  },
  logoContainer: {
    backgroundColor: '#F3F4F6',
  },
  logoSVG: {
    alignSelf: 'center',
  },
  logoImage: {
    width: '90%',
    height: '90%',
    ...Platform.select({
      web: {
        borderRadius: 72,
      },
      default: {
        borderRadius: 54,
      },
    }),
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    ...Platform.select({
      web: {
        fontSize: 36,
        marginBottom: 16,
      },
    }),
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    ...Platform.select({
      web: {
        fontSize: 18,
        lineHeight: 28,
        marginBottom: 24,
      },
    }),
  },
  featuresContainer: {
    width: '100%',
    paddingHorizontal: 16,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#1E40AF',
  },
  featureText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
    ...Platform.select({
      web: {
        fontSize: 16,
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
    borderColor: '#1E40AF',
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
    minWidth: 220,
    ...Platform.select({
      web: {
        minWidth: 280,
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
