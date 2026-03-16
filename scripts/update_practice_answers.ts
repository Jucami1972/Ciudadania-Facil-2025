import fs from 'fs';
import path from 'path';
import { questions } from '../src/data/questions';

const practiceQuestionsPath = path.resolve(__dirname, '../src/data/practiceQuestions.tsx');
let content = fs.readFileSync(practiceQuestionsPath, 'utf8');

let updatedCount = 0;

questions.forEach(q => {
  // MUST USE ENGLISH ANSWER because practiceQuestions.tsx has English questions
  let ans = q.answerEn || q.answerEs || '';
  if (Array.isArray(ans)) {
    ans = ans[0];
  }
  
  // Escape quotes
  const finalAns = ans.replace(/"/g, '\\"');
  
  // Look for the block with this ID
  const regex = new RegExp(`(id:\\s*${q.id}\\s*,[\\s\\S]*?answer:\\s*")[^"]*(")`);
  
  if (regex.test(content)) {
    content = content.replace(regex, `$1${finalAns}$2`);
    updatedCount++;
  } else {
    console.warn(`Could not find answer block for question ID: ${q.id}`);
  }
});

fs.writeFileSync(practiceQuestionsPath, content, 'utf8');
console.log(`Successfully updated ${updatedCount} questions in practiceQuestions.tsx to English`);
