const fs = require('fs');
const path = require('path');

const outPath = path.resolve('./src/assets/audio/reading_writing/readingWritingAudioMap.ts');

let content = `// ✅ src/assets/audio/reading_writing/readingWritingAudioMap.ts\n\n`;

content += `export const readingAudioMap: { [key: number]: any } = {\n`;
for (let i = 1; i <= 31; i++) {
    const pad = i.toString().padStart(3, '0');
    content += `  ${i}: require('./rw${pad}_reading.mp3'),\n`;
}
content += `};\n\n`;

content += `export const writingAudioMap: { [key: number]: any } = {\n`;
for (let i = 1; i <= 31; i++) {
    const pad = i.toString().padStart(3, '0');
    content += `  ${i}: require('./rw${pad}_writing.mp3'),\n`;
}
content += `};\n`;

fs.writeFileSync(outPath, content, 'utf8');
console.log('Created readingWritingAudioMap.ts with maps for 31 items');
