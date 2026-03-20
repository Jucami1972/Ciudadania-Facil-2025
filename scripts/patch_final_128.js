const fs = require('fs');
const path = require('path');

try {
    console.log("1. Parchando HomeScreenRedesign.tsx...");
    const hPath = path.resolve(__dirname, '../src/screens/HomeScreenRedesign.tsx');
    if (fs.existsSync(hPath)) {
        let content = fs.readFileSync(hPath, 'utf8');
        
        // Corregir estados iniciales
        content = content.replace(/totalQuestions: 128/g, 'totalQuestions: 100');
        content = content.replace(/remainingQuestions: 128/g, 'remainingQuestions: 100');
        
        // Corregir matemáticas de progreso
        content = content.replace(/\/ 128\)/g, '/ 100)');
        content = content.replace(/128 - completedCount/g, '100 - completedCount');
        
        // Corregir rangos de texto
        content = content.replace(/'125-128'/g, "'95-100'");
        
        // Posibles variables extras
        content = content.replace(/const totalQuestions = 128/g, 'const totalQuestions = 100');
        
        fs.writeFileSync(hPath, content);
        console.log("✅ HomeScreenRedesign.tsx: Actualizado a 100 métricas.");
    }

    console.log("2. Parchando Onboarding.tsx...");
    const oPath = path.resolve(__dirname, '../src/components/Onboarding.tsx');
    if (fs.existsSync(oPath)) {
        let content = fs.readFileSync(oPath, 'utf8');
        content = content.replace(/128 preguntas/g, '100 preguntas');
        fs.writeFileSync(oPath, content);
        console.log("✅ Onboarding.tsx: Texto de presentación corregido.");
    }

    console.log("3. Parchando WebSidebar.tsx...");
    const wPath = path.resolve(__dirname, '../src/components/layout/WebSidebar.tsx');
    if (fs.existsSync(wPath)) {
        let content = fs.readFileSync(wPath, 'utf8');
        content = content.replace(/128 Preguntas/g, '100 Preguntas');
        fs.writeFileSync(wPath, content);
        console.log("✅ WebSidebar.tsx: Pie de página corregido.");
    }

    console.log("🚀 Todos los textos y cálculos en el Home Screen han sido fijados en 100.");

} catch (error) {
    console.error("❌ Error en el proceso final:", error.message);
}
