# 🤖 Configuración de OpenAI para Entrevista AI

La funcionalidad de Entrevista AI puede usar OpenAI (ChatGPT) para generar respuestas más inteligentes y naturales del oficial de inmigración.

## 📋 Requisitos

1. Una cuenta de OpenAI con acceso a la API
2. Una API Key de OpenAI
3. Configurar la variable de entorno `EXPO_PUBLIC_OPENAI_API_KEY`

## 🔑 Cómo Obtener tu API Key de OpenAI

1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Inicia sesión o crea una cuenta
3. Ve a [API Keys](https://platform.openai.com/api-keys)
4. Haz clic en "Create new secret key"
5. Dale un nombre (ej: "Ciudadanía Fácil")
6. **Copia la API Key inmediatamente** (solo se muestra una vez)

## ⚙️ Configuración

### Opción 1: Archivo .env (Recomendado)

1. Crea un archivo `.env` en la raíz del proyecto (al mismo nivel que `package.json`)
2. Agrega tu API Key:

```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-tu-api-key-aqui
```

3. Reinicia el servidor de Expo:
   ```bash
   npm start
   ```

### Opción 2: Variables de Entorno del Sistema

En Windows (PowerShell):
```powershell
$env:EXPO_PUBLIC_OPENAI_API_KEY="sk-tu-api-key-aqui"
npm start
```

En macOS/Linux:
```bash
export EXPO_PUBLIC_OPENAI_API_KEY="sk-tu-api-key-aqui"
npm start
```

## ✅ Verificación

Una vez configurado, cuando inicies una entrevista AI:

- Si OpenAI está configurado: Verás en la consola `✅ Respuesta de OpenAI recibida`
- Si no está configurado: Verás `⚠️ OpenAI no configurado, usando respuestas predefinidas`

## 💡 Notas Importantes

1. **Seguridad**: Nunca subas tu `.env` a Git. El archivo `.env` ya debería estar en `.gitignore`
2. **Costo**: OpenAI cobra por uso. El modelo `gpt-4o-mini` es económico (~$0.15 por 1M tokens)
3. **Funcionamiento sin OpenAI**: La app funciona perfectamente sin OpenAI usando respuestas predefinidas inteligentes
4. **Modelo usado**: `gpt-4o-mini` (económico y rápido)

## 🎯 Funcionalidades con OpenAI

Con OpenAI configurado, el agente:
- Genera respuestas más naturales y contextuales
- Adapta el lenguaje según el contexto de la conversación
- Hace preguntas más variadas y relevantes
- Proporciona retroalimentación más detallada

Sin OpenAI, el agente:
- Usa respuestas predefinidas inteligentes
- Funciona perfectamente para practicar
- No requiere configuración adicional

## 🔧 Solución de Problemas

### "OpenAI no está disponible"
- Verifica que la API Key esté correctamente configurada
- Asegúrate de haber reiniciado el servidor después de agregar la variable
- Verifica que la API Key sea válida en [OpenAI Platform](https://platform.openai.com/api-keys)

### "Error en OpenAI API"
- Verifica tu saldo en [OpenAI Usage](https://platform.openai.com/usage)
- Asegúrate de tener créditos disponibles
- Verifica que la API Key tenga permisos para usar el modelo `gpt-4o-mini`

