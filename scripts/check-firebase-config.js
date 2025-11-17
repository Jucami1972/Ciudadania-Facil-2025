/**
 * Script para verificar la configuración de Firebase
 * Ejecuta: node scripts/check-firebase-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de Firebase...\n');

const envPath = path.join(__dirname, '..', '.env');
const configPath = path.join(__dirname, '..', 'src', 'config', 'firebaseConfig.ts');

let hasErrors = false;
let hasWarnings = false;

// Verificar archivo .env
if (fs.existsSync(envPath)) {
  console.log('✅ Archivo .env encontrado');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      const match = envContent.match(new RegExp(`${varName}=(.+)`));
      if (match && match[1] && !match[1].includes('YOUR_') && !match[1].includes('your-')) {
        console.log(`   ✅ ${varName} configurado`);
      } else {
        console.log(`   ⚠️  ${varName} tiene valor de ejemplo`);
        hasWarnings = true;
      }
    } else {
      console.log(`   ❌ ${varName} no encontrado`);
      hasErrors = true;
    }
  });
} else {
  console.log('⚠️  Archivo .env no encontrado');
  console.log('   💡 Copia .env.example a .env y configura tus credenciales');
  hasWarnings = true;
}

// Verificar firebaseConfig.ts
if (fs.existsSync(configPath)) {
  console.log('\n✅ Archivo firebaseConfig.ts encontrado');
  
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  if (configContent.includes('YOUR_API_KEY') || configContent.includes('your-project')) {
    console.log('   ⚠️  firebaseConfig.ts tiene valores de ejemplo');
    console.log('   💡 Actualiza los valores o usa variables de entorno en .env');
    hasWarnings = true;
  } else if (configContent.includes('process.env.EXPO_PUBLIC_FIREBASE_API_KEY')) {
    console.log('   ✅ Configurado para usar variables de entorno');
  } else {
    console.log('   ✅ Configuración personalizada encontrada');
  }
} else {
  console.log('\n❌ Archivo firebaseConfig.ts no encontrado');
  hasErrors = true;
}

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ Hay errores en la configuración. Por favor, revísalos.');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  La configuración tiene advertencias. Verifica los valores.');
  process.exit(0);
} else {
  console.log('✅ Configuración de Firebase parece estar correcta');
  console.log('💡 Recuerda reiniciar el servidor de Expo después de cambiar las variables');
  process.exit(0);
}

