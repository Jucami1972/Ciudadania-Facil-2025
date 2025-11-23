#!/usr/bin/env node

/**
 * Script para optimizar assets (imágenes y audio)
 * 
 * Uso:
 *   node scripts/optimize-assets.js
 * 
 * Requisitos:
 *   - sharp-cli instalado globalmente: npm install -g sharp-cli
 *   - ffmpeg instalado (para audio, opcional)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = path.join(__dirname, '../src/assets');
const IMAGES_DIR = path.join(ASSETS_DIR, 'images');
const AUDIO_DIR = path.join(ASSETS_DIR, 'audio');
const OPTIMIZED_DIR = path.join(ASSETS_DIR, 'optimized');

// Colores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkDependencies() {
  log('Verificando dependencias...', 'blue');
  
  try {
    execSync('sharp --version', { stdio: 'ignore' });
    log('✓ sharp-cli instalado', 'green');
  } catch (error) {
    log('✗ sharp-cli no encontrado. Instala con: npm install -g sharp-cli', 'red');
    return false;
  }
  
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    log('✓ ffmpeg instalado', 'green');
  } catch (error) {
    log('⚠ ffmpeg no encontrado. La optimización de audio se omitirá.', 'yellow');
  }
  
  return true;
}

function optimizeImages() {
  log('\n📸 Optimizando imágenes...', 'blue');
  
  if (!fs.existsSync(IMAGES_DIR)) {
    log('⚠ Directorio de imágenes no encontrado', 'yellow');
    return;
  }
  
  const optimizedImagesDir = path.join(OPTIMIZED_DIR, 'images');
  if (!fs.existsSync(optimizedImagesDir)) {
    fs.mkdirSync(optimizedImagesDir, { recursive: true });
  }
  
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
  const images = [];
  
  function findImages(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findImages(filePath);
      } else if (imageExtensions.some(ext => file.toLowerCase().endsWith(ext))) {
        images.push(filePath);
      }
    });
  }
  
  findImages(IMAGES_DIR);
  
  if (images.length === 0) {
    log('⚠ No se encontraron imágenes para optimizar', 'yellow');
    return;
  }
  
  log(`Encontradas ${images.length} imágenes`, 'blue');
  
  images.forEach((imagePath, index) => {
    try {
      const relativePath = path.relative(IMAGES_DIR, imagePath);
      const outputPath = path.join(optimizedImagesDir, relativePath);
      const outputDir = path.dirname(outputPath);
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Convertir a WebP con calidad 80
      const command = `sharp -i "${imagePath}" -o "${outputPath.replace(/\.[^.]+$/, '.webp')}" --webp --quality 80`;
      execSync(command, { stdio: 'ignore' });
      
      log(`✓ [${index + 1}/${images.length}] ${path.basename(imagePath)}`, 'green');
    } catch (error) {
      log(`✗ Error optimizando ${path.basename(imagePath)}: ${error.message}`, 'red');
    }
  });
  
  log(`\n✅ ${images.length} imágenes optimizadas en ${optimizedImagesDir}`, 'green');
  log('⚠ Revisa las imágenes optimizadas antes de reemplazar las originales', 'yellow');
}

function optimizeAudio() {
  log('\n🎵 Optimizando audio...', 'blue');
  
  if (!fs.existsSync(AUDIO_DIR)) {
    log('⚠ Directorio de audio no encontrado', 'yellow');
    return;
  }
  
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
  } catch (error) {
    log('⚠ ffmpeg no disponible. Saltando optimización de audio.', 'yellow');
    return;
  }
  
  const optimizedAudioDir = path.join(OPTIMIZED_DIR, 'audio');
  if (!fs.existsSync(optimizedAudioDir)) {
    fs.mkdirSync(optimizedAudioDir, { recursive: true });
  }
  
  const audioFiles = fs.readdirSync(AUDIO_DIR)
    .filter(file => file.toLowerCase().endsWith('.mp3'))
    .map(file => path.join(AUDIO_DIR, file));
  
  if (audioFiles.length === 0) {
    log('⚠ No se encontraron archivos de audio para optimizar', 'yellow');
    return;
  }
  
  log(`Encontrados ${audioFiles.length} archivos de audio`, 'blue');
  log('⚠ La optimización de audio puede tardar mucho tiempo', 'yellow');
  log('⚠ Considera optimizar solo archivos específicos si es necesario', 'yellow');
  
  // Nota: La optimización de audio se omite por defecto debido al tiempo que toma
  // Descomenta el siguiente código si quieres optimizar audio:
  /*
  audioFiles.forEach((audioPath, index) => {
    try {
      const outputPath = path.join(optimizedAudioDir, path.basename(audioPath).replace('.mp3', '.opus'));
      const command = `ffmpeg -i "${audioPath}" -c:a libopus -b:a 64k "${outputPath}"`;
      execSync(command, { stdio: 'ignore' });
      log(`✓ [${index + 1}/${audioFiles.length}] ${path.basename(audioPath)}`, 'green');
    } catch (error) {
      log(`✗ Error optimizando ${path.basename(audioPath)}: ${error.message}`, 'red');
    }
  });
  */
}

function generateReport() {
  log('\n📊 Generando reporte...', 'blue');
  
  const report = {
    timestamp: new Date().toISOString(),
    images: {
      original: IMAGES_DIR,
      optimized: path.join(OPTIMIZED_DIR, 'images'),
    },
    audio: {
      original: AUDIO_DIR,
      optimized: path.join(OPTIMIZED_DIR, 'audio'),
    },
    nextSteps: [
      '1. Revisa las imágenes optimizadas en src/assets/optimized/images/',
      '2. Compara el tamaño de archivos originales vs optimizados',
      '3. Si estás satisfecho, reemplaza las originales con las optimizadas',
      '4. Actualiza las referencias en el código si cambiaste extensiones (.png → .webp)',
    ],
  };
  
  const reportPath = path.join(OPTIMIZED_DIR, 'optimization-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`✅ Reporte guardado en ${reportPath}`, 'green');
}

function main() {
  log('🚀 Iniciando optimización de assets...\n', 'blue');
  
  if (!checkDependencies()) {
    log('\n❌ Faltan dependencias. Instala las dependencias requeridas.', 'red');
    process.exit(1);
  }
  
  if (!fs.existsSync(OPTIMIZED_DIR)) {
    fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
  }
  
  optimizeImages();
  optimizeAudio();
  generateReport();
  
  log('\n✅ Optimización completada!', 'green');
  log('⚠ Revisa los archivos optimizados antes de usarlos en producción.', 'yellow');
}

if (require.main === module) {
  main();
}

module.exports = { optimizeImages, optimizeAudio };

