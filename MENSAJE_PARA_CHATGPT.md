# Contexto del Proyecto: Entrevista AI de Ciudadanía

## Resumen del Proyecto

Estamos desarrollando una aplicación React Native (Expo) para preparar el examen de ciudadanía estadounidense. La aplicación incluye una **Entrevista AI** que simula un oficial de inmigración USCIS usando OpenAI GPT-4o-mini.

## Arquitectura Actual

### 1. Servicio de Entrevista (`aiInterviewN400Service.ts`)

**Estructura actual:**
- Clase singleton que maneja sesiones en memoria (Map)
- Llama directamente a OpenAI API desde el cliente usando `fetch`
- Maneja todo el flujo de la entrevista: saludo, verificación de identidad, revisión N-400, juramento, preguntas de civismo, pruebas de lectura/escritura, cierre
- Retorna respuestas estructuradas en formato JSON con:
  - `respuesta_oficial`: Mensaje del oficial (en inglés)
  - `evaluacion_fluidez`: Evaluación de la respuesta del usuario (puntaje y sugerencias en español)
  - `estado_entrevista`: Etapa actual de la entrevista

**Funcionalidades clave:**
- `initializeSession(context)`: Inicia sesión con contexto del solicitante
- `getSessionMessages(sessionId)`: Obtiene historial de mensajes
- `processApplicantResponse(sessionId, response)`: Procesa respuesta del usuario y genera respuesta del oficial
- `generateNextAutomaticMessage(sessionId)`: Genera mensajes automáticos para transiciones entre etapas

### 2. Base de Datos de Preguntas (`src/data/questions.tsx`)

**Estructura:**
- Archivo con **128 preguntas oficiales de civismo** del USCIS
- Cada pregunta tiene:
  - `id`: Identificador único
  - `questionEn` / `questionEs`: Pregunta en inglés y español
  - `answerEn` / `answerEs`: Respuesta correcta (puede ser string o array)
  - `explanationEn` / `explanationEs`: Explicación detallada
  - `category`: 'government' | 'history' | 'symbols_holidays'
  - `subcategory`: Subcategoría específica
  - `asterisk`: Si es pregunta marcada con asterisco (más importante)

**Uso en la entrevista:**
- El servicio importa estas preguntas: `const { questions } = await import('../data/questions')`
- Selecciona preguntas aleatorias que no se hayan usado
- Compara la respuesta del usuario con la respuesta correcta
- Evalúa si la respuesta es correcta usando palabras clave

### 3. Pantalla de Entrevista (`AIInterviewN400ScreenModerno.tsx`)

**Características:**
- Interfaz de chat con burbujas de mensajes
- Input de texto y reconocimiento de voz (opcional)
- TTS (Text-to-Speech) usando `expo-speech` con:
  - `prepareTextForTTS()`: Preprocesa texto (ej: "N-400" → "N four hundred")
  - `speakMessage()`: Reproduce audio con `language: 'en-US'`, `rate: 0.85`
- Muestra evaluación de fluidez en tarjeta destacada
- Carga opcional de formulario N-400 (PDF)

## Limitaciones de la Propuesta Original

### 1. **Preguntas de Civismo**

**Tu propuesta:** El backend generaría preguntas de civismo dinámicamente.

**Problema:** Ya tenemos un archivo con **128 preguntas oficiales del USCIS** que:
- Son las preguntas reales que se hacen en el examen
- Tienen respuestas correctas validadas
- Están estructuradas con categorías y subcategorías
- Se usan en otras partes de la app (tarjetas de estudio, pruebas prácticas, etc.)

**Solución necesaria:** El backend debe:
- Recibir el ID de la pregunta seleccionada desde el cliente
- O tener acceso a la misma base de datos de preguntas
- Comparar respuestas con las respuestas oficiales correctas

### 2. **Evaluación de Fluidez**

**Tu propuesta:** No incluye evaluación estructurada de fluidez.

