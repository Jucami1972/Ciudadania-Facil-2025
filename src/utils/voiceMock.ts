// Mock para @react-native-voice/voice cuando no está disponible en Expo Go
// Este mock proporciona una interfaz compatible pero no implementa funcionalidad real

const VoiceMock = {
  isAvailable: async () => {
    return false;
  },
  start: async (locale?: string) => {
    throw new Error('Voice recognition requires a development build. Not available in Expo Go.');
  },
  stop: async () => {
    // No-op
  },
  cancel: async () => {
    // No-op
  },
  destroy: async () => {
    return Promise.resolve();
  },
  removeAllListeners: () => {
    // No-op
  },
  onSpeechStart: null as any,
  onSpeechEnd: null as any,
  onSpeechResults: null as any,
  onSpeechError: null as any,
  onSpeechPartialResults: null as any,
  onSpeechVolumeChanged: null as any,
};

export default VoiceMock;

