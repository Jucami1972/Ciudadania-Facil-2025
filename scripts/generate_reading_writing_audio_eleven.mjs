import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { config } from 'dotenv';

config({ path: path.resolve('./.env') });

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

let ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error("Error: Falta ELEVENLABS_API_KEY en tu archivo .env");
  process.exit(1);
}

ELEVENLABS_API_KEY = ELEVENLABS_API_KEY.trim().replace(/[\n\r]/g, '');

// Cargar Datos
const questionsPath = path.resolve('./scripts/reading_writing_questions.json');
if (!fs.existsSync(questionsPath)) {
    console.error("No se encontró reading_writing_questions.json. Ejecuta extract_reading_writing.js primero.");
    process.exit(1);
}

const items = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

// Carpetas de Salida
const outDir = path.resolve('./src/assets/audio/reading_writing');
const tempDir = path.resolve('./scripts/temp_rw');

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

const silenceStartPath = path.join(tempDir, 'silence_start.mp3');
const silenceEndPath = path.join(tempDir, 'silence_end.mp3');

/**
 * 1. Generar audios de silencio ajustados
 */
async function generateSilence() {
  if (fs.existsSync(silenceStartPath)) fs.unlinkSync(silenceStartPath);
  if (fs.existsSync(silenceEndPath)) fs.unlinkSync(silenceEndPath);
  
  console.log("Generando clips de silencio (1.5s inicio, 0.5s final)...");
  
  const makeSilence = (duration, out) => new Promise((resolve, reject) => {
    ffmpeg()
      .input('anullsrc=r=44100:cl=stereo')
      .inputFormat('lavfi')
      .outputOptions(`-t ${duration}`)
      .save(out)
      .on('end', resolve)
      .on('error', () => {
          ffmpeg()
            .input('anullsrc')
            .inputFormat('lavfi')
            .outputOptions(`-t ${duration}`)
            .save(out)
            .on('end', resolve)
            .on('error', reject);
      });
  });

  await makeSilence('1.5', silenceStartPath);   // Inicio
  await makeSilence('0.5', silenceEndPath);     // Final
}

/**
 * 2. Descargar audio desde ElevenLabs
 */
async function downloadElevenLabs(text, outputPath) {
  const VOICE_ID = "pNInz6obpgDQGcFmaJgB"; // Adam
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
         stability: 0.55,
         similarity_boost: 0.8,
         style: 0.2,
         use_speaker_boost: true
      }
    })
  });
  
  if (!response.ok) {
     const err = await response.text();
     throw new Error(`ElevenLabs Error: ${err}`);
  }
  
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
}

/**
 * 3. Concatenar Silencios con el Audio original
 */
function concatPadding(rawInput, finalOutput) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(silenceStartPath)
      .input(rawInput)
      .input(silenceEndPath)
      .complexFilter([
        '[0:0][1:0][2:0]concat=n=3:v=0:a=1[out]'
      ])
      .map('[out]')
      .save(finalOutput)
      .on('end', () => {
        resolve();
      })
      .on('error', (err) => {
        console.error("FFmpeg Error:", err);
        reject(err);
      });
  });
}

/**
 * Ejecución Principal
 */
async function main() {
  await generateSilence();

  for (const item of items) {
    const id = item.id;
    const padId = id.toString().padStart(3, '0');
    
    // 1. Audio de Lectura (Reading): usar questionEn
    if (item.questionEn) {
      const readingOut = path.join(outDir, `rw${padId}_reading.mp3`);
      const tempRaw = path.join(tempDir, `temp_raw_reading.mp3`);
      
      console.log(`🔊 Procesando Lectura ID: ${padId}...`);
      try {
        await downloadElevenLabs(item.questionEn, tempRaw);
        await concatPadding(tempRaw, readingOut);
        if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw);
        console.log(`   ✅ rw${padId}_reading.mp3 Generado.`);
      } catch (err) {
        console.error(`   ❌ Error en Lectura ${padId}:`, err.message);
      }
    }

    // 2. Audio de Escritura (Writing): usar answerEn
    if (item.answerEn) {
      const writingOut = path.join(outDir, `rw${padId}_writing.mp3`);
      const tempRaw = path.join(tempDir, `temp_raw_writing.mp3`);
      
      console.log(`🔊 Procesando Escritura ID: ${padId}...`);
      try {
        await downloadElevenLabs(item.answerEn, tempRaw);
        await concatPadding(tempRaw, writingOut);
        if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw);
        console.log(`   ✅ rw${padId}_writing.mp3 Generado.`);
      } catch (err) {
        console.error(`   ❌ Error en Escritura ${padId}:`, err.message);
      }
    }
  }

  console.log("\n🎉 Generación de Audio Completa.");
  // Limpieza
  if (fs.existsSync(silenceStartPath)) fs.unlinkSync(silenceStartPath);
  if (fs.existsSync(silenceEndPath)) fs.unlinkSync(silenceEndPath);
  if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
}

main().catch(console.error);
