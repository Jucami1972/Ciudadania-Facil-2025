# Imágenes para Memoria Fotográfica

## Ubicación
Todas las imágenes para la funcionalidad de "Memoria Fotográfica" deben guardarse en esta carpeta:
```
src/assets/images/photo-memory/
```

## Sistema de Nombres

Las imágenes deben nombrarse usando el siguiente formato:

### Formato: `q{ID}.webp` (recomendado) o `q{ID}.png` o `q{ID}.jpg`

Donde `{ID}` es el número de la pregunta (con ceros a la izquierda para mantener 3 dígitos).

### Ejemplos:
- `q001.webp` - Para la pregunta con ID 1
- `q002.webp` - Para la pregunta con ID 2
- `q015.webp` - Para la pregunta con ID 15
- `q128.webp` - Para la pregunta con ID 128

## Formato de Imagen

- **Formato recomendado**: **WEBP** (mejor compresión y calidad) o PNG o JPG
- **Resolución recomendada**: Mínimo 800x600px, ideal 1200x900px o superior
- **Tamaño de archivo**: Optimizar para web/móvil (preferiblemente < 500KB por imagen)
- **Aspecto**: Horizontal (landscape) funciona mejor para las tarjetas

## Preguntas que Requieren Imágenes

Las siguientes preguntas del examen de ciudadanía se benefician especialmente de imágenes:

### Gobierno (Government)
- Q1: Forma de gobierno (bandera, símbolos)
- Q2: Constitución (documento, edificio del Capitolio)
- Q11: Declaración de Independencia (documento histórico)
- Q15: Ramas de gobierno (edificios: Capitolio, Casa Blanca, Corte Suprema)
- Q30, Q38, Q39: Funcionarios actuales (fotos oficiales)
- Q52: Corte Suprema (edificio)

### Historia (History)
- Q60: Enmiendas (documentos)
- Q75: Esclavitud (imágenes históricas)
- Q76: Guerra de Independencia (eventos históricos)
- Q82: Constitución 1787 (documento)
- Q90: Compra de Luisiana (mapa)
- Q95: Proclamación de Emancipación (documento)
- Q96: Guerra Civil (eventos históricos)
- Q115: 11 de septiembre (eventos)

### Símbolos y Festividades (Symbols & Holidays)
- Q96: Bandera (bandera americana)
- Q119: Capital (Washington D.C.)
- Q120: Estatua de la Libertad (monumento)
- Q121: Bandera - 13 rayas (bandera)
- Q122: Bandera - 50 estrellas (bandera)
- Q123: Himno nacional (partitura o evento)
- Q125: Día de la Independencia (celebraciones)
- Q127: Día de los Caídos (celebraciones)
- Q128: Día de los Veteranos (celebraciones)

## Cómo Agregar una Nueva Imagen

1. **Guarda la imagen** con el nombre `q{ID}.webp` (recomendado) o `q{ID}.png` o `q{ID}.jpg`
   - Ejemplo: Para la pregunta ID 1 → `q001.webp`
   - Ejemplo: Para la pregunta ID 52 → `q052.webp`
   - Ejemplo: Para la pregunta ID 120 → `q120.webp`

2. **Colócala en esta carpeta**: 
   ```
   src/assets/images/photo-memory/
   ```

3. **Actualiza el código** en `src/screens/practice/PhotoMemoryScreenModerno.tsx`:
   - Encuentra el objeto `imageMap` (línea ~43)
   - Descomenta o agrega la línea correspondiente:
   ```typescript
   const imageMap: Record<number, any> = {
     1: require('../../assets/images/photo-memory/q001.webp'),
     2: require('../../assets/images/photo-memory/q002.webp'),
     // ... agrega más según tengas imágenes
   };
   ```

4. **Asegúrate de que la pregunta esté en el array `photoCards`** con el mismo ID

## Notas Importantes

- Las imágenes deben ser relevantes y educativas
- Evita imágenes con derechos de autor sin permiso
- Usa imágenes de alta calidad pero optimizadas
- Las imágenes se cargan automáticamente basándose en el ID de la pregunta

