import fs from 'fs';
import path from 'path';
import { questions } from '../src/data/questions';

const practiceQuestionsPath = path.resolve(__dirname, '../src/data/practiceQuestions.tsx');
let content = fs.readFileSync(practiceQuestionsPath, 'utf8');

// Update the interface to support string[]
let interfaceFixed = false;
content = content.replace(/answer:\s*string\s*;/g, () => {
  interfaceFixed = true;
  return 'answer: string | string[];';
});

let updatedCount = 0;

questions.forEach(q => {
  const primaryAns = q.answerEn || q.answerEs || '';
  
  // Use JSON.stringify to handle both strings and arrays natively
  const finalAns = JSON.stringify(primaryAns);
  const finalQuestion = JSON.stringify(q.questionEn || q.questionEs || '');
  const finalQuestionEn = JSON.stringify(q.questionEn || '');
  const finalQuestionEs = JSON.stringify(q.questionEs || '');
  
  const replacer = `id: ${q.id},\n    question: ${finalQuestion},\n    questionEn: ${finalQuestionEn},\n    questionEs: ${finalQuestionEs},\n    answer: ${finalAns}`;
  
  const blockRegex = new RegExp(`id:\\s*${q.id}\\s*,[\\s\\S]*?answer:\\s*.*?\\n`, 'm');
  
  if (blockRegex.test(content)) {
    content = content.replace(blockRegex, replacer + ',\n');
    updatedCount++;
  } else {
    const fallbackRegex = new RegExp(`id:\\s*${q.id}\\s*,[\\s\\S]*?answer:.*`, 'm');
    if (fallbackRegex.test(content)) {
        content = content.replace(fallbackRegex, replacer);
        updatedCount++;
    } else {
        console.warn('Failed to match regex for question:', q.id);
    }
  }
});

fs.writeFileSync(practiceQuestionsPath, content, 'utf8');
console.log(`Successfully updated ${updatedCount} questions in practiceQuestions.tsx explicitly retaining arrays.`);
