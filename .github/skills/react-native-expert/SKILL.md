---
name: react-native-expert
description: 'Experto en React Native y Expo. USE WHEN: crear componentes, resolver errores de React Native, manejar navegación, optimizar renders, implementar animaciones, configurar Expo, gestionar plataformas (iOS/Android/Web), manejar SafeArea, implementar gestos, resolver problemas de metro bundler, configurar builds con EAS, usar hooks de React correctamente, implementar FlatList/ScrollView, manejar keyboard avoiding. DO NOT USE FOR: diseño visual puro (usar app-design), Firebase (usar firebase-services), testing (usar testing).'
---

# React Native & Expo Expert — Ciudadanía Fácil 2025

## Rol
Eres un ingeniero senior de React Native con experiencia profunda en Expo SDK 54, React 19, y React Navigation 6.

## Stack del Proyecto
- React Native 0.81 + Expo ~54
- React 19.1
- React Navigation 6 (bottom tabs + native stacks)
- React Native Paper (MD3)
- TypeScript estricto

## Arquitectura de Navegación

### Estructura
```
AppNavigator (Tab.Navigator)
├── Home → HomeScreenRedesign (pantalla directa, no stack)
├── Study → StudyStack (Stack.Navigator)
│   ├── StudyHome → StudyScreenModerno
│   ├── Subcategorias → SubcategoriasScreenModerno
│   ├── StudyCards → StudyCardsScreenModerno
│   ├── StudyCardsByType → StudyCardsByTypeScreen
│   └── Explanation → ExplanationScreenModerno
└── Practice → PracticeStack (Stack.Navigator)
    ├── PruebaPracticaHome → PruebaPracticaScreenModerno
    ├── CategoryPractice → CategoryPracticeScreen
    ├── Examen → ExamenScreen
    ├── EntrevistaAI → EntrevistaAIScreen
    ├── ReadingWriting → ReadingWritingScreenModerno
    ├── Vocabulario → VocabularioScreenModernoV2
    ├── IncorrectPractice → IncorrectPracticeScreen
    ├── MarkedPractice → MarkedPracticeScreen
    └── Subscription → SubscriptionScreen
```

### Tipos de navegación
- Archivo: `src/types/navigation.ts`
- Tipo principal: `RootStackParamList` con todos los parámetros
- Hook: `useNavigation<NavigationProps>()`
- Route: `useRoute<StudyCardsRouteProp>()`

## Reglas Críticas

### TypeScript
```typescript
// ❌ NUNCA
route.params as any
useRef<any>(null)
navigation.navigate('Screen' as any)

// ✅ SIEMPRE
route.params // TypeScript infiere desde el RouteProp
useRef<{ reset: () => void }>(null)
navigation.navigate('Subscription')
```

### Contexts del proyecto
```
AuthProvider        → Login/registro, estado de usuario (Firebase Auth)
PremiumProvider     → Estado de suscripción (RevenueCat)
QuestionsContext    → Preguntas y progreso
UserStatsContext    → Estadísticas de estudio
```
Orden de wrapping: `AuthProvider > PremiumProvider > AppNavigator`

### Hooks del proyecto
- `useSectionProgress` — Progreso por sección de estudio
- `useAudioPlayer` / `useWebAudioPlayer` — Reproducción de audio
- `useQuestionAudio` — Audio de preguntas específicas
- `usePracticeSession` — Estado de sesiones de práctica
- `useIsWebDesktop` — Detectar plataforma web escritorio
- `useVoiceRecognition` — Reconocimiento de voz
- `useFeedbackSound` — Sonidos de feedback (correcto/incorrecto)

### Servicios
- `AudioManagerService` — Singleton para gestión de audio
- `QuestionStorageService` — Persistencia AsyncStorage de progreso
- `SpacedRepetitionService` — Algoritmo de repetición espaciada
- `SectionNavigationService` — Navegación entre secciones de estudio
- `aiInterviewN400Service` — Entrevista AI con OpenAI

### Rendimiento
```typescript
// ✅ Usar useMemo para filtrar listas
const filtered = useMemo(() => 
  questions.filter(q => q.category === category), 
  [category]
);

// ✅ useCallback para funciones pasadas como props
const handlePress = useCallback(() => {
  navigation.navigate('Home');
}, [navigation]);

// ✅ React.memo para items de FlatList
const QuestionItem = React.memo(({ item }: Props) => (
  <View>...</View>
));

// ✅ Fisher-Yates para shuffle
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

### Platform handling
```typescript
import { Platform } from 'react-native';
const isWeb = Platform.OS === 'web';

// Safe area: siempre usar
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const insets = useSafeAreaInsets();
```

### Debug
```typescript
// ✅ SIEMPRE envolver logs en __DEV__
if (__DEV__) {
  console.log('Debug info:', data);
}
```

## Procedimiento

1. **Leer** el archivo completo antes de editar
2. **Verificar** tipos en `src/types/navigation.ts` antes de navegar
3. **Importar** desde rutas relativas correctas (no alias)
4. **Usar** tokens de `designSystem` para estilos
5. **Validar** que no haya `as any` en el código
6. **Verificar** errores TypeScript después de editar
