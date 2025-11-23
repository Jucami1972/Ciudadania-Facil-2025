# 🔧 Solución: Error "main has not been registered"

**Error:** `Invariant Violation: "main" has not been registered. This can happen if: Metro (the local dev server) is run from the wrong folder. Check if Metro is running, stop it and restart it in the current project. A module failed to load due to an error and AppRegistry.registerComponent wasn't called.`

**Fecha:** 23 de Noviembre, 2025

---

## 🔴 Problema Identificado

El error "main has not been registered" significa que el componente `App` no se está registrando correctamente. Esto puede pasar si:

1. **Error en App.tsx:** Un error en `App.tsx` impide que se cargue
2. **Error en imports:** Un error en algún import causa que el módulo falle
3. **Error en HomeScreenRedesign:** El import de `HomeScreenRedesign` está causando que todo el módulo falle
4. **Metro desde carpeta incorrecta:** Metro está corriendo desde la carpeta incorrecta
5. **Caché corrupta:** La caché de Metro está corrupta

---

## ✅ Soluciones Aplicadas

### 1. Verificar Estructura de Archivos

**Estado:** ✅ Verificado

- `index.ts` existe y llama `registerRootComponent(App)`
- `App.tsx` existe y exporta `export default function App()`
- `package.json` tiene `"main": "index.ts"`

### 2. Verificar Imports

**Estado:** ✅ Verificado

- `HomeScreenRedesign` se importa correctamente
- `AppNavigator` se importa correctamente
- Todos los componentes tienen `export default`

### 3. Limpiar Caché y Reiniciar

**Estado:** ⚠️ Requerido

El problema más común es la caché corrupta. Debes:

```powershell
# 1. Detener Metro (Ctrl+C)

# 2. Limpiar caché de Metro
cd Ciudadania-Facil-2025
npx expo start --clear

# 3. Si persiste, limpiar node_modules
Remove-Item -Recurse -Force node_modules
npm install

# 4. Reiniciar Metro
npx expo start --clear
```

---

## 🔍 Diagnóstico Paso a Paso

### Paso 1: Verificar que Metro está en la carpeta correcta

```powershell
# Asegúrate de estar en la carpeta del proyecto
cd Ciudadania-Facil-2025
pwd  # Debería mostrar: ...\CDF2025\Ciudadania-Facil-2025
```

### Paso 2: Verificar que no hay errores de sintaxis

```powershell
# Verificar errores de TypeScript
npx tsc --noEmit
```

Si hay errores, corrígelos antes de continuar.

### Paso 3: Verificar que App.tsx se puede importar

```typescript
// Temporalmente en index.ts, agrega:
import App from './App';
console.log('App loaded:', typeof App); // Debería mostrar "function"
```

### Paso 4: Verificar que HomeScreenRedesign se puede importar

```typescript
// Temporalmente en AppNavigator.tsx, agrega:
import HomeScreenRedesign from '../screens/HomeScreenRedesign';
console.log('HomeScreenRedesign loaded:', typeof HomeScreenRedesign); // Debería mostrar "function"
```

---

## 🎯 Solución Inmediata

### Opción 1: Limpiar Caché (Más Común)

```powershell
# Detener Metro (Ctrl+C)
cd Ciudadania-Facil-2025
npx expo start --clear
```

### Opción 2: Reinstalar Dependencias

```powershell
# Detener Metro (Ctrl+C)
cd Ciudadania-Facil-2025
Remove-Item -Recurse -Force node_modules
npm install
npx expo start --clear
```

### Opción 3: Verificar Carpeta de Metro

```powershell
# Asegúrate de que Metro está corriendo desde la carpeta correcta
cd Ciudadania-Facil-2025
# Verifica que package.json existe
Test-Path package.json  # Debería mostrar True
# Inicia Metro
npx expo start --clear
```

---

## 📝 Verificaciones Adicionales

### 1. Verificar package.json

```json
{
  "main": "index.ts",  // ✅ Debe ser index.ts
  "scripts": {
    "start": "expo start"  // ✅ Debe existir
  }
}
```

### 2. Verificar index.ts

```typescript
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);  // ✅ Debe llamar registerRootComponent
```

### 3. Verificar App.tsx

```typescript
export default function App(): React.ReactElement {
  // ... código ...
  return (
    // ... JSX ...
  );
}
```

---

## 🔧 Si el Problema Persiste

### 1. Verificar Errores en Consola

Revisa la consola de Metro para ver si hay errores específicos:

```
ERROR  [runtime not ready]: Error: Exception in HostFunction: <unknown>
```

### 2. Verificar Errores de TypeScript

```powershell
npx tsc --noEmit
```

Corrige todos los errores antes de continuar.

### 3. Verificar Imports Circulares

Busca imports circulares que puedan causar problemas:

```typescript
// ❌ Malo: Import circular
// App.tsx importa AppNavigator
// AppNavigator importa HomeScreenRedesign
// HomeScreenRedesign importa algo que importa App.tsx
```

### 4. Verificar que Todos los Componentes Tienen Export Default

```typescript
// ✅ Correcto
export default function MyComponent() { ... }

// ❌ Incorrecto
export function MyComponent() { ... }
```

---

## 🎯 Resultado Esperado

Después de limpiar la caché y reiniciar:

1. ✅ Metro debería iniciar sin errores
2. ✅ La app debería cargar correctamente
3. ✅ El componente "main" debería estar registrado
4. ✅ No debería aparecer el error "main has not been registered"

---

**Última actualización:** 23 de Noviembre, 2025  
**Estado:** ⚠️ Requiere limpiar caché y reiniciar Metro

