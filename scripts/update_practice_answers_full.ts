import fs from 'fs';
import path from 'path';
import { questions } from '../src/data/questions';

const practiceQuestionsPath = path.resolve(__dirname, '../src/data/practiceQuestions.tsx');
let content = fs.readFileSync(practiceQuestionsPath, 'utf8');

// Ensure the interface has questionEn and questionEs 
// (Optional, but kept so we don't break existing types)
if (!content.includes('questionEn?: string;')) {
  // Replace definition to support the new optional fields
  content = content.replace(
    'question: string;', 
    'question: string;\n  questionEn?: string;\n  questionEs?: string;'
  );
}

let updatedCount = 0;

questions.forEach(q => {
  // STRICTLY ENGLISH as per user's explicit instructions.
  let primaryAns = q.answerEn || q.answerEs || '';
  if (Array.isArray(primaryAns)) {
    primaryAns = primaryAns[0];
  }
  
  // Use JSON.stringify to perfectly escape any internal quotes and prevent syntax errors
  const finalAns = JSON.stringify(primaryAns);
  const finalQuestion = JSON.stringify(q.questionEn || q.questionEs || '');
  const finalQuestionEn = JSON.stringify(q.questionEn || '');
  const finalQuestionEs = JSON.stringify(q.questionEs || '');
  
  // Match the block from `id: X,` to `answer: "..."`
  // Because we added questionEn and questionEs before, the block might look different now.
  // We'll safely replace the object properties.
  
  const replacer = `id: ${q.id},\n    question: ${finalQuestion},\n    questionEn: ${finalQuestionEn},\n    questionEs: ${finalQuestionEs},\n    answer: ${finalAns}`;
  
  // Match `id: 86, ... answer: "..."` (multiline)
  const blockRegex = new RegExp(`id:\\s*${q.id}\\s*,[\\s\\S]*?answer:\\s*"[^"]*"`, 'm');
  
  if (blockRegex.test(content)) {
    content = content.replace(blockRegex, replacer);
    updatedCount++;
  } else {
    // Fallback if the answer has strange quotes from the previous error (e.g. answer: "“Padre de Nuestro País""")
    const fallbackRegex = new RegExp(`id:\\s*${q.id}\\s*,[\\s\\S]*?answer:\\s*.*`, 'm');
    // We only replace up to the answer line. We have to be careful not to eat the whole file.
    // Instead of parsing with Regex, maybe we just match id: 86 to category: "xxx"
    const safeRegex = new RegExp(`id:\\s*${q.id}\\s*,[\\s\\S]*?answer:.*?\\n`, 'm');
    if (safeRegex.test(content)) {
        content = content.replace(safeRegex, replacer + ',\n');
        updatedCount++;
    } else {
        console.warn('Failed to match regex for question:', q.id);
    }
  }
});

fs.writeFileSync(practiceQuestionsPath, content, 'utf8');
console.log(`Successfully updated ${updatedCount} questions in practiceQuestions.tsx explicitly to ENGLISH.`);
