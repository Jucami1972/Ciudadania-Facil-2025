module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json', '.web.js'],
          alias: {
            '@components': './src/components',
            '@screens': './src/screens',
            '@assets': './src/assets',
            '@config': './src/config',
            '@navigation': './src/navigation',
          },
        },
      ],
      // ✅ react-native-reanimated DEBE ser el último plugin
      'react-native-reanimated/plugin',
    ],
  };
}; 