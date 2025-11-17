// src/services/notificationService.ts
// Servicio para manejar notificaciones push
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackEvent, AnalyticsEvent } from '../utils/analytics';

// Configurar cómo se manejan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const STORAGE_KEY = '@notifications:token';
const STORAGE_ENABLED_KEY = '@notifications:enabled';

/**
 * Solicitar permisos de notificaciones
 */
export const requestPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    const enabled = finalStatus === 'granted';
    
    await AsyncStorage.setItem(STORAGE_ENABLED_KEY, String(enabled));

    if (enabled) {
      trackEvent(AnalyticsEvent.FEATURE_DISCOVERED, {
        feature: 'notifications',
        action: 'permission_granted',
      });
    }

    return enabled;
  } catch (error) {
    console.error('Error solicitando permisos de notificaciones:', error);
    return false;
  }
};

/**
 * Obtener token de notificaciones
 */
export const getNotificationToken = async (): Promise<string | null> => {
  try {
    // Verificar permisos primero
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return null;
    }

    // Obtener token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'ciudadaniafacil2025',
    });

    const token = tokenData.data;

    // Guardar token
    await AsyncStorage.setItem(STORAGE_KEY, token);

    return token;
  } catch (error) {
    console.error('Error obteniendo token de notificaciones:', error);
    return null;
  }
};

/**
 * Verificar si las notificaciones están habilitadas
 */
export const areNotificationsEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await AsyncStorage.getItem(STORAGE_ENABLED_KEY);
    if (enabled === null) {
      // Si no está guardado, verificar permisos
      const { status } = await Notifications.getPermissionsAsync();
      const isEnabled = status === 'granted';
      await AsyncStorage.setItem(STORAGE_ENABLED_KEY, String(isEnabled));
      return isEnabled;
    }
    return enabled === 'true';
  } catch (error) {
    console.error('Error verificando estado de notificaciones:', error);
    return false;
  }
};

/**
 * Programar notificación local
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  trigger: Notifications.NotificationTriggerInput
): Promise<string | null> => {
  try {
    const hasPermission = await areNotificationsEnabled();
    if (!hasPermission) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: 'reminder',
        },
      },
      trigger,
    });

    return notificationId;
  } catch (error) {
    console.error('Error programando notificación:', error);
    return null;
  }
};

/**
 * Programar recordatorio diario de estudio
 */
export const scheduleDailyStudyReminder = async (hour: number = 20, minute: number = 0): Promise<string | null> => {
  try {
    const hasPermission = await areNotificationsEnabled();
    if (!hasPermission) {
      return null;
    }

    // Cancelar recordatorios anteriores
    await cancelDailyStudyReminder();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 ¡Hora de estudiar!',
        body: 'No olvides practicar hoy. Cada día te acerca más a tu meta.',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: 'daily_reminder',
        },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    // Guardar ID para poder cancelarlo después
    await AsyncStorage.setItem('@notifications:daily_reminder_id', notificationId);

    trackEvent(AnalyticsEvent.FEATURE_DISCOVERED, {
      feature: 'notifications',
      action: 'daily_reminder_scheduled',
      hour,
      minute,
    });

    return notificationId;
  } catch (error) {
    console.error('Error programando recordatorio diario:', error);
    return null;
  }
};

/**
 * Cancelar recordatorio diario
 */
export const cancelDailyStudyReminder = async (): Promise<void> => {
  try {
    const notificationId = await AsyncStorage.getItem('@notifications:daily_reminder_id');
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await AsyncStorage.removeItem('@notifications:daily_reminder_id');
    }
  } catch (error) {
    console.error('Error cancelando recordatorio diario:', error);
  }
};

/**
 * Enviar notificación de logro
 */
export const sendAchievementNotification = async (
  achievementTitle: string,
  achievementDescription: string
): Promise<string | null> => {
  try {
    return await scheduleLocalNotification(
      `🎉 ${achievementTitle}`,
      achievementDescription,
      null // Inmediata
    );
  } catch (error) {
    console.error('Error enviando notificación de logro:', error);
    return null;
  }
};

/**
 * Enviar notificación de progreso
 */
export const sendProgressNotification = async (
  progress: number,
  totalQuestions: number
): Promise<string | null> => {
  try {
    const percentage = Math.round((progress / totalQuestions) * 100);
    
    let message = '';
    if (percentage === 100) {
      message = '¡Felicidades! Has completado todas las preguntas. 🎉';
    } else if (percentage >= 75) {
      message = `¡Estás a ${100 - percentage}% de completar todo! Sigue así. 💪`;
    } else if (percentage >= 50) {
      message = `¡Vas por buen camino! Has completado ${percentage}% de las preguntas.`;
    } else {
      message = `Sigue estudiando. Has completado ${progress} de ${totalQuestions} preguntas.`;
    }

    return await scheduleLocalNotification(
      '📊 Tu Progreso',
      message,
      null // Inmediata
    );
  } catch (error) {
    console.error('Error enviando notificación de progreso:', error);
    return null;
  }
};

/**
 * Configurar listener para notificaciones recibidas
 */
export const setupNotificationListeners = (
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) => {
  // Listener para cuando se recibe una notificación
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    trackEvent(AnalyticsEvent.FEATURE_DISCOVERED, {
      feature: 'notifications',
      action: 'notification_received',
      notification_type: notification.request.content.data?.type || 'unknown',
    });

    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Listener para cuando el usuario toca una notificación
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    trackEvent(AnalyticsEvent.FEATURE_DISCOVERED, {
      feature: 'notifications',
      action: 'notification_tapped',
      notification_type: response.notification.request.content.data?.type || 'unknown',
    });

    if (onNotificationTapped) {
      onNotificationTapped(response);
    }
  });

  return {
    received: receivedSubscription,
    response: responseSubscription,
    remove: () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    },
  };
};

/**
 * Obtener todas las notificaciones programadas
 */
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error obteniendo notificaciones programadas:', error);
    return [];
  }
};

/**
 * Cancelar todas las notificaciones programadas
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.removeItem('@notifications:daily_reminder_id');
  } catch (error) {
    console.error('Error cancelando todas las notificaciones:', error);
  }
};

/**
 * Obtener badge count (número en el ícono de la app)
 */
export const getBadgeCount = async (): Promise<number> => {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error obteniendo badge count:', error);
    return 0;
  }
};

/**
 * Establecer badge count
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error estableciendo badge count:', error);
  }
};

