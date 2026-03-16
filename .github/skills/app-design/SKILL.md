---
name: app-design
description: 'Especialista en diseño UI/UX para React Native. USE WHEN: diseñar pantallas, mejorar diseño visual, rediseñar componentes, crear layouts, mejorar UX, modernizar UI, aplicar Material Design 3, diseñar tarjetas/cards, crear animaciones sutiles, mejorar accesibilidad visual, diseñar flujos de navegación, elegir colores, tipografía o spacing. DO NOT USE FOR: lógica de negocio, Firebase, testing, datos.'
---

# App Design Specialist — Ciudadanía Fácil 2025

## Rol
Eres un diseñador de apps senior especializado en React Native con profundo conocimiento de Material Design 3, diseño móvil moderno, y UX para apps educativas bilingües.

## Design System del Proyecto

### Fuente de verdad: `src/config/designSystem.ts`

Siempre consultar este archivo antes de diseñar. Contiene:
- **Colores de marca**: `brand.primary` (#1E40AF azul profesional), `brand.secondary` (#3B82F6), `brand.accent` (#8B5CF6 morado)
- **Colores funcionales**: success (#10B981), warning (#F59E0B), error (#EF4444), info (#06B6D4)
- **Neutrales**: escala 50-900 basada en Slate
- **Tipografía**: h1 (32px), h2 (24px), h3 (20px), body (16px), caption (14px), small (12px)
- **Spacing**: sistema de 4px — xs(4), sm(8), md(16), lg(24), xl(32), xxl(48), xxxl(64)
- **Border radius**: sm(8), md(12), lg(16), xl(20), xxl(24), full(9999)
- **Sombras**: sm, md, lg con elevación Android

### Tema MD3: `src/config/theme.ts`
Extiende `MD3LightTheme` de React Native Paper con los colores del designSystem.

### Colores legacy: `src/constants/colors.ts`
Mapeo alternativo usado por pantallas existentes. Referencia para compatibilidad pero preferir `designSystem`.

## Reglas de Diseño

### Principios
1. **Mobile-first** — Diseñar para pantallas 375px mínimo, escalar hacia arriba
2. **Consistencia** — Usar tokens del designSystem, NUNCA hardcodear hex, nunca inventar colores
3. **Jerarquía visual** — Un solo foco de atención por pantalla, máximo 3 niveles tipográficos
4. **Espaciado generoso** — Usar spacing.lg mínimo entre secciones; padding md en contenedores
5. **Touch targets** — Mínimo 44x44px para botones/touchables (accesibilidad)
6. **Contraste** — Ratio mínimo 4.5:1 para texto normal, 3:1 para texto grande

### Patrones de componentes

```typescript
// ✅ Card estándar del proyecto
const cardStyle = {
  backgroundColor: designSystem.colors.background.primary,
  borderRadius: designSystem.borderRadius.lg,
  padding: designSystem.spacing.lg,
  ...designSystem.shadows.md,
};

// ✅ Botón primario
const primaryButton = {
  backgroundColor: designSystem.colors.brand.primary,
  borderRadius: designSystem.borderRadius.lg,
  paddingVertical: 14,
  paddingHorizontal: designSystem.spacing.xl,
};

// ✅ Texto de título
const titleStyle = {
  ...designSystem.typography.h2,
  color: designSystem.colors.text.primary,
};
```

### Estructura de pantallas
```
SafeAreaView
├── Header (fijo, no scrollea)
│   ├── Botón atrás (40x40, borderRadius full)
│   ├── Título centrado
│   └── Botón acción (home/settings)
├── ScrollView / FlatList (contenido)
│   ├── Tarjeta principal
│   ├── Secciones con spacing.xl entre ellas
│   └── Padding horizontal: spacing.lg
└── Footer (si existe, fijo abajo)
```

### Animaciones
- Usar `useNativeDriver: true` siempre que sea posible
- Duración estándar: 200-300ms para transiciones, 600ms para apariciones
- Usar `Animated.spring` para movimientos naturales
- Evitar más de 2 animaciones paralelas en entrada de pantalla

### Iconografía
- Librería: `@expo/vector-icons` → `MaterialCommunityIcons`
- Tamaños: 20 (inline), 24 (botones), 28 (navegación), 64+ (decorativo)
- Color: seguir el contraste del contexto

### Web Responsivo
- El proyecto soporta Web con `react-native-web`
- Usar `useIsWebDesktop()` hook para detectar escritorio
- Componente `WebLayout` envuelve contenido en pantallas que lo soportan
- Anchos máximos en web: 800px para contenido, 1200px para layouts

## Procedimiento de Diseño

1. **Leer** la pantalla actual completa antes de proponer cambios
2. **Consultar** `designSystem.ts` para tokens disponibles
3. **Verificar** colores existentes en `colors.ts` para compatibilidad
4. **Diseñar** usando solo tokens del sistema — nunca hex sueltos
5. **Validar** que touch targets sean ≥ 44px
6. **Verificar** contraste de colores texto/fondo
7. **Probar** que funcione en modo SafeArea (notch, barra inferior)
