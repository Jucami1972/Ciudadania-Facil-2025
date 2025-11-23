/**
 * Configuración del Backend
 * 
 * Para usar el backend, cambia USE_BACKEND a true y configura BACKEND_URL
 */

import { Platform } from 'react-native';

// Flag para activar/desactivar el uso del backend
export const USE_BACKEND = true; // Cambiar a true para usar el backend

// Detectar si estamos en móvil (Expo Go) para usar IP en lugar de localhost
const isMobileDevice = (): boolean => {
  try {
    const Constants = require('expo-constants');
    const constants = Constants?.default || Constants;
    const executionEnvironment = constants?.executionEnvironment;
    // En Expo Go o dispositivos móviles, usar IP
    return Platform.OS !== 'web' && (executionEnvironment === 'storeClient' || Platform.OS === 'ios' || Platform.OS === 'android');
  } catch {
    // Si no podemos detectar, asumir móvil si no es web
    return Platform.OS !== 'web';
  }
};

// IP de tu computadora (cambia esto si tu IP cambia)
// Para obtener tu IP: ipconfig (Windows) o ifconfig (Mac/Linux)
const LOCAL_IP = '192.168.0.28'; // ⚠️ Cambia esta IP si tu computadora tiene otra

// URL del backend (ajusta según tu configuración)
// En móvil usa la IP, en web usa localhost
const getBackendUrl = (): string => {
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }
  
  if (isMobileDevice()) {
    return `http://${LOCAL_IP}:3000`;
  }
  
  return 'http://localhost:3000';
};

export const BACKEND_URL = getBackendUrl();

// Timeout para requests al backend (en ms)
export const BACKEND_TIMEOUT = 30000; // 30 segundos

