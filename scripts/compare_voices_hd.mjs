/**
 * compare_voices_hd.mjs
 * 
 * Genera audios de comparación con OpenAI tts-1-hd
 * 3 voces (nova, onyx, echo) × 3 preguntas × 3 velocidades
 * 
 * Resultado: carpeta audios_comparacion/ con archivos nombrados:
 *   {voz}_q{id}_question.mp3  — pregunta (Normal → Lento → Rápido)
 *   {voz}_q{id}_answer.mp3    — respuesta (Normal → Lento → Rápido)
 *
 * Uso: node scripts/compare_voices_hd.mjs
 */

import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { config } from 'dotenv';

config({ path: path.resolve('./.env') });
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

let OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("Error: Falta OPENAI_API_KEY en .env");
  process.exit(1);
}
OPENAI_API_KEY = OPENAI_API_KEY.trim().replace(/[\n\r]/g, '');

// ─── CONFIGURACIÓN ─────────────────────────────────────────────
const VOICES = ['nova', 'onyx', 'echo'];

// Velocidades más diferenciadas para sentir el contraste
const SPEEDS = {
  normal: 0.95,   // Natural, ligeramente pausada
  slow:   0.70,   // Claramente lenta — para entender cada sílaba
  fast:   1.25,   // Claramente rápida — como habla un nativo
};

// 3 preguntas representativas: corta, media, larga
const SAMPLE_QUESTIONS = [
  {
    id: 1,
    questionEn: "What is the form of government of the United States?",
    answerEn: "Republic",
  },
  {
    id: 48,
    questionEn: "Why are there 100 senators in the U.S. Senate?",
    answerEn: "Because there are two senators per state, and there are fifty states.",
  },
  {
    id: 73,
    questionEn: "The House of Representatives has how many voting members?",
    answerEn: "Four hundred thirty-five voting members.",
  },
];

const outDir = path.resolve('./audios_comparacion');
const tempDir = path.resolve('./scripts/temp_compare');
const silencePath = path.join(tempDir, 'silence_400ms.mp3');

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

// ─── HELPERS ────────────────────────────────────────────────────

const cleanForTTS = (text, isQuestion) => {
  let cleaned = typeof text === 'string' ? text : '';
  cleaned = cleaned.replace(/\s*\(\d+\)/g, '');
  cleaned = cleaned.replace(/[()]/g, '');
  cleaned = cleaned.replace(/\bU\.S\./gi, 'U. S.');
  cleaned = cleaned.trim();
  if (isQuestion && !cleaned.endsWith('?')) cleaned += '?';
  else if (!isQuestion && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) cleaned += '.';
  return cleaned;
};

async function generateSilence() {
  if (fs.existsSync(silencePath)) return;
  console.log("🔇 Generando clip de silencio 400ms...");
  
  // Intentar con diferentes formatos de anullsrc según la versión de ffmpeg
  const attempts = [
    () => ffmpeg().input('anullsrc=r=44100:cl=stereo').inputFormat('lavfi').outputOptions('-t 0.4'),
    () => ffmpeg().input('anullsrc=r=44100:c=2').inputFormat('lavfi').outputOptions('-t 0.4'),
    () => ffmpeg().input('anullsrc').inputFormat('lavfi').outputOptions('-t 0.4').audioChannels(2).audioFrequency(44100),
  ];

  for (const makeCmd of attempts) {
    try {
      await new Promise((resolve, reject) => {
        makeCmd().save(silencePath).on('end', resolve).on('error', reject);
      });
      return; // Success
    } catch { /* try next */ }
  }
  throw new Error('No se pudo generar el clip de silencio con ffmpeg');
}

