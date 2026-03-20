/**
 * generate_n400_responses_audio.mjs
 * 
 * Genera audios MP3 estilo "dictado" de las respuestas recomendadas del N-400.
 * Usa ElevenLabs con voz "Arthur" para consistencia con las preguntas.
 * 
 * Estrategia de dictado (igual que generate_citizenship_audio_eleven.mjs):
 *   1. Descarga audio de ElevenLabs a velocidad normal (1.0x)
 *   2. Crea 3 velocidades localmente con FFmpeg:
 *      - Medio (0.85x): dicción clara
 *      - Lento/Dictado (0.70x): efecto profesor dictando
 *      - Rápido (1.15x): simula ritmo de oficial nativo
 *   3. Concatena con silencios:
 *      1.5s silencio → Medio → 1s silencio → Lento → 1s silencio → Rápido → 0.5s silencio
 * 
 * Los archivos se guardan como: n400_{id}_resp.mp3
 * Ejemplo: n400_id_1_resp.mp3, n400_leg_3_resp.mp3
 * 
 * Uso:
 *   node scripts/generate_n400_responses_audio.mjs
 *   node scripts/generate_n400_responses_audio.mjs --dry-run
 *   node scripts/generate_n400_responses_audio.mjs --force    (regenera todos, incluso existentes)
 */

import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { config } from 'dotenv';

config({ path: path.resolve('./.env') });

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

let ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error("❌ Error: Falta ELEVENLABS_API_KEY en tu archivo .env");
  process.exit(1);
}

ELEVENLABS_API_KEY = ELEVENLABS_API_KEY.trim().replace(/[\n\r]/g, '');

const VOICE_ID = "nPczCjzI2devNBz1zQrb"; // Arthur
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const outDir = path.resolve('./src/assets/audio/n400');
const tempDir = path.resolve('./scripts/temp_resp');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

// Paths para silencios
const silence1sPath = path.join(tempDir, 'silence_1s.mp3');
const silenceStartPath = path.join(tempDir, 'silence_start.mp3');
const silenceEndPath = path.join(tempDir, 'silence_end.mp3');

// ─── PARSEAR recommendedResponseAudio del archivo TS ─────────────────
function loadResponses() {
  const filePath = path.resolve('./src/data/n400FormPractice.ts');
  const content = fs.readFileSync(filePath, 'utf8');

  const responses = [];
  
  // Match each question block with id and recommendedResponseAudio
  const idRegex = /id:\s*'([^']+)'/g;
  const positions = [];
  let m;
  while ((m = idRegex.exec(content)) !== null) {
    const id = m[1];
    if (id.startsWith('proto_') || id.startsWith('def_')) continue;
    positions.push({ id, index: m.index });
  }

  for (let i = 0; i < positions.length; i++) {
    const { id, index } = positions[i];
    const endIdx = i < positions.length - 1 ? positions[i + 1].index : content.length;
    const block = content.substring(index, endIdx);
    
    const audioMatch = block.match(/recommendedResponseAudio:\s*'((?:[^'\\]|\\.)*)'/);
    if (audioMatch) {
      const text = audioMatch[1].replace(/\\'/g, "'");
      responses.push({ id, text });
    }
  }

  return responses;
}

