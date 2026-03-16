import 'dotenv/config';

async function fetchVoices() {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  if (!ELEVENLABS_API_KEY) {
    console.error('Missing ELEVENLABS_API_KEY');
    return;
  }

  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
    }
  });

  if (!response.ok) {
    console.error('Failed to fetch voices', await response.text());
    return;
  }

  const data = await response.json();
  data.voices.slice(0, 15).forEach((v: any) => {
    console.log(`- ${v.name} (${v.voice_id}): ${v.labels?.accent || 'No accent'} - ${v.labels?.description || 'No desc'}`);
  });
}

fetchVoices();
