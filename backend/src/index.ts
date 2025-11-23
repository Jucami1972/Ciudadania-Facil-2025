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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Routes
app.post('/interview/init', initInterview);
app.post('/interview/respond', processResponse);
app.post('/interview/auto', generateAutoMessage);
app.get('/interview/messages/:sessionId', getMessages);

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

