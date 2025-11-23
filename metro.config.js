const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  transformer: {
    ...defaultConfig.transformer,
    // Configurar el transformer de SVG - se usará automáticamente para archivos .svg
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    ...defaultConfig.resolver,
    assetExts: defaultConfig.resolver.assetExts.filter((ext) => ext !== 'svg'),
    // Asegura que .cjs esté incluido para módulos como idb
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg', 'cjs'],
  },
  // Optimizaciones para el watcher y evitar errores de "Body is unusable"
  watchFolders: [path.resolve(__dirname)],
  // Deshabilitar validación de dependencias en desarrollo para evitar errores de red
  server: {
    ...defaultConfig.server,
    enhanceMiddleware: (middleware) => {
      return middleware;
    },
  },
  // Configuración del watcher para evitar errores en Windows
  watcher: {
    ...defaultConfig.watcher,
    healthCheck: {
      enabled: true,
    },
  },
}; 