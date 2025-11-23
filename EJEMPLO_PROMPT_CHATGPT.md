# Ejemplo de Prompt para ChatGPT/Claude

## 🎬 Extraer Información de Video de Entrevista Real

### PROMPT para ChatGPT/Claude (Copia y pega esto)

```
Eres un experto en entrevistas de ciudadanía USCIS (United States Citizenship and Immigration Services).

Tengo un video/transcripción de una entrevista REAL de ciudadanía USCIS y necesito que extraigas TODA la información sobre preguntas PERSONALES que el oficial hace al solicitante.

**MI OBJETIVO:**
Quiero entrenar un agente virtual que simule un oficial de USCIS, así que necesito:
1. TODAS las preguntas personales que el oficial hace
2. Cómo el oficial formula las preguntas (lenguaje natural)
3. Variaciones de las mismas preguntas
4. Cómo el oficial confirma respuestas
5. Cómo el oficial pide aclaraciones
6. Las transiciones entre diferentes secciones

**NO NECESITO:**
- Preguntas de civismo (ya las tengo)
- Reading test (ya implementado)
- Writing test (ya implementado)

**SÍ NECESITO:**
- Preguntas de identidad (nombre, fecha de nacimiento, etc.)
- Preguntas del formulario N-400 (dirección, trabajo, familia, viajes, etc.)
- Preguntas sobre historial legal/criminal
- Preguntas sobre impuestos
- Preguntas sobre servicio militar
- Cualquier otra pregunta personal

**FORMATO DE SALIDA:**
Por favor, organiza la información en este formato JSON:

```json
{
  "interview_sections": [
    {
      "section_name": "Verificación de Identidad",
      "section_order": 1,
      "questions": [
        {
          "question": "Can you please confirm your full name?",
          "variations": [
            "What is your full name?",
            "Please state your full name for the record.",
            "Can you tell me your complete name?"
          ],
          "expected_response_type": "Full name matching identification documents",
          "context": "First question after greeting, used to verify identity",
          "confirmation_phrases": ["Thank you", "I see", "That's correct"],
          "clarification_phrases": ["Can you spell that?", "Can you clarify the spelling?"],
          "follow_up_if_unclear": true
        }
      ]
    },
    {
      "section_name": "Revisión del Formulario N-400 - Dirección",
      "section_order": 2,
      "questions": [
        {
          "question": "Can you confirm your current address?",
          "variations": [
            "What is your current residential address?",
            "Where do you currently live?",
            "Please provide your current address.",
            "I'd like to verify your current address."
          ],
          "expected_response_type": "Complete address (street, city, state, ZIP)",
          "context": "After identity verification, reviewing N-400 form data",
          "confirmation_phrases": ["Thank you, that matches our records", "That's correct"],
          "clarification_phrases": [
            "Can you clarify the street address?",
            "I need to verify the ZIP code.",
            "Can you be more specific about the address?"
          ],
          "follow_up_if_unclear": true,
          "flexible_matching": "Accept variations in format (St vs Street, CA vs California, etc.)"
        }
      ]
    }
  ],
  "official_behaviors": {
    "confirmation_phrases": [
      "Thank you",
      "That's correct",
      "I see",
      "That matches our records",
      "Thank you for confirming"
    ],
    "clarification_phrases": [
      "Can you clarify",
      "Can you be more specific",
      "I need to verify",
      "Let me confirm",
      "Can you repeat that"
    ],
    "transition_phrases": [
      "Now I'd like to",
      "Let's move on to",
      "Next, I'll ask you about",
      "Moving forward",
      "Now, about"
    ],
    "positive_reinforcement": [
      "Thank you for that information",
      "I appreciate your cooperation",
      "That's helpful"
    ]
  },
  "question_categories": {
    "identity_verification": {
      "description": "Questions to verify applicant identity",
      "questions": []
    },
    "n400_address": {
      "description": "Questions about current and previous addresses",
      "questions": []
    },
    "n400_employment": {
      "description": "Questions about employment history and current job",
      "questions": []
    },
    "n400_family": {
      "description": "Questions about spouse, children, and family members",
      "questions": []
    },
    "n400_travel": {
      "description": "Questions about travel history outside the US",
      "questions": []
    },
    "n400_legal": {
      "description": "Questions about criminal history and legal issues",
      "questions": []
    },
    "n400_taxes": {
      "description": "Questions about tax returns and tax obligations",
      "questions": []
    },
    "n400_military": {
      "description": "Questions about military service",
      "questions": []
    }
  }
}
```

**INSTRUCCIONES ADICIONALES:**
1. Para cada pregunta, incluye TODAS las variaciones que observes
2. Captura el lenguaje natural del oficial (cómo realmente habla)
3. Nota si el oficial usa un tono formal o más conversacional
4. Identifica patrones (¿siempre hace la misma pregunta primero? ¿hay un orden específico?)
5. Incluye ejemplos de cómo el oficial maneja respuestas poco claras
6. Nota si hay preguntas opcionales vs. requeridas

Si tienes el video o transcripción, por favor pégalo aquí o proporciona el enlace:
[PEGAR VIDEO/TRANSCRIPCIÓN/ENLACE AQUÍ]
```

