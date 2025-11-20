# Arquitectura del Flujo: Registro → Splash Screen → Onboarding

## 📋 Resumen Ejecutivo

Este documento describe la arquitectura completa del flujo de usuario desde el registro/autenticación hasta la pantalla de bienvenida del onboarding en la aplicación **Ciudadanía Fácil**.

---

## 🏗️ Arquitectura General

```
App.tsx
  └── AuthProvider (Context)
      └── PremiumProvider (Context)
          └── AppNavigator
              ├── AuthStack (si no hay usuario)
              │   ├── LoginScreen
              │   └── RegisterScreen
              └── [Flujo Autenticado]
                  ├── SplashScreen (después del login)
                  ├── Onboarding (si no está completado)
                  └── AppTabs (pantalla principal)
```

---

## 🔄 Flujo Detallado Paso a Paso

### **FASE 1: Inicialización de la Aplicación**

#### 1.1. Punto de Entrada: `App.tsx`

**Ubicación:** `Ciudadania-Facil-2025/App.tsx`

**Responsabilidades:**
- Inicializar servicios críticos de forma asíncrona (dentro de `useEffect` para no bloquear el registro del componente)
- Configurar providers de contexto (ErrorBoundary, AuthProvider, PremiumProvider)
- Configurar servicios:
  - Sentry (monitoreo de errores)
  - Audio (configuración de modo de audio)
  - PaymentService (In-App Purchases)
  - NotificationService (notificaciones push)
  - OfflineSync (sincronización offline)

