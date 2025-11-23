# Backend - Entrevista AI de Ciudadanía

Backend para la funcionalidad de Entrevista AI que simula un oficial de inmigración USCIS.

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```powershell
cd backend
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend/`:

```
OPENAI_API_KEY=tu-api-key-aqui
PORT=3000
NODE_ENV=development
```

### 3. Compilar TypeScript

```powershell
npm run build
```

### 4. Ejecutar servidor

**Modo desarrollo (con hot-reload):**
```powershell
npm run dev
```

**Modo producción:**
```powershell
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📡 Endpoints

### POST `/interview/init`
Inicia una nueva sesión de entrevista.

**Request:**
```json
{
  "context": {
    "applicantName": "Juan Pérez",
    "applicantAge": 30,
    "countryOfOrigin": "Mexico",
    "yearsInUS": 5,
    "n400FormData": { ... }
  }
}
```

**Response:**
```json
{
  "sessionId": "session_1234567890_abc123",
  "officerResponse": "Good morning, Juan Pérez...",
  "shouldSpeak": true,
  "fluencyEvaluation": {
    "puntaje_pronunciacion_y_gramatica": "7/10",
    "mejora_sugerida": "..."
  },
  "estado_entrevista": "greeting"
}
```

### POST `/interview/respond`
Procesa la respuesta del solicitante.

**Request:**
```json
{
  "sessionId": "session_1234567890_abc123",
  "response": "My name is Juan Pérez"
}
```

**Response:**
```json
{
  "officerResponse": "Thank you. Can you confirm your date of birth?",
  "isCorrect": true,
  "feedback": "Correct.",
  "shouldSpeak": true,
  "fluencyEvaluation": { ... },
  "estado_entrevista": "identity",
  "pregunta_id": 23
}
```

### POST `/interview/auto`
Genera mensaje automático para transiciones entre etapas.

**Request:**
```json
{
  "sessionId": "session_1234567890_abc123"
}
```

### GET `/interview/messages/:sessionId`
Obtiene todos los mensajes de una sesión.

## 🏗️ Arquitectura

```
backend/
├── src/
│   ├── types.ts                    # Tipos TypeScript compartidos
│   ├── data/
│   │   └── questions.ts            # 128 preguntas oficiales del USCIS
│   ├── services/
│   │   ├── SessionManager.ts       # Manejo de sesiones (memoria)
│   │   ├── QuestionBank.ts         # Base de datos de preguntas
│   │   ├── USCISInterviewEngine.ts # Motor de control de etapas
│   │   ├── OpenAIEngine.ts         # Llamadas a OpenAI API
│   │   └── fallbacks.ts            # Respuestas predefinidas
│   ├── controllers/
│   │   └── interviewController.ts  # Endpoints REST
│   └── index.ts                    # Servidor Express
├── package.json
├── tsconfig.json
└── .env
```

## 🔧 Configuración

### Variables de Entorno

- `OPENAI_API_KEY`: Tu API key de OpenAI (requerida para usar GPT-4o-mini)
- `PORT`: Puerto del servidor (default: 3000)
- `NODE_ENV`: Ambiente (development/production)

### Sin OpenAI

Si no configuras `OPENAI_API_KEY`, el backend usará respuestas predefinidas (fallbacks). La funcionalidad básica seguirá funcionando.

## 📦 Scripts

- `npm run build`: Compila TypeScript a JavaScript
- `npm start`: Ejecuta el servidor compilado
- `npm run dev`: Ejecuta en modo desarrollo con hot-reload
- `npm run watch`: Compila TypeScript en modo watch

## 🔄 Migración a Producción

Para producción, considera:

1. **Redis para sesiones**: Reemplazar `SessionManager` con Redis
2. **PostgreSQL**: Para guardar estadísticas y progreso
3. **Rate limiting**: Limitar requests por usuario
4. **Logging**: Implementar sistema de logs robusto
5. **Monitoring**: Agregar monitoring y alertas

## 🔒 Seguridad

- ✅ API key de OpenAI nunca se expone al cliente
- ✅ Validación de inputs en todos los endpoints
- ✅ Manejo de errores robusto
- ⚠️ En producción, agregar autenticación y rate limiting

## 📝 Notas

- El backend es 100% compatible con el frontend actual
- Usa el mismo formato de respuestas que espera `AIInterviewN400ScreenModerno.tsx`
- Las 128 preguntas están incluidas en el backend
- Fallbacks garantizan que funcione incluso sin OpenAI

