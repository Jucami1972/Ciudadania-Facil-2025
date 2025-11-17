// src/config/firebaseConfig.ts
// USAR FIREBASE COMPAT MODE (v8) para mejor compatibilidad con React Native
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { Platform } from 'react-native';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyApDqBmnVGeQH5uz55dU7Bhl8oc1ZDO3bA",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "ciudadaniafacil2025.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "ciudadaniafacil2025",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "ciudadaniafacil2025.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "763891163291",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:763891163291:web:4ea524a75f0695dc11e63e",
};

// Inicializar Firebase - PREVENIR INICIALIZACIONES DUPLICADAS
// Esta es la forma correcta de asegurar una sola instancia
const app = firebase.apps.length === 0 
  ? firebase.initializeApp(firebaseConfig)
  : firebase.app();

// Obtener auth y firestore DESPUÉS de asegurar que app existe
// Siempre usar firebase.auth() y firebase.firestore() directamente
// para garantizar que usamos la instancia vinculada a la app correcta
const auth = firebase.auth(app);
const db = firebase.firestore(app);

if (__DEV__) {
  console.log('✅ Firebase inicializado correctamente');
  console.log(`   📦 Proyecto: ${firebaseConfig.projectId}`);
  console.log(`   📱 Plataforma: ${Platform.OS}`);
  console.log(`   🔥 Apps inicializadas: ${firebase.apps.length}`);
  console.log(`   🔐 Auth disponible: ${!!auth}`);
}

// Funciones helper para obtener las instancias (por compatibilidad)
export function getFirebaseApp(): firebase.app.App {
  return app;
}

export function getFirebaseAuth(): firebase.auth.Auth {
  // Siempre retornar auth vinculado a la app
  return firebase.auth(app);
}

export function getFirebaseDb(): firebase.firestore.Firestore {
  // Siempre retornar firestore vinculado a la app
  return firebase.firestore(app);
}

// Exportar valores directos - SIEMPRE usar estos en lugar de crear nuevas instancias
export { app, auth, db };
export default firebaseConfig;

