import React, { useEffect, useRef } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { theme } from './src/config/theme';
import { AuthProvider } from './src/context/AuthContext';
import { PremiumProvider } from './src/context/PremiumContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App(): React.ReactElement {
  const cleanupRef = useRef<{
    notificationListeners: any;
    connectionCleanup: (() => void) | null;
    disconnectPayments: (() => void) | null;
  }>({
    notificationListeners: null,
    connectionCleanup: null,
    disconnectPayments: null,
  });

  useEffect(() => {
    // Inicializar Sentry (solo en producción) - con manejo de errores
    try {
      require('./src/config/sentry');
    } catch (error) {
      console.warn('Error cargando Sentry:', error);
    }

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
        });
      } catch (error) {
        console.warn('Error configurando modo de audio:', error);
      }
    };

    const setupPayments = async () => {
      try {
        const paymentService = require('./src/services/paymentService');
        const initializePayments = paymentService.initializePayments;
        if (initializePayments) {
          await initializePayments();
        }
        // Guardar referencia para cleanup
        cleanupRef.current.disconnectPayments = paymentService.disconnectPayments;
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
        const notificationService = require('./src/services/notificationService');
        const requestPermissions = notificationService.requestPermissions;
        const setupNotificationListeners = notificationService.setupNotificationListeners;
        
        if (!requestPermissions || !setupNotificationListeners) return null;
        
        // Solicitar permisos
        await requestPermissions();
        
        // Configurar listeners
        const listeners = setupNotificationListeners(
          (notification: any) => {
            // Notificación recibida
            console.log('Notificación recibida:', notification);
          },
          (response: any) => {
            // Usuario tocó la notificación
            console.log('Notificación tocada:', response);
            // Aquí puedes navegar a una pantalla específica si es necesario
          }
        );

        return listeners;
      } catch (error) {
        console.warn('Error configurando notificaciones:', error);
        return null;
      }
    };

    const setupOfflineSync = () => {
      try {
        const offlineSync = require('./src/utils/offlineSync');
        const setupConnectionListener = offlineSync.setupConnectionListener;
        
        if (!setupConnectionListener) return null;
        
        // Configurar listener de conexión
        const connectionCleanup = setupConnectionListener(async (isConnected: boolean) => {
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
      } catch (error) {
        console.warn('Error configurando sincronización offline:', error);
        return null;
      }
    };

    // Configurar todo de forma asíncrona
    (async () => {
      await configureAudio();
      await setupPayments();
      cleanupRef.current.notificationListeners = await setupNotifications();
      cleanupRef.current.connectionCleanup = setupOfflineSync();
    })();

    // Cleanup al desmontar
    return () => {
      if (cleanupRef.current.disconnectPayments) {
        cleanupRef.current.disconnectPayments();
      }
      if (cleanupRef.current.notificationListeners?.remove) {
        cleanupRef.current.notificationListeners.remove();
      }
      if (cleanupRef.current.connectionCleanup) {
        cleanupRef.current.connectionCleanup();
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
