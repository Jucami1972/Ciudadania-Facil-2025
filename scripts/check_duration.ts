import ffprobe from '@ffprobe-installer/ffprobe';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

ffmpeg.setFfprobePath(ffprobe.path);

const file = path.resolve(__dirname, '../audios_de_prueba/q001_question.mp3');

ffmpeg.ffprobe(file, (err, metadata) => {
  if (err) {
    console.error(err);
  } else {
    console.log(`Duration of q001_question.mp3: ${metadata.format.duration} seconds`);
  }
});

const part0 = path.resolve(__dirname, '../audios_de_prueba/temp/temp_q001_part0.mp3');
ffmpeg.ffprobe(part0, (err, metadata) => {
  if (err) {
    console.error(err);
  } else {
    console.log(`Duration of temp_q001_part0.mp3: ${metadata.format.duration} seconds`);
  }
});
