import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

let OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("Error: Falta OPENAI_API_KEY o EXPO_PUBLIC_OPENAI_API_KEY");
  process.exit(1);
}

OPENAI_API_KEY = OPENAI_API_KEY.trim().replace(/[\n\r]/g, '');

const questionsPath = path.resolve('./scripts/questions.json');
const outQuestions = path.resolve('./src/assets/audio/questions');
const outAnswers = path.resolve('./src/assets/audio/answers');
const tempDir = path.resolve('./scripts/temp');

fs.mkdirSync(outQuestions, { recursive: true });
fs.mkdirSync(outAnswers, { recursive: true });
fs.mkdirSync(tempDir, { recursive: true });

const silencePath = path.join(tempDir, 'silence.mp3');

async function generateSilence() {
  if (fs.existsSync(silencePath)) return;
  console.log("Generando clip de silencio...");
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input('anullsrc=r=44100:c=2')
      .inputFormat('lavfi')
      .outputOptions('-t 0.3')
      .save(silencePath)
      .on('end', resolve)
      .on('error', reject);
  });
}

async function downloadAudio(text, speed, outputPath) {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
      speed: speed
    })
  });
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  await new Promise(r => setTimeout(r, 800));
}

async function concatSpeeds(outputPath) {
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(silencePath)
      .input(path.join(tempDir, 'medium.mp3'))
      .input(silencePath)
      .input(path.join(tempDir, 'slow.mp3'))
      .input(silencePath)
      .input(path.join(tempDir, 'fast.mp3'))
      .input(silencePath)
      .complexFilter([
         '[0:a][1:a][2:a][3:a][4:a][5:a][6:a]concat=n=7:v=0:a=1[out]'
      ])
      .map('[out]')
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });
}

const cleanForTTS = (text, isQuestion) => {
    let cleaned = typeof text === 'string' ? text : '';
    cleaned = cleaned.replace(/\s*\(\d+\)/g, '').replace(/[()]/g, '').replace(/\bU\.S\./gi, 'U. S.').trim();
    if (isQuestion && !cleaned.endsWith('?')) cleaned += '?';
    else if (!isQuestion && !cleaned.endsWith('.')) cleaned += '.';
    return cleaned;
};

async function run() {
  await generateSilence();
  
  // SOLO ID 1 y 2 PARA TEST
  const ids = ['1', '2'];

  for (const id of ids) {
    console.log(`\n🔊 Test Pregunta ID: 00${id}`);
    const item = { questionEn: "What is the supreme law of the land?", answerEn: "The Constitution" }; // Mock hardcoded data for ID 1/2 safety or load just id 1 from questions json
    const qText = cleanForTTS(item.questionEn, true);
    const aText = cleanForTTS(item.answerEn, false);

    const tempMedium = path.join(tempDir, 'medium.mp3');
    const tempSlow = path.join(tempDir, 'slow.mp3');
    const tempFast = path.join(tempDir, 'fast.mp3');

    const qOutPath = path.join(outQuestions, `q00${id}_question_test.mp3`);
    await downloadAudio(qText, 1.00, tempMedium);
    await downloadAudio(qText, 0.85, tempSlow);
    await downloadAudio(qText, 1.15, tempFast);
    await concatSpeeds(qOutPath);
    console.log(`   ✅ Guardado: q00${id}_question_test.mp3`);

    const aOutPath = path.join(outAnswers, `q00${id}_answer_test.mp3`);
    await downloadAudio(aText, 1.00, tempMedium);
    await downloadAudio(aText, 0.85, tempSlow);
    await downloadAudio(aText, 1.15, tempFast);
    await concatSpeeds(aOutPath);
    console.log(`   ✅ Guardado: q00${id}_answer_test.mp3`);
  }
}

run();
