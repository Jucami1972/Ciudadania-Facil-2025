# 🔥 Pasos para Obtener Credenciales de Firebase

## ✅ Paso 1: Ir a Configuración del Proyecto

1. En Firebase Console, haz clic en el **ícono de engranaje ⚙️** (arriba a la izquierda, junto al nombre del proyecto)
2. Selecciona **"Configuración del proyecto"** o **"Project settings"**

## ✅ Paso 2: Agregar Aplicación Web

1. Desplázate hacia abajo hasta la sección **"Tus aplicaciones"** o **"Your apps"**
2. Haz clic en el **ícono `</>`** (aplicación web)
3. Ingresa un nombre para la app: **"Ciudadanía Fácil"** o **"CiudadaniaFacil"**
4. **NO marques** la casilla de Firebase Hosting (no es necesario por ahora)
5. Haz clic en **"Registrar app"** o **"Register app"**

## ✅ Paso 3: Copiar las Credenciales

Después de registrar la app, verás un objeto `firebaseConfig` como este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "ciudadaniafacil2025.firebaseapp.com",
  projectId: "ciudadaniafacil2025",
  storageBucket: "ciudadaniafacil2025.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};
```

**IMPORTANTE:** Copia estos valores exactos

## ✅ Paso 4: Crear Archivo .env

Una vez que tengas las credenciales, crea el archivo `.env` en la raíz del proyecto con este formato:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=ciudadaniafacil2025.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=ciudadaniafacil2025
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=ciudadaniafacil2025.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789
```

## ✅ Paso 5: Habilitar Servicios

### Habilitar Autenticación:
1. En el menú lateral, haz clic en **"Autenticación"** o **"Authentication"**
2. Haz clic en **"Comenzar"** o **"Get started"**
3. Ve a la pestaña **"Sign-in method"** o **"Métodos de inicio de sesión"**
4. Haz clic en **"Correo electrónico/Contraseña"** o **"Email/Password"**
5. Activa el toggle **"Habilitado"** o **"Enabled"**
6. Haz clic en **"Guardar"** o **"Save"**

### Habilitar Firestore:
1. En el menú lateral, haz clic en **"Firestore Database"**
2. Haz clic en **"Crear base de datos"** o **"Create database"**
3. Selecciona **"Comenzar en modo de prueba"** o **"Start in test mode"**
4. Selecciona la región más cercana (ej: **us-central**)
5. Haz clic en **"Habilitar"** o **"Enable"**

### Configurar Reglas de Firestore:
1. Ve a la pestaña **"Reglas"** o **"Rules"**
2. Reemplaza el contenido con estas reglas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /progress/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /sessions/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

3. Haz clic en **"Publicar"** o **"Publish"**

## ✅ Paso 6: Verificar

Ejecuta estos comandos en la terminal:

```bash
# Verificar configuración
npm run check:firebase

# Si todo está bien, iniciar la app
npm start
```

---

**¡Listo!** Una vez completados estos pasos, tu aplicación estará conectada a Firebase.

