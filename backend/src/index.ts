/**
 * Backend Server - Entrevista AI de Ciudadanía
 * 
 * Servidor Express para manejar las entrevistas N-400 con OpenAI
 */

// Cargar variables de entorno PRIMERO, antes de cualquier import
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { initInterview, processResponse, generateAutoMessage, getMessages } from './controllers/interviewController';
import { transcribeAudio, textToSpeech } from './controllers/proxyController';
import { validatePurchase } from './controllers/purchaseController';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS: permitir orígenes específicos en producción, todo en desarrollo
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
const corsOptions = process.env.NODE_ENV === 'production' && allowedOrigins.length > 0
  ? { origin: allowedOrigins }
  : {}; // En dev, permite cualquier origen
app.use(cors(corsOptions));

// Soportar payloads grandes para audio en base64 (~2-5 MB por audio de 30s)
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Routes — Interview
app.post('/interview/init', initInterview);
app.post('/interview/respond', processResponse);
app.post('/interview/auto', generateAutoMessage);
app.get('/interview/messages/:sessionId', getMessages);

// Routes — OpenAI Proxy (API key lives only on the server)
app.post('/api/transcribe', transcribeAudio);
app.post('/api/tts', textToSpeech);

// Routes — Purchase Validation (RevenueCat secret key lives only on the server)
app.post('/api/validate-purchase', validatePurchase);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 OpenAI API: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '⚠️ Not configured (using fallbacks)'}`);
});

