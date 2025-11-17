import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { theme } from './src/config/theme';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

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

    configureAudio();
  }, []);

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar backgroundColor={theme.colors.background} barStyle="dark-content" />
          <AppNavigator />
        </PaperProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
