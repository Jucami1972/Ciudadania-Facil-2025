import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import installer from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import textToSpeech from '@google-cloud/text-to-speech';

// Configurar ffmpeg
ffmpeg.setFfmpegPath(installer.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

import { questions } from '../src/data/questions';

// Configurar cliente de Google Cloud asumiendo que google-credentials.json está en la raíz
const keyFilename = path.resolve(__dirname, '../google-credentials.json');

if (!fs.existsSync(keyFilename)) {
  console.error('\n❌ ERROR CRÍTICO: No se encontró el archivo google-credentials.json');
  console.error('Por favor, asegúrate de haberlo descargado y colocado en:', keyFilename);
  process.exit(1);
}

const client = new textToSpeech.TextToSpeechClient({ keyFilename });

// --- SELECCIÓN DE VOZ ÚNICA DE ALTA FIDELIDAD ---
// Usando Journey (la voz generativa más avanzada y realista de Google Cloud)
// en-US-Journey-D es una voz masculina cálida, fluida y con enorme naturalidad
const VOICE_NAME = 'en-US-Jou// Tres "Acentos/Estilos" usando la misma voz variando velocidad y tono
const VOICE_PROFILES = [
  {
    name: 'Normal',
    settings: { speakingRate: 1.0 }
  },
  {
    name: 'Pausado/Claro',
    settings: { speakingRate: 0.65 } // Ligeramente más rápido que 0.60 para que no sea tan exagerado
  },
  {
    name: 'Rápido/Natural',
    settings: { speakingRate: 1.25 } // Bastante más rápido 
  }
];

// Rutas
const OUTPUT_DIR = path.resolve(__dirname, '../audios_de_prueba');
const TEMP_DIR = path.join(OUTPUT_DIR, 'temp');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

/**
 * Limpia el texto
 */
function cleanTextForAudio(text: string): string {
  let cleaned = text;
  // Forzar deletreo con comas
  cleaned = cleaned.replace(/\(?U\.S\.?\)?/gi, 'U, S, ');
  // Eliminar redundancia "(27)"
  cleaned = cleaned.replace(/\s\(\d+\)/g, '');
  return cleaned.trim();
}

/**
 * Llama a Google Cloud TTS para generar un clip individual
 */
async function generateClip(text: string, profile: typeof VOICE_PROFILES[0], outputPath: string) {
  if (fs.existsSync(outputPath)) return outputPath;

  console.log(`  -> Generando repetición Google Journey (${profile.name}): "${text.substring(0,30)}..."`);
  
  const request = {
    input: { text: text },
    voice: { languageCode: 'en-US', name: VOICE_NAME },
    audioConfig: { 
      audioEncoding: 'MP3' as const,
      speakingRate: profile.settings.speakingRate,
    },
  };

  const [response] = await client.synthesizeSpeech(request);
  
  if (!response.audioContent) {
    throw new Error('Google Cloud no devolvió audioContent');
  }

  // Escribir archivo original
  fs.writeFileSync(outputPath, response.audioContent, 'binary');
  return outputPath;
}

/**
 * Crea archivo de silencio si no existe
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
 * Concatena un archivo con silencio al final
 */
async function appendSilence(inputPath: string, silencePath: string, outputPath: string): Promise<void> {
  if (fs.existsSync(outputPath)) return;
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .input(silencePath)
      .on('end', () => resolve())
      .on('error', reject)
      .mergeToFile(outputPath, TEMP_DIR);
  });
}

/**
 * Une audios pre-espaciados usando la función nativa de FFmpeg de Node
 */
async function mergeAudioWithSilence(inputs: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    inputs.forEach(input => command.input(input));

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
  const silencePath = path.join(TEMP_DIR, 'silence_1s.mp3');
  await ensureSilenceFile(1.0, silencePath);

  for (let i = 0; i < VOICE_PROFILES.length; i++) {
    const rawTempPath = path.join(TEMP_DIR, `${tempPrefix}_raw_part${i}.mp3`);
    const paddedTempPath = path.join(TEMP_DIR, `${tempPrefix}_padded_part${i}.mp3`);
    
    try {
      // 1. Generar audio bruto
      await generateClip(cleanedText, VOICE_PROFILES[i], rawTempPath);
      // 2. Añadirle el silencio al final indvidualmente para que no se corte la pronunciación en el merge
      await appendSilence(rawTempPath, silencePath, paddedTempPath);
      
      clipPaths.push(paddedTempPath);
      await delay(200); 
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
}ath}`, e);
    }
  }
}

async function main() {
  console.log('🚀 Iniciando Prueba con GOOGLE CLOUD JOURNEY (Triple Repetición)...');

  for (let i = 0; i < 3; i++) {
    const q = questions[i];
    console.log(`\n===========================================`);
    console.log(`PROCESANDO PREGUNTA ${q.id}`);
    
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
