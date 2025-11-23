# 🔧 Solución: Incompatibilidad de Dependencias

**Error:** `Invariant Violation: "main" has not been registered`

**Fecha:** 23 de Noviembre, 2025

---

## 🔴 Problema Identificado

El error puede ser causado por **incompatibilidades entre dependencias**, especialmente:

1. **React 19.1.0 es muy nuevo** y puede tener incompatibilidades con:
   - React Native 0.81.4
   - Expo SDK 54
   - Algunas librerías de navegación

2. **Node.js 20.19.5** puede requerir reinstalación de dependencias

---

## ✅ Soluciones Aplicadas

### 1. Verificar Versiones Instaladas

**Estado:** ✅ Verificado

- Node.js: v20.19.5 ✅
- npm: 10.8.2 ✅
- React: 19.1.0 ⚠️ (muy nuevo, puede causar problemas)
- React Native: 0.81.4 ✅
- Expo: 54.0.25 ✅

### 2. Problemas de Compatibilidad Detectados

**React 19.1.0** puede tener incompatibilidades con:
- `@react-navigation/*` (versiones 6.x pueden no ser totalmente compatibles)
- `react-native-paper` (puede requerir actualización)
- `react-native-reanimated` (puede tener problemas)

---

## 🔧 Soluciones Recomendadas

### Opción 1: Reinstalar Dependencias (Recomendado)

```powershell
# 1. Detener Metro (Ctrl+C)

# 2. Limpiar todo
cd Ciudadania-Facil-2025
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# 3. Limpiar caché de npm
npm cache clean --force

# 4. Reinstalar con compatibilidad
npm install --legacy-peer-deps

# 5. Reiniciar Metro con caché limpia
npx expo start --clear
```

### Opción 2: Usar Expo Install para Ajustar Versiones

```powershell
# Expo puede ajustar automáticamente las versiones para compatibilidad
npx expo install --fix
```

### Opción 3: Verificar Múltiples Instancias de React

```powershell
# Verificar si hay múltiples versiones de React instaladas
npm ls react

# Si hay múltiples, forzar una versión con resolutions en package.json
```

---

## 📋 Verificaciones Adicionales

### 1. Verificar que No Hay Múltiples Instancias de React

```powershell
npm ls react
```

**Problema común:** Si hay múltiples versiones de React, puede causar el error.

**Solución:** Agregar `resolutions` en `package.json`:

```json
{
  "resolutions": {
    "react": "19.1.0",
    "react-dom": "19.1.0"
  }
}
```

### 2. Verificar Compatibilidad de React Navigation

React Navigation 6.x debería ser compatible con React 19, pero puede haber problemas menores.

**Solución:** Si persiste, considerar actualizar a React Navigation 7.x:

```powershell
npm install @react-navigation/native@latest @react-navigation/native-stack@latest @react-navigation/bottom-tabs@latest --legacy-peer-deps
```

### 3. Verificar Compatibilidad de React Native Paper

React Native Paper puede requerir actualización para React 19.

**Solución:** Verificar versión compatible:

```powershell
npm install react-native-paper@latest --legacy-peer-deps
```

---

## 🎯 Solución Inmediata (Más Probable)

El problema más común después de actualizar Node.js es que las dependencias necesitan reinstalarse:

```powershell
# 1. Detener Metro
# Ctrl+C en la terminal donde corre Metro

# 2. Limpiar y reinstalar
cd Ciudadania-Facil-2025
Remove-Item -Recurse -Force node_modules
npm cache clean --force
npm install --legacy-peer-deps

# 3. Reiniciar Metro
npx expo start --clear
```

---

## 🔍 Diagnóstico

### Verificar Versiones Instaladas

```powershell
npm ls react react-native expo
```

### Verificar Errores de Peer Dependencies

```powershell
npm install --legacy-peer-deps --dry-run
```

### Verificar Múltiples Instancias

```powershell
npm ls react-native-safe-area-context
npm ls @react-navigation/native
```

---

## 📝 Notas sobre React 19

React 19 es muy nuevo (lanzado en 2024) y algunas librerías pueden no estar totalmente compatibles:

1. **React Navigation 6.x:** Debería funcionar, pero puede haber problemas menores
2. **React Native Paper:** Puede requerir actualización
3. **React Native Reanimated:** Puede tener problemas con React 19

**Recomendación:** Si el problema persiste después de reinstalar, considera:
- Usar React 18.x (más estable)
- O esperar actualizaciones de las librerías

---

## 🎯 Resultado Esperado

Después de reinstalar dependencias:

1. ✅ Todas las dependencias deberían estar compatibles
2. ✅ No debería haber múltiples instancias de React
3. ✅ El error "main has not been registered" debería desaparecer
4. ✅ La app debería cargar correctamente

---

**Última actualización:** 23 de Noviembre, 2025  
**Estado:** ⚠️ Requiere reinstalación de dependencias

