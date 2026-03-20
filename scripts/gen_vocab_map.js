const fs = require('fs');
const path = require('path');

const dir = 'src/assets/audio/vocabulary';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp3')).sort();

const termMap = {};
const defMap = {};

for (const f of files) {
  const m = f.match(/^vocab_(.+)_(term|def)\.mp3$/);
  if (m) {
    const id = m[1], type = m[2];
    if (type === 'term') termMap[id] = f;
    else defMap[id] = f;
  }
}

let out = '// Auto-generated vocabulary audio map\n\n';
out += 'export const vocabTermAudioMap: Record<string, any> = {\n';
for (const [id, file] of Object.entries(termMap).sort(([a], [b]) => a.localeCompare(b))) {
  out += `  '${id}': require('./${file}'),\n`;
}
out += '};\n\n';
out += 'export const vocabDefAudioMap: Record<string, any> = {\n';
for (const [id, file] of Object.entries(defMap).sort(([a], [b]) => a.localeCompare(b))) {
  out += `  '${id}': require('./${file}'),\n`;
}
out += '};\n';

fs.writeFileSync(path.join(dir, 'vocabularyAudioMap.ts'), out);
console.log('Created with ' + Object.keys(termMap).length + ' terms and ' + Object.keys(defMap).length + ' defs');
