# 📱 Cómo Ver la Aplicación

Esta aplicación usa **Expo**, que permite verla en diferentes plataformas.

## Opciones para Ver la App

### Opción 1: Navegador Web (Más Rápido) ⚡

Cuando ejecutas `npm start`, deberías ver algo como:

```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press w │ open web
```

**Para abrir en el navegador:**
1. Presiona la tecla **`w`** en la terminal donde corre `npm start`
2. O haz clic en la opción "**w │ open web**"
3. Se abrirá automáticamente en tu navegador predeterminado

**URL directa:** También puedes abrir manualmente:
```
http://localhost:8081
```

### Opción 2: Dispositivo Móvil (Android/iOS) 📱

#### Para Android:
1. **Instala Expo Go** desde Google Play Store
2. En la terminal donde corre `npm start`, verás un **código QR**
3. **Abre Expo Go** en tu teléfono
4. **Escanea el código QR** con Expo Go
5. La app se cargará en tu dispositivo

#### Para iOS:
1. **Instala Expo Go** desde App Store
2. En la terminal donde corre `npm start`, verás un **código QR**
3. **Abre la app Cámara** de iOS
4. **Escanea el código QR** (te preguntará si quieres abrir con Expo Go)
5. La app se cargará en tu dispositivo

### Opción 3: Emulador/Simulador 💻

#### Android Emulator:
```bash
npm run android
```

#### iOS Simulator (solo en Mac):
```bash
npm run ios
```

## Pasos Detallados para Web

### 1. Si ya tienes `npm start` corriendo:

Simplemente presiona la tecla **`w`** en la terminal.

### 2. Si necesitas iniciar desde cero:

```bash
# En la terminal
cd Ciudadania-Facil-2025
npm start

# Espera a que aparezca el menú
# Luego presiona 'w' para abrir en navegador web
```

## Solución de Problemas

### No veo el código QR o el menú:

1. Asegúrate de que el servidor esté corriendo
2. Revisa que no haya errores en la terminal
3. Intenta presionar `r` para recargar

### La app no carga en el navegador:

1. Verifica que no haya otros procesos usando el puerto 8081
2. Intenta cerrar y volver a abrir: `Ctrl+C` y luego `npm start`
3. Abre manualmente: `http://localhost:8081`

### Error de conexión en dispositivo móvil:

1. Asegúrate de que tu teléfono y computadora estén en la **misma red WiFi**
2. Si no funciona, intenta usar la opción de "Tunnel" (presiona `s` para cambiar de modo)

## Comandos Útiles

```bash
# Iniciar servidor
npm start

# Abrir en web (desde el menú de npm start)
w

# Abrir en Android
a

# Abrir en iOS
i

# Recargar app
r

# Cambiar modo de conexión (LAN/Tunnel)
s

# Limpiar caché y reiniciar
npm start -- --clear
```

## 📝 Nota Importante

- **Para desarrollo web:** Usa la opción `w` - es la más rápida
- **Para probar en móvil real:** Usa Expo Go con el código QR
- **Para desarrollo nativo:** Usa los emuladores con `npm run android` o `npm run ios`

---

**¡Ahora puedes ver tu aplicación funcionando!** 🎉

