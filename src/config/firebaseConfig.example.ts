// src/config/firebaseConfig.example.ts
// Este es un archivo de ejemplo. No edites este archivo directamente.
// En su lugar, copia este contenido a firebaseConfig.ts o usa variables de entorno en .env

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// CONFIGURACIÓN DE FIREBASE
// Opción 1: Usar variables de entorno (Recomendado)
// Crea un archivo .env en la raíz del proyecto con:
//
// EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
// EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
// EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu-project-id
// EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
// EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
// EXPO_PUBLIC_FIREBASE_APP_ID=tu-app-id

// Opción 2: Reemplazar directamente aquí (No recomendado para producción)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "your-app-id",
};

// Inicializar Firebase
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('✅ Firebase inicializado correctamente');
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error);
  console.error('💡 Verifica tu configuración en firebaseConfig.ts o .env');
}

export { app, auth, db };
export default firebaseConfig;

