// Final extraction: Use baselines (confirmed as final original versions)
// For files with no recovery ops: use snapshot from contents/ dir
const fs = require('fs');
const path = require('path');

const sessionDir = 'C:/Users/prjcc/AppData/Roaming/Code/User/workspaceStorage/fac82bb61a0907f86cea0cf99ff8c0f2/chatEditingSessions/6e1cff9f-3a18-4c40-9a37-5978f9c262a0';
const contentsDir = path.join(sessionDir, 'contents');
const state = JSON.parse(fs.readFileSync(path.join(sessionDir, 'state.json'), 'utf8'));

const practiceFiles = [
  { name: 'PruebaPracticaScreenModerno.tsx', destPath: 'src/screens/PruebaPracticaScreenModerno.tsx' },
  { name: 'CategoryPracticeScreen.tsx', destPath: 'src/screens/practice/CategoryPracticeScreen.tsx' },
  { name: 'CategoryPracticeScreenModerno.tsx', destPath: 'src/screens/practice/CategoryPracticeScreenModerno.tsx' },
  { name: 'RandomPracticeScreen.tsx', destPath: 'src/screens/practice/RandomPracticeScreen.tsx' },
  { name: 'MisPreguntasScreen.tsx', destPath: 'src/screens/MisPreguntasScreen.tsx' },
  { name: 'IncorrectPracticeScreen.tsx', destPath: 'src/screens/IncorrectPracticeScreen.tsx' },
  { name: 'MarkedPracticeScreen.tsx', destPath: 'src/screens/MarkedPracticeScreen.tsx' },
  { name: 'QuestionTypePracticeScreenModerno.tsx', destPath: 'src/screens/practice/QuestionTypePracticeScreenModerno.tsx' },
  { name: 'Random20PracticeScreenModerno.tsx', destPath: 'src/screens/practice/Random20PracticeScreenModerno.tsx' },
  { name: 'AIInterviewN400ScreenModerno.tsx', destPath: 'src/screens/practice/AIInterviewN400ScreenModerno.tsx' },
  { name: 'SpacedRepetitionPracticeScreen.tsx', destPath: 'src/screens/practice/SpacedRepetitionPracticeScreen.tsx' },
  { name: 'ReadingWritingScreenModerno.tsx', destPath: 'src/screens/practice/ReadingWritingScreenModerno.tsx' },
  { name: 'VocabularioScreenModernoV2.tsx', destPath: 'src/screens/VocabularioScreenModernoV2.tsx' },
  { name: 'ExamenScreen.tsx', destPath: 'src/screens/ExamenScreen.tsx' },
  { name: 'N400PracticeHomeScreen.tsx', destPath: 'src/screens/practice/N400PracticeHomeScreen.tsx' },
  { name: 'N400SectionPracticeScreen.tsx', destPath: 'src/screens/practice/N400SectionPracticeScreen.tsx' },
];

// Build baseline map
const fileBaselines = {};
for (const item of state.timeline.fileBaselines) {
  const [key, data] = item;
  const fname = key.split('::')[0].split('/').pop();
  if (!fileBaselines[fname]) fileBaselines[fname] = [];
  fileBaselines[fname].push({ epoch: data.epoch, content: data.content });
}

// Get snapshot entries
const snapshotMap = {};
for (const entry of state.recentSnapshot.entries) {
  const fname = entry.resource.split('/').pop();
  snapshotMap[fname] = entry;
}

// Build file ops map
const fileOps = {};
for (const op of state.timeline.operations) {
  let fname;
  if (op.uri) fname = (op.uri.external || op.uri.path || '').split('/').pop();
  if (!fname) continue;
  if (!fileOps[fname]) fileOps[fname] = [];
  fileOps[fname].push(op);
}

const outDir = 'recovered_practice';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

console.log('=== EXTRACTING FINAL ORIGINAL PRACTICE FILES ===\n');

for (const file of practiceFiles) {
  const { name, destPath } = file;
  const baselines = (fileBaselines[name] || []).filter(b => b.epoch < 14000).sort((a, b) => a.epoch - b.epoch);
  const allOps = (fileOps[name] || []);
  const recoveryOps = allOps.filter(o => o.epoch >= 14000);
  const snap = snapshotMap[name];
  
  let content = null;
  let method = '';
  
  if (recoveryOps.length === 0 && snap) {
    // No recovery modifications — snapshot IS the final original
    const snapFile = path.join(contentsDir, snap.currentHash);
    if (fs.existsSync(snapFile)) {
      content = fs.readFileSync(snapFile, 'utf8');
      method = `snapshot(${snap.currentHash}) [no recovery ops = original final]`;
    }
  }
  
  if (!content && baselines.length > 0) {
    // Use latest baseline (confirmed: post-baseline ops are all empty)
    const latestBL = baselines[baselines.length - 1];
    content = latestBL.content;
    method = `baseline@${latestBL.epoch} [post-BL ops are empty markers]`;
  }
  
  if (content) {
    const lines = content.split('\n').length;
    
    // Compare with current file
    const currentPath = destPath;
    let currentLines = 0;
    let status = 'NEW';
    if (fs.existsSync(currentPath)) {
      const current = fs.readFileSync(currentPath, 'utf8');
      currentLines = current.split('\n').length;
      if (current === content) {
        status = 'IDENTICAL';
      } else {
        status = `DIFFERENT (current: ${currentLines}L, recovered: ${lines}L)`;
      }
    }
    
    console.log(`${name}:`);
    console.log(`  Method: ${method}`);
    console.log(`  Lines: ${lines}`);
    console.log(`  Status: ${status}`);
    
    // Write to output
    const outPath = path.join(outDir, name);
    fs.writeFileSync(outPath, content);
    console.log();
  } else {
    console.log(`${name}: FAILED - no content found`);
    console.log();
  }
}
