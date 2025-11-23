# 🔧 Solución al Error de Metro Bundler

## Error Encontrado

```
Failed to construct transformer: Error: Failed to start watch mode.
TypeError: Body is unusable
```

## Causas Posibles

1. **Problema con el file watcher de Metro** - Demasiados archivos siendo monitoreados
2. **Error de red al validar dependencias** - Expo intenta validar versiones y falla
3. **Caché corrupta** - Archivos temporales corruptos

## Soluciones Aplicadas

### 1. Actualizar metro.config.js ✅

Se agregaron configuraciones para:
- Optimizar el watcher
- Mejorar el manejo de archivos
- Configurar health checks

### 2. Corregir Error de useCallback en PremiumContext ✅

**Error:** `[ReferenceError: Property 'useCallback' doesn't exist]`

**Causa:** `useCallback` y `useMemo` no estaban importados en `PremiumContext.tsx`

**Solución:** Agregar `useCallback` y `useMemo` al import de React:
```typescript
// Antes
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Después
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
```

**Archivo corregido:** `src/context/PremiumContext.tsx`

### 2. Limpiar Caché (Ejecutar estos comandos)

```powershell
# Limpiar caché de Metro
npx expo start --clear

# O limpiar manualmente
Remove-Item -Recurse -Force .expo
Remove-Item -Recurse -Force node_modules/.cache
npm cache clean --force
```

### 3. Si el problema persiste

```powershell
# Reinstalar dependencias
Remove-Item -Recurse -Force node_modules
npm install --legacy-peer-deps

# Iniciar con modo offline (evita validación de dependencias)
npx expo start --offline
```

### 4. Verificar espacio en disco

El error puede estar relacionado con espacio insuficiente. Verificar:

```powershell
Get-PSDrive C | Select-Object Used,Free
```

## Comandos de Diagnóstico

```powershell
# Verificar versión de Node
node --version  # Debe ser >= 18.0.0

# Verificar versión de npm
npm --version

# Verificar instalación de Expo
npx expo --version

# Verificar que no haya procesos de Metro corriendo
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*expo*"}
```

## Solución Alternativa: Usar Expo Go sin Metro

Si el problema persiste, puedes usar Expo Go directamente:

```powershell
# Instalar Expo Go en tu dispositivo móvil
# Luego escanear el QR que aparece al ejecutar:
npx expo start --tunnel
```

## Notas

- El error "Body is unusable" generalmente indica un problema con la librería `undici` (fetch) de Node.js
- Puede estar relacionado con React 19 siendo muy reciente
- La solución con `--legacy-peer-deps` ayuda a evitar conflictos de dependencias

