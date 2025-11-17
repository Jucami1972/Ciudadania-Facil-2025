# 📱 Flujo de Navegación - Ciudadanía Fácil 2025

## 🔐 1. FLUJO DE AUTENTICACIÓN

```
┌─────────────────┐
│   App Start     │
└────────┬────────┘
         │
         ├─ Si NO hay usuario → Login
         │
         └─ Si HAY usuario → Home
         │
┌─────────────────┐
│     Login       │
└────────┬────────┘
         │
         ├─ Login exitoso → Home (automático)
         ├─ "Crear cuenta" → Register
         └─ "Continuar con Google" → Home (automático)
         │
┌─────────────────┐
│    Register     │
└────────┬────────┘
         │
         ├─ Registro exitoso → Home (automático)
         ├─ "Iniciar sesión" → Login
         └─ "Continuar con Google" → Home (automático)
```

---

## 🏠 2. PANTALLA INICIAL - HomeScreen

**Ruta:** `Home`

Desde Home, el usuario puede navegar a:

### 📚 Estudio
- **Tarjetas de Estudio** (`TarjetasDeEstudio`) → `StudyScreen`
  - Selecciona categoría → `Subcategorias`
  - Selecciona subcategoría → `StudyCards`
  - Desde StudyCards → `Explanation` (modal)

### 🎯 Práctica
- **Prueba Práctica** (`PruebaPractica`) → `PruebaPracticaScreen`
  - Opción: Práctica por Categoría → `CategoryPractice`
  - Opción: Práctica Aleatoria → `RandomPractice`
  - Opción: Preguntas Incorrectas → `IncorrectPractice`
  - Opción: Preguntas Marcadas → `MarkedPractice`

- **Práctica por Tipo** (`QuestionTypePractice`) → `QuestionTypePracticeScreen`
  - Selecciona tipo (Quién, Qué, Cuándo, etc.) → `SpecificTypePractice`

- **Práctica de 20 Preguntas** (`Random20Practice`) → `Random20PracticeScreen`

- **Entrevista AI** (`EntrevistaAI`) → `EntrevistaAIScreen`
  - 14 preguntas aleatorias con reconocimiento de voz

- **Memoria Fotográfica** (`PhotoMemory`) → `PhotoMemoryScreen`

- **Vocabulario** (`Vocabulario`) → `VocabularioScreen`

- **Examen** (`Examen`) → `ExamenScreen`
  - 10 preguntas (pasa con 6)

---

## 📖 3. FLUJO DETALLADO DE NAVEGACIÓN

### 3.1. TARJETAS DE ESTUDIO
```
Home
  └─ TarjetasDeEstudio (StudyScreen)
      └─ Selecciona categoría → Subcategorias
          └─ Selecciona subcategoría → StudyCards
              └─ Toca pregunta → Explanation (modal)
              └─ Botón "Atrás" → Subcategorias
```

### 3.2. PRUEBA PRÁCTICA
```
Home
  └─ PruebaPractica
      ├─ Práctica por Categoría → CategoryPractice
      │   └─ Selecciona categoría → Práctica interactiva
      │       └─ Botón "Atrás" → CategoryPractice
      │       └─ Botón "Home" → Home
      │
      ├─ Práctica Aleatoria → RandomPractice
      │   └─ Práctica interactiva
      │       └─ Botón "Atrás" → RandomPractice
      │       └─ Botón "Home" → Home
      │
      ├─ Preguntas Incorrectas → IncorrectPractice
      │   └─ Lista de preguntas incorrectas
      │       └─ Botón "Atrás" → IncorrectPractice
      │       └─ Botón "Home" → Home
      │
      └─ Preguntas Marcadas → MarkedPractice
          └─ Lista de preguntas marcadas
              └─ Botón "Atrás" → MarkedPractice
              └─ Botón "Home" → Home
```

### 3.3. PRÁCTICA POR TIPO DE PREGUNTA
```
Home
  └─ QuestionTypePractice
      └─ Selecciona tipo (ej: "Quién") → SpecificTypePractice
          └─ Práctica específica del tipo
              ├─ Ver pregunta escrita
              ├─ Escuchar pregunta
              ├─ Escribir respuesta
              ├─ Escuchar respuesta
              └─ Siguiente pregunta
              └─ Botón "Atrás" → QuestionTypePractice
              └─ Botón "Home" → Home (si sale durante práctica)
```

### 3.4. PRÁCTICA DE 20 PREGUNTAS
```
Home
  └─ Random20Practice
      └─ 20 preguntas aleatorias (simula examen real)
          └─ Header con:
              ├─ Botón "Atrás" (con confirmación)
              └─ Botón "Home" (con confirmación)
```

