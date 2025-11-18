// src/utils/analytics.ts
// Servicio de Analytics usando Firebase Analytics
import { Platform } from 'react-native';
import { getFirebaseApp } from '../config/firebaseConfig';
import firebase from 'firebase/compat/app';

// Inicializar Analytics
let analytics: firebase.analytics.Analytics | null = null;

// Firebase Analytics solo funciona en Web
// En React Native móvil, usar @react-native-firebase/analytics o deshabilitar
const isWeb = Platform.OS === 'web';

if (isWeb) {
  try {
    // Solo importar analytics en web
    require('firebase/compat/analytics');
    
    // Solo inicializar Analytics si estamos en web
    const app = getFirebaseApp();
    
    // Intentar inicializar con manejo de errores robusto
    try {
      analytics = firebase.analytics(app);
      if (__DEV__) {
        console.log('✅ Firebase Analytics inicializado (Web)');
      }
    } catch (initError: any) {
      // Si hay error de inicialización, silenciar y continuar sin analytics
      if (__DEV__) {
        console.warn('⚠️ Firebase Analytics no disponible:', initError?.message || initError);
      }
      analytics = null;
    }
  } catch (error: any) {
    // Silenciar errores de Analytics para que no rompan la app
    if (__DEV__) {
      console.warn('⚠️ Error inicializando Firebase Analytics:', error?.message || error);
    }
    analytics = null;
  }
} else {
  // En React Native móvil, Analytics no está disponible con firebase/compat
  // Para usar Analytics en móvil, necesitarías @react-native-firebase/analytics
  if (__DEV__) {
    console.log('ℹ️ Firebase Analytics deshabilitado en React Native móvil');
    console.log('   Para habilitar, instala: @react-native-firebase/analytics');
  }
  analytics = null;
}

// Tipos de eventos
export enum AnalyticsEvent {
  // Navegación
  SCREEN_VIEW = 'screen_view',
  
  // Estudio
  STUDY_CARD_VIEWED = 'study_card_viewed',
  STUDY_CARD_FLIPPED = 'study_card_flipped',
  STUDY_AUDIO_PLAYED = 'study_audio_played',
  STUDY_SECTION_COMPLETED = 'study_section_completed',
  
  // Práctica
  PRACTICE_STARTED = 'practice_started',
  PRACTICE_QUESTION_ANSWERED = 'practice_question_answered',
  PRACTICE_COMPLETED = 'practice_completed',
  PRACTICE_RESULT = 'practice_result',
  
  // Entrevista AI
  AI_INTERVIEW_STARTED = 'ai_interview_started',
  AI_INTERVIEW_COMPLETED = 'ai_interview_completed',
  AI_INTERVIEW_QUESTION_ANSWERED = 'ai_interview_question_answered',
  
  // Vocabulario
  VOCABULARY_VIEWED = 'vocabulary_viewed',
  VOCABULARY_AUDIO_PLAYED = 'vocabulary_audio_played',
  
  // Memoria Fotográfica
  PHOTO_MEMORY_STARTED = 'photo_memory_started',
  PHOTO_MEMORY_COMPLETED = 'photo_memory_completed',
  
  // Autenticación
  USER_SIGNED_UP = 'user_signed_up',
  USER_SIGNED_IN = 'user_signed_in',
  USER_SIGNED_OUT = 'user_signed_out',
  
  // Premium
  PREMIUM_PURCHASE_INITIATED = 'premium_purchase_initiated',
  PREMIUM_PURCHASE_COMPLETED = 'premium_purchase_completed',
  PREMIUM_PURCHASE_FAILED = 'premium_purchase_failed',
  
  // Engagement
  APP_OPENED = 'app_opened',
  APP_BACKGROUNDED = 'app_backgrounded',
  FEATURE_DISCOVERED = 'feature_discovered',
}

// Parámetros comunes
export interface AnalyticsParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Trackea una pantalla vista
 */
