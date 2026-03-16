import 'dotenv/config';

async function searchVoices() {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  if (!ELEVENLABS_API_KEY) {
    console.error('Missing ELEVENLABS_API_KEY');
    return;
  }

  // To search the public library, ElevenLabs requires a different endpoint. 
  // Let's first check if "The Bilingual Professional" is in the user's added voices, 
  // if not we will search the shared voices.
  
  console.log("Searching user's added voices first...");
  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': ELEVENLABS_API_KEY }
  });

  if (response.ok) {
    const data = await response.json();
    const matches = data.voices.filter((v: any) => 
      v.name.toLowerCase().includes('bilingual') || 
      (v.labels && Object.values(v.labels).some(l => String(l).toLowerCase().includes('bilingual')))
    );
    
    if (matches.length > 0) {
      console.log('✅ Encontradas en tu cuenta:');
      matches.forEach((v: any) => console.log(`- ${v.name} (${v.voice_id}): ${v.labels?.accent || ''}`));
    } else {
      console.log('❌ No encontrada en tu cuenta personal.');
    }
  }

  // Search public library (VoiceLab / Shared Voices)
  console.log("\nSearching public shared voices (top 100)...");
  const publicResponse = await fetch('https://api.elevenlabs.io/v1/shared-voices?search=bilingual', {
    headers: { 'xi-api-key': ELEVENLABS_API_KEY }
  });

  if (publicResponse.ok) {
    const data = await publicResponse.json();
    if (data.voices && data.voices.length > 0) {
      console.log(`✅ Encontradas en la biblioteca pública (${data.voices.length} resultados):`);
      data.voices.slice(0, 10).forEach((v: any) => {
        console.log(`- ${v.name} (${v.voice_id}) [Rate: ${v.rate}]`);
      });
    } else {
       console.log('❌ No se encontró "The Bilingual Professional" en la búsqueda pública de ElevenLabs.');
    }
  } else {
    console.error("Failed to query shared voices", await publicResponse.text());
  }
}

searchVoices();
