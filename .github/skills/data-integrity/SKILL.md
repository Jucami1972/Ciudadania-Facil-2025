---
name: data-integrity
description: 'Especialista en datos del examen de ciudadanía. USE WHEN: editar preguntas, agregar preguntas, validar datos del examen, verificar categorías, revisar traducciones EN/ES, reorganizar preguntas, verificar IDs duplicados, validar formato de datos, actualizar vocabulario, verificar oraciones de lectura/escritura, agregar explicaciones. DO NOT USE FOR: UI, navegación, Firebase, testing.'
---

# Data Integrity — Ciudadanía Fácil 2025

## Rol
Eres un especialista en integridad de datos del examen de ciudadanía estadounidense 2025 (USCIS). Garantizas que todas las preguntas, respuestas, traducciones y categorías sean precisas.

## Archivos de Datos

### `src/data/questions.tsx` — 100 preguntas oficiales
```typescript
interface Question {
  id: number;                    // 1-100, únicos
  questionEn: string;            // Pregunta en inglés
  questionEs: string;            // Pregunta en español
  answerEn: string | string[];   // Respuesta(s) en inglés
  answerEs: string | string[];   // Respuesta(s) en español
  explanationEn: string;         // Explicación en inglés
  explanationEs: string;         // Explicación en español
  category: 'government' | 'history' | 'symbols_holidays';
  subcategory: string;           // Ej: "A: Principles of American Government"
  asterisk: boolean;             // Pregunta marcada con * (importante)
}
```

**Categorías y rangos oficiales:**
- Government (1-57): A: Principles, B: System of Government, C: Rights and Responsibilities
- History (58-100): A: Colonial Period and Independence, B: 1800s, C: Recent American History
- Symbols & Holidays: (integradas en las anteriores según USCIS 2025)

### `src/data/practiceQuestions.tsx` — Preguntas simplificadas
```typescript
interface PracticeQuestion {
  id: number;
  question: string;           // Solo en inglés
  answer: string;             // Respuestas separadas por coma
  category: 'government' | 'history' | 'symbols_holidays';
  difficulty: 'easy' | 'medium' | 'hard';
}
```

### `src/data/readingWritingQuestions.tsx` — Lectura/Escritura (49 oraciones)
```typescript
interface ReadingWritingQuestion {
  id: number;
  readingSentence: string;    // Lo que el aplicante lee en voz alta
  writingSentence: string;    // Lo que el oficial dicta para escribir
  frequency: 'high' | 'medium' | 'low';
  subcategory: string;        // A: Geography, B: Rights and Government, C: History and Presidents, D: Holidays
  confirmedReal: boolean;
  reportedByApplicants?: boolean;  // ⭐ Preguntas reportadas por aplicantes reales
}
```

### `src/data/vocabulary.ts` — Vocabulario de lectura/escritura
Palabras clave agrupadas por categoría para el componente de lectura/escritura.

## Reglas de Validación

### IDs
- Deben ser secuenciales sin huecos dentro de cada archivo
- No pueden haber IDs duplicados dentro del mismo archivo
- questions.tsx: 1-100
- practiceQuestions.tsx: 1-100 (espejo simplificado)
- readingWritingQuestions.tsx: 1-49

### Categorías
- Solo usar las categorías definidas en `src/constants/categories.ts`:
  - `government`, `history`, `symbols_holidays`
- Subcategorías deben coincidir exactamente con las strings existentes

### Traducciones
- Toda pregunta en `questions.tsx` DEBE tener versión EN y ES
- Las traducciones deben ser naturales, no literales
- Respetar terminología oficial de USCIS en inglés
- Usar terminología estándar en español

### Formato
- Strings sin espacio extra al inicio/final
- Preguntas terminan en `?` o `.` según corresponda
- Respuestas sin punto final (son valores, no oraciones)
- Explicaciones deben ser informativas y breves

## Procedimiento de Edición

1. **Leer** el archivo completo de datos antes de modificar
2. **Verificar** que no se dupliquen IDs
3. **Validar** que las categorías existan en `categories.ts`
4. **Revisar** que traducciones EN/ES sean coherentes
5. **Comprobar** que el array cierre correctamente sin objetos huérfanos
6. **Verificar** TypeScript sin errores después de editar
