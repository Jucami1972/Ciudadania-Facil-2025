// STRATEGY: For each practice file, extract the FINAL original version.
// The baselines have inline `content`. We use the latest baseline < epoch 14000
// Then apply operations between that baseline epoch and epoch 14000.
// 
// HOWEVER: If the snapshot currentHash == originalHash, the recovery didn't touch it,
// so we could in theory use snapshot content. But snapshot might be post-recovery.
//
// Safest: reconstruct from baselines + ops, OR if that's complex, 
// check if currentHash content in `contents/` matches what we'd reconstruct.

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
  'AIInterviewN400ScreenModerno.tsx',
  'SpacedRepetitionPracticeScreen.tsx',
  'ReadingWritingScreenModerno.tsx',
  'VocabularioScreenModernoV2.tsx',
  'ExamenScreen.tsx',
  'N400PracticeHomeScreen.tsx',
  'N400SectionPracticeScreen.tsx',
];

// Build baseline map (keyed by filename)
const fileBaselines = {};
for (const item of state.timeline.fileBaselines) {
  const [key, data] = item;
  const fileUri = key.split('::')[0];
  const fname = fileUri.split('/').pop();
  if (!fileBaselines[fname]) fileBaselines[fname] = [];
  fileBaselines[fname].push({
    epoch: data.epoch,
    content: data.content,
  });
}

// Build operations map (keyed by filename)
const fileOps = {};
for (const op of state.timeline.operations) {
  let fname;
  if (op.uri) {
    fname = (op.uri.external || op.uri.path || '').split('/').pop();
  }
  if (!fname) continue;
  if (!fileOps[fname]) fileOps[fname] = [];
  fileOps[fname].push(op);
}

// Get initial file contents map
const initialContents = {};
for (const entry of state.initialFileContents) {
  const [uri, hash] = entry;
  const fname = uri.split('/').pop();
  initialContents[fname] = hash;
}

// Get snapshot entries
const snapshotMap = {};
for (const entry of state.recentSnapshot.entries) {
  const fname = entry.resource.split('/').pop();
  snapshotMap[fname] = entry;
}

function applyTextEdits(content, edits) {
  // Sort edits reverse by position (bottom to top) to avoid offset shifts
  const sortedEdits = [...edits].sort((a, b) => {
    if (b.range[0] !== a.range[0]) return b.range[0] - a.range[0];
    return b.range[1] - a.range[1];
  });
  
  const lines = content.split('\n');
  
  for (const edit of sortedEdits) {
    const [startLine, startChar, endLine, endChar] = edit.range;
    const newText = edit.text;
    
    // Get the text before the edit range
    const beforeEditLine = (lines[startLine] || '').substring(0, startChar);
    // Get the text after the edit range
    const afterEditLine = (lines[endLine] || '').substring(endChar);
    
    // Replace the range
    const newLines = (beforeEditLine + newText + afterEditLine).split('\n');
    
    // Remove old lines and insert new
    lines.splice(startLine, endLine - startLine + 1, ...newLines);
  }
  
  return lines.join('\n');
}

// Output directory
const outDir = path.join('recovered_practice');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

console.log('=== RECONSTRUCTING PRACTICE FILES ===\n');

for (const name of practiceFiles) {
  const baselines = (fileBaselines[name] || []).filter(b => b.epoch < 14000).sort((a, b) => a.epoch - b.epoch);
  const ops = (fileOps[name] || []).filter(o => o.epoch < 14000).sort((a, b) => a.epoch - b.epoch);
  const initHash = initialContents[name];
  const snap = snapshotMap[name];
  
  console.log(`--- ${name} ---`);
  
  // Strategy 1: Use latest baseline + apply remaining ops
  let content = null;
  let method = '';
  
  if (baselines.length > 0) {
    // Use latest original baseline
    const latestBaseline = baselines[baselines.length - 1];
    content = latestBaseline.content;
    
    // Apply ops after this baseline epoch
    const remainingOps = ops.filter(o => o.epoch > latestBaseline.epoch && o.type === 'textEdit' && o.textEdits);
    
    if (remainingOps.length > 0 && remainingOps.length < 50) {
      // Safe to replay
      for (const op of remainingOps) {
        try {
          content = applyTextEdits(content, op.textEdits);
        } catch (e) {
          console.log(`  WARNING: Failed to apply op at epoch ${op.epoch}: ${e.message}`);
        }
      }
      method = `baseline@${latestBaseline.epoch} + ${remainingOps.length} ops`;
    } else if (remainingOps.length >= 50) {
      // Too many ops - just use baseline
      method = `baseline@${latestBaseline.epoch} ONLY (${remainingOps.length} ops skipped - too many)`;
    } else {
      method = `baseline@${latestBaseline.epoch} (no additional ops)`;
    }
  } else if (initHash && initHash !== 'da39a3e') {
    // Use initial content from contents dir
    const initFile = path.join(contentsDir, initHash);
    if (fs.existsSync(initFile)) {
      content = fs.readFileSync(initFile, 'utf8');
      
      // Apply all original ops
      const allOps = ops.filter(o => o.type === 'textEdit' && o.textEdits);
      if (allOps.length > 0 && allOps.length < 50) {
        for (const op of allOps) {
          try {
            content = applyTextEdits(content, op.textEdits);
          } catch (e) {
            console.log(`  WARNING: Failed to apply op at epoch ${op.epoch}: ${e.message}`);
          }
        }
        method = `initial(${initHash}) + ${allOps.length} ops`;
      } else if (allOps.length >= 50) {
        method = `initial(${initHash}) ONLY (${allOps.length} ops skipped)`;
      } else {
        method = `initial(${initHash}) no ops`;
      }
    }
  }
  
  // Also check: what does the snapshot content hash give us?
  let snapContent = null;
  let snapLines = 0;
  if (snap) {
    const snapFile = path.join(contentsDir, snap.currentHash);
    if (fs.existsSync(snapFile)) {
      snapContent = fs.readFileSync(snapFile, 'utf8');
      snapLines = snapContent.split('\n').length;
    }
  }
  
  // Compare methods: if recovery ops count is 0, snapshot IS the original final state
  const recovOps = (fileOps[name] || []).filter(o => o.epoch >= 14000);
  
  if (recovOps.length === 0 && snapContent) {
    // No recovery modifications — snapshot IS the final original version
    content = snapContent;
    method = `snapshot(${snap.currentHash}) - no recovery ops, this IS original final`;
  } else if (content && snapContent) {
    // Compare
    const contentLines = content.split('\n').length;
    console.log(`  Reconstructed: ${contentLines} lines, Snapshot: ${snapLines} lines (recovery ops: ${recovOps.length})`);
    
    // If content matches snapshot, great
    if (content === snapContent) {
      method += ' [MATCHES snapshot]';
    }
  }
  
  if (content) {
    const lines = content.split('\n').length;
    console.log(`  Method: ${method}`);
    console.log(`  Result: ${lines} lines`);
    
    // Write output
    const outFile = path.join(outDir, name);
    fs.writeFileSync(outFile, content);
  } else {
    console.log(`  FAILED - no content found`);
    // Try snapshot as fallback
    if (snapContent) {
      console.log(`  FALLBACK: using snapshot (${snapLines} lines) - may include recovery changes`);
      fs.writeFileSync(path.join(outDir, name), snapContent);
    }
  }
  console.log();
}

console.log('=== DONE ===');
