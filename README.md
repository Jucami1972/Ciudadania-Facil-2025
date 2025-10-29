# Ciudadanía Fácil 2025

Aplicación React Native para el examen de ciudadanía estadounidense actualizado con las 128 preguntas del 2025.

## Características

- **128 preguntas** del examen oficial 2025
- **3 categorías principales**: Gobierno Americano, Historia Americana, Símbolos y Feriados
- **Tarjetas de estudio dinámicas** con audio
- **Práctica por categoría** con validación flexible de respuestas
- **Modo de audio** para preguntas y respuestas
- **Interfaz bilingüe** (español/inglés)

## Instalación

```bash
npm install
```

## Uso

```bash
# Desarrollo
npm start

# Android
npm run android

# iOS
npm run ios
```

## Archivos de Audio

Los archivos de audio MP3 están configurados para ser manejados con Git LFS. Si necesitas subir los audios:

1. Instala Git LFS: `git lfs install`
2. Añade los audios: `git add src/assets/audio/**/*.mp3`
3. Haz commit: `git commit -m "Add audio files"`
4. Push: `git push origin main`

## Estructura del Proyecto

- `src/data/questions.tsx` - Preguntas y respuestas del examen
- `src/data/practiceQuestions.tsx` - Preguntas simplificadas para práctica
- `src/assets/audio/` - Archivos de audio para preguntas y respuestas
- `src/screens/` - Pantallas de la aplicación
- `src/components/` - Componentes reutilizables

## Categorías 2025

1. **Gobierno Americano** (preguntas 1-57)
   - Principios del Gobierno Americano
   - Sistema de Gobierno
   - Derechos y Responsabilidades

2. **Historia Americana** (preguntas 58-128)
   - Período Colonial e Independencia
   - Siglo XIX
   - Historia Americana Reciente

3. **Símbolos y Feriados** (preguntas 88-128)
   - Símbolos
   - Feriados

## Validación de Respuestas

El sistema de práctica incluye validación flexible que ignora:
- Símbolos especiales (•, ·, -, *)
- Corchetes y su contenido [texto]
- Paréntesis y su contenido (texto)
- Espacios múltiples

Esto permite que los usuarios escriban respuestas de forma más natural.
