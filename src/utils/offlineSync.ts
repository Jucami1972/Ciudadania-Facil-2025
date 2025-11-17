// src/utils/offlineSync.ts
// Utilidades para sincronización offline/online
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebaseConfig';
import firebase from 'firebase/compat/app';
import { trackEvent, AnalyticsEvent } from './analytics';

const SYNC_QUEUE_KEY = '@sync:queue';
const LAST_SYNC_KEY = '@sync:last_sync';
const ONLINE_STATUS_KEY = '@sync:online_status';

interface SyncItem {
  id: string;
  type: 'progress' | 'practice' | 'settings' | 'premium';
  data: any;
  timestamp: number;
  retries: number;
}

/**
 * Verificar si hay conexión a internet
 * Usa un ping simple a Firebase para verificar conectividad
 */
export const isOnline = async (): Promise<boolean> => {
  try {
    // Intentar una operación simple de Firestore
    // Si falla, asumimos que estamos offline
    await db.collection('_health').limit(1).get();
    
    // Si llegamos aquí, hay conexión
    await AsyncStorage.setItem(ONLINE_STATUS_KEY, 'true');
    return true;
  } catch (error) {
    // Probablemente offline
    await AsyncStorage.setItem(ONLINE_STATUS_KEY, 'false');
    return false;
  }
};

/**
 * Obtener estado de conexión guardado
 */
export const getCachedOnlineStatus = async (): Promise<boolean> => {
  try {
    const status = await AsyncStorage.getItem(ONLINE_STATUS_KEY);
    return status === 'true';
  } catch (error) {
    return false;
  }
};

/**
 * Agregar item a la cola de sincronización
 */
export const addToSyncQueue = async (item: Omit<SyncItem, 'id' | 'timestamp' | 'retries'>): Promise<void> => {
  try {
    const queue = await getSyncQueue();
    const newItem: SyncItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...item,
      timestamp: Date.now(),
      retries: 0,
    };

    queue.push(newItem);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error agregando a cola de sincronización:', error);
  }
};

/**
 * Obtener cola de sincronización
 */
export const getSyncQueue = async (): Promise<SyncItem[]> => {
  try {
    const queueStr = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return queueStr ? JSON.parse(queueStr) : [];
  } catch (error) {
    console.error('Error obteniendo cola de sincronización:', error);
    return [];
  }
};

/**
 * Procesar cola de sincronización
 */
export const processSyncQueue = async (userId: string): Promise<{ success: number; failed: number }> => {
  const queue = await getSyncQueue();
  if (queue.length === 0) {
    return { success: 0, failed: 0 };
  }

  const online = await isOnline();
  if (!online) {
    return { success: 0, failed: queue.length };
  }

  let success = 0;
  let failed = 0;
  const remainingQueue: SyncItem[] = [];

  for (const item of queue) {
    try {
      await syncItem(userId, item);
      success++;
    } catch (error) {
      console.error('Error sincronizando item:', error);
      
      // Reintentar hasta 3 veces
      if (item.retries < 3) {
        item.retries++;
        remainingQueue.push(item);
      } else {
        failed++;
        // Log error para revisar después
        console.error('Item falló después de 3 intentos:', item);
      }
    }
  }

  // Guardar cola actualizada
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));

  // Actualizar última sincronización
  await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

  trackEvent(AnalyticsEvent.FEATURE_DISCOVERED, {
    feature: 'sync',
    action: 'queue_processed',
    success_count: success,
    failed_count: failed,
  });

  return { success, failed };
};

/**
 * Sincronizar un item individual
 */
const syncItem = async (userId: string, item: SyncItem): Promise<void> => {
  const userRef = db.collection('users').doc(userId);

  switch (item.type) {
    case 'progress':
      await userRef.set(
        {
          progress: {
            ...item.data,
            lastUpdated: firebase.firestore.Timestamp.fromDate(new Date()),
          },
        },
        { merge: true }
      );
      break;

    case 'practice':
      await userRef.collection('practice_sessions').add({
        ...item.data,
        timestamp: firebase.firestore.Timestamp.fromDate(new Date(item.timestamp)),
        synced: true,
      });
      break;

    case 'settings':
      await userRef.set(
        {
          settings: {
            ...item.data,
            lastUpdated: firebase.firestore.Timestamp.fromDate(new Date()),
          },
        },
        { merge: true }
      );
      break;

    case 'premium':
      // Premium se maneja en PremiumContext
      break;

    default:
      throw new Error(`Tipo de sincronización desconocido: ${item.type}`);
  }
};

