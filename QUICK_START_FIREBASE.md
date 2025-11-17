# 🚀 Inicio Rápido - Configuración de Firebase

## Pasos Rápidos

### 1️⃣ Crear Proyecto en Firebase (5 minutos)

1. Ve a https://console.firebase.google.com/
2. Click en **"Crear un proyecto"**
3. Nombre: `ciudadania-facil`
4. Sigue los pasos (puedes desactivar Analytics si quieres)
5. Click en **"Continuar"**

### 2️⃣ Obtener Credenciales (2 minutos)

1. En Firebase Console → ⚙️ **Configuración** → **Configuración del proyecto**
2. Scroll down → **"Tus aplicaciones"** → Click en **</>** (web)
3. Nombre: "Ciudadanía Fácil"
4. Click **"Registrar app"**
5. **Copia el objeto `firebaseConfig`**

### 3️⃣ Configurar Credenciales (1 minuto)

**Opción A: Usar archivo .env (Recomendado)**

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env y pega tus credenciales
```

Ejemplo de `.env`:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=ciudadania-facil.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=ciudadania-facil
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=ciudadania-facil.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789
```

**Opción B: Editar directamente**

Abre `src/config/firebaseConfig.ts` y reemplaza los valores.

### 4️⃣ Habilitar Servicios (3 minutos)

**Autenticación:**
1. Firebase Console → **Autenticación** → **Comenzar**
2. **Sign-in method** → **Correo electrónico/Contraseña**
3. Activar → **Guardar**

**Firestore:**
1. Firebase Console → **Firestore Database** → **Crear base de datos**
2. **Modo de prueba** → Seleccionar región → **Habilitar**
3. Tab **Reglas** → Copiar y pegar estas reglas:

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

4. Click **"Publicar"**

### 5️⃣ Verificar (1 minuto)

```bash
# Verificar configuración
npm run check:firebase

# Reiniciar servidor
npm start
```

### ✅ ¡Listo!

Deberías ver la pantalla de Login. Intenta crear una cuenta nueva.

---

**¿Problemas?** Ver `FIREBASE_SETUP.md` para ayuda detallada.

