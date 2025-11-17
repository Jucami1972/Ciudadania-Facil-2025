// src/config/sentry.ts
// Configuración de Sentry para error tracking y crash reporting
import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';

// Inicializar Sentry solo si tenemos la DSN configurada
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN && !__DEV__) {
  // Solo inicializar en producción
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000, // 30 segundos
    tracesSampleRate: 0.2, // 20% de las transacciones
    enableNative: true,
    enableNativeCrashHandling: true,
    attachStacktrace: true,
    beforeSend(event, hint) {
      // Filtrar información sensible
      if (event.user) {
        // No enviar email completo, solo dominio
        if (event.user.email) {
          const email = event.user.email;
          const domain = email.split('@')[1];
          event.user.email = `***@${domain}`;
        }
      }
      
      // Filtrar datos sensibles de contexto
      if (event.contexts) {
        delete event.contexts.device?.model;
        delete event.contexts.device?.model_id;
      }
      
      return event;
    },
    integrations: [
      new Sentry.ReactNativeTracing({
        // Opciones de tracing
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        enableNativeFramesTracking: Platform.OS !== 'web',
        enableStallTracking: true,
      }),
    ],
  });

  if (__DEV__) {
    console.log('✅ Sentry inicializado para desarrollo');
  }
} else if (!SENTRY_DSN) {
  console.warn('⚠️ Sentry DSN no configurado. Error tracking deshabilitado.');
} else {
  console.log('ℹ️ Sentry deshabilitado en modo desarrollo');
}

/**
 * Captura una excepción manualmente
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (!SENTRY_DSN || __DEV__) {
    console.error('Error capturado:', error, context);
    return;
  }

  Sentry.captureException(error, {
    contexts: {
      custom: context || {},
    },
  });
};

/**
 * Captura un mensaje
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  if (!SENTRY_DSN || __DEV__) {
    console.log(`[${level.toUpperCase()}] ${message}`);
    return;
  }

  Sentry.captureMessage(message, level);
};

/**
 * Establece el usuario actual en Sentry
 */
export const setSentryUser = (user: { id: string; email?: string; username?: string } | null) => {
  if (!SENTRY_DSN || __DEV__) return;

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email ? `***@${user.email.split('@')[1]}` : undefined,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
};

/**
 * Agrega contexto adicional a los eventos
 */
export const setSentryContext = (key: string, context: Record<string, any>) => {
  if (!SENTRY_DSN || __DEV__) return;

  Sentry.setContext(key, context);
};

/**
 * Agrega breadcrumb (rastro de eventos)
 */
export const addBreadcrumb = (breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}) => {
  if (!SENTRY_DSN || __DEV__) return;

  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category || 'custom',
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Inicia una transacción para medir performance
 */
export const startTransaction = (name: string, op: string = 'navigation') => {
  if (!SENTRY_DSN || __DEV__) return null;

  return Sentry.startTransaction({
    name,
    op,
  });
};

export default Sentry;