**Problema actual:** El servicio retorna `FluencyEvaluation` con:
- `puntaje_pronunciacion_y_gramatica`: "X/10"
- `mejora_sugerida`: Sugerencia en español

La pantalla muestra esto en una tarjeta destacada para feedback al usuario.

**Solución necesaria:** El backend debe incluir evaluación de fluidez en las respuestas.

### 3. **Manejo de Etapas**

**Tu propuesta:** No maneja explícitamente las etapas de la entrevista.

**Problema actual:** El servicio maneja etapas:
- `greeting` → `identity` → `n400_review` → `oath` → `civics` → `reading` → `writing` → `closing`

Cada etapa tiene lógica específica y el oficial debe saber en qué etapa está.

**Solución necesaria:** El backend debe recibir y retornar el estado de la entrevista.

### 4. **Fallbacks Predefinidos**

**Tu propuesta:** Depende completamente del backend.

**Problema actual:** Si OpenAI falla (cuota insuficiente, error de red, etc.), el servicio tiene respuestas predefinidas como fallback para que la entrevista continúe.

**Solución necesaria:** El backend debe tener fallbacks o el cliente debe mantenerlos.

## Preguntas para ChatGPT

### 1. Arquitectura Backend

**Pregunta:** ¿Cómo deberíamos estructurar el backend para que:
- Tenga acceso a las 128 preguntas oficiales de civismo (¿debería el cliente enviar el ID de la pregunta o el backend debe tener su propia copia?)
- Mantenga el estado de las etapas de la entrevista
- Genere respuestas con evaluación de fluidez estructurada
- Tenga fallbacks cuando OpenAI falle?

### 2. Compatibilidad con Código Actual

**Pregunta:** ¿Cómo podemos mantener la compatibilidad con el código actual de la pantalla que espera:
- `processApplicantResponse()` retorne `{ officerResponse, isCorrect?, feedback?, shouldSpeak?, fluencyEvaluation? }`
- `generateNextAutomaticMessage()` retorne mensajes con `fluencyEvaluation`
- `getSessionMessages()` funcione igual (¿mantener en memoria en cliente o sincronizar con backend?)

### 3. Seguridad y Escalabilidad

**Pregunta:** ¿Cuál es la mejor forma de:
- Mantener la API key de OpenAI segura en el backend
- Manejar sesiones (¿memoria, base de datos, Redis?)
- Escalar si hay muchos usuarios simultáneos?

### 4. Mejoras Adicionales

**Pregunta:** ¿Qué otras mejoras podríamos implementar para:
- Mejorar la calidad del inglés del oficial (¿usar GPT-4 en lugar de GPT-4o-mini?)
- Hacer el oficial más autónomo y conversacional
- Mejorar la evaluación de fluidez (¿usar modelos específicos de evaluación?)
- Optimizar costos de OpenAI (¿caching, respuestas más cortas, etc.?)

### 5. Migración Gradual

**Pregunta:** ¿Cómo podemos hacer una migración gradual sin romper la funcionalidad actual?
- ¿Mantener el código actual como fallback?
- ¿Crear un flag para usar backend o cliente directo?
- ¿Cómo probar que todo funciona antes de desplegar?

## Información Técnica Adicional

- **Framework:** React Native con Expo
- **OpenAI Model:** GPT-4o-mini (actualmente)
- **TTS:** expo-speech con preprocesamiento de texto
- **STT:** @react-native-voice/voice (requiere development build)
- **Estado:** Sesiones en memoria (Map) en el cliente
- **Formato de respuestas:** JSON estructurado con `response_format: { type: "json_object" }`

## Objetivos Finales

1. **Seguridad:** API key de OpenAI no expuesta en el cliente
2. **Calidad:** Mejor inglés del oficial, más natural y profesional
3. **Autonomía:** Oficial más conversacional y autónomo
4. **Compatibilidad:** Mantener funcionalidades actuales (evaluación de fluidez, etapas, preguntas oficiales)
5. **Escalabilidad:** Preparado para producción con muchos usuarios

