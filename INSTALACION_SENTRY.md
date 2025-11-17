# 📦 Instalación de Sentry

## Paso 1: Crear cuenta en Sentry

1. Ve a https://sentry.io/signup/
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto:
   - Platform: **React Native**
   - Project Name: `Ciudadania-Facil-2025`

## Paso 2: Obtener DSN

1. En Sentry Dashboard, ve a **Settings > Projects > Ciudadania-Facil-2025**
2. Copia el **DSN** (Data Source Name)
3. Se ve así: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

## Paso 3: Instalar dependencias

```bash
npm install @sentry/react-native
```

## Paso 4: Configurar variables de entorno

Agrega a tu archivo `.env`:

```env
EXPO_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

## Paso 5: Configurar para iOS (si aplica)

Si vas a compilar para iOS nativo:

```bash
cd ios
pod install
cd ..
```

## Paso 6: Verificar

1. Reinicia el servidor de Expo
2. Los errores se capturarán automáticamente en Sentry
3. Ve a Sentry Dashboard para ver los errores

## Notas

- Sentry solo funciona en builds de producción (no en Expo Go)
- En desarrollo, los errores se muestran en consola
- El plan gratuito incluye 5,000 eventos/mes

## Uso en el código

```typescript
import { captureException, captureMessage } from './src/config/sentry';

// Capturar excepción
try {
  // código
} catch (error) {
  captureException(error, { contexto: 'adicional' });
}

// Capturar mensaje
captureMessage('Algo importante pasó', 'info');
```