**Código Clave:**
```typescript
export default function App(): React.ReactElement {
  useEffect(() => {
    // Todos los require() están dentro de useEffect
    // para no bloquear AppRegistry.registerComponent
    require('./src/config/sentry');
    // ... otros servicios
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <PremiumProvider>
          <AppNavigator />
        </PremiumProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

**⚠️ Nota Importante:** Todos los `require()` están dentro de `useEffect` para evitar el error "Invariant Violation: 'main' has not been registered".

---

### **FASE 2: Autenticación y Registro**

#### 2.1. AuthContext: Gestión de Estado de Autenticación

**Ubicación:** `src/context/AuthContext.tsx`

**Responsabilidades:**
- Gestionar el estado de autenticación del usuario
- Proporcionar métodos: `register()`, `login()`, `loginWithGoogle()`, `logout()`
- Escuchar cambios en el estado de autenticación de Firebase
- Guardar información del usuario en AsyncStorage
- Configurar Analytics con información del usuario
- Cargar datos desde Firestore al autenticarse

**Flujo de Registro:**
```typescript
const register = async (email: string, password: string) => {
  const authInstance = getAuthInstance();
  await authInstance.createUserWithEmailAndPassword(email, password);
  // Firebase automáticamente dispara onAuthStateChanged
  // que actualiza el estado 'user' en el contexto
};
```

**Estado del Contexto:**
- `user: firebase.User | null` - Usuario autenticado o null
- `loading: boolean` - Indica si está verificando el estado de autenticación

#### 2.2. RegisterScreen: Pantalla de Registro

**Ubicación:** `src/screens/auth/RegisterScreen.tsx`

**Flujo:**
1. Usuario ingresa email, password y confirmación
2. Validaciones:
   - Campos no vacíos
   - Contraseñas coinciden
   - Contraseña mínimo 6 caracteres
3. Llama a `register()` del AuthContext
4. Firebase crea la cuenta
5. `onAuthStateChanged` se dispara automáticamente
6. El estado `user` en AuthContext se actualiza
7. AppNavigator detecta el cambio y redirige

---

### **FASE 3: Navegación y Decisión de Flujo**

#### 3.1. AppNavigator: Orquestador Principal

**Ubicación:** `src/navigation/AppNavigator.tsx`

**Responsabilidades:**
- Decidir qué pantalla mostrar según el estado de autenticación
- Gestionar el flujo: Splash → Onboarding → App Principal
- Cargar el módulo Onboarding de forma lazy
- Verificar el estado de completitud del onboarding
- Gestionar transiciones animadas entre pantallas

**Estados Clave:**
```typescript
const { user, loading } = useAuth(); // Del AuthContext
const [onboardingModule, setOnboardingModule] = useState(null);
const [showSplash, setShowSplash] = useState(false);
const [hasShownSplash, setHasShownSplash] = useState(false);
const [isTransitioning, setIsTransitioning] = useState(false);
const { isCompleted: onboardingCompleted, isLoading: onboardingLoading } = useOnboardingStatusSafe();
```

**⚠️ Regla Crítica de React Hooks:**
Todos los hooks deben llamarse ANTES de cualquier `return` condicional para cumplir con las reglas de React.

---

### **FASE 4: Verificación del Estado de Onboarding**

#### 4.1. useOnboardingStatusSafe: Hook Seguro

**Ubicación:** `src/navigation/AppNavigator.tsx` (función interna)

**Responsabilidades:**
- Verificar si el usuario ha completado el onboarding
- Usar AsyncStorage directamente (no depende del módulo Onboarding)
- Manejar casos donde el módulo no está cargado

**Lógica:**
```typescript
const useOnboardingStatusSafe = () => {
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const completed = await AsyncStorage.getItem('@onboarding:completed');
      
      // Si es null/undefined = cuenta nueva = mostrar onboarding (false)
      if (completed === null || completed === undefined) {
        setIsCompleted(false);
      } else {
        setIsCompleted(completed === 'true');
      }
    };
    checkOnboardingStatus();
  }, []);

  return { isCompleted: isCompleted ?? false, isLoading };
};
```

**Valores de AsyncStorage:**
- `null` o `undefined` → Cuenta nueva → `isCompleted = false` → Mostrar onboarding
- `'true'` → Onboarding completado → `isCompleted = true` → No mostrar onboarding
- `'false'` → Onboarding no completado → `isCompleted = false` → Mostrar onboarding

---

### **FASE 5: Carga Lazy del Módulo Onboarding**

#### 5.1. loadOnboarding: Carga Asíncrona

**Ubicación:** `src/navigation/AppNavigator.tsx` (función interna)

**Responsabilidades:**
- Cargar el componente Onboarding solo cuando sea necesario
- Evitar bloquear el registro del componente principal
- Manejar errores si el módulo no se puede cargar

**Código:**
```typescript
const loadOnboarding = () => {
  try {
    const onboardingModule = require('../components/Onboarding');
    OnboardingComponent = onboardingModule.default;
    useOnboardingStatusHook = onboardingModule.useOnboardingStatus;
    return { Onboarding: OnboardingComponent, useOnboardingStatus: useOnboardingStatusHook };
  } catch (error) {
    console.warn('Error cargando Onboarding:', error);
    return { Onboarding: null, useOnboardingStatus: null };
  }
};
```

**Cuándo se Carga:**
- Se carga cuando `!loading && user` (usuario autenticado)
- Se carga ANTES de que termine el splash para preparar la transición

---

### **FASE 6: Splash Screen (Después del Login)**

#### 6.1. Activación del Splash Screen

**Condiciones para Mostrar:**
```typescript
useEffect(() => {
  if (!loading && user && !hasShownSplash && !showSplash) {
    setShowSplash(true);
    setHasShownSplash(true); // Solo una vez por sesión
  }
}, [loading, user, hasShownSplash, showSplash]);
```

**Características:**
- Se muestra solo UNA VEZ por sesión (después del login)
- Duración: 3.5 segundos (3500ms)
- Solo en dispositivos móviles (no en web)

#### 6.2. SplashScreen Component

**Ubicación:** `src/components/SplashScreen.tsx`

**Animaciones:**
1. **Logo aparece con rotación completa (360°)** - 800ms
2. **Logo crece a 130%** - Simultáneo con rotación
3. **Logo se encoge a tamaño normal** - Spring animation
4. **Texto "Ciudadanía Fácil" aparece** - 500ms después
5. **Fade out controlado externamente** - 600ms (para transición suave)

**Props:**
- `onFinish: () => void` - Callback cuando termina la animación
- `duration: number` - Duración total (default: 3500ms)
- `fadeOutOpacity?: Animated.Value` - Control externo para cross-fade

**Código de Animación:**
```typescript
// Paso 1: Rotación + Escala + Opacidad
Animated.parallel([
  Animated.timing(logoRotation, { toValue: 1, duration: 800 }),
  Animated.timing(logoScale, { toValue: 1.3, duration: 800 }),
  Animated.timing(logoOpacity, { toValue: 1, duration: 600 }),
]).start(() => {
  // Paso 2: Encoger a tamaño normal
  Animated.spring(logoScale, { toValue: 1 }).start(() => {
    // Paso 3: Mostrar texto
    Animated.parallel([
      Animated.timing(textOpacity, { toValue: 1, duration: 500 }),
      Animated.timing(textTranslateY, { toValue: 0, duration: 500 }),
    ]).start();
  });
});
```

---

### **FASE 7: Transición Cross-Fade (Splash → Onboarding)**

#### 7.1. handleSplashComplete: Iniciar Transición

**Ubicación:** `src/navigation/AppNavigator.tsx`

**Flujo:**
1. SplashScreen llama a `onFinish()` después de 3.5 segundos
2. `handleSplashComplete()` se ejecuta
3. Se inicia la transición cross-fade:
   - Splash fade out (opacidad 1 → 0)
   - Onboarding fade in (opacidad 0 → 1)
   - Ambas animaciones en paralelo, duración 600ms

**Código:**
```typescript
const handleSplashComplete = () => {
  setIsTransitioning(true);
  
  Animated.parallel([
    Animated.timing(splashFadeOut, {
      toValue: 0,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.timing(onboardingFadeIn, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
  ]).start(() => {
    setShowSplash(false);
    setIsTransitioning(false);
    // Resetear valores para próxima vez
    splashFadeOut.setValue(1);
    onboardingFadeIn.setValue(0);
  });
};
```

#### 7.2. Renderizado Simultáneo

**Estructura Visual:**
```
<View style={{ flex: 1 }}>
  {/* Splash Screen - posición absoluta, z-index 1 */}
  {showSplash && (
    <Animated.View style={{ opacity: splashFadeOut }}>
      <SplashScreen />
    </Animated.View>
  )}

  {/* Onboarding - posición absoluta, z-index 2 durante transición */}
  {shouldShowOnboarding && (
    <Animated.View style={{ opacity: onboardingFadeIn }}>
      <Onboarding />
    </Animated.View>
  )}
</View>
```

**Comportamiento:**
- Durante el splash: Onboarding está renderizado pero invisible (opacidad 0)
- Durante la transición: Ambas pantallas visibles, una desaparece y otra aparece
- Después de la transición: Solo Onboarding visible

---

### **FASE 8: Pantalla de Bienvenida del Onboarding**

#### 8.1. Onboarding Component

**Ubicación:** `src/components/Onboarding.tsx`

**Estructura:**
- 4 pasos (steps) en total
- Paso 1: **Bienvenida** (pantalla de bienvenida)
- Paso 2: Tarjetas de Estudio
- Paso 3: Practica y Aprende
- Paso 4: Rastrea tu Progreso

#### 8.2. Paso de Bienvenida (Primera Pantalla)

**Configuración:**
```typescript
{
  id: 'welcome',
  icon: 'book-education',
  title: 'Bienvenido a Ciudadanía Fácil',
  description: 'Prepárate para el Examen de Ciudadanía de EE.UU. 2020-2025 de forma interactiva.',
  color: '#1E40AF',
}
```

**Características Visuales:**
- Muestra el logo de la app (SVG o PNG fallback)
- Logo con animación de entrada (opacidad y escala)
- Título: "Bienvenido a Ciudadanía Fácil"
- Descripción: "Prepárate para el Examen de Ciudadanía de EE.UU. 2020-2025 de forma interactiva."
- Barra de progreso (4 puntos, el primero activo)
- Botón "Omitir" en la esquina superior derecha
- Botón "Siguiente" en la parte inferior

**Animación del Logo:**
```typescript
useEffect(() => {
  if (currentStep === 0) {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }
}, [currentStep]);
```

#### 8.3. Navegación en Onboarding

**Botones:**
- **"Omitir"**: Completa el onboarding inmediatamente, guarda estado en AsyncStorage
- **"Siguiente"**: Avanza al siguiente paso
- **"Anterior"**: Vuelve al paso anterior (no visible en el primer paso)

**Completar Onboarding:**
```typescript
const handleComplete = async () => {
  await AsyncStorage.setItem('@onboarding:completed', 'true');
  onComplete(); // Callback que oculta el onboarding
};
```

---

## 🔑 Puntos Clave de la Arquitectura

### 1. **Lazy Loading**
- El módulo Onboarding se carga solo cuando es necesario
- Evita bloquear el registro del componente principal
- Permite que la app inicie más rápido

### 2. **Gestión de Estado**
- Estado de onboarding en AsyncStorage (`@onboarding:completed`)
- Estado de splash en memoria (`hasShownSplash`) - solo una vez por sesión
- Estado de usuario en Firebase Auth + Context

### 3. **Transiciones Suaves**
- Cross-fade entre Splash y Onboarding
- Animaciones nativas usando `Animated` API
- `useNativeDriver: true` para mejor rendimiento

### 4. **Cumplimiento de Reglas de React**
- Todos los hooks se llaman antes de cualquier `return` condicional
- No hay hooks condicionales
- Orden consistente de hooks en cada render

### 5. **Manejo de Errores**
- Try-catch en carga de módulos
- Fallbacks (PNG si SVG no carga)
- Logging para debugging

---

## 📊 Diagrama de Flujo Completo

```
┌─────────────────┐
│   App.tsx       │
│  (Inicializa)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AuthProvider   │
│  (Context)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AppNavigator    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│  No    │ │  Usuario  │
│ Usuario│ │ Autentic. │
└───┬────┘ └─────┬─────┘
    │            │
    ▼            │
┌────────┐       │
│ Auth   │       │
│ Stack  │       │
│(Login/ │       │
│Register)│      │
└────────┘       │
                 │
                 ▼
         ┌───────────────┐
         │ ¿Splash ya    │
         │ mostrado?     │
         └───┬───────┬───┘
             │       │
         NO  │       │ SÍ
             │       │
             ▼       │
    ┌─────────────┐  │
    │ SplashScreen│  │
    │ (3.5 seg)   │  │
    └──────┬──────┘  │
           │         │
           ▼         │
    ┌─────────────┐  │
    │ Transición  │  │
    │ Cross-Fade  │  │
    └──────┬──────┘  │
           │         │
           └────┬────┘
                │
                ▼
    ┌───────────────────┐
    │ ¿Onboarding       │
    │ completado?       │
    └───┬───────────┬───┘
        │           │
    NO  │           │ SÍ
        │           │
        ▼           ▼
┌─────────────┐ ┌──────────┐
│ Onboarding  │ │  AppTabs │
│ (Bienvenida)│ │ (Home)   │
│             │ │          │
│ Paso 1:     │ │          │
│ "Bienvenido │ │          │
│  a          │ │          │
│  Ciudadanía │ │          │
│  Fácil"     │ │          │
│             │ │          │
│ "Prepárate  │ │          │
│  para el    │ │          │
│  Examen de  │ │          │
│  Ciudadanía │ │          │
│  de EE.UU.  │ │          │
│  2020-2025  │ │          │
│  de forma   │ │          │
│  interactiva│ │          │
│  ."         │ │          │
└──────┬──────┘ └──────────┘
       │
       │ (Completa)
       ▼
┌─────────────┐
│ Guarda en   │
│ AsyncStorage│
│ '@onboarding│
│ :completed' │
│ = 'true'    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   AppTabs   │
│   (Home)    │
└─────────────┘
```

---

## 🛠️ Archivos Clave

| Archivo | Responsabilidad |
|---------|----------------|
| `App.tsx` | Punto de entrada, inicialización de servicios |
| `src/context/AuthContext.tsx` | Gestión de autenticación |
| `src/navigation/AppNavigator.tsx` | Orquestación de navegación y flujo |
| `src/components/SplashScreen.tsx` | Pantalla de splash animada |
| `src/components/Onboarding.tsx` | Componente de onboarding con 4 pasos |
| `src/screens/auth/RegisterScreen.tsx` | Pantalla de registro |
| `src/screens/auth/LoginScreen.tsx` | Pantalla de login |

---

## 🎯 Resumen del Flujo Completo

1. **Usuario se registra** → `RegisterScreen` → `AuthContext.register()`
2. **Firebase crea cuenta** → `onAuthStateChanged` se dispara
3. **AuthContext actualiza `user`** → `AppNavigator` detecta cambio
4. **AppNavigator verifica estado** → `useOnboardingStatusSafe()` lee AsyncStorage
5. **Si es cuenta nueva** → `@onboarding:completed` es `null` → `isCompleted = false`
6. **Se activa Splash Screen** → Solo una vez por sesión
7. **Splash muestra animación** → Logo rota, crece, encoge, texto aparece (3.5 seg)
8. **Splash termina** → `handleSplashComplete()` inicia transición
9. **Transición cross-fade** → Splash fade out + Onboarding fade in (600ms)
10. **Onboarding se muestra** → Primera pantalla: "Bienvenido a Ciudadanía Fácil"
11. **Usuario completa onboarding** → AsyncStorage guarda `'true'`
12. **AppTabs se muestra** → Pantalla principal de la app

---

## ✅ Checklist de Implementación

- [x] Lazy loading del módulo Onboarding
- [x] Verificación de estado de onboarding en AsyncStorage
- [x] Splash screen después del login (una vez por sesión)
- [x] Transición cross-fade suave
- [x] Animaciones nativas con `Animated` API
- [x] Cumplimiento de reglas de React Hooks
- [x] Manejo de errores y fallbacks
- [x] Texto de bienvenida actualizado

---

**Última actualización:** Diciembre 2024  
**Versión:** 1.0

