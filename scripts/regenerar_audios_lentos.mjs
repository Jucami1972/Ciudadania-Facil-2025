import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// Cargar variables del .env
config({ path: path.resolve('./.env') });

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

let OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("Error: Falta OPENAI_API_KEY en tu archivo .env");
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

// La nueva configuración solicitada por el usuario
const VOICE_SPEED = 0.87; // Velocidad ajustada según petición

async function generateAudio(text, outputPath) {
  if (fs.existsSync(outputPath)) {
    console.log(`Ya existe, saltando: ${path.basename(outputPath)}`);
    return;
  }

  console.log(`Generando (Speed: ${VOICE_SPEED}x, EQ Studio): ${path.basename(outputPath)}...`);
  
  const maxRetries = 3;
  let response;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: 'echo', // Forzar la voz "echo" solicitada
          input: text,
          speed: VOICE_SPEED
        }),
        signal: AbortSignal.timeout(60000) // 60 segundos de timeout
      });
      break;
    } catch (e) {
      if (attempt === maxRetries) throw e;
      console.log(`Fallo intento ${attempt}, reintentando en 3s...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  if (!response.ok) {
     const err = await response.text();
     console.error(`Error de OpenAI: ${err}`);
     process.exit(1);
  }
  
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  
  // ECUALIZACIÓN PROFESIONAL (FFMPEG) APLICADA A LA VOZ ECHO
  // 1. highpass: Elimina ruidos graves y retumbos sub-graves.
  // 2. equalizer (300Hz): Reduce -3dB en frecuencias bajas/medias para quitar el sonido "encajonado" ("boxiness").
  // 3. equalizer (4000Hz): Sube +3.5dB para dar "presencia" y "brillo" a la dicción (hace las palabras más claras).
  // 4. acompressor: Actúa como un nivelador automático, haciendo que las partes bajitas suenen un poco más fuertes.
  // 5. loudnorm: Estándar de la industria (Podcast/YouTube) que eleva inteligentemente el volumen a -14 LUFS sin distorsionar.
  const tempPath = outputPath.replace('.mp3', '_temp.mp3');
  fs.renameSync(outputPath, tempPath);

  await new Promise((resolve, reject) => {
    ffmpeg(tempPath)
      .audioFilters([
        'highpass=f=80',
        'equalizer=f=300:width_type=q:width=1:g=-3',
        'equalizer=f=4000:width_type=q:width=1:g=3.5',
        'acompressor=threshold=-15dB:ratio=3:attack=5:release=50',
        'loudnorm=I=-14:TP=-1.5:LRA=11',
        'volume=1.7'
      ])
      .save(outputPath)
      .on('end', () => {
         fs.unlinkSync(tempPath);
         resolve();
      })
      .on('error', (err) => {
         console.error('Error aumentando volumen:', err);
         reject(err);
      });
  });
  
  // Breve pausa para no saturar Rate Limits de OpenAI
  await new Promise(r => setTimeout(r, 1000)); 
}

async function run() {
  let manifest = {};

  for (let i = 1; i <= 128; i++) {
    const item = questionsData[i.toString()];
    if (!item) continue;
    
    // Formato: q001_question.mp3
    const idStr = i.toString().padStart(3, '0');
    
    const cleanForTTS = (text, isQuestion) => {
        let cleaned = typeof text === 'string' ? text : '';
        // 1. Manejo de U.S. para que lo deletree "U S"
        cleaned = cleaned.replace(/\(U\.S\.\)/g, 'U.S.');
        cleaned = cleaned.replace(/\bU\.S\./gi, 'U. S.');
        
        // 2. Remover números repetidos en paréntesis, ej "one (1)" -> "one"
        cleaned = cleaned.replace(/\s*\(\d+\)/g, '');
        
        // 3. Puntuación y prolongación final
        cleaned = cleaned.trim();
        if (isQuestion && !cleaned.endsWith('?')) {
            cleaned += '?';
        } else if (!isQuestion && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
            cleaned += '.';
        }
        // Añadir puntos suspensivos fuerza al modelo a renderizar un poco de silencio extra al final
        cleaned += ' ...';
        
        return cleaned;
    };
    
    // 1. PREGUNTA: Ecualización de Estudio
    const qEnText = cleanForTTS(item.questionEn, true);
    const qEnPath = path.join(outQuestions, `q${idStr}_question.mp3`);
    await generateAudio(qEnText, qEnPath);
    
    // 2. RESPUESTA: Ecualización de Estudio
    let aEnText = Array.isArray(item.answerEn) ? item.answerEn.map(a => cleanForTTS(a, false)).join(' ... ') : cleanForTTS(item.answerEn, false);
    const aEnPath = path.join(outAnswers, `q${idStr}_answer.mp3`);
    await generateAudio(aEnText, aEnPath);
    
    manifest[`q${idStr}`] = {
        question: `q${idStr}_question.mp3`,
        answer: `q${idStr}_answer.mp3`
    };
  }

  fs.writeFileSync(path.resolve('./src/assets/audio/audio_manifest.json'), JSON.stringify(manifest, null, 2));
  console.log("¡Los 256 mp3 fueron generados, procesados con EQ de estudio y normalizados a volumen profesional!");
}

run();
