// Map practice files to their content hashes in session cache
const fs = require('fs');
const path = require('path');

const sessionDir = 'C:/Users/prjcc/AppData/Roaming/Code/User/workspaceStorage/fac82bb61a0907f86cea0cf99ff8c0f2/chatEditingSessions/6e1cff9f-3a18-4c40-9a37-5978f9c262a0';
const contentsDir = path.join(sessionDir, 'contents');
const state = JSON.parse(fs.readFileSync(path.join(sessionDir, 'state.json'), 'utf8'));

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
  'AppNavigator.tsx',
];

// 1. Get initial file contents (mapping file URI -> initial hash)
const initialContents = {};
for (const entry of state.initialFileContents) {
  const [uri, hash] = entry;
  const fname = uri.split('/').pop();
  initialContents[fname] = { uri, hash };
}

// 2. Get recent snapshot entries (current state)
const snapshotEntries = {};
for (const entry of state.recentSnapshot.entries) {
  const fname = entry.resource.split('/').pop();
  snapshotEntries[fname] = {
    resource: entry.resource,
    originalHash: entry.originalHash,
    currentHash: entry.currentHash,
    state: entry.state, // 1 = modified, 0 = unchanged?
  };
}

// 3. Get file baselines (snapshots at specific epochs)
const fileBaselines = {};
for (const item of state.timeline.fileBaselines) {
  const [key, data] = item;
  // key format: "file:///path::request_id"
  const fileUri = key.split('::')[0];
  const fname = fileUri.split('/').pop();
  if (!fileBaselines[fname]) fileBaselines[fname] = [];
  fileBaselines[fname].push({
    epoch: data.epoch,
    snapshotUri: data.snapshotUri,
    // Extract hash from snapshotUri
    hash: data.snapshotUri ? data.snapshotUri.split('/').pop() : null,
    // Also check for content field
    hasContent: !!data.content,
    contentHash: data.contentHash || null,
    allKeys: Object.keys(data),
  });
}

// 4. Count operations per file (before epoch 14000 = original work)
const opsPerFile = {};
for (const op of state.timeline.operations) {
  let fname;
  if (op.uri) {
    fname = (op.uri.external || op.uri.path || '').split('/').pop();
  } else if (op.resource) {
    fname = (typeof op.resource === 'string' ? op.resource : op.resource.external || '').split('/').pop();
  }
  if (!fname) continue;
  if (!opsPerFile[fname]) opsPerFile[fname] = { orig: 0, recov: 0, lastOrigEpoch: 0, firstOrigEpoch: Infinity };
  if (op.epoch < 14000) {
    opsPerFile[fname].orig++;
    if (op.epoch > opsPerFile[fname].lastOrigEpoch) opsPerFile[fname].lastOrigEpoch = op.epoch;
    if (op.epoch < opsPerFile[fname].firstOrigEpoch) opsPerFile[fname].firstOrigEpoch = op.epoch;
  } else {
    opsPerFile[fname].recov++;
  }
}

// Report for each practice file
console.log('=== PRACTICE FILES ANALYSIS ===\n');
for (const name of practiceFiles) {
  const init = initialContents[name];
  const snap = snapshotEntries[name];
  const baselines = fileBaselines[name] || [];
  const ops = opsPerFile[name] || { orig: 0, recov: 0 };
  
  // Sort baselines by epoch
  baselines.sort((a, b) => a.epoch - b.epoch);
  
  // Find latest baseline before epoch 14000
  const origBaselines = baselines.filter(b => b.epoch < 14000);
  const latestOrigBaseline = origBaselines.length > 0 ? origBaselines[origBaselines.length - 1] : null;
  
  console.log(`--- ${name} ---`);
  console.log(`  Initial: ${init ? init.hash : 'NOT IN SESSION'}`);
  console.log(`  Snapshot: current=${snap ? snap.currentHash : 'N/A'}, original=${snap ? snap.originalHash : 'N/A'}, state=${snap ? snap.state : 'N/A'}`);
  console.log(`  Baselines: ${baselines.length} total, original(<14000): ${origBaselines.length}`);
  for (const bl of origBaselines) {
    let hashInfo = bl.hash || 'no-hash';
    if (bl.hash) {
      const contentFile = path.join(contentsDir, bl.hash);
      if (fs.existsSync(contentFile)) {
        const content = fs.readFileSync(contentFile, 'utf8');
        hashInfo += ` (${content.split('\n').length} lines)`;
      } else {
        hashInfo += ' (file NOT FOUND)';
      }
    }
    console.log(`    Baseline: epoch ${bl.epoch}, hash=${hashInfo}, keys=${bl.allKeys.join(',')}`);
  }
  console.log(`  Operations: ${ops.orig} original, ${ops.recov} recovery`);
  console.log();
}

// Also check what hashes exist in contents dir
const allHashes = fs.readdirSync(contentsDir);
console.log(`\n=== Contents dir: ${allHashes.length} files ===`);

// Check if snapshot currentHash files exist for practice files 
console.log('\n=== SNAPSHOT CURRENT HASHES (final state of session) ===');
for (const name of practiceFiles) {
  const snap = snapshotEntries[name];
  if (snap) {
    const contentFile = path.join(contentsDir, snap.currentHash);
    if (fs.existsSync(contentFile)) {
      const content = fs.readFileSync(contentFile, 'utf8');
      console.log(`${name}: hash=${snap.currentHash}, ${content.split('\n').length} lines`);
    } else {
      console.log(`${name}: hash=${snap.currentHash} - FILE NOT FOUND`);
    }
  }
}
