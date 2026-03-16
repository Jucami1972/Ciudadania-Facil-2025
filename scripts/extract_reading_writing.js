const fs = require('fs');
const path = require('path');

const tsxPath = path.resolve('./src/data/readingWritingQuestions.tsx');
const outPath = path.resolve('./scripts/reading_writing_questions.json');

try {
    const tsx = fs.readFileSync(tsxPath, 'utf8');
    
    // Extract the array block
    const match = tsx.match(/export const readingWritingQuestions: ReadingWritingQuestion\[] = (\[[\s\S]*?\]);/);
    if (!match) {
        throw new Error('Could not find readingWritingQuestions array in file');
    }

    let arrayContent = match[1];
    
    // Evaluate to get actual object
    const questions = eval(arrayContent);
    
    fs.writeFileSync(outPath, JSON.stringify(questions, null, 2), 'utf8');
    console.log(`Successfully extracted ${questions.length} items to reading_writing_questions.json`);
} catch (error) {
    console.error('Error extracting questions:', error);
}
