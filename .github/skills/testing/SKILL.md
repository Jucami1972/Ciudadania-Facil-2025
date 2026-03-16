---
name: testing
description: 'Especialista en testing para React Native con Jest. USE WHEN: escribir tests, crear tests unitarios, tests de integración, tests de componentes, tests de hooks, tests de servicios, mejorar cobertura de tests, configurar jest, mockear módulos nativos, mockear AsyncStorage, mockear navegación, tests de contextos, snapshot testing, debugging de tests fallidos. DO NOT USE FOR: diseño UI, datos del examen, Firebase prod config.'
---

# Testing — Ciudadanía Fácil 2025

## Rol
Eres un especialista en testing para React Native con Jest y React Native Testing Library.

## Configuración Actual

### Jest Config: `jest.config.js`
- Jest preset: `jest-expo`
- Setup file: `jest.setup.js`
- Transform: babel-jest con babel-preset-expo

### Tests existentes: `src/__tests__/services/`
- `QuestionStorageService.test.ts`
- `SpacedRepetitionService.test.ts`
- `QuestionLoaderService.test.ts`

### Cobertura actual: < 10%

## Estructura de Tests

```
src/__tests__/
├── services/           → Tests de servicios (existentes)
├── components/         → Tests de componentes (por crear)
├── screens/            → Tests de pantallas (por crear)
├── context/            → Tests de contextos (por crear)
├── hooks/              → Tests de hooks (por crear)
└── utils/              → Tests de utilidades (por crear)
```

## Mocks Estándar

### AsyncStorage
```typescript
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  clear: jest.fn(),
}));
```

### React Navigation
```typescript
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
};
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: {} }),
  useFocusEffect: jest.fn(),
}));
```

### Expo Audio
```typescript
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn(),
          stopAsync: jest.fn(),
          unloadAsync: jest.fn(),
          setOnPlaybackStatusUpdate: jest.fn(),
        },
      }),
    },
    setAudioModeAsync: jest.fn(),
  },
}));
```

### Firebase
```typescript
jest.mock('../config/firebaseConfig', () => ({
  getFirebaseAuth: () => ({
    currentUser: { uid: 'test-uid', email: 'test@test.com' },
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  }),
  getFirebaseDb: () => ({
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
  }),
}));
```

### Context Wrappers
```typescript
import { render } from '@testing-library/react-native';

const AllProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <PremiumProvider>
      {children}
    </PremiumProvider>
  </AuthProvider>
);

const renderWithProviders = (ui: React.ReactElement) =>
  render(ui, { wrapper: AllProviders });
```

## Patrones de Test

### Componente
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';

describe('QuestionCard', () => {
  it('muestra la pregunta en español', () => {
    const { getByText } = render(<QuestionCard question={mockQuestion} />);
    expect(getByText(mockQuestion.questionEs)).toBeTruthy();
  });

  it('llama onPress al tocar', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<QuestionCard question={mockQuestion} onPress={onPress} />);
    fireEvent.press(getByTestId('question-card'));
    expect(onPress).toHaveBeenCalledWith(mockQuestion.id);
  });
});
```

### Hook personalizado
```typescript
import { renderHook, act } from '@testing-library/react-native';

describe('useSectionProgress', () => {
  it('inicia con progreso 0', () => {
    const { result } = renderHook(() => useSectionProgress('government'));
    expect(result.current.progress).toBe(0);
  });

  it('actualiza progreso', async () => {
    const { result } = renderHook(() => useSectionProgress('government'));
    await act(async () => {
      await result.current.markViewed(1);
    });
    expect(result.current.progress).toBeGreaterThan(0);
  });
});
```

### Servicio
```typescript
describe('SpacedRepetitionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calcula próxima revisión correctamente', () => {
    const nextReview = SpacedRepetitionService.calculateNextReview(1, 'correct');
    expect(nextReview.interval).toBeGreaterThan(0);
  });
});
```

## Comandos
```bash
npm test              # Ejecutar todos los tests
npm run test:watch    # Modo watch
npm run test:coverage # Con cobertura
```

## Prioridades de Testing

1. **Servicios** — Lógica pura, fáciles de testear (SpacedRepetition, QuestionStorage)
2. **Utilidades** — Funciones puras en `utils/` (answerValidation, arrayUtils)
3. **Hooks** — Hooks custom con lógica significativa
4. **Contextos** — Auth, Premium flows
5. **Componentes** — Componentes reutilizables críticos (FlipCard, ProgressModal)
6. **Pantallas** — Smoke tests de pantallas principales
