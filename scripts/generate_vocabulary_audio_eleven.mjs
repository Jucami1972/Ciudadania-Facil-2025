/**
 * generate_vocabulary_audio_eleven.mjs
 * 
 * Genera audios profesionales para TODO el vocabulario:
 *   - Examen Cívico (144 entradas)
 *   - Entrevista N-400 (~55 entradas)
 * 
 * Usa ElevenLabs con voz "Arthur" (profesional, americana, clara)
 * Genera 2 archivos por entrada:
 *   - vocab_{id}_term.mp3  → Término en inglés (pronunciación clara)
 *   - vocab_{id}_def.mp3   → Definición en inglés (explicativa)
 * 
 * Uso:
 *   node scripts/generate_vocabulary_audio_eleven.mjs
 *   node scripts/generate_vocabulary_audio_eleven.mjs --category interview
 *   node scripts/generate_vocabulary_audio_eleven.mjs --start 50
 *   node scripts/generate_vocabulary_audio_eleven.mjs --dry-run
 *   node scripts/generate_vocabulary_audio_eleven.mjs --voice-id XXXXX
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve('./.env') });

let ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error("❌ Error: Falta ELEVENLABS_API_KEY en tu archivo .env");
  console.log("Obtén tu API key en: https://elevenlabs.io/app/api-keys");
  process.exit(1);
}

ELEVENLABS_API_KEY = ELEVENLABS_API_KEY.trim().replace(/[\n\r]/g, '');

// ─── CONFIGURACIÓN DE VOCES ──────────────────────────────────────────
// Arthur: Voz masculina profesional, americana, clara y dinámica
// Alternativas: pNInz6obpgDQGcFmaJgB (Adam), EXAVITQu4vr4xnSDxMaL (Rachel)
const DEFAULT_VOICE_ID = "nPczCjzI2devNBz1zQrb"; // Arthur

// ─── PARSEAR ARGUMENTOS ──────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const VOICE_ID = getArg('voice-id') || DEFAULT_VOICE_ID;
const CATEGORY_FILTER = getArg('category'); // 'interview', 'government', etc.
const START_INDEX = parseInt(getArg('start') || '0', 10);
const DRY_RUN = hasFlag('dry-run');
const TERMS_ONLY = hasFlag('terms-only');
const DEFS_ONLY = hasFlag('defs-only');

// ─── DIRECTORIOS ─────────────────────────────────────────────────────
const outDir = path.resolve('./src/assets/audio/vocabulary');
fs.mkdirSync(outDir, { recursive: true });

// ─── CARGAR VOCABULARIO DIRECTAMENTE ─────────────────────────────────
// Leemos el archivo TS y extraemos los datos con regex (evitar compilar)
function loadVocabulary() {
  const vocabPath = path.resolve('./src/data/vocabulary.ts');
  const content = fs.readFileSync(vocabPath, 'utf8');
  
  const entries = [];
  // Buscar cada bloque { id: '...', ... }
  const blockRegex = /\{\s*id:\s*'([^']+)'[\s\S]*?termEn:\s*'([^']*)'[\s\S]*?definitionEn:\s*'([^']*)'[\s\S]*?category:\s*'([^']*)'/g;
  
  let match;
  while ((match = blockRegex.exec(content)) !== null) {
    entries.push({
      id: match[1],
      termEn: match[2].replace(/\\'/g, "'"),
      definitionEn: match[3].replace(/\\'/g, "'"),
      category: match[4],
    });
  }
  
  return entries;
}

const vocabulary = loadVocabulary();
console.log(`📚 Vocabulario cargado: ${vocabulary.length} entradas`);

// Filtrar por categoría si se especificó
let entries = vocabulary;
if (CATEGORY_FILTER) {
  if (CATEGORY_FILTER === 'exam') {
    entries = vocabulary.filter(e => e.category !== 'interview');
  } else {
    entries = vocabulary.filter(e => e.category === CATEGORY_FILTER);
  }
  console.log(`🔍 Filtrado por "${CATEGORY_FILTER}": ${entries.length} entradas`);
}

// Aplicar start index
if (START_INDEX > 0) {
  entries = entries.slice(START_INDEX);
  console.log(`⏭️  Empezando desde índice ${START_INDEX}: ${entries.length} restantes`);
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
        stability: 0.50,        // Ligeramente variable = más natural
        similarity_boost: 0.80, // Alta fidelidad a la voz
        style: 0.25,            // Algo de expresividad
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
  
  // Rate limit: esperar entre peticiones
  await new Promise(r => setTimeout(r, 500));
}

// ─── GENERAR AUDIOS ──────────────────────────────────────────────────
async function generateAll() {
  const manifest = {};
  let generated = 0;
  let skipped = 0;
  let errors = 0;

  const total = entries.length;
  const totalFiles = TERMS_ONLY || DEFS_ONLY ? total : total * 2;
  
  console.log(`\n🎙️  Voz: ${VOICE_ID}`);
  console.log(`📁 Salida: ${outDir}`);
  console.log(`📊 Total a generar: ${totalFiles} archivos de audio`);
  
  if (DRY_RUN) {
    console.log('\n🏃 DRY RUN — No se generarán archivos reales\n');
    entries.forEach((entry, i) => {
      console.log(`  ${i + 1}. [${entry.category}] ${entry.id}`);
      console.log(`     Term: "${entry.termEn}"`);
      console.log(`     Def:  "${entry.definitionEn.substring(0, 80)}..."`);
    });
    console.log(`\n📊 Resumen: ${total} entradas × ${TERMS_ONLY || DEFS_ONLY ? 1 : 2} = ${totalFiles} archivos`);
    return;
  }

  console.log('\n');

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const idx = START_INDEX + i + 1;
    const prefix = `[${idx}/${START_INDEX + total}]`;
    
    // Archivo del término
    if (!DEFS_ONLY) {
      const termPath = path.join(outDir, `vocab_${entry.id}_term.mp3`);
      
      if (fs.existsSync(termPath)) {
        skipped++;
      } else {
        try {
          console.log(`${prefix} 🔊 Término: "${entry.termEn}"`);
          await downloadElevenLabs(entry.termEn, termPath);
          generated++;
        } catch (err) {
          console.error(`${prefix} ❌ Error término "${entry.id}": ${err.message}`);
          errors++;
        }
      }
    }

    // Archivo de la definición
    if (!TERMS_ONLY) {
      const defPath = path.join(outDir, `vocab_${entry.id}_def.mp3`);
      
      if (fs.existsSync(defPath)) {
        skipped++;
      } else {
        try {
          console.log(`${prefix} 📖 Definición: "${entry.definitionEn.substring(0, 60)}..."`);
          await downloadElevenLabs(entry.definitionEn, defPath);
          generated++;
        } catch (err) {
          console.error(`${prefix} ❌ Error definición "${entry.id}": ${err.message}`);
          errors++;
        }
      }
    }

    // Registrar en manifiesto
    manifest[entry.id] = {
      term: `vocab_${entry.id}_term.mp3`,
      definition: `vocab_${entry.id}_def.mp3`,
      category: entry.category,
    };
  }

  // Guardar manifiesto
  const manifestPath = path.join(outDir, 'vocabulary_audio_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('\n═══════════════════════════════════════');
  console.log(`✅ Generados: ${generated}`);
  console.log(`⏭️  Saltados (ya existían): ${skipped}`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`📋 Manifiesto: ${manifestPath}`);
  console.log('═══════════════════════════════════════\n');
}

generateAll().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
