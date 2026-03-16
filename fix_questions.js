const fs = require('fs');
const path = require('path');

const filepath = 'c:/Users/prjcc/Downloads/CDF2025/Ciudadania-Facil-2025/src/data/questions.tsx';

fs.readFile(filepath, 'utf8', (err, data) => {
  if (err) throw err;
  const lines = data.split('\n');
  console.log('Total lines before:', lines.length);

  // Line 1216 -> index 1215
  // Line 1411 -> index 1410
  const startIndex = 1215; // 0-indexed
  const countToRemove = 196; // 1410 - 1215 + 1

  console.log('Line 1215 (to keep):', lines[1214] ? lines[1214].trim() : "N/A");
  console.log('Line 1216 (to remove):', lines[1215] ? lines[1215].trim() : "N/A");
  console.log('Line 1411 (to remove):', lines[1410] ? lines[1410].trim() : "N/A");
  console.log('Line 1412 (to keep):', lines[1411] ? lines[1411].trim() : "N/A");

  if (lines[1411] && lines[1411].includes('100')) {
    console.log("Found '100' on item to keep! Proceeding.");
  }

  lines.splice(startIndex, countToRemove);

  fs.writeFile(filepath, lines.join('\n'), 'utf8', (err) => {
    if (err) throw err;
    console.log('Total lines after:', lines.length);
    console.log('Fix applied successfully.');
  });
});