// ─── 1. GENERAR SILENCIOS ────────────────────────────────────────────
async function generateSilence() {
  // Limpiar silencios anteriores
  for (const f of [silence1sPath, silenceStartPath, silenceEndPath]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }

  console.log("⏸️  Generando clips de silencio (1.5s inicio, 1s medio, 0.5s final)...");

  const makeSilence = (duration, out) => new Promise((resolve, reject) => {
    ffmpeg()
      .input('anullsrc=r=44100:cl=stereo')
      .inputFormat('lavfi')
      .outputOptions(`-t ${duration}`)
      .save(out)
      .on('end', resolve)
      .on('error', () => {
        // Fallback sin channel layout explícito
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
  await makeSilence('1.5', silenceStartPath);    // Inicio
  await makeSilence('0.5', silenceEndPath);      // Final
  console.log("✅ Silencios generados\n");
}

// ─── 2. ELEVENLABS API (descarga a velocidad normal 1.0) ────────────
async function downloadElevenLabs(text, outputPath) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.55,
        similarity_boost: 0.80,
        style: 0.20,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs Error (${response.status}): ${err}`);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  await new Promise(r => setTimeout(r, 600)); // Rate limit safety
}

// ─── 3. CAMBIAR VELOCIDAD LOCALMENTE con FFmpeg ─────────────────────
async function changeSpeed(inputPath, tempo, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioFilters(`atempo=${tempo}`)
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });
}

// ─── 4. CONCATENAR 3 VELOCIDADES CON SILENCIOS ──────────────────────
// Resultado: 1.5s silencio → Medio(0.85x) → 1s → Lento(0.70x) → 1s → Rápido(1.15x) → 0.5s
async function concatDictado(downloadedPath, finalOutputPath) {
  const tempMedium = path.join(tempDir, 'medium.mp3');
  const tempSlow = path.join(tempDir, 'slow.mp3');
  const tempFast = path.join(tempDir, 'fast.mp3');

  // Crear 3 velocidades localmente (ahorra créditos ElevenLabs)
  await changeSpeed(downloadedPath, 0.85, tempMedium);  // 🚶 Medio
  await changeSpeed(downloadedPath, 0.70, tempSlow);    // 🐢 Lento/Dictado
  await changeSpeed(downloadedPath, 1.15, tempFast);    // 🏃 Rápido

  // Concatenar: silencio_inicio + medio + silencio + lento + silencio + rapido + silencio_final
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(silenceStartPath)  // 0 → 1.5s
      .input(tempMedium)        // 1 → Medio (0.85x)
      .input(silence1sPath)     // 2 → 1s
      .input(tempSlow)          // 3 → Lento (0.70x)
      .input(silence1sPath)     // 4 → 1s
      .input(tempFast)          // 5 → Rápido (1.15x)
      .input(silenceEndPath)    // 6 → 0.5s
      .complexFilter([
        '[0:a][1:a][2:a][3:a][4:a][5:a][6:a]concat=n=7:v=0:a=1[out]'
      ])
      .map('[out]')
      .save(finalOutputPath)
      .on('end', resolve)
      .on('error', reject);
  });

  // Limpiar temporales de velocidad
  for (const f of [tempMedium, tempSlow, tempFast]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
}

// ─── GENERAR ─────────────────────────────────────────────────────────
async function generate() {
  const responses = loadResponses();
  
  // Deduplicate by audio text (many share "No, I have not", "Yes, I am willing", etc.)
  const uniqueTexts = new Map();
  const items = [];
  
  for (const r of responses) {
    const file = `n400_${r.id}_resp.mp3`;
    items.push({ id: r.id, text: r.text, file });
    uniqueTexts.set(r.text, (uniqueTexts.get(r.text) || 0) + 1);
  }

  console.log(`\n📋 Respuestas recomendadas del N-400 (modo DICTADO):`);
  console.log(`   ${items.length} respuestas totales`);
  console.log(`   ${uniqueTexts.size} textos únicos (${items.length - uniqueTexts.size} se copiarán)`);
  console.log(`\n🎙️  Voz: ${VOICE_ID} (Arthur)`);
  console.log(`🔊 Estrategia: 1.5s → Medio(0.85x) → 1s → Lento(0.70x) → 1s → Rápido(1.15x) → 0.5s`);
  console.log(`📁 Salida: ${outDir}`);
  if (FORCE) console.log(`⚠️  FORCE: regenerando todos los archivos`);
  console.log('');

  if (DRY_RUN) {
    console.log('🏃 DRY RUN — No se generarán archivos\n');
    items.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.id} → "${item.text}" → ${item.file}`);
    });
    console.log(`\n📊 Total: ${items.length} archivos (${uniqueTexts.size} llamadas API + ${items.length - uniqueTexts.size} copias)`);
    return;
  }

  // Generar silencios
  await generateSilence();

  // For duplicate texts, generate once and copy
  const generatedTexts = new Map(); // text -> first final file path
  let generated = 0, skipped = 0, copied = 0, errors = 0;
  const tempDownloaded = path.join(tempDir, 'downloaded.mp3');

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const outputPath = path.join(outDir, item.file);
    const prefix = `[${i + 1}/${items.length}]`;

    // Skip if already exists (unless --force)
    if (!FORCE && fs.existsSync(outputPath)) {
      const stat = fs.statSync(outputPath);
      if (stat.size > 5000) { // Dictado files are bigger than simple ones
        console.log(`${prefix} ⏭️  ${item.file} (existe, ${(stat.size / 1024).toFixed(1)}KB)`);
        skipped++;
        if (!generatedTexts.has(item.text)) generatedTexts.set(item.text, outputPath);
        continue;
      }
    }

    // If same text was already generated, copy the final concatenated file
    if (generatedTexts.has(item.text)) {
      const sourcePath = generatedTexts.get(item.text);
      fs.copyFileSync(sourcePath, outputPath);
      const size = fs.statSync(outputPath).size;
      console.log(`${prefix} 📋 ${item.file} (copiado, ${(size / 1024).toFixed(1)}KB)`);
      copied++;
      continue;
    }

    try {
      console.log(`${prefix} 🔊 "${item.text}"`);
      
      // 1. Descargar de ElevenLabs (velocidad normal)
      await downloadElevenLabs(item.text, tempDownloaded);
      
      // 2. Crear 3 velocidades + concatenar con silencios
      console.log(`${prefix}    🎛️  Creando 3 velocidades + concatenando...`);
      await concatDictado(tempDownloaded, outputPath);
      
      const size = fs.statSync(outputPath).size;
      console.log(`${prefix} ✅ ${item.file} (${(size / 1024).toFixed(1)}KB)`);
      generatedTexts.set(item.text, outputPath);
      generated++;
      
      // Limpiar descarga temporal
      if (fs.existsSync(tempDownloaded)) fs.unlinkSync(tempDownloaded);
    } catch (err) {
      console.error(`${prefix} ❌ ${item.file}: ${err.message}`);
      errors++;
      await new Promise(r => setTimeout(r, 2000));
      try {
        await downloadElevenLabs(item.text, tempDownloaded);
        await concatDictado(tempDownloaded, outputPath);
        console.log(`${prefix} ✅ Retry exitoso: ${item.file}`);
        generatedTexts.set(item.text, outputPath);
        generated++;
        errors--;
        if (fs.existsSync(tempDownloaded)) fs.unlinkSync(tempDownloaded);
      } catch (err2) {
        console.error(`${prefix} ❌ Retry falló: ${err2.message}`);
      }
    }
  }

  // Limpiar directorio temporal
  for (const f of [silence1sPath, silenceStartPath, silenceEndPath, tempDownloaded]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  try { fs.rmdirSync(tempDir); } catch (_) {}

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ Generados (dictado): ${generated}`);
  console.log(`📋 Copiados:           ${copied}`);
  console.log(`⏭️  Omitidos:           ${skipped}`);
  console.log(`❌ Errores:            ${errors}`);
  console.log(`${'═'.repeat(50)}`);

  // Regenerate audioMap
  regenerateAudioMap();
}

// ─── REGENERAR audioMap ──────────────────────────────────────────────
function regenerateAudioMap() {
  const files = fs.readdirSync(outDir).filter(f => f.endsWith('.mp3') && f.startsWith('n400_')).sort();
  
  const lines = files.map(f => {
    const key = f.replace('n400_', '').replace('.mp3', '');
    return `  "${key}": require("./${f}"),`;
  });

  const mapContent = `// Auto-generated map for N-400 practice audio\n// Generated by scripts/generate_n400_responses_audio.mjs\n\nexport const n400AudioMap: { [key: string]: any } = {\n${lines.join('\n')}\n};\n`;

  const mapPath = path.join(outDir, 'n400AudioMap.ts');
  fs.writeFileSync(mapPath, mapContent, 'utf8');
  console.log(`\n📝 Generado ${mapPath} con ${files.length} entradas`);
}

generate().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
