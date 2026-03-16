import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// Configurar la ruta de ffmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Aumenta el volumen de todos los archivos MP3 en un directorio
 * @param {string} targetDir - Directorio con los archivos de audio
 * @param {number} boostFactor - Factor de aumento (ej. 2.0 es 200%, 3.0 es 300%)
 */
async function boostVolume(targetDir, boostFactor = 2.5) {
  try {
    const files = fs.readdirSync(targetDir);
    const mp3Files = files.filter(file => file.endsWith('.mp3'));

    console.log(`\n🔊 Encontrados ${mp3Files.length} audios MP3 en ${targetDir}`);
    console.log(`🚀 Aumentando volumen en un factor de ${boostFactor}x...`);

    let processedCount = 0;

    for (const file of mp3Files) {
      const inputPath = path.join(targetDir, file);
      const tempPath = path.join(targetDir, `temp_${file}`);

      try {
        await new Promise((resolve, reject) => {
          ffmpeg(inputPath)
            .audioFilters(`volume=${boostFactor}`)
            .save(tempPath)
            .on('end', () => {
              // Reemplazar el archivo original con el archivo con mayor volumen
              fs.renameSync(tempPath, inputPath);
              processedCount++;
              if (processedCount % 10 === 0) {
                  process.stdout.write(`\r✅ Procesados ${processedCount}/${mp3Files.length} audios... `);
              }
              resolve();
            })
            .on('error', (err) => {
              console.error(`\n❌ Error procesando ${file}:`, err);
              // Limpiar archivo temporal si falla
              if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
              reject(err);
            });
        });
      } catch (err) {
        // Continuar con el siguiente si uno falla
        console.error(`Saltando ${file} debido a un error.`);
      }
    }

    console.log(`\n\n🎉 ¡Proceso completado! Se aumentó el volumen de ${processedCount} audios.`);
  } catch (err) {
    console.error(`❌ Error fatal procesando directorio ${targetDir}:`, err);
  }
}

// Ejecutar el script (puedes ajustar el factor de volumen, 2.5 suele ser bueno para audios bajos)
const answersDir = path.resolve('./src/assets/audio/answers');
const questionsDir = path.resolve('./src/assets/audio/questions');

async function main() {
    console.log("Iniciando proceso de aumento de volumen...");
    // Aumentar volumen de las respuestas
    if (fs.existsSync(answersDir)) {
        await boostVolume(answersDir, 2.5);
    }
    
    // Si necesitas aumentar las preguntas también, descomenta la siguiente línea:
    // if (fs.existsSync(questionsDir)) {
    //     await boostVolume(questionsDir, 2.0); 
    // }
}

main();
