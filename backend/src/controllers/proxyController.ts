/**
 * Proxy Controller — OpenAI Whisper y TTS
 *
 * El cliente envía audio/texto a estos endpoints.
 * El backend llama a OpenAI con la API key del servidor (nunca expuesta al cliente).
 */

import { Request, Response } from 'express';

const getApiKey = (): string => process.env.OPENAI_API_KEY || '';

/**
 * POST /api/transcribe
 * Body: { audioBase64: string, language?: string }
 * Response: { text: string }
 */
export async function transcribeAudio(req: Request, res: Response) {
  try {
    const { audioBase64, language = 'en' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API not configured on server' });
    }

    // Validar formato base64 antes de procesar
    if (typeof audioBase64 !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(audioBase64)) {
      return res.status(400).json({ error: 'Invalid base64 format' });
    }

    const buffer = Buffer.from(audioBase64, 'base64');
    const blob = new Blob([buffer], { type: 'audio/m4a' });

    const formData = new FormData();
    formData.append('file', blob, 'audio.m4a');
    formData.append('model', 'whisper-1');
    formData.append('language', language);

    // Timeout: 28s (menor que cliente 30s para permitir manejo de error)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 28000);

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}` },
        body: formData as any,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Whisper API error:', response.status, errText);
        return res.status(502).json({ error: 'Transcription failed', status: response.status });
      }

      const data = await response.json() as { text?: string };
      return res.json({ text: data.text ?? '' });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error: any) {
    // Manejo específico de timeout
    if (error.name === 'AbortError') {
      console.error('OpenAI Whisper timeout after 28s');
      return res.status(504).json({ error: 'Transcription timeout - audio may be too long or OpenAI is slow' });
    }
    console.error('Error in transcribeAudio:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * POST /api/tts
 * Body: { text: string, voice?: string, speed?: number }
 * Response: { audioBase64: string }
 */
export async function textToSpeech(req: Request, res: Response) {
  try {
    const { text, voice = 'nova', speed = 0.95 } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API not configured on server' });
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice,
        input: text,
        speed,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('TTS API error:', response.status, errText);
      return res.status(502).json({ error: 'TTS failed', status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString('base64');
    return res.json({ audioBase64 });
  } catch (error: any) {
    console.error('Error in textToSpeech:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
