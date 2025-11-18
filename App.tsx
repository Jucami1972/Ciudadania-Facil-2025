import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { theme } from './src/config/theme';
import { AuthProvider } from './src/context/AuthContext';
import { PremiumProvider } from './src/context/PremiumContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
// Inicializar Sentry (solo en producción)
import './src/config/sentry';
// Inicializar servicio de pagos
import { initializePayments, disconnectPayments } from './src/services/paymentService';
// Configurar notificaciones
import { setupNotificationListeners, requestPermissions } from './src/services/notificationService';
// Configurar sincronización offline
import { setupConnectionListener } from './src/utils/offlineSync';

export default function App(): JSX.Element {
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          playsInSilentModeIOS: true,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          // Optimizaciones adicionales para mejor rendimiento
          shouldRouteThroughEarpiece: false,
          staysActiveInBackground: false,
          allowsRecordingIOS: false,
        });
      } catch (error) {
        console.warn('Error configurando modo de audio:', error);
      }
    };

    const setupPayments = async () => {
      try {
        await initializePayments();
      } catch (error: any) {
        // IAP no funciona en Expo Go, esto es esperado
        if (error?.message?.includes('Nitro') || error?.message?.includes('Expo Go')) {
          if (__DEV__) {
            console.log('ℹ️ IAP no disponible en Expo Go (esto es normal)');
          }
        } else {
          console.warn('Error inicializando servicio de pagos:', error?.message || error);
        }
      }
    };

    const setupNotifications = async () => {
      try {
        // Solicitar permisos
        await requestPermissions();
        
        // Configurar listeners
        const listeners = setupNotificationListeners(
          (notification) => {
            // Notificación recibida
            console.log('Notificación recibida:', notification);
          },
          (response) => {
            // Usuario tocó la notificación
            console.log('Notificación tocada:', response);
            // Aquí puedes navegar a una pantalla específica si es necesario
          }
        );

        // Cleanup al desmontar
        return () => {
          listeners.remove();
        };
      } catch (error) {
        console.warn('Error configurando notificaciones:', error);
      }
    };

    const setupOfflineSync = () => {
      // Configurar listener de conexión
      const connectionCleanup = setupConnectionListener(async (isConnected) => {
        if (isConnected) {
          // Cuando vuelve online, intentar sincronizar
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const userId = await AsyncStorage.getItem('@user:uid');
          if (userId) {
            const { loadFromFirestore } = require('./src/utils/offlineSync');
            await loadFromFirestore(userId);
          }
        }
      });

      return connectionCleanup;
    };

    configureAudio();
    setupPayments();
    const notificationCleanup = setupNotifications();
    const connectionCleanup = setupOfflineSync();

    // Cleanup al desmontar
    return () => {
      disconnectPayments();
      if (notificationCleanup) {
        notificationCleanup.then(cleanup => cleanup && cleanup());
      }
      if (connectionCleanup) {
        connectionCleanup();
      }
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <PremiumProvider>
          <SafeAreaProvider>
            <PaperProvider theme={theme}>
              <StatusBar backgroundColor={theme.colors.background} barStyle="dark-content" />
              <AppNavigator />
            </PaperProvider>
          </SafeAreaProvider>
        </PremiumProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
