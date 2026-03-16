---
name: performance-optimization
description: 'Optimización de rendimiento para React Native. USE WHEN: la app es lenta, optimizar renders, reducir re-renders, optimizar listas FlatList, mejorar tiempo de carga, reducir bundle size, optimizar imágenes, mejorar animaciones, optimizar memoria, reducir uso de AsyncStorage, lazy loading, code splitting, optimizar navegación, mejorar startup time. DO NOT USE FOR: diseño visual, datos del examen, Firebase config.'
---

# Performance Optimization — Ciudadanía Fácil 2025

## Rol
Eres un especialista en rendimiento de React Native con enfoque en apps educativas con listas grandes, audio, y animaciones.

## Áreas Críticas del Proyecto

### 1. Listas de Preguntas (100+ items)
```typescript
// ✅ FlatList con optimización
<FlatList
  data={questions}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  initialNumToRender={10}
  maxToRenderPerBatch={5}
  windowSize={5}
  removeClippedSubviews={Platform.OS !== 'web'}
  getItemLayout={getItemLayout}  // Si items tienen altura fija
/>

// ✅ Extraer keyExtractor y renderItem fuera del render
const keyExtractor = useCallback((item: Question) => String(item.id), []);
const renderItem = useCallback(({ item }: { item: Question }) => (
  <QuestionItem item={item} />
), []);

// ✅ React.memo para items de lista
const QuestionItem = React.memo(({ item }: { item: Question }) => (
  <View style={styles.card}>
    <Text>{item.questionEs}</Text>
  </View>
));
```

### 2. AsyncStorage (usado extensivamente)
```typescript
// ❌ Leer multiples veces en cada render
useEffect(() => {
  AsyncStorage.getItem('@key1');
  AsyncStorage.getItem('@key2');
  AsyncStorage.getItem('@key3');
}, []);

// ✅ Leer en batch con multiGet
useEffect(() => {
  const keys = ['@key1', '@key2', '@key3'];
  AsyncStorage.multiGet(keys).then(results => {
    const data = Object.fromEntries(results);
    // usar data
  });
}, []);

// ✅ Cache en Context para evitar lecturas repetidas
// El proyecto usa contextos (UserStats, Questions) — preferir esos sobre AsyncStorage directo
```

### 3. Animaciones
```typescript
// ✅ SIEMPRE useNativeDriver cuando sea posible
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,  // Solo funciona con transform y opacity
}).start();

// ✅ Evitar animaciones en mount con muchos elementos
// Máximo 2 animaciones paralelas en entrada de pantalla

// ✅ Reanimated para animaciones complejas
// El proyecto tiene react-native-reanimated instalado
```

### 4. Audio (expo-av)
```typescript
// ✅ Usar el AudioManagerService singleton del proyecto
import { audioManager } from '../services/AudioManagerService';

// ✅ Descargar sonidos cuando no se necesitan
useEffect(() => {
  return () => {
    if (sound) sound.unloadAsync();
  };
}, [sound]);

// ✅ No crear múltiples instancias de Sound simultáneamente
```

### 5. Navegación
```typescript
// ✅ Lazy loading de tabs (ya implementado en AppNavigator)
// Los stacks Study y Practice son funciones que se evalúan lazy

// ✅ Evitar pasar objetos grandes como params de navegación
// Pasar IDs y cargar datos en destino

// ✅ Usar listeners para reset de stacks en tabs
listeners={({ navigation }) => ({
  tabPress: () => {
    navigation.navigate('Study', { screen: 'StudyHome' });
  },
})}
```

### 6. Imágenes
```typescript
// ✅ Usar formatos optimizados (WebP)
// El proyecto ya usa .webp para onboarding

// ✅ Tamaños apropiados para la resolución
// No cargar imágenes 4K para mostrar en 200x200

// ✅ Cache de imágenes para assets remotos
```

## Herramientas de Diagnóstico

```bash
# Bundle size analysis
npx expo export --platform web --dump-assetmap

# React DevTools Profiler
# Usar el profiler para identificar re-renders innecesarios

# Flipper (Android/iOS debug)
# Monitorear renders, network, async storage
```

## Checklist de Optimización

1. [ ] ¿Listas usan FlatList (no ScrollView con map)?
2. [ ] ¿Items de lista están en React.memo?
3. [ ] ¿Callbacks son memorizados con useCallback?
4. [ ] ¿Cálculos costosos usan useMemo?
5. [ ] ¿Animaciones usan useNativeDriver?
6. [ ] ¿Audio se descarga en cleanup?
7. [ ] ¿AsyncStorage se lee en batch?
8. [ ] ¿Imágenes están optimizadas (WebP, tamaño correcto)?
9. [ ] ¿Navegación no pasa objetos grandes como params?
10. [ ] ¿Logs de debug están en `if (__DEV__)`?
