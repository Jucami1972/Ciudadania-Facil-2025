const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log("1. Reading HomeScreenRedesign.tsx from commit b6e5e3d...");
  const content = execSync('git show b6e5e3d:src/screens/HomeScreenRedesign.tsx');
  const targetPath = path.resolve(__dirname, '../src/screens/HomeScreenRedesign.tsx');
  
  fs.writeFileSync(targetPath, content);
  console.log("✅ HomeScreenRedesign.tsx overwritten with original design content.");

  console.log("2. Continuing Cherry-Pick...");
  execSync('git add src/screens/HomeScreenRedesign.tsx');
  
  // Bypass editor with env variable
  try {
     const output = execSync('git -c core.editor=true cherry-pick --continue').toString();
     console.log(output);
  } catch (err) {
     console.log("Secondary conflict or continuation reported:", err.message);
     if (err.stdout) console.log("STDOUT:", err.stdout.toString());
  }

  console.log("🚀 Finalized design restoration indices.");

} catch (error) {
  console.error("❌ Error on resolving conflict:", error.message);
}
