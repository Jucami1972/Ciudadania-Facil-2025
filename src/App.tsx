import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { theme } from './config/theme';
import AppNavigator from './navigation/AppNavigator';
import { QuestionsProvider } from './context/QuestionsContext';
import { UserStatsProvider } from './context/UserStatsContext';

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
        });
      } catch (error) {
        console.warn('Error configurando modo de audio:', error);
      }
    };

    configureAudio();
  }, []);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <QuestionsProvider>
          <UserStatsProvider>
            <StatusBar backgroundColor={theme.colors.background} barStyle="dark-content" />
            <AppNavigator />
          </UserStatsProvider>
        </QuestionsProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
} 