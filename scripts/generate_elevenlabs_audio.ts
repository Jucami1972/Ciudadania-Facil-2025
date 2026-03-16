import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { questions } from '../src/data/questions';

// Configuración de ElevenLabs
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// URLs base
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// IDs de voces recomendadas para la máxima claridad en educación:
// Voces en Inglés (Acento Americano Oficial)
const VOICE_EN_MALE = 'pNInz6obpgDQGcFmaJcg'; // Adam (American, Deep, clear)
const VOICE_EN_FEMALE = 'EXAVITQu4vr4xnSDxMaL'; // Rachel (American, Calm, clear)

// Voces en Español (Neutral)
const VOICE_ES_MALE = 'pNInz6obpgDQGcFmaJcg'; // Adam also speaks Spanish well with the multilingual model v2
const VOICE_ES_FEMALE = 'EXAVITQu4vr4xnSDxMaL';

// Configuración de rutas
const AUDIO_DIR = path.resolve(__dirname, '../src/assets/audio');
const QS_DIR = path.join(AUDIO_DIR, 'questions');
const ANS_DIR = path.join(AUDIO_DIR, 'answers');

// Crear directorios si no existen
if (!fs.existsSync(QS_DIR)) fs.mkdirSync(QS_DIR, { recursive: true });
if (!fs.existsSync(ANS_DIR)) fs.mkdirSync(ANS_DIR, { recursive: true });

async function generateAudio(text: string, voiceId: string, outputPath: string) {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('No se encontró ELEVENLABS_API_KEY en el archivo .env');
  }

  // Prevenir reprocesamiento si ya existe y OVERWRITE es false
  if (fs.existsSync(outputPath) && process.env.OVERWRITE !== 'true') {
    console.log(`⏩ Saltando (ya existe): ${path.basename(outputPath)}`);
    return true;
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2', // Mejor para inglés y español
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Creado: ${path.basename(outputPath)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error en ${path.basename(outputPath)}:`, error);
    return false;
  }
}

// Función para pausar entre peticiones para no saturar la API (Rate Limits)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  if (!ELEVENLABS_API_KEY) {
    console.error('❌ ERROR: Falta ELEVENLABS_API_KEY en tu archivo .env');
    console.log('Obtén tu API key en: https://elevenlabs.io/app/api-keys');
    console.log('Añade a tu .env: ELEVENLABS_API_KEY=tu_api_key_aqui');
    process.exit(1);
  }

  console.log('🚀 Iniciando generación de audios con ElevenLabs HD...');
  console.log(`Encontradas ${questions.length} preguntas.`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`\nProcesando Pregunta ${q.id} (${i+1}/${questions.length})...`);

    // Procesar la respuesta (si es array, tomar la primera, o unirlas)
    const answerEnText = Array.isArray(q.answerEn) ? q.answerEn[0] : q.answerEn;
    const answerEsText = Array.isArray(q.answerEs) ? q.answerEs[0] : q.answerEs;

    // Generar 4 audios por pregunta: Q(En), Q(Es), A(En), A(Es)
    const paths = {
      qEn: path.join(QS_DIR, `q${q.id}_en.mp3`),
      qEs: path.join(QS_DIR, `q${q.id}_es.mp3`),
      aEn: path.join(ANS_DIR, `a${q.id}_en.mp3`),
      aEs: path.join(ANS_DIR, `a${q.id}_es.mp3`)
    };

    // Usaremos voz de hombre para Preguntas, voz de mujer para Respuestas (o viceversa)
    // Para hacer la experiencia de estudio más dinámica como un diálogo.
    
    try {
      // 1. Pregunta Inglés (Voz Femenina, clara y profesional)
      await generateAudio(q.questionEn, VOICE_EN_FEMALE, paths.qEn);
      
      // 2. Respuesta Inglés (Voz Masculina)
      await generateAudio(answerEnText, VOICE_EN_MALE, paths.aEn);
      
      // 3. Pregunta Español (Voz Femenina)
      await generateAudio(q.questionEs, VOICE_ES_FEMALE, paths.qEs);
      
      // 4. Respuesta Español (Voz Masculina)
      await generateAudio(answerEsText, VOICE_ES_MALE, paths.aEs);
      
      successCount += 4;
      
      // Esperar 1 segundo entre preguntas para no golpear el Rate Limit de ElevenLabs
      await delay(1000); 
    } catch (e) {
      errorCount++;
      console.error(`Error procesando pregunta ${q.id}`);
    }
  }

  console.log('\n=======================================');
  console.log('🎉 PROCESO COMPLETADO');
  console.log(`Audios generados exitosamente: ${successCount}`);
  console.log(`Errores: ${errorCount}`);
  console.log('=======================================');
}

main();
