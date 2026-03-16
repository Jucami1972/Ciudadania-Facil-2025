const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  const mapFiles = ['src/assets/audio/questions/questionsMap.ts', 'src/assets/audio/answers/answersMap.ts'];
  mapFiles.forEach(f => {
     const p = path.resolve(__dirname, '../', f);
     if (fs.existsSync(p)) {
         let c = fs.readFileSync(p, 'utf8');
         const l = c.split('\n');
         const nl = l.filter(line => {
             const match = line.match(/^\s*(\d+):/);
             if (match) {
                 return parseInt(match[1], 10) <= 100;
             }
             return true;
         });
         fs.writeFileSync(p, nl.join('\n'));
         console.log(`✅ ${f}: Trimmed to 100 items.`);
     }
  });

  execSync('git add src/assets/audio/questions/questionsMap.ts src/assets/audio/answers/answersMap.ts');
  execSync('git commit -m "fix: recortar mapas de audio a 100 índices oficialmente para resolver Bundling failed"');
  execSync('git push origin HEAD');
  console.log("✅ Pushed map corrections successfully.");

} catch (e) {
  console.error("❌ Error:", e.message);
}
