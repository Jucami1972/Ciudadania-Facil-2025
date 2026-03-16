const fs = require('fs');

const filepath = 'c:/Users/prjcc/Downloads/CDF2025/Ciudadania-Facil-2025/src/data/questions.tsx';

fs.readFile(filepath, 'utf8', (err, data) => {
  if (err) throw err;
  
  const lines = data.split('\n');
  const cleanLines = [];
  const seenIds = new Set();
  
  let insideObject = false;
  let currentId = null;
  let currentObjectLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Detect start of object
    if (trimmed === '{') {
      insideObject = true;
      currentObjectLines = [line];
      currentId = null;
      continue;
    }

    if (insideObject) {
      currentObjectLines.push(line);
      
      const idMatch = line.match(/id:\s*(\d+)/);
      if (idMatch) {
        currentId = parseInt(idMatch[1], 10);
      }

      // Detect end of object
      if (trimmed.startsWith('}') || trimmed === '},') {
        insideObject = false;
        
        if (currentId !== null) {
          if (seenIds.has(currentId)) {
            console.log(`Skipping duplicate ID: ${currentId}`);
          } else {
            seenIds.add(currentId);
            
            // Sub-deduplicate duplicate keys (like two explanationEs)
            const cleanedObj = [];
            const seenKeys = new Set();
            for (const objLine of currentObjectLines) {
              const keyMatch = objLine.match(/^\s*(\w+)\s*:/);
              if (keyMatch) {
                const key = keyMatch[1];
                if (key !== 'id') { // keep id just in case
                   if (seenKeys.has(key)) {
                     console.log(`Skipping duplicate key ${key} in item ${currentId}`);
                     continue; 
                   }
                   seenKeys.add(key);
                }
              }
              cleanedObj.push(objLine);
            }
            cleanLines.push(...cleanedObj);
          }
        } else {
          // No ID found inside {}? Keep it just in case it is part of type checking or other array
          cleanLines.push(...currentObjectLines);
        }
        currentObjectLines = [];
      }
    } else {
      // Outside object: declarations, comments backslash structure
      if (trimmed.startsWith('//') || trimmed === '];' || line.includes('export const questions') || trimmed === '[') {
         cleanLines.push(line);
      } else if (trimmed !== '') {
         cleanLines.push(line);
      }
    }
  }

  fs.writeFile(filepath, cleanLines.join('\n'), 'utf8', (err) => {
    if (err) throw err;
    console.log(`Successfully cleaned questions.tsx. Found ${seenIds.size} unique items.`);
  });
});
