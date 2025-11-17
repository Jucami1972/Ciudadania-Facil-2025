# ⚡ Optimización de Performance y Bundle Size

## 1. Análisis del Bundle

### Ver tamaño actual

```bash
# Android
cd android && ./gradlew bundleRelease
# Revisa: android/app/build/outputs/bundle/release/app-release.aab

# iOS
# En Xcode: Product > Archive > Distribute App
# Revisa el tamaño en App Store Connect
```

### Analizar bundle con Metro

```bash
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output /tmp/bundle.js \
  --sourcemap-output /tmp/bundle.map

# Ver tamaño
du -h /tmp/bundle.js
```

## 2. Optimizaciones de Código

### Lazy Loading de Componentes

```typescript
// ❌ Malo: Import directo
import HeavyComponent from './HeavyComponent';

// ✅ Bueno: Lazy loading
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
```

### Code Splitting

```typescript
// Dividir rutas grandes en chunks
const StudyScreen = React.lazy(() => import('./screens/StudyScreen'));
const PracticeScreen = React.lazy(() => import('./screens/PracticeScreen'));
```

### Eliminar Imports No Usados

```bash
# Instalar eslint-plugin-unused-imports
npm install --save-dev eslint-plugin-unused-imports

# En .eslintrc.js
plugins: ['unused-imports'],
rules: {
  'unused-imports/no-unused-imports': 'error',
}
```

## 3. Optimización de Imágenes

### Comprimir Imágenes

```bash
# Instalar sharp-cli
npm install -g sharp-cli

# Comprimir todas las imágenes
sharp -i src/assets/**/*.{png,jpg,jpeg} -o src/assets/compressed/
```

### Usar Formatos Modernos

- **WebP** para Android (mejor compresión)
- **HEIC** para iOS (mejor compresión)
- **SVG** para iconos simples

### Lazy Loading de Imágenes

```typescript
import { Image } from 'react-native';

// Usar FastImage para mejor performance
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: imageUrl }}
  resizeMode={FastImage.resizeMode.contain}
/>
```

## 4. Optimización de Firebase

### Lazy Loading de Firebase

```typescript
// ❌ Malo: Importar todo
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';
import 'firebase/compat/analytics';

// ✅ Bueno: Importar solo lo necesario
import firebase from 'firebase/compat/app';
// Importar módulos solo cuando se necesiten
```

### Usar Firestore Lite (si es posible)

```typescript
// Para operaciones simples, usar Firestore Lite
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore/lite';
```

## 5. Optimización de Dependencias

### Analizar Dependencias

```bash
# Ver qué ocupa más espacio
npx react-native-bundle-visualizer

# O usar webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer
```

### Eliminar Dependencias No Usadas

```bash
# Encontrar dependencias no usadas
npx depcheck

# Eliminar manualmente del package.json
```

### Usar Versiones Optimizadas

```json
{
  "dependencies": {
    "react-native": "^0.73.0",  // Usar versión estable más reciente
    "expo": "~50.0.0"  // Usar versión compatible
  }
}
```

## 6. Configuración de Metro

### Optimizar Metro Config

Crea o edita `metro.config.js`:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimizaciones
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: false,
    keep_fnames: false,
    mangle: {
      keep_classnames: false,
      keep_fnames: false,
    },
  },
};

// Tree shaking
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx'],
};

module.exports = config;
```

## 7. Optimización de Android

### ProGuard Rules

Edita `android/app/proguard-rules.pro`:

```proguard
# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Expo
-keep class expo.modules.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Tu código
-keep class com.ciudadaniafacil.** { *; }
```

### Habilitar Shrinking

En `android/app/build.gradle`:

```gradle
buildTypes {
    release {
        shrinkResources true
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

## 8. Optimización de iOS

### Bitcode (deshabilitado por defecto en RN)

No es necesario configurar, React Native no usa Bitcode.

### Optimizar Assets

```bash
# Comprimir assets de iOS
xcrun actool --compress-pngs --compile . Images.xcassets/
```

## 9. Optimizaciones de Runtime

### Memoización

```typescript
// Memoizar componentes pesados
const ExpensiveComponent = React.memo(({ data }) => {
  // Componente
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id;
});
```

### useMemo y useCallback

```typescript
// Memoizar cálculos costosos
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// Memoizar callbacks
const handlePress = useCallback(() => {
  doSomething();
}, [dependencies]);
```

### Virtualización de Listas

```typescript
// Usar FlatList con getItemLayout para mejor performance
<FlatList
  data={items}
  renderItem={renderItem}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

## 10. Monitoreo de Performance

### React DevTools Profiler

```bash
# Instalar React DevTools
npm install -g react-devtools

# Ejecutar
react-devtools
```

### Flipper

Flipper viene incluido con React Native. Úsalo para:
- Network inspector
- Layout inspector
- Performance monitor

## 11. Checklist de Optimización

Antes de publicar:

- [ ] Bundle size < 50MB (Android) / < 100MB (iOS)
- [ ] Todas las imágenes comprimidas
- [ ] ProGuard habilitado (Android)
- [ ] Tree shaking funcionando
- [ ] Lazy loading implementado
- [ ] Dependencias no usadas eliminadas
- [ ] Console.logs removidos
- [ ] Source maps generados (solo para debugging)
- [ ] Performance testado en dispositivos reales
- [ ] Memory leaks verificados

## 12. Comandos Útiles

```bash
# Analizar bundle
npx react-native-bundle-visualizer

# Ver dependencias
npm ls --depth=0

# Limpiar cache
npm start -- --reset-cache
# Android
cd android && ./gradlew clean
# iOS
cd ios && rm -rf build && pod install

# Build optimizado
# Android
cd android && ./gradlew bundleRelease
# iOS
# En Xcode: Product > Archive
```

## 13. Métricas Objetivo

### Bundle Size
- **Android APK:** < 30MB
- **Android AAB:** < 25MB
- **iOS IPA:** < 50MB

### Performance
- **Tiempo de inicio:** < 3 segundos
- **FPS:** 60 FPS constante
- **Memory:** < 150MB en uso normal

## 14. Recursos

- [React Native Performance](https://reactnative.dev/docs/performance)
- [Expo Performance](https://docs.expo.dev/guides/performance/)
- [Metro Bundler](https://metrobundler.dev/)
- [Flipper](https://fbflipper.com/)

