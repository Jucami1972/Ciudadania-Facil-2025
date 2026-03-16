const fs = require('fs');
const path = require('path');

const tsxPath = 'c:\\Users\\prjcc\\Downloads\\CDF2025\\Ciudadania-Facil-2025\\src\\data\\questions.tsx';
const outPath = 'c:\\Users\\prjcc\\Downloads\\CDF2025\\Ciudadania-Facil-2025\\scripts\\questions.json';

try {
    const tsx = fs.readFileSync(tsxPath, 'utf8');
    
    // Extract the array block
    const match = tsx.match(/export const questions: Question\[] = (\[[\s\S]*?\]);/);
    if (!match) {
        throw new Error('Could not find questions array in questions.tsx');
    }

    // Clean up typescript decorators / castings if any
    let arrayContent = match[1];
    
    // Evaluate to get actual object
    const questions = eval(arrayContent);
    
    // Convert back to structured list keyed by string ID
    const questionsMap = {};
    questions.forEach(q => {
        questionsMap[q.id.toString()] = q;
    });

    fs.writeFileSync(outPath, JSON.stringify(questionsMap, null, 2), 'utf8');
    console.log(`Successfully extracted ${questions.length} questions to questions.json`);
} catch (error) {
    console.error('Error extracting questions:', error);
}
