import fs from 'fs';

const data = JSON.parse(fs.readFileSync('parsed_pdf.json', 'utf8'));
const matches = [];

for (const key in data) {
  const item = data[key];
  if (!item) continue;
  
  const qEn = item.questionEn || '';
  const aEn = Array.isArray(item.answerEn) ? item.answerEn.join(' ') : (item.answerEn || '');
  
  const combined = qEn + ' ' + aEn;
  
  // Condición 1: Tiene U.S. o (U.S.)
  const hasUS = /\bU\.S\./i.test(combined) || /\(U\.S\.\)/i.test(combined);
  // Condición 2: Tiene números en paréntesis ej. (1) o (2)
  const hasNumberParens = /\(\d+\)/.test(combined);
  
  if (hasUS || hasNumberParens) {
    matches.push(key);
  }
}

console.log("Total a regenerar:", matches.length);
console.log(matches.join(', '));
