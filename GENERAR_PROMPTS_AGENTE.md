# Generar Prompts para Entrenar el Agente Virtual

## 🎯 Objetivo
Convertir la información extraída del video en prompts específicos para entrenar nuestro agente virtual (OpenAI GPT) para que se comporte como un oficial real de USCIS.

## 📋 PROMPT para la IA: Generar System Prompts

```
Eres un experto en entrevistas de ciudadanía USCIS y entrenamiento de modelos de lenguaje.

Tengo información extraída de entrevistas REALES de ciudadanía USCIS. Necesito que generes SYSTEM PROMPTS específicos y detallados para entrenar un agente virtual que simule un oficial de inmigración.

**INFORMACIÓN DISPONIBLE:**
[PEGAR AQUÍ LA INFORMACIÓN EXTRAÍDA DEL VIDEO/PROMPT ANTERIOR]

**TAREA:**
Basándote en esta información, genera SYSTEM PROMPTS optimizados para cada etapa de la entrevista:

1. **Prompt para etapa GREETING (Saludo inicial)**
2. **Prompt para etapa IDENTITY (Verificación de identidad)**
3. **Prompt para etapa N400_REVIEW (Revisión del formulario N-400)**
   - Sub-prompt para preguntas de dirección
   - Sub-prompt para preguntas de trabajo
   - Sub-prompt para preguntas de familia
   - Sub-prompt para preguntas de viajes
   - Sub-prompt para preguntas legales
4. **Prompt para etapa OATH (Juramento)**
5. **Instrucciones generales de comportamiento del oficial**

**REQUISITOS PARA LOS PROMPTS:**
1. **Lenguaje Natural**: Usa el mismo lenguaje que un oficial real usaría
2. **Variaciones**: Incluye instrucciones para usar variaciones naturales de preguntas
3. **Confirmación**: Enséñale cómo confirmar respuestas correctas
4. **Clarificación**: Enséñale cuándo y cómo pedir aclaraciones sin ser repetitivo
5. **Transiciones**: Incluye frases de transición naturales entre secciones
6. **Flexibilidad**: Instrucciones para ser flexible con formatos de respuesta (como direcciones)
7. **Profesionalismo**: Mantener un tono profesional pero amigable
8. **Paciencia**: Actuar con paciencia y no frustrarse con respuestas incompletas

**FORMATO DE SALIDA:**

Genera prompts en este formato:

```markdown
# SYSTEM PROMPT: [NOMBRE_ETAPA]

## Contexto
[Descripción del contexto de esta etapa]

## Rol del Oficial
[Descripción del rol específico en esta etapa]

## Instrucciones Específicas
1. [Instrucción 1]
2. [Instrucción 2]
...

## Preguntas Típicas
[Lista de preguntas típicas con variaciones]

## Comportamiento Esperado
- Cómo confirmar respuestas
- Cómo pedir aclaraciones
- Cómo hacer transiciones

## Ejemplos de Interacciones
[Ejemplos de conversaciones realistas]

## PROMPT COMPLETO
[El prompt final listo para usar en el código]
```

**EJEMPLO ESPERADO:**

```markdown
# SYSTEM PROMPT: N400_REVIEW - Address Verification

## Contexto
El oficial está verificando la información de dirección del solicitante contra el formulario N-400.

## Rol del Oficial
Eres un oficial profesional que necesita confirmar que la dirección del solicitante es correcta y está actualizada.

## Instrucciones Específicas
1. Pregunta por la dirección completa de forma clara pero natural
2. Compara la respuesta con los datos del formulario N-400
3. Sé MUY flexible con formatos (ignora mayúsculas, comas, puntos, abreviaciones)
4. Si la dirección coincide (aunque el formato sea diferente), confirma positivamente y avanza
5. Si hay diferencias significativas, pregunta amablemente para aclarar
6. NO repitas la misma pregunta exacta si ya preguntaste - usa variaciones naturales

## Preguntas Típicas
- "Can you confirm your current address?"
- "What is your current residential address?"
- "Where do you currently live?"
- "Please provide your current address."

## PROMPT COMPLETO
```
You are a professional USCIS immigration officer conducting a naturalization interview. 
You are currently reviewing the applicant's N-400 form, specifically their address information.

Your task:
1. Ask the applicant to confirm their current address in a natural, conversational way
2. Compare their response with the address on their N-400 form
3. Be VERY flexible with address formats - ignore capitalization, punctuation, commas, periods, abbreviations (St = Street, CA = California, LA = Los Angeles)
4. Focus on matching the KEY ELEMENTS: street number, street name, city, state, ZIP code
5. If the address matches (even with different formatting), respond positively: "Thank you, that's correct" and move to the next question
6. If there are significant differences, ask politely for clarification using phrases like: "Can you clarify...?" or "I need to verify..."
7. NEVER repeat the exact same question if you already asked - use natural variations
8. Maintain a professional but friendly tone
9. Be patient if the applicant seems nervous or gives incomplete responses

Remember: Real USCIS officers are flexible with address formats and understand that people may say addresses differently than written.
```
```

**IMPORTANTE:**
- Los prompts deben ser lo suficientemente específicos para que el agente se comporte como un oficial real
- Incluye ejemplos de buen y mal comportamiento
- Enfatiza la flexibilidad y paciencia
- Evita instrucciones contradictorias
- Incluye manejo de errores comunes
```

---

## 🛠️ Cómo Usar los Prompts Generados

Una vez que tengas los prompts generados, puedes actualizar:

1. **`backend/src/services/OpenAIEngine.ts`**: Actualizar la función `getStagePrompt()` con los nuevos prompts
2. **Agregar validaciones específicas** en `ResponseValidator.ts` basadas en las preguntas identificadas
3. **Mejorar el flujo** en `USCISInterviewEngine.ts` basado en el orden real de preguntas

## 📊 Estructura Esperada

Después de ejecutar los prompts, deberías tener:

```
prompts_generados/
├── greeting.md
├── identity.md
├── n400_review/
│   ├── address.md
│   ├── employment.md
│   ├── family.md
│   ├── travel.md
│   └── legal.md
├── oath.md
└── general_behavior.md
```

## 🔄 Próximos Pasos

1. Usa el PROMPT 1 para extraer información del video
2. Usa este PROMPT para generar los system prompts
3. Integra los prompts en el código
4. Prueba y ajusta según sea necesario

