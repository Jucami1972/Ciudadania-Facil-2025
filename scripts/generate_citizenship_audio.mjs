import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Utiliza la variable que el usuario ya tiene en su .env y eliminas posibles espacios/saltos de línea ocultos
let OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("Error: Falta OPENAI_API_KEY o EXPO_PUBLIC_OPENAI_API_KEY en tu archivo .env");
  process.exit(1);
}

OPENAI_API_KEY = OPENAI_API_KEY.trim().replace(/[\n\r]/g, '');

const questionsPath = path.resolve('./parsed_pdf.json');
if (!fs.existsSync(questionsPath)) {
    console.error("No se encontró parsed_pdf.json. Ejecuta este script desde la raíz del proyecto.");
    process.exit(1);
}

const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

const outQuestions = path.resolve('./src/assets/audio/questions');
const outAnswers = path.resolve('./src/assets/audio/answers');

// Crear carpetas si no existen
fs.mkdirSync(outQuestions, { recursive: true });
fs.mkdirSync(outAnswers, { recursive: true });

async function generateAudio(text, outputPath) {
  // CONFIGURADO PARA REEMPLAZAR SIEMPRE LOS AUDIOS
  console.log(`Generando y reemplazando audio para: ${path.basename(outputPath)}...`);
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || 'tts-1',
      voice: process.env.OPENAI_TTS_VOICE || 'alloy', // Voces disponibles: alloy, echo, fable, onyx, nova, shimmer
      input: text,
      speed: parseFloat(process.env.OPENAI_TTS_SPEED || '0.90') // Velocidad ligeramente menor (90%) para fácil comprensión
    })
  });
  
  if (!response.ok) {
     const err = await response.text();
     console.error(`Error generando audio: ${err}`);
     process.exit(1);
  }
  
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  
  // AUMENTAR EL VOLUMEN (Boost +50%)
  // OpenAI no tiene control de volumen en su API, así que lo amplificamos localmente justo al descargarlo
  const tempPath = outputPath.replace('.mp3', '_temp.mp3');
  fs.renameSync(outputPath, tempPath);
  
  await new Promise((resolve, reject) => {
    ffmpeg(tempPath)
      .audioFilters('volume=1.5') // Aumentar en 150%
      .save(outputPath)
      .on('end', () => {
         fs.unlinkSync(tempPath); // Borrar el temporal
         resolve();
      })
      .on('error', (err) => {
         console.error('Error aumentando volumen:', err);
         reject(err);
      });
  });
  
  // Pausa de 1.5 segundos para no saturar los límites de la API de OpenAI (Rate Limits)
  await new Promise(r => setTimeout(r, 1500)); 
}

async function run() {
  let manifest = {};

  for (let i = 1; i <= 128; i++) {
    const item = questionsData[i.toString()];
    if (!item) continue;
    
    // Formato: q001_question.mp3
    const idStr = i.toString().padStart(3, '0');
    
    // Función ayudante para limpiar texto para TTS
    const cleanForTTS = (text, isQuestion) => {
        let cleaned = typeof text === 'string' ? text : '';
        // 1. Quitar paréntesis pero mantener el contenido para que lo lea ("(U.S.)" -> "U.S.")
        cleaned = cleaned.replace(/[()]/g, '');
        // 2. Asegurar buena pronunciación de U.S. (Aveces lee "us")
        cleaned = cleaned.replace(/\bU\.S\./g, 'United States');
        
        // 3. Forzar entonación de pregunta o de afirmación final
        cleaned = cleaned.trim();
        if (isQuestion && !cleaned.endsWith('?')) {
            cleaned += '?';
        } else if (!isQuestion && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
            cleaned += '.';
        }
        return cleaned;
    };
    
    // 1. AUDIO DE LA PREGUNTA
    const qEnText = cleanForTTS(item.questionEn, true);
    const qEnPath = path.join(outQuestions, `q${idStr}_question.mp3`);
    await generateAudio(qEnText, qEnPath);
    
    // 2. AUDIO DE LA RESPUESTA
    // Separamos arrays por puntos y puntos suspensivos para forzar pausas largas artificiales
    let aEnText = Array.isArray(item.answerEn) ? item.answerEn.map(a => cleanForTTS(a, false)).join(' ... ') : cleanForTTS(item.answerEn, false);
    
    // Log para depuración
    console.log(`[Q${idStr}] Preparado Respuesta: "${aEnText}"`);
    
    const aEnPath = path.join(outAnswers, `q${idStr}_answer.mp3`);
    await generateAudio(aEnText, aEnPath);
    
    manifest[`q${idStr}`] = {
        question: `q${idStr}_question.mp3`,
        answer: `q${idStr}_answer.mp3`
    };
  }

  fs.writeFileSync(path.resolve('./src/assets/audio/audio_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log("¡Los 256 mp3 fueron generados, reemplazados con éxito!");
}

run();
