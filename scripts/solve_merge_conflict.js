const { execSync } = require('child_process');

try {
  console.log("1. Running standard git pull origin main...");
  try {
    execSync('git pull origin main');
    console.log("No conflict detected on merge.");
  } catch (error) {
    console.log("Conflict detected as expected, resolving with local versions...");
    
    const filesToKeep = [
      'src/data/questions.tsx',
      'src/data/practiceQuestions.tsx',
      'src/assets/audio/questions/questionsMap.ts',
      'src/assets/audio/answers/answersMap.ts'
    ];
    
    filesToKeep.forEach(f => {
      try {
        execSync(`git checkout --ours ${f}`);
        execSync(`git add ${f}`);
        console.log(`✅ ${f}: Resolved keeping local version.`);
      } catch (e) {
        console.log(`⚠️ ${f}: No conflict to resolve or error.`);
      }
    });

    try {
      execSync('git commit -m "fix: resolver conflicto manteniendo versiones locales de 100 preguntas"');
      console.log("✅ Merge conflict resolved and committed.");
    } catch (e) {
      console.log("No commit needed or index was already clean.");
    }
  }

  console.log("2. Pushing to GitHub Vercel indices...");
  execSync('git push origin HEAD');
  console.log("✅ Final push triggers completed successfully!");

} catch (error) {
  console.error("❌ Error on workflow:", error.message);
  if (error.stdout) console.log("STDOUT:", error.stdout.toString());
  if (error.stderr) console.log("STDERR:", error.stderr.toString());
}
