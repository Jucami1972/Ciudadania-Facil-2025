# 🔒 Eliminación de Credenciales del Repositorio

## ⚠️ CRÍTICO: Credenciales Expuestas

Se encontraron archivos con credenciales en el repositorio:

- `credenciales firesox.txt` (866 bytes)
- `API key Ciudanadia Facil.txt` (164 bytes)

**Ubicación:** Directorio raíz del proyecto (CDF2025/)

## 🚨 Acción Inmediata Requerida

### Paso 1: Verificar que están en .gitignore ✅

El `.gitignore` ya está actualizado con:
```
*credenciales*.txt
*API*.txt
*key*.txt
*.txt
!README*.txt
!CHANGELOG*.txt
!LICENSE*.txt
```

### Paso 2: Eliminar Archivos Localmente

```powershell
# Desde el directorio raíz (CDF2025)
Remove-Item "credenciales firesox.txt" -Force
Remove-Item "API key Ciudanadia Facil.txt" -Force
```

### Paso 3: Eliminar del Historial de Git (IMPORTANTE)

Si estos archivos ya fueron commitados al repositorio:

```powershell
# Eliminar del historial de Git
git filter-branch --force --index-filter `
  "git rm --cached --ignore-unmatch 'credenciales firesox.txt' 'API key Ciudanadia Facil.txt'" `
  --prune-empty --tag-name-filter cat -- --all

# Forzar push (CUIDADO: esto reescribe el historial)
git push origin --force --all
git push origin --force --tags
```

**⚠️ ADVERTENCIA:** Esto reescribe el historial de Git. Solo hazlo si:
- Tienes backup del repositorio
- Todos los colaboradores están informados
- Estás seguro de que quieres eliminar estos archivos permanentemente

### Paso 4: Rotar Credenciales (CRÍTICO)

**Las credenciales ya están comprometidas.** Debes rotarlas inmediatamente:

#### Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Configuración del proyecto** > **Cuentas de servicio**
4. Genera nuevas claves privadas
5. Actualiza las credenciales en tu aplicación

#### OpenAI (si aplica)

1. Ve a [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Revoca las claves expuestas
3. Genera nuevas claves API
4. Actualiza `EXPO_PUBLIC_OPENAI_API_KEY` en `.env`

#### Otras APIs

- Revisa todas las APIs que uses
- Revoca todas las claves que puedan estar en esos archivos
- Genera nuevas claves

### Paso 5: Actualizar Variables de Entorno

Asegúrate de que todas las credenciales estén en `.env`:

```env
# .env (NO subir a Git)
EXPO_PUBLIC_OPENAI_API_KEY=tu_nueva_clave_aqui
FIREBASE_API_KEY=tu_nueva_clave_aqui
# ... otras variables
```

### Paso 6: Verificar que no se suban en el futuro

```powershell
# Verificar que .gitignore funciona
git status
# No deberían aparecer archivos .txt con credenciales
```

## 📋 Checklist de Seguridad

- [ ] Archivos eliminados localmente
- [ ] Archivos eliminados del historial de Git (si fueron commitados)
- [ ] Credenciales de Firebase rotadas
- [ ] Credenciales de OpenAI rotadas (si aplica)
- [ ] Otras APIs rotadas
- [ ] Variables de entorno actualizadas
- [ ] `.env` verificado en `.gitignore`
- [ ] `.gitignore` actualizado y funcionando
- [ ] Colaboradores informados (si aplica)

## 🔍 Verificación Post-Eliminación

```powershell
# Buscar cualquier archivo con credenciales
Get-ChildItem -Recurse -File | Where-Object {
    $_.Name -match "credenciales|API|key" -and $_.Extension -eq ".txt"
} | Select-Object FullName

# Verificar que no estén en Git
git ls-files | Select-String -Pattern "credenciales|API|key"
```

## 📚 Recursos

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Firebase: Rotate Service Account Keys](https://firebase.google.com/docs/projects/iam/service-accounts)
- [OpenAI: API Key Management](https://platform.openai.com/api-keys)

## ⚠️ Recordatorio

**NUNCA** subas archivos con credenciales a Git. Siempre usa:
- Variables de entorno (`.env`)
- Secretos del sistema (GitHub Secrets, Vercel Secrets, etc.)
- Servicios de gestión de secretos (AWS Secrets Manager, etc.)

