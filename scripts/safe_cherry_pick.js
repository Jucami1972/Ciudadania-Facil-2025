const { execSync } = require('child_process');

try {
  console.log("1. Creating local backup commit of current disk state...");
  execSync('git add .');
  try {
     execSync('git commit -m "local: guardar parches de 100 en disco para permitir cherry-pick"');
  } catch (e) {
     console.log("No current modifications to commit.");
  }

  console.log("2. Cherry-picking b6e5e3d (HomeScreenRedesign) and 88adeea (Category Navigation)...");
  const output = execSync('git cherry-pick b6e5e3d 88adeea').toString();
  console.log(output);

  console.log("✅ Cherry-picks applied successfully!");
  
} catch (error) {
  console.error("❌ Error on workflow:", error.message);
  if (error.stdout) console.log("STDOUT:", error.stdout.toString());
  if (error.stderr) console.log("STDERR:", error.stderr.toString());
  
  console.log("Attempting to abort conflicted cherry-pick if any...");
  try { execSync('git cherry-pick --abort'); } catch(e) {}
}