/**
 * Sincronizar progreso de estudio
 */
export const syncStudyProgress = async (
  userId: string,
  progress: {
    viewedQuestions: number[];
    completedSections: string[];
    lastQuestionId?: number;
  }
): Promise<boolean> => {
  try {
    const online = await isOnline();

    if (online) {
      // Sincronizar directamente
      await syncItem(userId, {
        id: '',
        type: 'progress',
        data: progress,
        timestamp: Date.now(),
        retries: 0,
      });
      return true;
    } else {
      // Agregar a cola
      await addToSyncQueue({
        type: 'progress',
        data: progress,
      });
      return false;
    }
  } catch (error) {
    console.error('Error sincronizando progreso:', error);
    // Agregar a cola en caso de error
    await addToSyncQueue({
      type: 'progress',
      data: progress,
    });
    return false;
  }
};

/**
 * Sincronizar sesión de práctica
 */
export const syncPracticeSession = async (
  userId: string,
  session: {
    mode: string;
    correct: number;
    total: number;
    timeSpent: number;
    questions: any[];
  }
): Promise<boolean> => {
  try {
    const online = await isOnline();

    if (online) {
      await syncItem(userId, {
        id: '',
        type: 'practice',
        data: session,
        timestamp: Date.now(),
        retries: 0,
      });
      return true;
    } else {
      await addToSyncQueue({
        type: 'practice',
        data: session,
      });
      return false;
    }
  } catch (error) {
    console.error('Error sincronizando sesión de práctica:', error);
    await addToSyncQueue({
      type: 'practice',
      data: session,
    });
    return false;
  }
};

/**
 * Sincronizar configuración del usuario
 */
export const syncUserSettings = async (
  userId: string,
  settings: {
    language?: string;
    notifications?: boolean;
    dailyGoal?: number;
    [key: string]: any;
  }
): Promise<boolean> => {
  try {
    const online = await isOnline();

    if (online) {
      await syncItem(userId, {
        id: '',
        type: 'settings',
        data: settings,
        timestamp: Date.now(),
        retries: 0,
      });
      return true;
    } else {
      await addToSyncQueue({
        type: 'settings',
        data: settings,
      });
      return false;
    }
  } catch (error) {
    console.error('Error sincronizando configuración:', error);
    await addToSyncQueue({
      type: 'settings',
      data: settings,
    });
    return false;
  }
};

/**
 * Cargar datos desde Firestore cuando vuelve online
 */
export const loadFromFirestore = async (userId: string): Promise<void> => {
  try {
    const online = await isOnline();
    if (!online) {
      return;
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();

      // Cargar progreso
      if (userData?.progress) {
        const viewedQuestions = userData.progress.viewedQuestions || [];
        await AsyncStorage.setItem('@study:viewed', JSON.stringify(viewedQuestions));
      }

      // Cargar configuración
      if (userData?.settings) {
        await AsyncStorage.setItem('@user:settings', JSON.stringify(userData.settings));
      }
    }

    // Procesar cola de sincronización
    await processSyncQueue(userId);
  } catch (error) {
    console.error('Error cargando desde Firestore:', error);
  }
};

/**
 * Configurar listener de conexión (polling cada 30 segundos)
 */
export const setupConnectionListener = (
  onConnectionChange: (isConnected: boolean) => void
): (() => void) => {
  let intervalId: NodeJS.Timeout | null = null;
  let lastStatus: boolean | null = null;

  const checkConnection = async () => {
    const currentStatus = await isOnline();
    
    if (lastStatus !== currentStatus) {
      lastStatus = currentStatus;
      onConnectionChange(currentStatus);

      if (currentStatus) {
        trackEvent(AnalyticsEvent.FEATURE_DISCOVERED, {
          feature: 'sync',
          action: 'connection_restored',
        });
      }
    }
  };

  // Verificar inmediatamente
  checkConnection();

  // Verificar cada 30 segundos
  intervalId = setInterval(checkConnection, 30000);

  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
};

/**
 * Obtener última sincronización
 */
export const getLastSyncTime = async (): Promise<Date | null> => {
  try {
    const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return lastSyncStr ? new Date(parseInt(lastSyncStr, 10)) : null;
  } catch (error) {
    console.error('Error obteniendo última sincronización:', error);
    return null;
  }
};

/**
 * Limpiar cola de sincronización (útil para debugging)
 */
export const clearSyncQueue = async (): Promise<void> => {
  await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
};

