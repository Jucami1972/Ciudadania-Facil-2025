# Ciudadanía Fácil 2025 — Instrucciones Generales

## Proyecto
App React Native / Expo (SDK 54) para preparar el examen de ciudadanía estadounidense 2025. Bilingüe ES/EN. Target: Android, iOS, Web.

## Stack
- **Framework**: React Native 0.81 + Expo ~54
- **Navegación**: React Navigation 6 (bottom tabs + native stacks)
- **UI**: React Native Paper (MD3) + sistema de diseño propio (`src/config/designSystem.ts`)
- **Estado**: React Context (Auth, Premium, Questions, UserStats)
- **Backend**: Firebase (Auth, Firestore) en modo compat (v8)
- **Audio**: expo-av, expo-speech
- **Pagos**: react-native-purchases (RevenueCat)
- **Testing**: Jest + React Native Testing Library

## Convenciones de código
- TypeScript estricto — no usar `as any`
- Interfaces y tipos en `src/types/`
- Constantes en `src/constants/`
- Colores: usar `designSystem.colors` o `colors` de `src/constants/colors.ts`, nunca hardcodear hex
- Spacing: usar `spacing` de `src/constants/spacing.ts` (sistema de 4px)
- Nombres de pantallas terminan en `Screen` (ej: `ExamenScreen.tsx`)
- Nombres de servicios terminan en `Service` (ej: `AudioManagerService.ts`)
- Hooks personalizados empiezan con `use` (ej: `useSectionProgress.ts`)
- Shuffle: usar Fisher-Yates, nunca `sort(() => Math.random() - 0.5)`
- Logs de debug: envolver en `if (__DEV__)` siempre
- Firebase: nunca hardcodear credenciales, usar variables de entorno `EXPO_PUBLIC_*`

## Estructura
```
src/
├── screens/       → Pantallas (una por archivo)
├── components/    → Componentes reutilizables
├── navigation/    → AppNavigator con tabs lazy-loaded
├── context/       → Providers (Auth, Premium, Questions, UserStats)
├── services/      → Lógica de negocio (audio, pagos, repetición espaciada)
├── hooks/         → Custom hooks
├── data/          → Datos estáticos (preguntas, vocabulario)
├── config/        → Configuración (Firebase, tema, design system, Sentry)
├── constants/     → Colores, spacing, categorías
├── types/         → TypeScript types/interfaces
├── utils/         → Utilidades (validación, analytics, accesibilidad)
└── __tests__/     → Tests
```

## Datos del examen
- 100 preguntas oficiales de ciudadanía (questions.tsx)
- 49 oraciones de lectura/escritura (readingWritingQuestions.tsx)
- Vocabulario de lectura/escritura (vocabulary.ts)
- Preguntas de práctica simplificadas (practiceQuestions.tsx)
