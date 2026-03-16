const { execSync } = require('child_process');

try {
  console.log("1. Aborting Rebase State...");
  execSync('git rebase --abort || true');

  console.log("2. Fetching origin/main...:");
  execSync('git fetch origin main');

  console.log("3. Core Remote Logs logs:");
  const logs = execSync('git log origin/main -n 5 --oneline').toString();
  console.log(logs);

  console.log("4. Difference Diff for 77040a4:");
  const diff = execSync('git log -n 1 --stat origin/main').toString();
  console.log(diff);

} catch (error) {
  console.error(error.message);
}
