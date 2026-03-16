const { execSync } = require('child_process');

try {
  console.log("1. Safely Aborting Rebase...");
  try {
     execSync('git rebase --abort');
  } catch (e) {
     console.log("No rebase in progress or already aborted.");
  }

  console.log("2. Fetching latest remote commits...");
  execSync('git fetch origin main');

  console.log("3. Inspecting Commit 77040a4 from Origin:");
  const commitDetails = execSync('git log -n 1 --stat origin/main').toString();
  console.log(commitDetails);

} catch (error) {
  console.error("error:", error.message);
}