export const trackScreenView = (screenName: string, params?: AnalyticsParams) => {
  if (!analytics) {
    if (__DEV__) {
      console.log(`📊 Screen View (no analytics): ${screenName}`, params);
    }
    return;
  }
  
  try {
    analytics.logEvent(AnalyticsEvent.SCREEN_VIEW, {
      screen_name: screenName,
      screen_class: screenName,
      platform: Platform.OS,
      ...params,
    });
    
    if (__DEV__) {
      console.log(`📊 Screen View: ${screenName}`, params);
    }
  } catch (error: any) {
    // Silenciar errores de Analytics para que no rompan la app
    if (__DEV__) {
      console.warn('Error tracking screen view:', error?.message || error);
    }
  }
};

/**
 * Trackea un evento personalizado
 */
export const trackEvent = (eventName: AnalyticsEvent | string, params?: AnalyticsParams) => {
  if (!analytics) {
    if (__DEV__) {
      console.log(`📊 Event (no analytics): ${eventName}`, params);
    }
    return;
  }
  
  try {
    analytics.logEvent(eventName, {
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      ...params,
    });
    
    if (__DEV__) {
      console.log(`📊 Event: ${eventName}`, params);
    }
  } catch (error: any) {
    // Silenciar errores de Analytics para que no rompan la app
    if (__DEV__) {
      console.warn('Error tracking event:', error?.message || error);
    }
  }
};

/**
 * Establece propiedades del usuario
 */
export const setUserProperties = (properties: { [key: string]: string | number | boolean | null }) => {
  if (!analytics) {
    if (__DEV__) {
      console.log('📊 User Properties (no analytics):', properties);
    }
    return;
  }
  
  try {
    Object.entries(properties).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        analytics?.setUserProperty(key, String(value));
      }
    });
    
    if (__DEV__) {
      console.log('📊 User Properties:', properties);
    }
  } catch (error: any) {
    // Silenciar errores de Analytics para que no rompan la app
    if (__DEV__) {
      console.warn('Error setting user properties:', error?.message || error);
    }
  }
};

/**
 * Establece el ID de usuario
 */
export const setUserId = (userId: string | null) => {
  if (!analytics) {
    if (__DEV__) {
      console.log('📊 User ID (no analytics):', userId);
    }
    return;
  }
  
  try {
    if (userId) {
      analytics.setUserId(userId);
    } else {
      analytics.setUserId(null);
    }
    
    if (__DEV__) {
      console.log('📊 User ID:', userId);
    }
  } catch (error: any) {
    // Silenciar errores de Analytics para que no rompan la app
    if (__DEV__) {
      console.warn('Error setting user ID:', error?.message || error);
    }
  }
};

/**
 * Trackea tiempo de sesión
 */
export const trackSessionStart = () => {
  trackEvent(AnalyticsEvent.APP_OPENED, {
    timestamp: new Date().toISOString(),
  });
};

export const trackSessionEnd = () => {
  trackEvent(AnalyticsEvent.APP_BACKGROUNDED, {
    timestamp: new Date().toISOString(),
  });
};

/**
 * Helper para trackear progreso de estudio
 */
export const trackStudyProgress = (sectionId: string, progress: number, totalQuestions: number) => {
  trackEvent(AnalyticsEvent.STUDY_SECTION_COMPLETED, {
    section_id: sectionId,
    progress_percentage: Math.round((progress / totalQuestions) * 100),
    questions_completed: progress,
    total_questions: totalQuestions,
  });
};

/**
 * Helper para trackear resultados de práctica
 */
export const trackPracticeResult = (
  mode: string,
  correct: number,
  total: number,
  timeSpent: number
) => {
  trackEvent(AnalyticsEvent.PRACTICE_RESULT, {
    practice_mode: mode,
    correct_answers: correct,
    total_questions: total,
    accuracy: Math.round((correct / total) * 100),
    time_spent_seconds: Math.round(timeSpent / 1000),
  });
};

// Exportar instancia de analytics para uso avanzado
export { analytics };

