const fs = require('fs');
const state = JSON.parse(fs.readFileSync('C:/Users/prjcc/AppData/Roaming/Code/User/workspaceStorage/fac82bb61a0907f86cea0cf99ff8c0f2/chatEditingSessions/6e1cff9f-3a18-4c40-9a37-5978f9c262a0/state.json','utf8'));

const practiceFiles = [
  'PruebaPracticaScreenModerno.tsx',
  'CategoryPracticeScreen.tsx',
  'CategoryPracticeScreenModerno.tsx',
  'RandomPracticeScreen.tsx',
  'MisPreguntasScreen.tsx',
  'IncorrectPracticeScreen.tsx',
  'MarkedPracticeScreen.tsx',
  'QuestionTypePracticeScreenModerno.tsx',
  'Random20PracticeScreenModerno.tsx',
  'Random20PracticeScreen.tsx',
  'AIInterviewN400ScreenModerno.tsx',
  'SpacedRepetitionPracticeScreen.tsx',
  'ReadingWritingScreenModerno.tsx',
  'VocabularioScreenModernoV2.tsx',
  'ExamenScreen.tsx',
  'N400PracticeHomeScreen.tsx',
  'N400SectionPracticeScreen.tsx',
];

// Check structure
console.log('Top-level keys:', Object.keys(state));
console.log('fileBaselines type:', typeof state.fileBaselines, Array.isArray(state.fileBaselines));

// fileBaselines: could be an array of objects
const baselines = Array.isArray(state.fileBaselines) ? state.fileBaselines : 
  (state.fileBaselines ? Object.entries(state.fileBaselines) : []);

console.log('Baselines count:', baselines.length);
if (baselines.length > 0) {
  console.log('First baseline sample:', JSON.stringify(baselines[0]).substring(0, 200));
}

// Operations
console.log('Operations count:', state.operations ? state.operations.length : 'N/A');

for (const name of practiceFiles) {
  const fileBaselines = [];
  
  if (Array.isArray(state.fileBaselines)) {
    for (const b of state.fileBaselines) {
      const uri = b.resource || b.uri || '';
      if (uri.includes(name)) {
        fileBaselines.push({ epoch: b.epoch, content: b.content ? b.content.substring(0, 50) : 'hash:' + (b.snapshotUri || '').split('/').pop() });
      }
    }
  }
  
  const ops = [];
  if (state.operations) {
    for (const op of state.operations) {
      const uri = op.resource || '';
      if (uri.includes(name) && op.epoch < 14000) {
        ops.push({ epoch: op.epoch, type: op.type, edits: op.textEdits ? op.textEdits.length : 0 });
      }
    }
  }
  
  if (fileBaselines.length > 0 || ops.length > 0) {
    console.log('\n--- ' + name + ' ---');
    console.log('  Baselines:', fileBaselines.length, fileBaselines.map(b => 'e' + b.epoch).join(', '));
    console.log('  Ops (<14000):', ops.length, 
      ops.length > 0 ? `[${ops[0].epoch}..${ops[ops.length-1].epoch}]` : '');
  }
}
