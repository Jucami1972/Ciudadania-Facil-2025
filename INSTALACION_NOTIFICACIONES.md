# 🔔 Instalación de Notificaciones Push

## Paso 1: Instalar dependencia

```bash
npx expo install expo-notifications
```

## Paso 2: Configurar Expo Project ID

Si aún no tienes un Expo Project ID:

1. Ve a https://expo.dev/
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Copia el Project ID

Agrega a tu archivo `.env`:

```env
EXPO_PUBLIC_PROJECT_ID=tu-project-id-aqui
```

O usa el que ya tienes configurado en `app.json` (slug).

## Paso 3: Configurar para iOS (si aplica)

Las notificaciones push en iOS requieren:

1. **Certificado APNs** (Apple Push Notification service)
2. Configuración en App Store Connect
3. Build nativo (no funciona en Expo Go)

### Pasos:
1. En Xcode, ve a **Capabilities**
2. Habilita **Push Notifications**
3. Configura certificados APNs en Apple Developer Portal

## Paso 4: Configurar para Android

Android funciona automáticamente con Expo. Solo necesitas:

1. Build nativo (no funciona en Expo Go)
2. Las notificaciones funcionarán automáticamente

## Paso 5: Testing

### En desarrollo (Expo Go):
- Las notificaciones locales funcionan
- Las notificaciones push NO funcionan (requiere build nativo)

### En producción:
- Necesitas un build nativo
- Configurar certificados APNs para iOS
- Android funciona automáticamente

## Uso en el código

```typescript
import {
  requestPermissions,
  scheduleDailyStudyReminder,
  sendAchievementNotification,
} from './src/services/notificationService';

// Solicitar permisos
await requestPermissions();

// Programar recordatorio diario (8 PM)
await scheduleDailyStudyReminder(20, 0);

// Enviar notificación de logro
await sendAchievementNotification(
  'Primer día completado',
  '¡Has estudiado tu primer día! Sigue así.'
);
```

## Notas

- Las notificaciones push requieren build nativo
- Las notificaciones locales funcionan en Expo Go
- iOS requiere certificados APNs adicionales
- Android funciona automáticamente con Expo

