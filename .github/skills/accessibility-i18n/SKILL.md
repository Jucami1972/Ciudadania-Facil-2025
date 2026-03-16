---
name: accessibility-i18n
description: 'Especialista en accesibilidad e internacionalización. USE WHEN: mejorar accesibilidad, agregar accessibilityLabel, implementar i18n, traducir textos, soporte para lectores de pantalla, VoiceOver, TalkBack, contraste de colores, tamaños de fuente dinámicos, soporte RTL, localización ES/EN, cambiar idioma, bilingüe, traducciones. DO NOT USE FOR: diseño visual general, Firebase, testing.'
---

# Accessibility & i18n — Ciudadanía Fácil 2025

## Rol
Eres especialista en accesibilidad (a11y) e internacionalización para React Native. La app es bilingüe español/inglés y sirve a una audiencia diversa preparándose para el examen de ciudadanía.

## Estado Actual
- **Idioma**: Bilingüe EN/ES con datos hardcodeados (no usa i18n library)
- **Accesibilidad**: Básica, sin `accessibilityLabel` consistente
- **Utilidades**: `src/utils/accessibility.ts` existe pero uso limitado

## Accesibilidad en React Native

### Props esenciales
```typescript
// ✅ Botones y touchables
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Siguiente pregunta"
  accessibilityHint="Avanza a la siguiente pregunta del examen"
  accessibilityState={{ disabled: isLastQuestion }}
>

// ✅ Imágenes decorativas
<Image
  accessible={false}
  accessibilityElementsHidden={true}
  importantForAccessibility="no"
/>

// ✅ Imágenes informativas
<Image
  accessible={true}
  accessibilityRole="image"
  accessibilityLabel="Bandera de Estados Unidos"
/>

// ✅ Texto informativo
<Text accessibilityRole="header">Gobierno Americano</Text>

// ✅ Progreso
<View
  accessible={true}
  accessibilityRole="progressbar"
  accessibilityValue={{ min: 0, max: 100, now: progress }}
  accessibilityLabel={`Progreso: ${progress}%`}
/>
```

### Roles de accesibilidad útiles
- `button` — Elementos presionables
- `header` — Títulos de sección
- `link` — Navegación
- `image` — Imágenes con significado
- `progressbar` — Barras de progreso
- `text` — Texto informativo
- `alert` — Mensajes importantes
- `tab` — Pestañas de navegación
- `checkbox` / `switch` — Controles de toggle

### Contraste
- Texto normal: ratio mínimo **4.5:1**
- Texto grande (≥18px bold o ≥24px): ratio mínimo **3:1**
- Verificar con los colores del designSystem:
  - `text.primary` (#111827) sobre blanco: ✅ ~16:1
  - `text.secondary` (#6B7280) sobre blanco: ✅ ~5.5:1
  - `text.tertiary` (#9CA3AF) sobre blanco: ⚠️ ~3.5:1 (solo texto grande)

### Touch Targets
```typescript
// ✅ Mínimo 44x44 para accesibilidad
const touchTarget = {
  minWidth: 44,
  minHeight: 44,
  justifyContent: 'center',
  alignItems: 'center',
};
```

## Internacionalización

### Patrón actual (hardcoded bilingüe)
```typescript
// Las preguntas tienen campos _En y _Es
{ questionEn: "...", questionEs: "...", answerEn: "...", answerEs: "..." }

// Las pantallas tienen estado de idioma
const [language, setLanguage] = useState<'en' | 'es'>('en');
```

### Strings de UI
Actualmente los textos de UI están hardcodeados en español. Para futura i18n:
```typescript
// Patrón recomendado si se implementa i18n
const strings = {
  es: {
    home: { title: 'Inicio', study: 'Estudiar', practice: 'Practicar' },
    exam: { start: 'Comenzar Examen', result: 'Resultado' },
  },
  en: {
    home: { title: 'Home', study: 'Study', practice: 'Practice' },
    exam: { start: 'Start Exam', result: 'Result' },
  },
};
```

## Procedimiento

1. **Auditar** accesibilidad de la pantalla con VoiceOver/TalkBack
2. **Agregar** `accessibilityLabel` a todos los touchables
3. **Usar** `accessibilityRole` apropiado para cada elemento
4. **Verificar** contraste con los colores del designSystem
5. **Asegurar** touch targets ≥ 44x44px
6. **Probar** navegación completa solo con lector de pantalla
