# 🔥 Guía de Configuración de Firebase

Esta guía te ayudará a configurar Firebase para la aplicación Ciudadanía Fácil.

## Paso 1: Crear un Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en **"Crear un proyecto"** o **"Add project"**
3. Ingresa el nombre del proyecto: `ciudadania-facil` (o el que prefieras)
4. Haz clic en **"Continuar"**
5. Opcionalmente, desactiva Google Analytics (puedes activarlo después)
6. Haz clic en **"Crear proyecto"**
7. Espera a que se cree el proyecto (30-60 segundos)
8. Haz clic en **"Continuar"**

## Paso 2: Obtener las Credenciales de Firebase

1. En la consola de Firebase, haz clic en el ícono de **⚙️ Configuración** (arriba a la izquierda)
2. Selecciona **"Configuración del proyecto"**
3. Desplázate hacia abajo hasta la sección **"Tus aplicaciones"**
4. Haz clic en el ícono **</>** (aplicación web)
5. Ingresa un nombre para la app (ej: "Ciudadanía Fácil Web")
6. Haz clic en **"Registrar app"**
7. **Copia el objeto `firebaseConfig`** que aparece en la pantalla

Deberías ver algo así:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "ciudadania-facil.firebaseapp.com",
  projectId: "ciudadania-facil",
  storageBucket: "ciudadania-facil.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};
```

## Paso 3: Configurar las Variables de Entorno

### Opción A: Usar archivo .env (Recomendado)

1. Copia el archivo `.env.example` y renómbralo a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Abre el archivo `.env` y reemplaza los valores con tus credenciales:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=ciudadania-facil.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=ciudadania-facil
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=ciudadania-facil.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789
```

### Opción B: Editar directamente firebaseConfig.ts

1. Abre `src/config/firebaseConfig.ts`
2. Reemplaza los valores "YOUR_API_KEY", etc., con tus credenciales reales

## Paso 4: Habilitar Autenticación

1. En Firebase Console, ve a **"Autenticación"** en el menú lateral
2. Haz clic en **"Comenzar"** o **"Get started"**
3. Ve a la pestaña **"Sign-in method"** o **"Métodos de inicio de sesión"**
4. Haz clic en **"Correo electrónico/Contraseña"**
5. Activa el toggle **"Habilitado"**
6. Haz clic en **"Guardar"**

## Paso 5: Crear Base de Datos Firestore

1. En Firebase Console, ve a **"Firestore Database"** en el menú lateral
2. Haz clic en **"Crear base de datos"**
3. Selecciona **"Comenzar en modo de prueba"** (para desarrollo)
4. Selecciona la ubicación más cercana a tus usuarios
5. Haz clic en **"Habilitar"**

### Configurar Reglas de Seguridad de Firestore

1. Ve a la pestaña **"Reglas"** en Firestore
2. Reemplaza las reglas con estas (permiten acceso solo a usuarios autenticados):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acceso solo a usuarios autenticados
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

3. Haz clic en **"Publicar"**

## Paso 6: Verificar la Configuración

1. Reinicia el servidor de Expo:
   ```bash
   npm start
   # o
   pnpm start
   ```

2. Deberías poder ver la pantalla de Login al iniciar la app
3. Prueba crear una cuenta nueva desde la pantalla de Registro

## Solución de Problemas

### Error: "Firebase is not initialized"

- Verifica que las credenciales en `.env` o `firebaseConfig.ts` sean correctas
- Asegúrate de reiniciar el servidor después de cambiar las variables de entorno
- Verifica que los nombres de las variables de entorno empiecen con `EXPO_PUBLIC_`

### Error: "Permission denied" en Firestore

- Verifica que las reglas de seguridad de Firestore estén configuradas correctamente
- Asegúrate de estar autenticado antes de acceder a Firestore

### Error: "Email already in use" o "User not found"

- Estos son errores normales de autenticación que indican que Firebase está funcionando
- Verifica en Firebase Console > Autenticación > Usuarios que los usuarios se estén creando

## Recursos Adicionales

- [Documentación de Firebase para React Native](https://rnfirebase.io/)
- [Documentación de Expo con Firebase](https://docs.expo.dev/guides/using-firebase/)
- [Firebase Console](https://console.firebase.google.com/)

---

**¡Listo!** Una vez completados estos pasos, tu aplicación estará conectada a Firebase y podrás usar todas las funcionalidades de autenticación y almacenamiento.

