---
name: firebase-services
description: 'Especialista en Firebase para React Native. USE WHEN: configurar Firebase, implementar autenticación, manejar Firestore, resolver errores de Firebase, configurar reglas de seguridad, implementar login con Google/email, manejar sesiones de usuario, persistencia offline, sincronización de datos, analytics, crashlytics, configurar variables de entorno Firebase. DO NOT USE FOR: diseño UI, datos del examen, testing puro.'
---

# Firebase Services — Ciudadanía Fácil 2025

## Rol
Eres un especialista en Firebase para React Native con foco en seguridad y buenas prácticas.

## Configuración Actual

### Firebase Config: `src/config/firebaseConfig.ts`
- Firebase en modo compat (v8 API) para máxima compatibilidad con React Native
- Requiere variables de entorno `EXPO_PUBLIC_*` (sin fallbacks hardcodeados)
- Previene inicializaciones duplicadas con `firebase.apps.length` check
- Exporta helpers: `getFirebaseApp()`, `getFirebaseAuth()`, `getFirebaseDb()`

### Variables de entorno requeridas
```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
```

### Context de Auth: `src/context/AuthContext.tsx`
- Proveedor de autenticación con Firebase Auth
- Maneja login, registro, logout
- Persiste sesión con `onAuthStateChanged`
- Exporta hook `useAuth()` con `{ user, loading, login, register, logout }`

### Context Premium: `src/context/PremiumContext.tsx`
- Estado de suscripción con RevenueCat
- Exporta `usePremium()` con `{ isPremium, loading }`
- Gating de funcionalidades premium en pantallas

## Reglas de Seguridad

### NUNCA hacer
```typescript
// ❌ Hardcodear credenciales
const config = { apiKey: "AIzaSy..." };

// ❌ Exponer secretos en el cliente
const OPENAI_KEY = "sk-...";

// ❌ Confiar en el cliente para validación de permisos
if (user.isPremium) { /* dar acceso */ }
// Esto debe validarse TAMBIÉN en Firestore Rules
```

### SIEMPRE hacer
```typescript
// ✅ Variables de entorno
const config = { apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY };

// ✅ Verificar autenticación antes de operaciones
const user = firebase.auth().currentUser;
if (!user) throw new Error('No autenticado');

// ✅ Usar el helper del proyecto
import { getFirebaseAuth, getFirebaseDb } from '../config/firebaseConfig';
```

### Firestore Best Practices
```typescript
// ✅ Batch writes para operaciones múltiples
const batch = db.batch();
items.forEach(item => {
  const ref = db.collection('users').doc(userId).collection('progress').doc(item.id);
  batch.set(ref, item, { merge: true });
});
await batch.commit();

// ✅ Offline persistence (habilitado por defecto en compat mode)
// Los datos se cachean localmente y sincronizan cuando hay conexión

// ✅ Listeners con cleanup
useEffect(() => {
  const unsubscribe = db.collection('users').doc(userId)
    .onSnapshot(doc => setUserData(doc.data()));
  return () => unsubscribe();
}, [userId]);
```

## Offline Sync
- `src/utils/offlineSync.ts` — Utilidad para sincronización offline
- AsyncStorage como cache local primario
- Firebase Firestore como fuente de verdad remota
- Sincronización al detectar conexión

## Procedimiento

1. **Nunca** agregar credenciales al código fuente
2. **Usar** siempre imports desde `firebaseConfig.ts`
3. **Verificar** autenticación antes de acceso a Firestore
4. **Limpiar** listeners en useEffect return
5. **Manejar** errores de red/offline gracefully
