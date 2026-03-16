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

const questionsPath = path.resolve('./scripts/questions.json');
if (!fs.existsSync(questionsPath)) {
    console.error("No se encontró questions.json. Ejecuta extract_questions.js primero.");
    process.exit(1);
}

const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

const outQuestions = path.resolve('./src/assets/audio/questions');
const outAnswers = path.resolve('./src/assets/audio/answers');
const tempDir = path.resolve('./scripts/temp');

fs.mkdirSync(outQuestions, { recursive: true });
fs.mkdirSync(outAnswers, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

const silence1sPath = path.join(tempDir, 'silence_1s.mp3');
const silenceStartPath = path.join(tempDir, 'silence_start.mp3');
const silenceEndPath = path.join(tempDir, 'silence_end.mp3');

/**
 * 1. Generar audios de silencio ajustados para compensar el retardo de ElevenLabs
 */
async function generateSilence() {
  if (fs.existsSync(silence1sPath)) fs.unlinkSync(silence1sPath);
  if (fs.existsSync(silenceStartPath)) fs.unlinkSync(silenceStartPath);
  if (fs.existsSync(silenceEndPath)) fs.unlinkSync(silenceEndPath);
  
  console.log("Generando clips de silencio (1.5s inicio, 1s medio, 0.5s final)...");
  
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

  await makeSilence('1.0', silence1sPath);      // Entre repeticiones
  await makeSilence('1.5', silenceStartPath);   // Inicio
  await makeSilence('0.5', silenceEndPath);     // Final corto (ElevenLabs ya deja cola de silencio)
}

/**
 * 2. Descargar audio desde ElevenLabs (Velocidad normal 1.0)
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
  await new Promise(r => setTimeout(r, 600)); // Rate limit safety
}

/**
 * 3. Crear versiones lenta y rápida LOCALMENTE con FFMpeg (Ahorra Créditos)
 */
async function changeSpeed(inputPath, tempo, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .audioFilters(`atempo=${tempo}`)
          .save(outputPath)
          .on('end', resolve)
          .on('error', reject);
    });
}

/**
 * 4. Concatenar 3 velocidades con silencio intermedio
 */
async function concatSpeeds(outputPath) {
  const tempMedium = path.join(tempDir, 'medium.mp3');
  const tempSlow = path.join(tempDir, 'slow.mp3');
  const tempFast = path.join(tempDir, 'fast.mp3');

  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(silenceStartPath) // 0 -> 1.5s (Inicio)
      .input(tempMedium)       // 1
      .input(silence1sPath)     // 2 -> 1s (Entre)
      .input(tempSlow)         // 3
      .input(silence1sPath)     // 4 -> 1s (Entre)
      .input(tempFast)         // 5
      .input(silenceEndPath)   // 6 -> 0.5s (Final)
      .complexFilter([
         '[0:a][1:a][2:a][3:a][4:a][5:a][6:a]concat=n=7:v=0:a=1[out]'
      ])
      .map('[out]')
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });

  // Limpiar temporales
  fs.unlinkSync(tempMedium);
  fs.unlinkSync(tempSlow);
  fs.unlinkSync(tempFast);
}

const cleanForTTS = (text, isQuestion) => {
    let cleaned = typeof text === 'string' ? text : '';
    
    // 1. Número repetido en paréntesis: "Twenty-seven (27)" -> "Twenty-seven"
    cleaned = cleaned.replace(/\s*\(\d+\)/g, '');

    // 2. Pronunciación de U.S. deletreada: "U.S." -> "U. S."
    cleaned = cleaned.replace(/[()]/g, '');
    cleaned = cleaned.replace(/\bU\.S\./gi, 'U. S.');

    cleaned = cleaned.trim();
    if (isQuestion && !cleaned.endsWith('?')) {
        cleaned += '?';
    } else if (!isQuestion && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
        cleaned += '.';
    }
    return cleaned;
};

async function run() {
  await generateSilence();
  
  let manifest = {};
  const ids = Object.keys(questionsData).sort((a,b) => parseInt(a) - parseInt(b));

  for (const id of ids) {
    const item = questionsData[id];
    const idStr = id.padStart(3, '0');
    
    console.log(`\n🔊 Procesando Pregunta ID: ${idStr}`);

    const qText = cleanForTTS(item.questionEn, true);
    const aText = Array.isArray(item.answerEn) ? item.answerEn.map(a => cleanForTTS(a, false)).join(', ') : cleanForTTS(item.answerEn, false);

    const tempDownloaded = path.join(tempDir, 'downloaded.mp3');
    const tempMedium = path.join(tempDir, 'medium.mp3');
    const tempSlow = path.join(tempDir, 'slow.mp3');
    const tempFast = path.join(tempDir, 'fast.mp3');

    // --- 1. PREGUNTA ---
    const qOutPath = path.join(outQuestions, `q${idStr}_question.mp3`);
    console.log(`   Generando Pregunta (ElevenLabs): "${qText}"`);
    await downloadElevenLabs(qText, tempDownloaded);
    
    console.log(`   Creando velocidades localmente...`);
    await changeSpeed(tempDownloaded, 0.85, tempMedium); // Medio (0.85)
    await changeSpeed(tempDownloaded, 0.70, tempSlow);   // Lento (0.70)
    await changeSpeed(tempDownloaded, 1.15, tempFast);   // Rápido (1.15)
    
    await concatSpeeds(qOutPath);
    console.log(`   ✅ Guardado: q${idStr}_question.mp3`);
    if (fs.existsSync(tempDownloaded)) fs.unlinkSync(tempDownloaded);

    // --- 2. RESPUESTA ---
    const aOutPath = path.join(outAnswers, `q${idStr}_answer.mp3`);
    console.log(`   Generando Respuesta (ElevenLabs): "${aText}"`);
    await downloadElevenLabs(aText, tempDownloaded);
    
    console.log(`   Creando velocidades localmente...`);
    await changeSpeed(tempDownloaded, 0.85, tempMedium); // Medio (0.85)
    await changeSpeed(tempDownloaded, 0.70, tempSlow);   // Lento (0.70)
    await changeSpeed(tempDownloaded, 1.15, tempFast);   // Rápido (1.15)
    
    await concatSpeeds(aOutPath);
    console.log(`   ✅ Guardado: q${idStr}_answer.mp3`);
    if (fs.existsSync(tempDownloaded)) fs.unlinkSync(tempDownloaded);

    manifest[`q${idStr}`] = {
        question: `q${idStr}_question.mp3`,
        answer: `q${idStr}_answer.mp3`
    };
  }

  fs.writeFileSync(path.resolve('./src/assets/audio/audio_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log("\n🎉 ¡Todos los audios de ElevenLabs concatenados (Medio, Lento, Rápido) fueron generados!");
}

run();
