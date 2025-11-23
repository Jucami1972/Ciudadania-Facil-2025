# 🔄 Cómo Actualizar Node.js a 20.19.4+

**Versión Actual:** Node.js v18.20.7  
**Versión Requerida:** Node.js >= 20.19.4  
**Sistema Operativo:** Windows

---

## 📋 Opción 1: Instalador Oficial (Recomendado para la mayoría)

### Paso 1: Descargar Node.js

1. Ve a [nodejs.org](https://nodejs.org/)
2. Descarga la versión **LTS (Long Term Support)** - actualmente 20.x.x
3. Elige el instalador para Windows (`.msi`)

### Paso 2: Instalar

1. Ejecuta el archivo `.msi` descargado
2. Sigue el asistente de instalación
3. **Importante:** Marca la opción "Automatically install the necessary tools" si aparece
4. Completa la instalación

### Paso 3: Verificar

Abre una nueva terminal de PowerShell y verifica:

```powershell
node --version
# Debería mostrar: v20.x.x (donde x.x >= 19.4)

npm --version
# Debería mostrar la versión de npm incluida
```

### Paso 4: Reinstalar dependencias del proyecto

Después de actualizar Node.js, es recomendable reinstalar las dependencias:

```powershell
cd Ciudadania-Facil-2025
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install --legacy-peer-deps
```

---

## 📋 Opción 2: NVM-Windows (Recomendado para desarrolladores)

NVM (Node Version Manager) te permite tener múltiples versiones de Node.js y cambiar entre ellas fácilmente.

### Paso 1: Instalar NVM-Windows

1. Ve a [github.com/coreybutler/nvm-windows/releases](https://github.com/coreybutler/nvm-windows/releases)
2. Descarga `nvm-setup.exe` (la última versión)
3. Ejecuta el instalador
4. **Importante:** Cierra y vuelve a abrir PowerShell después de instalar

### Paso 2: Instalar Node.js 20

Abre PowerShell como Administrador y ejecuta:

```powershell
# Ver versiones disponibles de Node.js 20
nvm list available

# Instalar Node.js 20.19.4 (o la última versión 20.x.x)
nvm install 20.19.4

# Usar la versión instalada
nvm use 20.19.4

# Verificar
node --version
```

### Paso 3: Configurar como versión por defecto (opcional)

```powershell
# Establecer como versión por defecto
nvm alias default 20.19.4
```

### Comandos útiles de NVM

```powershell
# Ver versiones instaladas
nvm list

# Cambiar entre versiones
nvm use 18.20.7  # Volver a la versión anterior si es necesario
nvm use 20.19.4  # Usar la nueva versión

# Desinstalar una versión
nvm uninstall 18.20.7
```

### Paso 4: Reinstalar dependencias

```powershell
cd Ciudadania-Facil-2025
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install --legacy-peer-deps
```

---

## 📋 Opción 3: Chocolatey (Si ya lo tienes instalado)

Si tienes Chocolatey instalado, puedes actualizar Node.js con un comando:

```powershell
# Actualizar Node.js a la última versión LTS
choco upgrade nodejs-lts -y

# O instalar una versión específica
choco install nodejs --version=20.19.4 -y
```

---

## ⚠️ Problemas Comunes y Soluciones

### Problema 1: "node no se reconoce como comando"

**Solución:**
1. Cierra y vuelve a abrir PowerShell
2. Verifica que Node.js esté en el PATH:
   ```powershell
   $env:PATH -split ';' | Select-String node
   ```
3. Si no aparece, reinicia tu computadora

### Problema 2: Versión antigua después de instalar

**Solución:**
1. Cierra todas las terminales abiertas
2. Abre una nueva terminal
3. Verifica con `node --version`
4. Si persiste, reinicia la computadora

### Problema 3: Conflictos con instalaciones anteriores

**Solución:**
1. Desinstala Node.js desde "Agregar o quitar programas"
2. Elimina carpetas residuales:
   ```powershell
   # Eliminar carpetas de Node.js (si existen)
   Remove-Item -Recurse -Force "$env:ProgramFiles\nodejs" -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force "$env:ProgramFiles(x86)\nodejs" -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force "$env:APPDATA\npm" -ErrorAction SilentlyContinue
   ```
3. Reinicia la computadora
4. Instala Node.js nuevamente

### Problema 4: npm no funciona después de actualizar

**Solución:**
```powershell
# Reinstalar npm globalmente
npm install -g npm@latest

# Verificar
npm --version
```

---

## ✅ Verificación Post-Instalación

Después de actualizar, verifica que todo funcione:

```powershell
# Verificar versiones
node --version    # Debe ser >= 20.19.4
npm --version     # Debe mostrar una versión reciente

# Verificar que no hay advertencias EBADENGINE
cd Ciudadania-Facil-2025
npm install --legacy-peer-deps
# No deberían aparecer advertencias sobre Node.js
```

---

## 🎯 Recomendación

**Para la mayoría de usuarios:** Usa la **Opción 1 (Instalador Oficial)** - es la más simple y directa.

**Para desarrolladores que trabajan con múltiples proyectos:** Usa la **Opción 2 (NVM-Windows)** - te permite cambiar entre versiones fácilmente.

---

## 📝 Notas Importantes

1. **Backup:** Antes de actualizar, considera hacer backup de tu proyecto
2. **Cerrar terminales:** Cierra todas las terminales abiertas antes de instalar
3. **Reinstalar dependencias:** Siempre reinstala las dependencias después de actualizar Node.js
4. **Verificar compatibilidad:** Algunos proyectos pueden requerir versiones específicas de Node.js

---

## 🔗 Enlaces Útiles

- [Node.js Downloads](https://nodejs.org/)
- [NVM-Windows GitHub](https://github.com/coreybutler/nvm-windows)
- [Node.js Release Schedule](https://nodejs.org/en/about/releases/)

---

**Última actualización:** 23 de Noviembre, 2025

