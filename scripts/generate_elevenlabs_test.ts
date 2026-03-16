import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import installer from '@ffmpeg-installer/ffmpeg';

// Configurar la ruta de ffmpeg
ffmpeg.setFfmpegPath(installer.path);

import { questions } from '../src/data/questions';

// Configuración de ElevenLabs
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// --- SELECCIÓN DE VOZ ÚNICA (RACHEL) ---
// Usando a Matilda (XrExE9yKIg1WjnnlVkGX) - Premium VoiceLab
const VOICE_ID = 'XrExE9yKIg1WjnnlVkGX'; 

// Tres "Acentos/Estilos" usando la misma voz variando parámetros neurales
const VOICE_PROFILES = [
  {
    name: 'Normal/Claro',
    settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0 }
  },
  {
    name: 'Pausado/Estricto',
    settings: { stability: 0.85, similarity_boost: 0.9, style: 0.0 } // Mayor estabilidad la hace leer más robótica/pausada
  },
  {
    name: 'Rápido/Emocional',
    settings: { stability: 0.25, similarity_boost: 0.5, style: 0.5 } // Menos estabilidad crea inflexiones naturales como en charla rápida
  }
];

// Configuración de rutas
const OUTPUT_DIR = path.resolve(__dirname, '../audios_de_prueba');
const TEMP_DIR = path.join(OUTPUT_DIR, 'temp');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

/**
 * Limpia el texto para evitar que la IA pronuncie cosas raras.
 * 1. Usa comas forzadas para "U.S." asegurando que lea letra por letra
 * 2. Elimina números duplicados en paréntesis
 */
function cleanTextForAudio(text: string): string {
  let cleaned = text;
  
  // Forzar deletreo con pausas de U.S. -> "U, S,"
  cleaned = cleaned.replace(/\(?U\.S\.?\)?/gi, 'U, S, ');
  
  // Eliminar redundancia "(27)"
  cleaned = cleaned.replace(/\s\(\d+\)/g, '');

  return cleaned.trim();
}

/**
 * Genera un clip individual usando ElevenLabs
 */
async function generateClip(text: string, profile: typeof VOICE_PROFILES[0], outputPath: string) {
  if (fs.existsSync(outputPath)) return outputPath; // Cache

  console.log(`  -> Generando repetición (${profile.name}): "${text.substring(0,30)}..."`);
  
  const response = await fetch(`${ELEVENLABS_API_URL}/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': ELEVENLABS_API_KEY as string,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        ...profile.settings,
        use_speaker_boost: true
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
  return outputPath;
}

/**
 * Crea un archivo mp3 de silencio puro si no existe
 */
async function ensureSilenceFile(duration: number, outputPath: string): Promise<string> {
  if (fs.existsSync(outputPath)) return outputPath;
  
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input('anullsrc')
      .inputFormat('lavfi')
      .duration(duration)
      .outputOptions(['-c:a libmp3lame', '-b:a 128k'])
      .save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject);
  });
}

/**
 * Une múltiples archivos mp3 con un silencio intermedio
 */
async function mergeAudioWithSilence(inputs: string[], outputPath: string): Promise<void> {
  const silencePath = path.join(TEMP_DIR, 'silence_1_2s.mp3');
  await ensureSilenceFile(1.2, silencePath);

  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    
    // Intercalar los inputs con el silencio
    inputs.forEach((input, index) => {
      command.input(input);
      if (index < inputs.length - 1) {
        command.input(silencePath); // Añadir silencio entre clips
      }
    });

    command
      .on('end', () => resolve())
      .on('error', (err) => {
        console.error('FFmpeg Error en merge:', err);
        reject(err);
      })
      .mergeToFile(outputPath, TEMP_DIR);
  });
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function processItem(originalText: string, finalFileName: string, tempPrefix: string) {
  const cleanedText = cleanTextForAudio(originalText);
  console.log(`\nOriginal: ${originalText}`);
  console.log(`Limpio:   ${cleanedText}`);

  const clipPaths: string[] = [];

  for (let i = 0; i < VOICE_PROFILES.length; i++) {
    const tempPath = path.join(TEMP_DIR, `${tempPrefix}_part${i}.mp3`);
    try {
      await generateClip(cleanedText, VOICE_PROFILES[i], tempPath);
      clipPaths.push(tempPath);
      await delay(500); 
    } catch (e) {
      console.error(`Error generando clip ${i}:`, e);
    }
  }

  if (clipPaths.length === VOICE_PROFILES.length) {
    const finalPath = path.join(OUTPUT_DIR, finalFileName);
    console.log(`  -> Uniendo repeticiones en: ${finalFileName}...`);
    try {
      await mergeAudioWithSilence(clipPaths, finalPath);
      console.log(`  ✅ Archivo creado: ${finalFileName}`);
    } catch (e) {
       console.error(`Failed to merge ${finalPath}`, e);
    }
  }
}

async function main() {
  if (!ELEVENLABS_API_KEY) {
    console.error('❌ ERROR: Falta ELEVENLABS_API_KEY en tu archivo .env');
    process.exit(1);
  }

  console.log('🚀 Iniciando Prueba de Triple Repetición con 1 Sola Voz...');

  // Procesar primeras 3 preguntas
  for (let i = 0; i < 3; i++) {
    const q = questions[i];
    console.log(`\n===========================================`);
    console.log(`PROCESANDO PREGUNTA ${q.id}`);
    
    // Formato exacto requerido: q001_question.mp3 y q001_answer.mp3
    const formatId = q.id.toString().padStart(3, '0');
    
    const questionFileName = `q${formatId}_question.mp3`;
    const answerFileName = `q${formatId}_answer.mp3`;

    // 1. Pregunta
    await processItem(q.questionEn, questionFileName, `temp_q${formatId}`);
    
    // 2. Respuesta
    const answerText = Array.isArray(q.answerEn) ? q.answerEn[0] : q.answerEn;
    await processItem(answerText, answerFileName, `temp_a${formatId}`);
  }

  console.log('\n===========================================');
  console.log(`🎉 PRUEBA COMPLETADA`);
  console.log(`Audios en: ${OUTPUT_DIR}`);
  console.log('===========================================');
}

main();
