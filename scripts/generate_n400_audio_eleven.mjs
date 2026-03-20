/**
 * generate_n400_audio_eleven.mjs
 * 
 * Genera audios profesionales para TODAS las preguntas del N-400:
 *   - 39 preguntas principales + 59 variaciones = 98 preguntas
 *   - 13 frases de protocolo
 *   - 11 definiciones (término + pregunta) = 22 audios
 *   Total: ~133 archivos MP3
 * 
 * Usa ElevenLabs con voz "Arthur" (profesional, americana, clara)
 * 
 * Uso:
 *   node scripts/generate_n400_audio_eleven.mjs
 *   node scripts/generate_n400_audio_eleven.mjs --dry-run
 *   node scripts/generate_n400_audio_eleven.mjs --category identity
 *   node scripts/generate_n400_audio_eleven.mjs --start 20
 *   node scripts/generate_n400_audio_eleven.mjs --only-questions
 *   node scripts/generate_n400_audio_eleven.mjs --only-protocol
 *   node scripts/generate_n400_audio_eleven.mjs --only-definitions
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve('./.env') });

let ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error("❌ Error: Falta ELEVENLABS_API_KEY en tu archivo .env");
  process.exit(1);
}

ELEVENLABS_API_KEY = ELEVENLABS_API_KEY.trim().replace(/[\n\r]/g, '');

const DEFAULT_VOICE_ID = "nPczCjzI2devNBz1zQrb"; // Arthur

// ─── PARSEAR ARGUMENTOS ──────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const VOICE_ID = getArg('voice-id') || DEFAULT_VOICE_ID;
const CATEGORY_FILTER = getArg('category');
const START_INDEX = parseInt(getArg('start') || '0', 10);
const DRY_RUN = hasFlag('dry-run');
const ONLY_QUESTIONS = hasFlag('only-questions');
const ONLY_PROTOCOL = hasFlag('only-protocol');
const ONLY_DEFINITIONS = hasFlag('only-definitions');

// ─── DIRECTORIO DE SALIDA ────────────────────────────────────────────
const outDir = path.resolve('./src/assets/audio/n400');
fs.mkdirSync(outDir, { recursive: true });

// ─── CARGAR DATOS DEL N-400 ──────────────────────────────────────────
function loadN400Data() {
  const filePath = path.resolve('./src/data/n400FormPractice.ts');
  const content = fs.readFileSync(filePath, 'utf8');

  // Parse questions using a two-pass approach
  const questions = [];
  
  // Find each question block: { id: 'xxx', question: 'yyy', variations: [...], ...}
  const qBlockRegex = /\{\s*id:\s*'([^']+)',\s*question:\s*'((?:[^'\\]|\\.)*)'/g;
  let qMatch;
  while ((qMatch = qBlockRegex.exec(content)) !== null) {
    const id = qMatch[1];
    const question = qMatch[2].replace(/\\'/g, "'");
    
    // Skip protocol/definition ids
    if (id.startsWith('proto_') || id.startsWith('def_')) continue;
    
    // Find variations array after this position
    const afterQ = content.substring(qMatch.index);
    const varBlockMatch = afterQ.match(/variations:\s*\[([\s\S]*?)\]/);
    const variations = [];
    if (varBlockMatch) {
      // Extract each string inside the array
      const varContent = varBlockMatch[1];
      const strRegex = /'((?:[^'\\]|\\.)*)'/g;
      let vMatch;
      while ((vMatch = strRegex.exec(varContent)) !== null) {
        const v = vMatch[1].replace(/\\'/g, "'").trim();
        if (v && v.length > 3) {
          variations.push(v);
        }
      }
    }
    
    questions.push({ id, question, variations });
  }

  // Parse protocol phrases
  const protocol = [];
  const protoRegex = /\{\s*id:\s*'(proto_\d+)',\s*phrase:\s*'((?:[^'\\]|\\.)*)'/g;
  let pMatch;
  while ((pMatch = protoRegex.exec(content)) !== null) {
    protocol.push({
      id: pMatch[1],
      phrase: pMatch[2].replace(/\\'/g, "'"),
    });
  }

  // Parse definitions
  const definitions = [];
  const defRegex = /\{\s*id:\s*'(def_\d+)',\s*term:\s*'((?:[^'\\]|\\.)*)',\s*n400Question:\s*'((?:[^'\\]|\\.)*)'/g;
  let dMatch;
  while ((dMatch = defRegex.exec(content)) !== null) {
    definitions.push({
      id: dMatch[1],
      term: dMatch[2].replace(/\\'/g, "'"),
      n400Question: dMatch[3].replace(/\\'/g, "'"),
    });
  }

  return { questions, protocol, definitions };
}

// ─── ELEVENLABS API ──────────────────────────────────────────────────
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
        stability: 0.50,
        similarity_boost: 0.80,
        style: 0.25,
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
  
  // Rate limit
  await new Promise(r => setTimeout(r, 500));
}

// ─── GENERAR TODO ────────────────────────────────────────────────────
async function generateAll() {
  const data = loadN400Data();
  console.log(`\n📋 N-400 Data cargado:`);
  console.log(`   ${data.questions.length} preguntas principales`);
  console.log(`   ${data.questions.reduce((s, q) => s + q.variations.length, 0)} variaciones`);
  console.log(`   ${data.protocol.length} frases de protocolo`);
  console.log(`   ${data.definitions.length} definiciones`);

  // Build list of all audio items to generate
  const items = [];

  if (!ONLY_PROTOCOL && !ONLY_DEFINITIONS) {
    // Questions + variations
    let qs = data.questions;
    if (CATEGORY_FILTER) {
      qs = qs.filter(q => q.id.startsWith(CATEGORY_FILTER));
      console.log(`\n🔍 Filtrado por '${CATEGORY_FILTER}': ${qs.length} preguntas`);
    }
    for (const q of qs) {
      items.push({ id: q.id, text: q.question, file: `n400_${q.id}.mp3`, type: 'question' });
      q.variations.forEach((v, vi) => {
        items.push({ id: `${q.id}_v${vi + 1}`, text: v, file: `n400_${q.id}_v${vi + 1}.mp3`, type: 'variation' });
      });
    }
  }

  if (!ONLY_QUESTIONS && !ONLY_DEFINITIONS) {
    // Protocol
    for (const p of data.protocol) {
      items.push({ id: p.id, text: p.phrase, file: `n400_${p.id}.mp3`, type: 'protocol' });
    }
  }

  if (!ONLY_QUESTIONS && !ONLY_PROTOCOL) {
    // Definitions (term audio + question audio)
    for (const d of data.definitions) {
      items.push({ id: `${d.id}_term`, text: d.term, file: `n400_${d.id}_term.mp3`, type: 'def_term' });
      items.push({ id: `${d.id}_q`, text: d.n400Question, file: `n400_${d.id}_q.mp3`, type: 'def_question' });
    }
  }

  // Apply start index
  const toGenerate = items.slice(START_INDEX);
  
  console.log(`\n🎙️  Voz: ${VOICE_ID}`);
  console.log(`📁 Salida: ${outDir}`);
  console.log(`📊 Total a generar: ${toGenerate.length} archivos`);

  if (DRY_RUN) {
    console.log('\n🏃 DRY RUN — No se generarán archivos reales\n');
    toGenerate.forEach((item, i) => {
      console.log(`  ${START_INDEX + i + 1}. [${item.type}] ${item.id}`);
      console.log(`     "${item.text.substring(0, 80)}${item.text.length > 80 ? '...' : ''}"`);
      console.log(`     → ${item.file}`);
    });
    console.log(`\n📊 Total: ${toGenerate.length} archivos`);
    return;
  }

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < toGenerate.length; i++) {
    const item = toGenerate[i];
    const outputPath = path.join(outDir, item.file);
    const idx = START_INDEX + i + 1;
    const prefix = `[${idx}/${START_INDEX + toGenerate.length}]`;

    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      const stat = fs.statSync(outputPath);
      if (stat.size > 1000) {
        console.log(`${prefix} ⏭️  ${item.file} (existe, ${(stat.size / 1024).toFixed(1)}KB)`);
        skipped++;
        continue;
      }
    }

    try {
      console.log(`${prefix} 🔊 [${item.type}] "${item.text.substring(0, 60)}..."`);
      await downloadElevenLabs(item.text, outputPath);
      const size = fs.statSync(outputPath).size;
      console.log(`${prefix} ✅ ${item.file} (${(size / 1024).toFixed(1)}KB)`);
      generated++;
    } catch (err) {
      console.error(`${prefix} ❌ ${item.file}: ${err.message}`);
      errors++;
      // Wait a bit more on error and retry once
      await new Promise(r => setTimeout(r, 2000));
      try {
        await downloadElevenLabs(item.text, outputPath);
        console.log(`${prefix} ✅ Retry exitoso: ${item.file}`);
        generated++;
        errors--;
      } catch (retryErr) {
        console.error(`${prefix} ❌ Retry fallido: ${retryErr.message}`);
      }
    }
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`✅ Generados: ${generated}`);
  console.log(`⏭️  Omitidos:  ${skipped}`);
  console.log(`❌ Errores:   ${errors}`);
  console.log(`═══════════════════════════════════════\n`);

  // Generate n400AudioMap.ts
  generateAudioMap();
}

// ─── GENERAR MAPA TS ─────────────────────────────────────────────────
function generateAudioMap() {
  const files = fs.readdirSync(outDir).filter(f => f.endsWith('.mp3') && f.startsWith('n400_'));
  
  const lines = [
    '// Auto-generated map for N-400 practice audio',
    '// Generated by scripts/generate_n400_audio_eleven.mjs',
    '',
    'export const n400AudioMap: { [key: string]: any } = {',
  ];

  for (const file of files.sort()) {
    // n400_id_1.mp3 → id_1
    // n400_proto_1.mp3 → proto_1
    // n400_def_1_term.mp3 → def_1_term
    const id = file.replace(/^n400_/, '').replace(/\.mp3$/, '');
    lines.push(`  ${JSON.stringify(id)}: require(${JSON.stringify('./' + file)}),`);
  }

  lines.push('};', '');

  const mapPath = path.join(outDir, 'n400AudioMap.ts');
  fs.writeFileSync(mapPath, lines.join('\n'));
  console.log(`📝 Generado ${mapPath} con ${files.length} entradas`);
}

// ─── RUN ─────────────────────────────────────────────────────────────
generateAll().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
