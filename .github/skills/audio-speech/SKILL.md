---
name: audio-speech
description: 'Especialista en audio y voz para React Native. USE WHEN: implementar reproducción de audio, text-to-speech, reconocimiento de voz, grabación de audio, dictado, pronunciación, audio de preguntas, audio de respuestas, manejar expo-av, expo-speech, voice recognition, generar audio, configurar audio mode, manejar interrupciones de audio. DO NOT USE FOR: diseño visual, datos del examen, Firebase.'
---

# Audio & Speech — Ciudadanía Fácil 2025

## Rol
Eres un especialista en audio y procesamiento de voz en React Native/Expo.

## Servicios de Audio del Proyecto

### `src/services/AudioManagerService.ts` — Singleton principal
- Gestor centralizado de reproducción de audio
- Maneja carga, reproducción, pausa, stop de sonidos
- Previene múltiples sonidos simultáneos
- Descarga sonidos automáticamente al cambiar

### `src/services/AudioDictationService.ts` — Dictado
- Servicio para modo de dictado (escritura)
- Reproduce oraciones que el usuario debe escribir

### Hooks de audio
- `useAudioPlayer` — Hook para reproducción de audio con controles
- `useWebAudioPlayer` — Versión para web
- `useQuestionAudio` — Audio específico de preguntas/respuestas
- `useFeedbackSound` — Sonidos de feedback (correcto/incorrecto)
- `useVoiceRecognition` — Reconocimiento de voz

## Assets de Audio
```
src/assets/audio/
├── questions/           → Audio de preguntas (por ID)
│   └── questionsMap.ts  → Mapeo id -> require(audio)
├── answers/             → Audio de respuestas (por ID)
│   └── answersMap.ts    → Mapeo id -> require(audio)
├── reading/             → Audio de oraciones de lectura
│   └── readingMap.ts
└── writing/             → Audio de oraciones de escritura
    └── writingMap.ts
```

## Configuración de Audio

### App.tsx — Modo de audio global
```typescript
await Audio.setAudioModeAsync({
  allowsRecordingIOS: false,
  staysActiveInBackground: false,
  interruptionModeIOS: InterruptionModeIOS.DoNotMix,
  playsInSilentModeIOS: true,          // ← Importante para iOS
  interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
  shouldDuckAndroid: true,
  playThroughEarpieceAndroid: false,
});
```

## Patrones Correctos

### Reproducir audio de pregunta
```typescript
import { audioManager } from '../services/AudioManagerService';
import { questionAudioMap } from '../assets/audio/questions/questionsMap';
import { answerAudioMap } from '../assets/audio/answers/answersMap';

const playQuestionAudio = async (questionId: number) => {
  const audioSource = questionAudioMap[questionId];
  if (audioSource) {
    await audioManager.play(audioSource);
  }
};
```

### Text-to-Speech (fallback)
```typescript
import * as Speech from 'expo-speech';

const speak = (text: string, lang: 'en' | 'es') => {
  Speech.speak(text, {
    language: lang === 'en' ? 'en-US' : 'es-MX',
    rate: 0.9,
    pitch: 1.0,
  });
};
```

### Cleanup obligatorio
```typescript
useEffect(() => {
  return () => {
    // SIEMPRE limpiar en unmount
    if (sound) {
      sound.unloadAsync();
    }
    Speech.stop();
  };
}, [sound]);
```

### Reconocimiento de voz
```typescript
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

const { isListening, transcribedText, startListening, stopListening } = useVoiceRecognition();
```

## Limitaciones

- `expo-av` no soporta streaming de audio en Expo Go
- `@react-native-voice/voice` requiere build nativo (no funciona en Expo Go)
- En web, usar Web Audio API como fallback
- Los archivos MP3 deben ser livianos (< 200KB por pregunta)

## Procedimiento

1. **Usar** AudioManagerService para toda reproducción de audio
2. **Mapear** nuevos audios en los archivos `*Map.ts` correspondientes
3. **Limpiar** sonidos en useEffect cleanup
4. **Proveer** fallback con expo-speech si no hay archivo de audio
5. **No** reproducir múltiples sonidos simultáneamente
6. **Manejar** errores silenciosamente en producción, logear en `__DEV__`
