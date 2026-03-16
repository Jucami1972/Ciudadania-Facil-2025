import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { config } from 'dotenv';

config({ path: path.resolve('./.env') });

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Cargar variables del .env si dotenv está disponible
let OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("Error: Falta OPENAI_API_KEY o EXPO_PUBLIC_OPENAI_API_KEY en tu entorno");
  process.exit(1);
}

OPENAI_API_KEY = OPENAI_API_KEY.trim().replace(/[\n\r]/g, '');

const questionsPath = path.resolve('./scripts/questions.json');
if (!fs.existsSync(questionsPath)) {
    console.error("No se encontró questions.json. Ejecuta extract_questions.js primero.");
    process.exit(1);
}

const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

const outQuestions = path.resolve('./src/assets/audio/questions');
const outAnswers = path.resolve('./src/assets/audio/answers');
const tempDir = path.resolve('./scripts/temp');

// Crear carpetas si no existen
fs.mkdirSync(outQuestions, { recursive: true });
fs.mkdirSync(outAnswers, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

const silencePath = path.join(tempDir, 'silence.mp3');

/**
 * 1. Generar audio de silencio corto (300ms)
 */
async function generateSilence() {
  if (fs.existsSync(silencePath)) return;
  
  console.log("Generando clip de silencio...");
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input('anullsrc=r=44100:c=2')
      .inputFormat('lavfi')
      .outputOptions('-t 0.3') // 300ms
      .save(silencePath)
      .on('end', resolve)
      .on('error', reject);
  });
}

/**
 * 2. Generar un solo audio desde OpenAI
 */
async function downloadAudio(text, speed, outputPath) {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: 'alloy', // Puedes cambiar a 'alloy', 'echo', etc.
      input: text,
      speed: speed
    })
  });
  
  if (!response.ok) {
     const err = await response.text();
     throw new Error(`OpenAI Error: ${err}`);
  }
  
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  await new Promise(r => setTimeout(r, 800)); // Rate limit buffer
}

/**
 * 3. Concatenar 3 velocidades con silencio intermedio
 */
async function concatSpeeds(outputPath) {
  const tempMedium = path.join(tempDir, 'medium.mp3');
  const tempSlow = path.join(tempDir, 'slow.mp3');
  const tempFast = path.join(tempDir, 'fast.mp3');

  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(silencePath)   // 0
      .input(tempMedium)    // 1
      .input(silencePath)   // 2
      .input(tempSlow)      // 3
      .input(silencePath)   // 4
      .input(tempFast)      // 5
      .input(silencePath)   // 6
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
    // Asegurarse de quitar paréntesis si dice (U.S.)
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

    const tempMedium = path.join(tempDir, 'medium.mp3');
    const tempSlow = path.join(tempDir, 'slow.mp3');
    const tempFast = path.join(tempDir, 'fast.mp3');

    // --- 1. PREGUNTA ---
    const qOutPath = path.join(outQuestions, `q${idStr}_question.mp3`);
    if (!fs.existsSync(qOutPath)) {
        console.log(`   Generando Pregunta: ${qText}`);
        await downloadAudio(qText, 1.00, tempMedium);
        await downloadAudio(qText, 0.85, tempSlow);
        await downloadAudio(qText, 1.15, tempFast);
        await concatSpeeds(qOutPath);
        console.log(`   ✅ Guardado: q${idStr}_question.mp3`);
    } else {
        console.log(`   ⏭ Saltando q${idStr}_question.mp3 (Ya existe)`);
    }

    // --- 2. RESPUESTA ---
    const aOutPath = path.join(outAnswers, `q${idStr}_answer.mp3`);
    if (!fs.existsSync(aOutPath)) {
        console.log(`   Generando Respuesta: ${aText}`);
        await downloadAudio(aText, 1.00, tempMedium);
        await downloadAudio(aText, 0.85, tempSlow);
        await downloadAudio(aText, 1.15, tempFast);
        await concatSpeeds(aOutPath);
        console.log(`   ✅ Guardado: q${idStr}_answer.mp3`);
    } else {
        console.log(`   ⏭ Saltando q${idStr}_answer.mp3 (Ya existe)`);
    }

    manifest[`q${idStr}`] = {
        question: `q${idStr}_question.mp3`,
        answer: `q${idStr}_answer.mp3`
    };
  }

  fs.writeFileSync(path.resolve('./src/assets/audio/audio_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log("\n🎉 ¡Todos los audios concatenados (Medio, Lento, Rápido) fueron generados!");
}

run();