---

## 📝 Ejemplo de Uso

### Paso 1: Obtener Video/Transcripción

**Opciones:**
1. **YouTube**: Buscar "USCIS citizenship interview", "naturalization interview real"
2. **Transcripciones**: Buscar transcripciones de entrevistas
3. **Documentación**: Usar documentación oficial de USCIS sobre el proceso

### Paso 2: Usar el Prompt

1. Copia el PROMPT de arriba
2. Pégalo en ChatGPT o Claude
3. Agrega el video/transcripción al final
4. Ejecuta el prompt

### Paso 3: Obtener Resultado

La IA debería devolver un JSON estructurado con todas las preguntas y comportamientos.

---

## 🔄 Si no Tienes Video: Usar Prompt Alternativo

Si no tienes un video específico, usa este prompt:

```
Eres un experto en entrevistas de ciudadanía USCIS.

Basándote en tu conocimiento de entrevistas REALES de ciudadanía USCIS y el formulario N-400 completo, genera una lista EXHAUSTIVA de todas las preguntas PERSONALES que un oficial de inmigración puede hacer durante una entrevista de naturalización.

**IMPORTANTE:**
- SOLO preguntas personales (NO civismo, reading, writing)
- Incluye variaciones naturales de cada pregunta
- Basa las preguntas en el formulario N-400 real
- Incluye el lenguaje natural que un oficial real usaría

**CATEGORÍAS:**
1. Verificación de Identidad
2. Información del N-400 (dirección, trabajo, educación)
3. Familia (esposo/a, hijos)
4. Historial de Residencia
5. Historial de Viajes
6. Historial Laboral
7. Historial Legal/Criminal
8. Información Fiscal
9. Servicio Militar
10. Otra Información Personal

Para cada pregunta, incluye:
- Pregunta principal
- 3-5 variaciones naturales
- Tipo de respuesta esperada
- Contexto (cuándo se pregunta)
- Frases de confirmación
- Frases de aclaración

**FORMATO:** El mismo JSON del prompt anterior.
```

---

## ✅ Después de Obtener la Información

Una vez que tengas la información extraída:

1. **Guárdala** en un archivo JSON
2. **Usa el archivo** `GENERAR_PROMPTS_AGENTE.md` para convertir esa información en prompts de entrenamiento
3. **Actualiza** el código en `backend/src/services/OpenAIEngine.ts` con los nuevos prompts
4. **Mejora** el `ResponseValidator.ts` con las nuevas validaciones

---

## 📌 Recursos Útiles

- **Videos de YouTube**: 
  - "USCIS citizenship interview"
  - "Naturalization interview real"
  - "N-400 interview experience"
  
- **Documentación USCIS**:
  - https://www.uscis.gov/n-400
  - https://www.uscis.gov/citizenship
  
- **Foros y Experiencias**:
  - Reddit r/USCIS
  - Foros de inmigración

---

## 💡 Consejos

1. **Si usas ChatGPT Plus**: Puede analizar videos directamente
2. **Si usas ChatGPT Free**: Necesitas la transcripción del video
3. **Para transcribir videos**: Usa herramientas como YouTube Auto-Transcript, Whisper, etc.
4. **Valida la información**: Compara con documentación oficial de USCIS