async function downloadAudio(text, voice, speed, outputPath) {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'tts-1-hd',
      voice: voice,
      input: text,
      speed: speed
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI Error (${response.status}): ${err}`);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  // Rate limit: 3 requests/sec con tts-1-hd
  await new Promise(r => setTimeout(r, 1000));
}

/**
 * Concatena: [silencio] [normal] [silencio] [lento] [silencio] [rápido] [silencio]
 * + normalización de volumen con loudnorm
 */
async function concatAndNormalize(outputPath) {
  const tNormal = path.join(tempDir, 'normal.mp3');
  const tSlow   = path.join(tempDir, 'slow.mp3');
  const tFast   = path.join(tempDir, 'fast.mp3');

  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(silencePath) // 0
      .input(tNormal)     // 1
      .input(silencePath) // 2
      .input(tSlow)       // 3
      .input(silencePath) // 4
      .input(tFast)       // 5
      .input(silencePath) // 6
      .complexFilter([
        '[0:a][1:a][2:a][3:a][4:a][5:a][6:a]concat=n=7:v=0:a=1[raw]',
        '[raw]loudnorm=I=-16:LRA=11:TP=-1.5[out]'
      ])
      .map('[out]')
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });

  // Limpiar temporales de velocidades
  for (const f of [tNormal, tSlow, tFast]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
}

// ─── MAIN ───────────────────────────────────────────────────────

async function run() {
  await generateSilence();

  const total = VOICES.length * SAMPLE_QUESTIONS.length * 2; // 3 voces × 3 preguntas × 2 (Q+A)
  let count = 0;

  console.log(`\n🎙️  Comparación de voces — tts-1-hd`);
  console.log(`   Voces: ${VOICES.join(', ')}`);
  console.log(`   Velocidades: Normal ${SPEEDS.normal}x → Lento ${SPEEDS.slow}x → Rápido ${SPEEDS.fast}x`);
  console.log(`   Preguntas: ${SAMPLE_QUESTIONS.map(q => `Q${q.id}`).join(', ')}`);
  console.log(`   Total de archivos a generar: ${total}`);
  console.log(`   Destino: ${outDir}\n`);

  for (const voice of VOICES) {
    console.log(`\n━━━ VOZ: ${voice.toUpperCase()} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    for (const q of SAMPLE_QUESTIONS) {
      const idStr = String(q.id).padStart(3, '0');
      const qText = cleanForTTS(q.questionEn, true);
      const aText = cleanForTTS(q.answerEn, false);

      // --- PREGUNTA ---
      const qOut = path.join(outDir, `${voice}_q${idStr}_question.mp3`);
      count++;
      console.log(`\n  [${count}/${total}] ${voice} — Q${q.id} pregunta`);
      console.log(`    "${qText}"`);

      await downloadAudio(qText, voice, SPEEDS.normal, path.join(tempDir, 'normal.mp3'));
      await downloadAudio(qText, voice, SPEEDS.slow,   path.join(tempDir, 'slow.mp3'));
      await downloadAudio(qText, voice, SPEEDS.fast,    path.join(tempDir, 'fast.mp3'));
      await concatAndNormalize(qOut);
      console.log(`    ✅ ${path.basename(qOut)}`);

      // --- RESPUESTA ---
      const aOut = path.join(outDir, `${voice}_q${idStr}_answer.mp3`);
      count++;
      console.log(`  [${count}/${total}] ${voice} — Q${q.id} respuesta`);
      console.log(`    "${aText}"`);

      await downloadAudio(aText, voice, SPEEDS.normal, path.join(tempDir, 'normal.mp3'));
      await downloadAudio(aText, voice, SPEEDS.slow,   path.join(tempDir, 'slow.mp3'));
      await downloadAudio(aText, voice, SPEEDS.fast,    path.join(tempDir, 'fast.mp3'));
      await concatAndNormalize(aOut);
      console.log(`    ✅ ${path.basename(aOut)}`);
    }
  }

  // Limpiar
  if (fs.existsSync(silencePath)) fs.unlinkSync(silencePath);
  fs.rmdirSync(tempDir, { recursive: true });

  console.log(`\n🎉 ¡Listo! ${count} archivos generados en: ${outDir}`);
  console.log(`\n📋 Archivos generados:`);
  const files = fs.readdirSync(outDir).filter(f => f.endsWith('.mp3')).sort();
  files.forEach(f => console.log(`   🔊 ${f}`));

  console.log(`\n💡 Compara las voces escuchando los archivos y elige tu favorita.`);
  console.log(`   Las velocidades son: Normal (${SPEEDS.normal}x) → Lento (${SPEEDS.slow}x) → Rápido (${SPEEDS.fast}x)`);
}

run().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
