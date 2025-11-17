# 🚀 Guía para Builds de Producción

## Android - Keystore de Producción

### Paso 1: Generar Keystore

**⚠️ IMPORTANTE:** Guarda este archivo de forma SEGURA. Si lo pierdes, NO podrás actualizar tu app en Google Play.

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore ciudadania-facil-release.keystore -alias ciudadania-facil-key -keyalg RSA -keysize 2048 -validity 10000
```

**Información que te pedirá:**
- Contraseña del keystore: **GUÁRDALA EN UN LUGAR SEGURO**
- Contraseña de la clave: (puede ser la misma)
- Nombre y apellidos: Tu nombre o nombre de la empresa
- Unidad organizativa: (opcional)
- Ciudad: Tu ciudad
- Estado/Provincia: Tu estado
- Código de país: US (o tu país)

### Paso 2: Configurar gradle.properties

Crea o edita `android/gradle.properties` y agrega:

```properties
CIUDADANIA_FACIL_UPLOAD_STORE_FILE=ciudadania-facil-release.keystore
CIUDADANIA_FACIL_UPLOAD_KEY_ALIAS=ciudadania-facil-key
CIUDADANIA_FACIL_UPLOAD_STORE_PASSWORD=TU_PASSWORD_AQUI
CIUDADANIA_FACIL_UPLOAD_KEY_PASSWORD=TU_PASSWORD_AQUI
```

**⚠️ NUNCA subas este archivo a Git.** Agrega `gradle.properties` a `.gitignore`.

### Paso 3: Configurar build.gradle

Edita `android/app/build.gradle` y agrega la configuración de signing:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('CIUDADANIA_FACIL_UPLOAD_STORE_FILE')) {
                storeFile file(CIUDADANIA_FACIL_UPLOAD_STORE_FILE)
                storePassword CIUDADANIA_FACIL_UPLOAD_STORE_PASSWORD
                keyAlias CIUDADANIA_FACIL_UPLOAD_KEY_ALIAS
                keyPassword CIUDADANIA_FACIL_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Paso 4: Generar APK/AAB

```bash
cd android
./gradlew bundleRelease  # Para AAB (recomendado para Play Store)
# o
./gradlew assembleRelease  # Para APK
```

El archivo estará en:
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## iOS - Certificados y Provisioning

### Paso 1: Crear Certificado de Distribución

1. Ve a https://developer.apple.com/account/
2. **Certificates, Identifiers & Profiles**
3. **Certificates** > **+** (Agregar)
4. Selecciona **Apple Distribution**
5. Sigue las instrucciones para crear el certificado
6. Descarga e instala el certificado

### Paso 2: Crear App ID

1. En Apple Developer Portal
2. **Identifiers** > **+**
3. Selecciona **App IDs**
4. **App ID:** `com.ciudadaniafacil.app`
5. Habilita las capacidades necesarias (Push Notifications, In-App Purchase)
6. **Register**

### Paso 3: Crear Provisioning Profile

1. **Profiles** > **+**
2. Selecciona **App Store** (para distribución)
3. Selecciona tu App ID
4. Selecciona tu certificado
5. Nombre: `Ciudadania Facil Distribution`
6. **Generate** y descarga

### Paso 4: Configurar en Xcode

1. Abre el proyecto en Xcode:
   ```bash
   cd ios
   open CiudadaniaFacil.xcworkspace
   ```

2. En Xcode:
   - Selecciona el proyecto
   - **Signing & Capabilities**
   - Selecciona tu equipo
   - Xcode debería detectar automáticamente el provisioning profile

### Paso 5: Archivar y Subir

1. En Xcode: **Product** > **Archive**
2. Cuando termine, se abrirá **Organizer**
3. Selecciona tu archive
4. **Distribute App**
5. Selecciona **App Store Connect**
6. Sigue el asistente

---

## EAS Build (Recomendado para Expo)

### Paso 1: Instalar EAS CLI

```bash
npm install -g eas-cli
```

### Paso 2: Iniciar sesión

```bash
eas login
```

### Paso 3: Configurar proyecto

```bash
eas build:configure
```

Esto creará `eas.json`.

### Paso 4: Configurar eas.json

Edita `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "bundleIdentifier": "com.ciudadaniafacil.app"
      }
    },
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    }
  }
}
```

### Paso 5: Crear build

```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production

# Ambos
eas build --platform all --profile production
```

---

## Variables de Entorno para Producción

Crea un archivo `.env.production`:

```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key_produccion
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=ciudadaniafacil2025.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=ciudadaniafacil2025
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=ciudadaniafacil2025.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=763891163291
EXPO_PUBLIC_FIREBASE_APP_ID=1:763891163291:web:4ea524a75f0695dc11e63e

# Sentry
EXPO_PUBLIC_SENTRY_DSN=tu_sentry_dsn_produccion

# OpenAI (opcional)
EXPO_PUBLIC_OPENAI_API_KEY=tu_openai_key_produccion

# Expo
EXPO_PUBLIC_PROJECT_ID=ciudadaniafacil2025
```

---

## Checklist Pre-Build

Antes de crear el build de producción:

- [ ] Actualizar `version` y `versionCode` en `app.json`
- [ ] Verificar que todas las variables de entorno estén configuradas
- [ ] Probar la app en modo release localmente
- [ ] Verificar que los iconos y splash screens estén actualizados
- [ ] Revisar que no haya console.logs de debug
- [ ] Verificar que Sentry esté configurado para producción
- [ ] Probar compras in-app en sandbox/test
- [ ] Verificar que las notificaciones funcionen
- [ ] Revisar que la Privacy Policy esté accesible

---

## Versioning

### Android

En `android/app/build.gradle`:

```gradle
defaultConfig {
    versionCode 2  // Incrementar en cada release
    versionName "1.0.1"  // Versión visible al usuario
}
```

### iOS

En `app.json`:

```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "2"  // Incrementar en cada release
    }
  }
}
```

---

## Troubleshooting

### Error: "Keystore file not found"
- Verifica la ruta en `gradle.properties`
- Asegúrate de que el archivo existe

### Error: "Invalid keystore format"
- Regenera el keystore
- Asegúrate de usar PKCS12

### Error: "Certificate expired"
- Renueva el certificado en Apple Developer Portal
- Actualiza el provisioning profile

### Error: "Bundle identifier mismatch"
- Verifica que el bundle ID coincida en:
  - `app.json`
  - Apple Developer Portal
  - Xcode

---

## Seguridad

**⚠️ NUNCA:**
- Subas el keystore a Git
- Compartas las contraseñas del keystore
- Publiques las variables de entorno en código público
- Uses el keystore de debug en producción

**✅ SÍ:**
- Guarda el keystore en un lugar seguro (1Password, LastPass, etc.)
- Usa variables de entorno para secretos
- Mantén backups del keystore
- Documenta dónde guardaste las credenciales

---

## Recursos

- [Android Signing Guide](https://reactnative.dev/docs/signed-apk-android)
- [iOS Distribution Guide](https://developer.apple.com/distribute/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo App Configuration](https://docs.expo.dev/workflow/configuration/)

