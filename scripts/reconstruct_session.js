// Script to reconstruct final file states from VS Code Copilot editing session
const fs = require('fs');
const path = require('path');

const STATE_PATH = 'C:/Users/prjcc/AppData/Roaming/Code/User/workspaceStorage/fac82bb61a0907f86cea0cf99ff8c0f2/chatEditingSessions/6e1cff9f-3a18-4c40-9a37-5978f9c262a0/state.json';
const OUTPUT_DIR = path.join(__dirname, '..', 'recovered_files');
const MAX_EPOCH = 14000; // Only original work, not recovery attempts
const PROJECT_PREFIX = '/c:/Users/prjcc/Downloads/CDF2025/Ciudadania-Facil-2025/';

console.log('Loading state.json...');
const j = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
const bl = j.timeline.fileBaselines;
const ops = j.timeline.operations;
const initials = j.initialFileContents;

console.log(`Baselines: ${bl.length}, Operations: ${ops.length}, Initials: ${initials.length}`);

// Get initial content from contents/ directory
const CONTENTS_DIR = path.dirname(STATE_PATH) + '/contents';

function getInitialContent(filePath) {
  for (const entry of initials) {
    const uri = entry[0];
    const hash = entry[1];
    const p = decodeURIComponent(uri).replace('file:///c%3A', 'file:///c:').replace(/file:\/\/\/c:\/Users\/prjcc\/Downloads\/CDF2025\/Ciudadania-Facil-2025\//, '');
    if (p === filePath && hash !== 'da39a3e') { // da39a3e = empty file hash
      const contentFile = path.join(CONTENTS_DIR, hash);
      if (fs.existsSync(contentFile)) {
        return fs.readFileSync(contentFile, 'utf8');
      }
    }
  }
  return null;
}

// For each file, get the latest baseline BEFORE MAX_EPOCH
const latestBL = {};
for (const entry of bl) {
  const val = entry[1];
  if (val.epoch >= MAX_EPOCH) continue;
  const filePath = val.uri.path.replace(PROJECT_PREFIX, '');
  if (!latestBL[filePath] || val.epoch > latestBL[filePath].epoch) {
    latestBL[filePath] = { epoch: val.epoch, content: val.content };
  }
}

// Apply text edits to content
function applyEdits(content, edits) {
  const lines = content.split('\n');
  
  // Sort edits in reverse order (bottom to top) to avoid position shifts
  const sorted = [...edits].sort((a, b) => {
    if (b.range.startLineNumber !== a.range.startLineNumber)
      return b.range.startLineNumber - a.range.startLineNumber;
    return b.range.startColumn - a.range.startColumn;
  });
  
  for (const edit of sorted) {
    const sl = edit.range.startLineNumber - 1; // 0-based
    const sc = edit.range.startColumn - 1;
    const el = edit.range.endLineNumber - 1;
    const ec = edit.range.endColumn - 1;
    const text = edit.text || '';
    
    if (sl < 0 || sl > lines.length) continue;
    if (el < 0 || el > lines.length) continue;
    
    const startLine = sl < lines.length ? lines[sl] : '';
    const endLine = el < lines.length ? lines[el] : '';
    
    const before = startLine.substring(0, sc);
    const after = endLine.substring(ec);
    const newContent = before + text + after;
    const newLines = newContent.split('\n');
    
    const deleteCount = el - sl + 1;
    lines.splice(sl, Math.min(deleteCount, lines.length - sl), ...newLines);
  }
  
  return lines.join('\n');
}

// Important source files to reconstruct
const targetFiles = [
  'src/screens/ExamenScreen.tsx',
  'src/screens/practice/Random20PracticeScreenModerno.tsx',
  'src/screens/practice/AIInterviewN400ScreenModerno.tsx',
  'src/screens/VocabularioScreenModernoV2.tsx',
  'src/screens/practice/ReadingWritingScreenModerno.tsx',
  'src/screens/practice/SpacedRepetitionPracticeScreen.tsx',
  'src/screens/practice/RandomPracticeScreen.tsx',
  'src/screens/practice/CategoryPracticeScreen.tsx',
  'src/screens/practice/CategoryPracticeScreenModerno.tsx',
  'src/screens/practice/QuestionTypePracticeScreenModerno.tsx',
  'src/screens/HomeScreenRedesign.tsx',
  'src/screens/StudyScreenModerno.tsx',
  'src/screens/StudyCardsScreenModerno.tsx',
  'src/screens/SubcategoriasScreenModerno.tsx',
  'src/screens/PruebaPracticaScreenModerno.tsx',
  'src/screens/IncorrectPracticeScreen.tsx',
  'src/screens/MarkedPracticeScreen.tsx',
  'src/screens/MisPreguntasScreen.tsx',
  'src/screens/EstadisticasScreen.tsx',
  'src/screens/StudyCardsByTypeScreen.tsx',
  'src/screens/DashboardScreen.tsx',
  'src/navigation/AppNavigator.tsx',
  'src/data/vocabulary.ts',
  'src/data/practiceQuestions.tsx',
  'src/data/questions.tsx',
  'src/data/readingWritingQuestions.tsx',
  'src/data/n400FormPractice.ts',
  'src/data/n400InterviewQuestions.tsx',
  'src/services/aiInterviewN400Service.ts',
  'src/services/AudioManagerService.ts',
  'src/services/questionTypesService.ts',
  'src/services/SectionNavigationService.ts',
  'src/components/practice/AnswerResultCard.tsx',
  'src/components/practice/PracticeQuestionCard.tsx',
  'src/components/Onboarding.tsx',
  'src/context/PremiumContext.tsx',
  'src/hooks/useHomeData.ts',
  'src/types/navigation.ts',
  'src/constants/categories.ts',
  'src/config/firebaseConfig.ts',
  'src/screens/practice/N400PracticeHomeScreen.tsx',
  'src/screens/practice/N400SectionPracticeScreen.tsx',
];

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('\n=== RECONSTRUCTING FILES ===\n');

for (const filePath of targetFiles) {
  const base = latestBL[filePath];
  
  if (!base) {
    // Try to get from initial content or start empty (new file)
    let content = getInitialContent(filePath) || '';
    const fileOps = ops.filter(op => {
      const p = op.uri.path.replace(PROJECT_PREFIX, '');
      return p === filePath && op.epoch < MAX_EPOCH;
    });
    for (const op of fileOps) {
      if (op.type === 'create') continue;
      if (!op.edits || !Array.isArray(op.edits)) continue;
      content = applyEdits(content, op.edits);
    }
    const lines = content.split('\n').length;
    const kb = Math.round(content.length / 1024 * 10) / 10;
    console.log(`${filePath}: ${lines} lines (${kb}KB) [from initial + ${fileOps.length} ops]`);
    
    const outPath = path.join(OUTPUT_DIR, filePath);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, content);
    continue;
  }
  
  // Start from baseline content
  let content = base.content;
  
  // Get operations for this file after baseline epoch, before MAX_EPOCH
  const fileOps = ops.filter(op => {
    const p = op.uri.path.replace(PROJECT_PREFIX, '');
    return p === filePath && op.epoch >= base.epoch && op.epoch < MAX_EPOCH;
  });
  
  // Apply operations in order
  for (const op of fileOps) {
    if (op.type === 'create') continue; // Skip create ops (file starts empty)
    if (!op.edits || !Array.isArray(op.edits)) continue; // Skip non-edit ops
    content = applyEdits(content, op.edits);
  }
  
  const lines = content.split('\n').length;
  const kb = Math.round(content.length / 1024 * 10) / 10;
  console.log(`${filePath}: ${lines} lines (${kb}KB) [baseline@${base.epoch} + ${fileOps.length} ops]`);
  
  // Save to output directory
  const outPath = path.join(OUTPUT_DIR, filePath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content);
}

console.log(`\nFiles saved to: ${OUTPUT_DIR}`);
