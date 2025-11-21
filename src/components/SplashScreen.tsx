// src/components/SplashScreen.tsx
// Pantalla de splash con logo animado (similar a Duolingo)
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Importar el SVG con manejo de errores
let LogoComponent: React.ComponentType<any> | null = null;

const loadLogo = () => {
  if (LogoComponent !== null) return LogoComponent;
  
  try {
    const svgModule = require('../assets/logoappredondovector.svg');
    LogoComponent = svgModule.default || svgModule;
  } catch (error) {
    LogoComponent = null;
  }
  
  return LogoComponent;
};

interface SplashScreenProps {
  onFinish: () => void;
  duration?: number; // Duración en milisegundos (default: 3500ms)
  fadeOutOpacity?: Animated.Value; // Opacidad controlada externamente para transición suave
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, duration = 3500, fadeOutOpacity }) => {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const internalFadeOut = useRef(new Animated.Value(1)).current;
  
  // Usar el fadeOutOpacity externo si está disponible, sino usar el interno
  const fadeOut = fadeOutOpacity || internalFadeOut;

  useEffect(() => {
    // Secuencia de animaciones:
    // 1. Logo aparece con rotación completa y escala
    // 2. Logo crece más de lo normal
    // 3. Logo se encoge a su tamaño normal
    // 4. Fade out y terminar

    // Paso 1: Rotación completa (360 grados) + escala inicial + opacidad del logo
    Animated.parallel([
      Animated.timing(logoRotation, {
        toValue: 1, // 1 = 360 grados
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1.3, // Crecer a 130% del tamaño
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Paso 2: Después de la rotación, encoger a tamaño normal con efecto bounce
      Animated.spring(logoScale, {
        toValue: 1, // Tamaño normal
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start(() => {
        // Paso 3: Después de que el logo se estabiliza, mostrar el texto
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(textTranslateY, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
    });

    // Si no hay fadeOutOpacity externo, manejar el fade out interno
    if (!fadeOutOpacity) {
      const timer = setTimeout(() => {
        console.log('⏰ SplashScreen: Timer completado, iniciando fade out interno');
        Animated.timing(internalFadeOut, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          console.log('✅ SplashScreen: Fade out interno completado, llamando onFinish');
          onFinish();
        });
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Si hay fadeOutOpacity externo, llamar onFinish después de la duración
      // El fadeOutOpacity será controlado externamente
      const timer = setTimeout(() => {
        console.log('⏰ SplashScreen: Timer completado, llamando onFinish (fadeOutOpacity externo)');
        onFinish();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onFinish, fadeOutOpacity]);

  const Logo = loadLogo();

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F9FAFB']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeOut,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Animated.View
            style={{
              transform: [
                { 
                  rotate: logoRotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'], // Rotación completa en sentido del reloj
                  })
                },
              ],
            }}
          >
            {Logo ? (
              <Logo
                width={120}
                height={120}
                style={styles.logoSVG}
              />
            ) : (
              <Image
                source={require('../assets/imagenonboarding/logoapp1.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            )}
          </Animated.View>
        </Animated.View>

        {/* Nombre de la app con animación */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.appName}>Ciudadanía Fácil</Text>
        </Animated.View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Asegurar que el contenido no se salga del contenedor redondo
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoSVG: {
    alignSelf: 'center',
  },
  logoImage: {
    width: '85%',
    height: '85%',
    borderRadius: 60,
  },
  textContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E3A8A', // Azul oscuro primario del logo
    letterSpacing: 0.5,
    ...Platform.select({
      web: {
        fontSize: 32,
      },
    }),
  },
});

export default SplashScreen;