### 3.5. ENTREVISTA AI
```
Home
  └─ EntrevistaAI
      └─ Pantalla de inicio
          └─ "Comenzar Entrevista" → Entrevista activa (14 preguntas)
              ├─ Header con:
              │   ├─ Botón "Atrás" (con confirmación)
              │   ├─ Progreso: "Pregunta X de 14"
              │   └─ Botón "Home" (con confirmación)
              ├─ Reproducir pregunta (audio)
              ├─ Grabar respuesta (voz)
              ├─ Escribir respuesta (texto)
              └─ Finalización → Pantalla de resultados
                  ├─ Botón "Atrás" → Home
                  └─ Botón "Home" → Home
```

### 3.6. OTRAS PANTALLAS
```
Home
  ├─ Vocabulario → VocabularioScreen
  ├─ Memoria Fotográfica → PhotoMemoryScreen
  └─ Examen → ExamenScreen (10 preguntas)
```

---

## 🗂️ 4. ESTRUCTURA DE GRUPOS DE NAVEGACIÓN

La app usa **Stack Navigator** con grupos condicionales:

### Grupo 1: Autenticación (Solo si NO hay usuario)
- `Login`
- `Register`

### Grupo 2: Pantallas Principales (Solo si HAY usuario)
- `Home`
- `TarjetasDeEstudio`
- `Subcategorias`

### Grupo 3: Wrappers por Categoría (Solo si HAY usuario)
- `GobiernoAmericano`
- `HistoriaAmericana`
- `EducacionCivica`

### Grupo 4: Estudio y Práctica (Solo si HAY usuario)
- `StudyCards`
- `PruebaPractica`
- `CategoryPractice`
- `QuestionTypePractice`
- `SpecificTypePractice`
- `RandomPractice`
- `Random20Practice`
- `PhotoMemory`
- `IncorrectPractice`
- `MarkedPractice`
- `Vocabulario`
- `EntrevistaAI`
- `Examen`

### Grupo 5: Modal (Siempre disponible)
- `Explanation` (presentación modal desde abajo)

---

## 🔄 5. NAVEGACIÓN CONDICIONAL

### Ruta Inicial
```typescript
initialRouteName = user ? "Home" : "Login"
```

### Condiciones de Acceso
- **Sin autenticación:** Solo ve `Login` y `Register`
- **Con autenticación:** Ve todas las pantallas principales y de práctica

---

## 🎨 6. PATRONES DE NAVEGACIÓN

### Headers con Botones de Navegación
Pantallas que tienen header con botones de retorno e inicio:
- ✅ `Random20Practice`
- ✅ `EntrevistaAI` (durante las 14 preguntas)
- ✅ `SpecificTypePractice`
- ✅ `CategoryPractice`
- ✅ `RandomPractice`
- ✅ `IncorrectPractice`
- ✅ `MarkedPractice`

### Confirmaciones al Salir
Algunas pantallas muestran confirmación antes de salir:
- `Random20Practice` - "¿Salir de la práctica?"
- `EntrevistaAI` - "¿Salir de la entrevista?"

---

## 📊 7. RESUMEN DE PANTALLAS

| Pantalla | Ruta | Acceso | Header Navegación |
|----------|------|--------|-------------------|
| Login | `Login` | Público | No |
| Register | `Register` | Público | No |
| Home | `Home` | Autenticado | No |
| Tarjetas de Estudio | `TarjetasDeEstudio` | Autenticado | Sí |
| Prueba Práctica | `PruebaPractica` | Autenticado | Sí |
| Práctica por Tipo | `QuestionTypePractice` | Autenticado | Sí |
| Práctica Específica | `SpecificTypePractice` | Autenticado | Sí |
| 20 Preguntas | `Random20Practice` | Autenticado | Sí |
| Entrevista AI | `EntrevistaAI` | Autenticado | Sí (durante práctica) |
| Vocabulario | `Vocabulario` | Autenticado | Sí |
| Examen | `Examen` | Autenticado | Sí |
| Explanation | `Explanation` | Autenticado | Modal |

---

## 🚀 8. FLUJO TÍPICO DE USO

### Flujo de Estudio
```
Login → Home → TarjetasDeEstudio → Subcategorias → StudyCards → Explanation
```

### Flujo de Práctica por Tipo
```
Login → Home → QuestionTypePractice → SpecificTypePractice → (práctica interactiva)
```

### Flujo de Práctica Aleatoria
```
Login → Home → PruebaPractica → RandomPractice → (práctica interactiva)
```

### Flujo de Examen Simulado
```
Login → Home → Random20Practice → (20 preguntas) → Resultados
```

### Flujo de Entrevista AI
```
Login → Home → EntrevistaAI → (14 preguntas con voz) → Resultados
```

---

**Última actualización:** Configuración actual de la app después de implementar:
- Autenticación con Firebase
- Práctica por tipo de pregunta
- Headers de navegación en pantallas de práctica
- Entrevista AI con navegación mejorada

