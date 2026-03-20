// Analyze state.json structure deeply and map content hashes to practice files
const fs = require('fs');
const path = require('path');

const sessionDir = 'C:/Users/prjcc/AppData/Roaming/Code/User/workspaceStorage/fac82bb61a0907f86cea0cf99ff8c0f2/chatEditingSessions/6e1cff9f-3a18-4c40-9a37-5978f9c262a0';
const state = JSON.parse(fs.readFileSync(path.join(sessionDir, 'state.json'), 'utf8'));

console.log('=== STATE.JSON STRUCTURE ===');
console.log('Top keys:', Object.keys(state));
console.log('Version:', state.version);

// initialFileContents
console.log('\n=== initialFileContents ===');
const ifc = state.initialFileContents;
if (ifc) {
  console.log('Type:', typeof ifc, Array.isArray(ifc) ? 'array(' + ifc.length + ')' : '');
  if (Array.isArray(ifc)) {
    // Show first entry structure
    console.log('First entry keys:', Object.keys(ifc[0]));
    console.log('First entry sample:', JSON.stringify(ifc[0]).substring(0, 300));
  } else {
    const entries = Object.entries(ifc);
    console.log('Entries:', entries.length);
    console.log('First entry:', JSON.stringify(entries[0]).substring(0, 300));
  }
}

// timeline
console.log('\n=== timeline ===');
const tl = state.timeline;
if (tl) {
  console.log('Type:', typeof tl, Array.isArray(tl) ? 'array(' + tl.length + ')' : '');
  if (typeof tl === 'object' && !Array.isArray(tl)) {
    console.log('Timeline keys:', Object.keys(tl));
    for (const [k, v] of Object.entries(tl)) {
      if (Array.isArray(v)) {
        console.log(`  ${k}: array(${v.length})`);
        if (v.length > 0) console.log('    First:', JSON.stringify(v[0]).substring(0, 300));
      } else {
        console.log(`  ${k}:`, typeof v, JSON.stringify(v).substring(0, 200));
      }
    }
  }
}

// recentSnapshot
console.log('\n=== recentSnapshot ===');
const rs = state.recentSnapshot;
if (rs) {
  console.log('Type:', typeof rs, Array.isArray(rs) ? 'array(' + rs.length + ')' : '');
  if (typeof rs === 'object' && !Array.isArray(rs)) {
    console.log('Keys:', Object.keys(rs));
    for (const [k, v] of Object.entries(rs)) {
      if (Array.isArray(v)) {
        console.log(`  ${k}: array(${v.length})`);
        if (v.length > 0) console.log('    First:', JSON.stringify(v[0]).substring(0, 400));
      } else if (typeof v === 'object' && v !== null) {
        console.log(`  ${k}: object with keys`, Object.keys(v).slice(0, 5));
      } else {
        console.log(`  ${k}:`, JSON.stringify(v).substring(0, 200));
      }
    }
  }
}
