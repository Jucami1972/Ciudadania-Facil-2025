import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

config({ path: path.resolve('./.env') });
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

let OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("Error: Falta OPENAI_API_KEY en tu archivo .env");
  process.exit(1);
}

OPENAI_API_KEY = OPENAI_API_KEY.trim().replace(/[\n\r]/g, '');

const questionsPath = path.resolve('./parsed_pdf.json');
const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

const outQuestions = path.resolve('./src/assets/audio/questions');
const outAnswers = path.resolve('./src/assets/audio/answers');
const VOICE_SPEED = 0.87;

async function generateAudio(text, outputPath) {
  console.log(`Generando corregido: ${path.basename(outputPath)} -> Texto: "${text}"`);
  
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
          voice: 'echo',
          input: text,
          speed: VOICE_SPEED
        }),
        signal: AbortSignal.timeout(60000)
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
         console.error('Error procesando audio:', err);
         reject(err);
      });
  });
  
  await new Promise(r => setTimeout(r, 1000)); 
}

const targetIds = [
  '2', '3', '4', '5', '7', '10', '14', '18', '19', '20', '21', '22',
  '23', '24', '25', '26', '27', '29', '31', '32', '36', '42', '53',
  '54', '63', '67', '82', '83', '84', '85', '92', '96', '97', '104',
  '116', '126', '128'
];

async function run() {
  for (const matchId of targetIds) {
    const item = questionsData[matchId];
    if (!item) continue;
    
    const idStr = matchId.padStart(3, '0');
    
    const cleanForTTS = (text, isQuestion) => {
        let cleaned = typeof text === 'string' ? text : '';
        
        // REGLAS ESTRICTAS PARA U.S. y NÚMEROS
        // Para asegurar que deletree "U.S.", la separacion de letras U S suele funcionar perfecto
        cleaned = cleaned.replace(/\(U\.S\.\)/g, 'U S');
        cleaned = cleaned.replace(/\bU\.S\./gi, 'U S');
        
        // Quitar números en parestesis como (1) o (2)
        cleaned = cleaned.replace(/\s*\(\d+\)/g, '');
        
        cleaned = cleaned.trim();
        if (isQuestion && !cleaned.endsWith('?')) {
            cleaned += '?';
        } else if (!isQuestion && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
            cleaned += '.';
        }
        cleaned += ' ...';
        
        return cleaned;
    };
    
    // Pregunta
    const qEnText = cleanForTTS(item.questionEn, true);
    const qEnPath = path.join(outQuestions, `q${idStr}_question.mp3`);
    await generateAudio(qEnText, qEnPath);
    
    // Respuesta
    let aEnText = Array.isArray(item.answerEn) ? item.answerEn.map(a => cleanForTTS(a, false)).join(' ... ') : cleanForTTS(item.answerEn, false);
    const aEnPath = path.join(outAnswers, `q${idStr}_answer.mp3`);
    await generateAudio(aEnText, aEnPath);
  }

  console.log("¡Audios específicos regenerados con corrección en U.S. y Números!");
}

run();
