# 🔧 Instalación de Dependencias de Testing

## ⚠️ Problema Detectado

Hay un conflicto de dependencias con React 19.1.0 y las librerías de testing. Además, se detectó un error de espacio en disco.

## ✅ Soluciones

### Opción 1: Instalar con --legacy-peer-deps (Recomendado)

```powershell
cd Ciudadania-Facil-2025
npm install --legacy-peer-deps
```

Este comando ignora los conflictos de peer dependencies y permite la instalación.

### Opción 2: Limpiar caché y reinstalar

Si tienes problemas de espacio en disco:

```powershell
# Limpiar caché de npm
npm cache clean --force

# Luego instalar
npm install --legacy-peer-deps
```

### Opción 3: Instalar solo dependencias de testing

Si ya tienes las dependencias principales instaladas:

```powershell
npm install --legacy-peer-deps --save-dev @testing-library/jest-native@^5.4.3 @testing-library/react-native@^12.4.3 @types/jest@^29.5.12 jest@^29.7.0 jest-expo@~52.0.0 react-test-renderer@19.1.0
```

## 📝 Nota sobre React 19

React 19 es muy nuevo y algunas librerías de testing pueden mostrar advertencias de peer dependencies. Esto es normal y no afecta la funcionalidad. El flag `--legacy-peer-deps` permite instalar sin errores.

## ✅ Verificar Instalación

Después de instalar, verifica que todo esté correcto:

```powershell
npm test
```

Si los tests se ejecutan sin errores, la instalación fue exitosa.

## 🔍 Si Persisten los Problemas

1. **Verificar espacio en disco**: Asegúrate de tener al menos 500MB libres
2. **Limpiar node_modules**: 
   ```powershell
   Remove-Item -Recurse -Force node_modules
   npm install --legacy-peer-deps
   ```
3. **Verificar versión de Node.js**: Debe ser >= 18.0.0
   ```powershell
   node --version
   ```


