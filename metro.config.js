const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  transformer: {
    ...defaultConfig.transformer,
    // Optimizaciones de minificación
    minifierConfig: {
      keep_classnames: false,
      keep_fnames: false,
      mangle: {
        keep_classnames: false,
        keep_fnames: false,
      },
    },
    // Habilitar tree shaking
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true, // Mejora el tiempo de inicio
      },
    }),
  },
  resolver: {
    ...defaultConfig.resolver,
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json', 'web.js', 'web.jsx', 'web.ts', 'web.tsx'],
    // Resolver problemas con paquetes de Firebase (especialmente idb)
    resolveRequest: (context, moduleName, platform) => {
      // Fix para idb - redirigir a un mock en React Native
      if (platform !== 'web' && (moduleName === 'idb' || moduleName.startsWith('idb/'))) {
        const mockPath = path.resolve(__dirname, 'node_modules', 'idb', 'build', 'index.cjs.js');
        return {
          type: 'sourceFile',
          filePath: mockPath,
        };
      }
      // Mock para @react-native-voice/voice cuando no está disponible (Expo Go)
      if (moduleName === '@react-native-voice/voice') {
        const mockPath = path.resolve(__dirname, 'src', 'utils', 'voiceMock.ts');
        return {
          type: 'sourceFile',
          filePath: mockPath,
        };
      }
      // Dejar que Metro resuelva otros módulos normalmente usando el resolver por defecto
      return context.resolveRequest(context, moduleName, platform);
    },
  },
}; 