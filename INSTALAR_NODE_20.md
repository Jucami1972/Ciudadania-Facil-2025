# 📦 Instalar Node.js 20.19.5

**Estado Actual:** Node.js v18.20.7 instalado  
**Versión Descargada:** Node.js v20.19.5 (en Downloads)  
**Acción Requerida:** Instalar la versión descargada

---

## 🎯 Pasos para Instalar

### Opción 1: Desde el Archivo Descargado (Recomendado)

1. **Abrir el archivo descargado:**
   - Ve a `C:\Users\prjcc\Downloads\node-v20.19.5-win-x64\`
   - Ejecuta `node-v20.19.5-x64.msi` (o el archivo `.msi` que descargaste)

2. **Seguir el asistente de instalación:**
   - Haz clic en "Next" en cada paso
   - Acepta los términos y condiciones
   - **Importante:** Marca la opción "Automatically install the necessary tools" si aparece
   - Completa la instalación

3. **Cerrar y reabrir PowerShell:**
   - Cierra todas las terminales abiertas
   - Abre una nueva terminal de PowerShell
   - Verifica la instalación:
     ```powershell
     node --version
     # Debería mostrar: v20.19.5
     ```

### Opción 2: Desde nodejs.org (Si no encuentras el archivo)

1. Ve a https://nodejs.org/
2. Descarga la versión **LTS 20.x.x** (Windows Installer `.msi`)
3. Ejecuta el instalador
4. Sigue los pasos del asistente

---

## ✅ Verificación Post-Instalación

Después de instalar, verifica:

```powershell
# Verificar versión de Node.js
node --version
# Debe mostrar: v20.19.5 o superior

# Verificar versión de npm
npm --version
# Debe mostrar una versión reciente

# Verificar ubicación
where.exe node
# Debe mostrar: C:\Program Files\nodejs\node.exe
```

---

## 🔄 Reinstalar Dependencias del Proyecto

Después de actualizar Node.js, es recomendable reinstalar las dependencias:

```powershell
cd Ciudadania-Facil-2025
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json -ErrorAction SilentlyContinue
npm install --legacy-peer-deps
```

---

## ⚠️ Notas Importantes

1. **Cerrar terminales:** Cierra todas las terminales antes de instalar
2. **Reiniciar si es necesario:** Si `node --version` sigue mostrando 18.20.7, reinicia tu computadora
3. **No deberían aparecer advertencias:** Después de actualizar, las advertencias `EBADENGINE` deberían desaparecer

---

**Última actualización:** 23 de Noviembre, 2025

