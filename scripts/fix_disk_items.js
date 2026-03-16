const fs = require('fs');
const path = require('path');

try {
    console.log("1. Recortando practiceQuestions.tsx a 100 ítems...");
    const pPath = path.resolve(__dirname, '../src/data/practiceQuestions.tsx');
    if (fs.existsSync(pPath)) {
        const content = fs.readFileSync(pPath, 'utf8');
        const searchStr = 'id: 100,';
        const startIdx = content.indexOf(searchStr);
        
        if (startIdx !== -1) {
            // Encontrar el cierre de la pregunta 100
            const nextClosingObj = content.indexOf('}', startIdx);
            const remaining = content.substring(nextClosingObj + 1);
            const arrayEnd = remaining.indexOf('];');
            
            if (arrayEnd !== -1) {
                const cutoff = nextClosingObj + 1 + arrayEnd;
                // Dejar el '];' y lo que venga después (ej: export)
                const sliced = content.substring(0, cutoff) + content.substring(nextClosingObj + 1 + arrayEnd);
                fs.writeFileSync(pPath, sliced);
                console.log("✅ practiceQuestions.tsx: Recortado con éxito.");
            } else {
                console.log("⚠️ No se encontró el fin del arreglo ];");
            }
        } else {
             console.log("⚠️ No se encontró id: 100, en el archivo.");
        }
    }

    console.log("2. Parchando DashboardScreen.tsx...");
    const dPath = path.resolve(__dirname, '../src/screens/DashboardScreen.tsx');
    if (fs.existsSync(dPath)) {
        let content = fs.readFileSync(dPath, 'utf8');
        content = content.replace(/const total = 128;/g, 'const total = 100;');
        content = content.replace(/const totalQuestions = 128;/g, 'const totalQuestions = 100;');
        content = content.replace(/id <= 128/g, 'id <= 100');
        fs.writeFileSync(dPath, content);
        console.log("✅ DashboardScreen.tsx: Actualizado a 100.");
    }

    console.log("3. Parchando StudyScreenModerno.tsx...");
    const sPath = path.resolve(__dirname, '../src/screens/StudyScreenModerno.tsx');
    if (fs.existsSync(sPath)) {
        let content = fs.readFileSync(sPath, 'utf8');
        content = content.replace(/125-128/g, '95-100');
        fs.writeFileSync(sPath, content);
        console.log("✅ StudyScreenModerno.tsx: Parches aplicados.");
    }

    console.log("🚀 Todos los archivos han sido modificados en disco local sin hacer Git Commits.");

} catch (error) {
    console.error("❌ Error en el proceso:", error.message);
}
