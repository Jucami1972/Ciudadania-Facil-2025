// Detailed analysis of ops between latest baseline and epoch 14000
const fs = require('fs');
const path = require('path');

const sessionDir = 'C:/Users/prjcc/AppData/Roaming/Code/User/workspaceStorage/fac82bb61a0907f86cea0cf99ff8c0f2/chatEditingSessions/6e1cff9f-3a18-4c40-9a37-5978f9c262a0';
const state = JSON.parse(fs.readFileSync(path.join(sessionDir, 'state.json'), 'utf8'));

const practiceFiles = [
  'PruebaPracticaScreenModerno.tsx',
  'CategoryPracticeScreen.tsx',
  'RandomPracticeScreen.tsx',
  'MisPreguntasScreen.tsx',
  'IncorrectPracticeScreen.tsx',
  'MarkedPracticeScreen.tsx',
  'QuestionTypePracticeScreenModerno.tsx',
  'Random20PracticeScreenModerno.tsx',
  'AIInterviewN400ScreenModerno.tsx',
  'SpacedRepetitionPracticeScreen.tsx',
  'ExamenScreen.tsx',
];

// Build baseline map
const fileBaselines = {};
for (const item of state.timeline.fileBaselines) {
  const [key, data] = item;
  const fname = key.split('::')[0].split('/').pop();
  if (!fileBaselines[fname]) fileBaselines[fname] = [];
  fileBaselines[fname].push({ epoch: data.epoch, content: data.content });
}

// Build operations map
const fileOps = {};
for (const op of state.timeline.operations) {
  let fname;
  if (op.uri) fname = (op.uri.external || op.uri.path || '').split('/').pop();
  if (!fname) continue;
  if (!fileOps[fname]) fileOps[fname] = [];
  fileOps[fname].push(op);
}

for (const name of practiceFiles) {
  const baselines = (fileBaselines[name] || []).filter(b => b.epoch < 14000).sort((a, b) => a.epoch - b.epoch);
  const allOps = (fileOps[name] || []).sort((a, b) => a.epoch - b.epoch);
  
  const latestBL = baselines.length > 0 ? baselines[baselines.length - 1] : null;
  
  // Ops between latest baseline and epoch 14000
  const postBLOrigOps = allOps.filter(o => 
    o.epoch < 14000 && 
    o.epoch > (latestBL ? latestBL.epoch : 0) && 
    o.type === 'textEdit'
  );
  
  // Recovery ops
  const recoveryOps = allOps.filter(o => o.epoch >= 14000);
  
  console.log(`${name}:`);
  console.log(`  Baselines: ${baselines.map(b => 'e'+b.epoch+'('+b.content.split('\n').length+'L)').join(', ')}`);
  console.log(`  Post-BL original ops: ${postBLOrigOps.length} [epochs: ${postBLOrigOps.map(o => o.epoch).join(', ')}]`);
  console.log(`  Recovery ops: ${recoveryOps.length} [epochs: ${recoveryOps.map(o => o.epoch).join(', ')}]`);
  
  // Show what each op does (size of edits)
  for (const op of postBLOrigOps) {
    const edits = op.textEdits || [];
    const totalText = edits.reduce((sum, e) => sum + (e.text || '').length, 0);
    console.log(`    Op@${op.epoch}: ${edits.length} edits, ~${totalText} chars added`);
  }
  console.log();
}
