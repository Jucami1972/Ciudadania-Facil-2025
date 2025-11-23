# Prompt para Extraer Información de Entrevista Real del Video

## 🎯 Objetivo
Extraer todas las preguntas personales y el flujo de una entrevista real de ciudadanía USCIS desde un video, para entrenar nuestro agente virtual.

## 📋 Instrucciones para la IA (ChatGPT/Claude/Anthropic)

### PROMPT 1: Análisis del Video (Si tienes transcripción o acceso al video)

```
Eres un experto en entrevistas de ciudadanía USCIS (United States Citizenship and Immigration Services).

Necesito que analices un video/transcripción de una entrevista REAL de ciudadanía y extraigas TODA la información relevante para entrenar un agente virtual.

**TAREA:**
1. Identifica TODAS las preguntas personales que el oficial hace al solicitante
2. Categoriza las preguntas por tipo:
   - Verificación de identidad (nombre, fecha de nacimiento, etc.)
   - Información del formulario N-400 (dirección, trabajo, familia, etc.)
   - Preguntas sobre historial de viajes
   - Preguntas sobre historial criminal/legal
   - Preguntas sobre trabajo y educación
   - Preguntas sobre familia (esposo/a, hijos)
   - Otras preguntas personales

3. Para cada pregunta, extrae:
   - La pregunta EXACTA del oficial (en inglés)
   - El contexto (cuándo se hace en la entrevista)
   - El tipo de respuesta esperada
   - Variaciones posibles de la pregunta (si el oficial pregunta de diferentes formas)
   - Ejemplos de respuestas correctas
   - Ejemplos de respuestas que requieren aclaración

4. Identifica el FLUJO de la entrevista:
   - Orden de las preguntas
   - Transiciones entre secciones
   - Cuándo el oficial confirma información
   - Cuándo el oficial pide aclaraciones

**FORMATO DE SALIDA:**
Organiza la información en un formato JSON estructurado con las siguientes categorías:

```json
{
  "interview_flow": {
    "sections": [
      {
        "name": "Identidad",
        "order": 1,
        "questions": [
          {
            "question": "Can you confirm your full name?",
            "variations": [
              "What is your full name?",
              "Please state your full name."
            ],
            "expected_response": "Full name matching N-400",
            "context": "First question after greeting",
            "follow_up_if_unclear": true
          }
        ]
      }
    ]
  },
  "question_categories": {
    "identity_verification": [...],
    "n400_form_review": [...],
    "address_verification": [...],
    "employment_history": [...],
    "family_information": [...],
    "travel_history": [...],
    "legal_history": [...],
    "other_personal": [...]
  },
  "official_behaviors": {
    "confirmation_phrases": ["Thank you", "That's correct", "I see"],
    "clarification_phrases": ["Can you clarify", "Can you be more specific", "I need to verify"],
    "transition_phrases": ["Now I'd like to", "Let's move on to", "Next"]
  }
}
```

**IMPORTANTE:**
- Extrae SOLO información de preguntas PERSONALES (no civismo, reading, writing)
- Incluye TODAS las variaciones de preguntas que observes
- Captura el lenguaje natural del oficial (cómo realmente habla)
- Nota las frases de confirmación y transición
- Identifica patrones en cómo el oficial maneja respuestas poco claras

Si tienes el video o transcripción, pégalo aquí:
[PEGAR VIDEO/TRANSCRIPCIÓN AQUÍ]
```

---

### PROMPT 2: Si solo tienes el enlace o descripción del video

```
Necesito que me ayudes a crear un prompt para extraer información de un video de entrevista de ciudadanía USCIS.

He encontrado este video/recurso sobre entrevistas reales:
[PEGAR ENLACE O DESCRIPCIÓN]

Por favor:
1. Indica qué tipo de información puedo extraer de este recurso
2. Proporcióname preguntas específicas que debería hacerle a la IA sobre este video
3. Sugiere cómo estructurar la información extraída

También necesito que me proporciones ejemplos de:
- Preguntas personales comunes en entrevistas USCIS
- Variaciones de cómo los oficiales hacen las mismas preguntas
- Formas en que los oficiales confirman información
- Cómo manejan respuestas ambiguas o incompletas
```

---

### PROMPT 3: Generar Base de Datos de Preguntas (Sin video)

Si no tienes video, puedes pedirle a la IA que genere preguntas basadas en conocimiento:

```
Eres un experto en entrevistas de ciudadanía USCIS.

Necesito una lista COMPLETA y EXHAUSTIVA de todas las preguntas PERSONALES que un oficial de inmigración puede hacer durante una entrevista de naturalización.

Basándote en:
1. El formulario N-400 completo
2. Procedimientos reales de USCIS
3. Casos documentados de entrevistas

Genera una lista detallada de preguntas organizadas por categoría:

**CATEGORÍAS:**
1. Verificación de Identidad
2. Información del N-400 (dirección, trabajo, educación)
3. Familia (esposo/a, hijos, padres)
4. Historial de Residencia (direcciones anteriores, tiempo en EE.UU.)
5. Historial de Viajes (viajes fuera de EE.UU.)
6. Historial Laboral
7. Historial Legal/Criminal
8. Información Fiscal
9. Servicio Militar
10. Información Adicional

Para cada pregunta:
- Versión formal del oficial
- Variaciones comunes de la misma pregunta
- Contexto (cuándo se pregunta)
- Tipo de respuesta esperada
- Ejemplos de buenas respuestas
- Cuándo el oficial puede pedir aclaración

**FORMATO:** JSON estructurado similar al formato del PROMPT 1.
```

---

## 📝 Siguiente Paso: Generar Prompts para el Agente

Una vez que tengas la información extraída, usa el archivo `GENERAR_PROMPTS_AGENTE.md` para convertir esa información en prompts de entrenamiento.

## 🔗 Recursos Útiles

- [USCIS N-400 Form](https://www.uscis.gov/n-400)
- [USCIS Interview Guide](https://www.uscis.gov/citizenship)
- Videos de entrevistas en YouTube (buscar "USCIS citizenship interview", "naturalization interview")

## 📌 Notas

- Las preguntas personales NO incluyen: civismo, reading test, writing test (esos ya están implementados)
- Enfócate en el lenguaje natural del oficial
- Captura variaciones y sinónimos
- Identifica patrones de confirmación y transición

