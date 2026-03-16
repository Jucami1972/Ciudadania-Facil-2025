---
name: store-deployment
description: 'Especialista en publicación en App Store y Google Play. USE WHEN: configurar EAS Build, preparar release, configurar app.json, generar builds de producción, configurar code signing, manejar versiones, configurar splash screen, configurar iconos, preparar screenshots, escribir descripción de la app, configurar Sentry para producción, OTA updates, configurar revenue cat para producción, resolver errores de build. DO NOT USE FOR: diseño de pantallas, datos del examen, testing unitario.'
---

# Store & Deployment — Ciudadanía Fácil 2025

## Rol
Eres un especialista en publicación de apps React Native/Expo en las tiendas de aplicaciones.

## Configuración Actual

### `app.json` — Config principal de Expo
Contiene: nombre, slug, versión, splash, iconos, plugins de Expo.

### `eas.json.example` — Config de EAS Build
Template para builds de desarrollo, staging y producción.

### Sentry: `src/config/sentry.ts`
Monitoring de errores en producción. Se carga condicionalmente en App.tsx.

### RevenueCat: `src/services/paymentService.ts`
Manejo de suscripciones premium.

## Build & Deploy con EAS

### Comandos
```bash
# Desarrollo (APK/Simulator)
eas build --profile development --platform android
eas build --profile development --platform ios

# Preview (para testing interno)
eas build --profile preview --platform all

# Producción
eas build --profile production --platform all

# Submit a stores
eas submit --platform android
eas submit --platform ios

# OTA Update
eas update --branch production --message "Fix: descripción"
```

### Checklist Pre-Release

#### Código
- [ ] Sin `console.log` fuera de `__DEV__`
- [ ] Sin credenciales hardcodeadas
- [ ] Variables de entorno configuradas en EAS secrets
- [ ] Sentry configurado con release/dist correctos
- [ ] Error boundaries en todas las pantallas
- [ ] Sin `__DEV__` features que rompan en producción

#### app.json
- [ ] `version` incrementada (semver)
- [ ] `android.versionCode` incrementado
- [ ] `ios.buildNumber` incrementado
- [ ] Iconos en tamaños correctos (1024x1024 adaptive)
- [ ] Splash screen configurado
- [ ] Bundle ID correcto

#### Store Listings
- [ ] Screenshots actualizados (6.5", 5.5" iOS; teléfono, tablet Android)
- [ ] Descripción en inglés y español
- [ ] Keywords relevantes
- [ ] Privacy policy URL actualizada
- [ ] Categoría: Education
- [ ] Rating: Everyone / 4+

### Web Deploy (Vercel)

```bash
# Build web
npm run build:web

# Deploy (configurado en vercel.json)
# Se despliega automáticamente con push a main
```

`vercel.json` configura rewrites para SPA routing.

## Variables de Entorno para Producción

### EAS Secrets (no en código)
```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
EXPO_PUBLIC_SENTRY_DSN
EXPO_PUBLIC_REVENUECAT_API_KEY
EXPO_PUBLIC_OPENAI_API_KEY
```

## Procedimiento

1. **Incrementar** versiones en app.json
2. **Verificar** variables de entorno en EAS secrets
3. **Ejecutar** tests antes de build
4. **Build** con `eas build --profile production`
5. **Test** build internamente antes de submit
6. **Submit** a stores con `eas submit`
7. **Monitorear** errores en Sentry post-release
