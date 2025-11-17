# 🔐 Configuración de Google Sign In

Esta guía te ayudará a habilitar el inicio de sesión con Google en Firebase.

## ✅ Paso 1: Habilitar Google en Firebase Authentication

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto **CiudadaniaFacil2025**
3. En el menú lateral, haz clic en **"Autenticación"** o **"Authentication"**
4. Ve a la pestaña **"Sign-in method"** o **"Métodos de inicio de sesión"**
5. Busca **"Google"** en la lista de proveedores
6. Haz clic en **"Google"**
7. Activa el toggle **"Habilitado"** o **"Enable"**
8. **No necesitas configurar un email de soporte** (opcional)
9. Haz clic en **"Guardar"** o **"Save"**

## ✅ Paso 2: Obtener el Client ID de Google (Opcional para móvil)

Si planeas usar Google Sign In en dispositivos móviles (iOS/Android), necesitarás:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona el proyecto **ciudadaniafacil2025** (el mismo que Firebase)
3. Ve a **"APIs & Services"** → **"Credentials"**
4. Crea un **OAuth 2.0 Client ID** si no tienes uno
5. Agrega los **Authorized redirect URIs** según tu plataforma

**Nota:** Para desarrollo en Expo, esto no es estrictamente necesario ya que Firebase maneja la autenticación automáticamente.

## ✅ Paso 3: Verificar que funciona

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Reinicia la app:
   ```bash
   npx expo start --clear
   ```

3. En la pantalla de Login o Register, verás el botón **"Continuar con Google"**
4. Haz clic en el botón para probar la autenticación

## 🎯 Funcionalidades Implementadas

- ✅ Botón de Google Sign In en LoginScreen
- ✅ Botón de Google Sign In en RegisterScreen
- ✅ Manejo de errores para autenticación con Google
- ✅ Soporte para Web (popup) y móvil (redirect)
- ✅ Indicadores de carga durante la autenticación

## ⚠️ Notas Importantes

- **Para Web**: La autenticación usa un popup que se abre automáticamente
- **Para Móvil**: La autenticación redirige al navegador y luego vuelve a la app
- **Modo Pruebas**: Asegúrate de que Firestore esté en modo pruebas para desarrollo
- **Errores comunes**:
  - Si ves "Autenticación con Google no está habilitada": Verifica el Paso 1
  - Si el popup se bloquea: Permite popups en tu navegador
  - Si hay errores de red: Verifica tu conexión a internet

## 🔄 Agregar más proveedores (Facebook, Apple, etc.)

Para agregar más proveedores de autenticación:

1. Sigue el mismo proceso en Firebase Console
2. Agrega el método correspondiente en `AuthContext.tsx`
3. Agrega botones en las pantallas de Login/Register

Ejemplo para Facebook:
- En Firebase Console, habilita "Facebook"
- Agrega `loginWithFacebook()` en AuthContext
- Crea botones similares en las pantallas

