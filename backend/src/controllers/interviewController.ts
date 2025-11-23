/**
 * Interview Controller - Endpoints para la entrevista AI
 */

import { Request, Response } from 'express';
import { sessionManager } from '../services/SessionManager';
import { openAIEngine } from '../services/OpenAIEngine';
import { uscisInterviewEngine } from '../services/USCISInterviewEngine';
import { fallbackEngine } from '../services/fallbacks';
import { responseValidator } from '../services/ResponseValidator';
import { InterviewContext, ProcessResponseResult, InitResponse, AutoResponse } from '../types';

/**
 * POST /interview/init
 * Inicia una nueva sesión de entrevista
 */
export async function initInterview(req: Request, res: Response) {
  try {
    const context: InterviewContext = req.body.context;
    
    if (!context || !context.applicantName) {
      return res.status(400).json({ error: 'Context with applicantName is required' });
    }

    // Crear sesión
    const session = sessionManager.createSession(context);

    // Generar saludo inicial
    const systemPrompt = openAIEngine.getStagePrompt('greeting', session);
    let officerResponse: string;
    let fluencyEvaluation;

    if (openAIEngine.isAvailable()) {
      const aiResponse = await openAIEngine.generateOfficerResponse(session.sessionId, systemPrompt);
      if (aiResponse) {
        officerResponse = aiResponse.respuesta_oficial;
        fluencyEvaluation = aiResponse.evaluacion_fluidez;
      } else {
        officerResponse = fallbackEngine.generateOfficerResponse('greeting', context);
        fluencyEvaluation = fallbackEngine.generateFluencyEvaluation();
      }
    } else {
      officerResponse = fallbackEngine.generateOfficerResponse('greeting', context);
      fluencyEvaluation = fallbackEngine.generateFluencyEvaluation();
    }

    // Agregar mensaje inicial a la sesión
    sessionManager.addMessage(session.sessionId, {
      role: 'officer',
      content: officerResponse,
      timestamp: new Date(),
      shouldSpeak: true,
      fluencyEvaluation,
    });

    const response: InitResponse = {
      sessionId: session.sessionId,
      officerResponse,
      shouldSpeak: true,
      fluencyEvaluation,
      estado_entrevista: 'greeting',
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error in initInterview:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * POST /interview/respond
 * Procesa la respuesta del solicitante y genera la siguiente pregunta
 */
export async function processResponse(req: Request, res: Response) {
  try {
    const { sessionId, response: applicantResponse } = req.body;

    if (!sessionId || !applicantResponse) {
      return res.status(400).json({ error: 'sessionId and response are required' });
    }

    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Agregar respuesta del solicitante
    sessionManager.addMessage(sessionId, {
      role: 'applicant',
      content: applicantResponse,
      timestamp: new Date(),
    });

    let result: ProcessResponseResult;

    // Manejar diferentes etapas
    switch (session.stage) {
      case 'greeting':
        // Después del saludo, avanzar a identity
        uscisInterviewEngine.advanceStageIfNeeded(sessionId);
        const updatedSession = sessionManager.getSession(sessionId)!;
        
        // Generar respuesta de transición y primera pregunta de identity
        const identityPrompt = openAIEngine.getStagePrompt('identity', updatedSession);
        let officerResponse: string;
        let fluencyEvaluation;
        
        if (openAIEngine.isAvailable()) {
          // Generar respuesta que reconozca que está listo y haga la primera pregunta
          const transitionPrompt = `The applicant has confirmed they are ready to begin. Acknowledge this briefly (1 sentence) and immediately ask the first identity verification question (full name and date of birth).`;
          const aiResponse = await openAIEngine.generateOfficerResponse(sessionId, identityPrompt, applicantResponse);
          if (aiResponse) {
            officerResponse = aiResponse.respuesta_oficial;
            fluencyEvaluation = aiResponse.evaluacion_fluidez;
          } else {
            officerResponse = fallbackEngine.generateOfficerResponse('identity', updatedSession.context);
            fluencyEvaluation = fallbackEngine.generateFluencyEvaluation();
          }
        } else {
          officerResponse = fallbackEngine.generateOfficerResponse('identity', updatedSession.context);
          fluencyEvaluation = fallbackEngine.generateFluencyEvaluation();
        }
        
        sessionManager.addMessage(sessionId, {
          role: 'officer',
          content: officerResponse,
          timestamp: new Date(),
          shouldSpeak: true,
          fluencyEvaluation,
        });
        
        result = {
          officerResponse,
          shouldSpeak: true,
          fluencyEvaluation,
          estado_entrevista: 'identity',
        };
        break;

      case 'identity':
      case 'n400_review':
      case 'oath':
      case 'reading':
      case 'writing':
        result = await handleGeneralStage(sessionId, applicantResponse);
        break;

      case 'civics':
        result = await handleCivicsStage(sessionId, applicantResponse);
        break;

      case 'closing':
        result = {
          officerResponse: 'The interview has concluded. Thank you for your time.',
          shouldSpeak: true,
          estado_entrevista: 'closing',
        };
        break;

      default:
        result = {
          officerResponse: 'Thank you for your response.',
          shouldSpeak: true,
          estado_entrevista: session.stage,
        };
    }

    // Avanzar etapa si es necesario (para otras etapas que no sean greeting)
    if (session.stage !== 'greeting') {
      uscisInterviewEngine.advanceStageIfNeeded(sessionId);
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error in processResponse:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * POST /interview/auto
 * Genera el siguiente mensaje automático (transiciones entre etapas)
 */
export async function generateAutoMessage(req: Request, res: Response) {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Avanzar etapa si es necesario
    const advanced = uscisInterviewEngine.advanceStageIfNeeded(sessionId);
    
    if (!advanced) {
      return res.status(400).json({ error: 'No automatic message available at this stage' });
    }

    // Obtener sesión actualizada
    const updatedSession = sessionManager.getSession(sessionId)!;

    // Generar mensaje para la nueva etapa
    const systemPrompt = openAIEngine.getStagePrompt(updatedSession.stage, updatedSession);
    let officerResponse: string;
    let fluencyEvaluation;

    if (openAIEngine.isAvailable()) {
      const aiResponse = await openAIEngine.generateOfficerResponse(sessionId, systemPrompt);
      if (aiResponse) {
        officerResponse = aiResponse.respuesta_oficial;
        fluencyEvaluation = aiResponse.evaluacion_fluidez;
      } else {
        officerResponse = fallbackEngine.generateOfficerResponse(updatedSession.stage, updatedSession.context);
        fluencyEvaluation = fallbackEngine.generateFluencyEvaluation();
      }
    } else {
      officerResponse = fallbackEngine.generateOfficerResponse(updatedSession.stage, updatedSession.context);
      fluencyEvaluation = fallbackEngine.generateFluencyEvaluation();
    }

    // Si es etapa de civismo, seleccionar pregunta
    if (updatedSession.stage === 'civics') {
      const question = uscisInterviewEngine.selectNextCivicsQuestion(sessionId);
      if (question) {
        officerResponse = question.questionEn;
      }
    }

    // Agregar mensaje a la sesión
    sessionManager.addMessage(sessionId, {
      role: 'officer',
      content: officerResponse,
      timestamp: new Date(),
      shouldSpeak: true,
      fluencyEvaluation,
    });

    const response: AutoResponse = {
      officerResponse,
      shouldSpeak: true,
      fluencyEvaluation,
      estado_entrevista: updatedSession.stage,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error in generateAutoMessage:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * GET /interview/messages/:sessionId
 * Obtiene todos los mensajes de una sesión
 */
export async function getMessages(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const messages = sessionManager.getSessionMessages(sessionId);
    res.json({ messages });
  } catch (error: any) {
    console.error('Error in getMessages:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// Helper functions

async function handleGeneralStage(sessionId: string, applicantResponse: string): Promise<ProcessResponseResult> {
  const session = sessionManager.getSession(sessionId)!;
  
  // VALIDACIÓN INTELIGENTE: Validar localmente ANTES de OpenAI
  const validation = responseValidator.validateResponse(session, applicantResponse);
  
  let officerResponse: string;
  let fluencyEvaluation;
  let shouldAdvance = false;

  // Si la validación es exitosa y confiable, avanzar automáticamente
  if (validation.isValid && validation.confidence >= 0.7) {
    console.log(`✅ Validación local exitosa (confianza: ${validation.confidence.toFixed(2)}): ${validation.reason}`);
    shouldAdvance = validation.shouldAdvance;

    // Generar respuesta positiva y avanzar
    if (session.stage === 'n400_review') {
      sessionManager.updateSession(sessionId, {
        n400QuestionsAsked: session.n400QuestionsAsked + 1,
      });
      
      // Avanzar etapa si es necesario
      uscisInterviewEngine.advanceStageIfNeeded(sessionId);
      const updatedSession = sessionManager.getSession(sessionId)!;
      
      // Generar siguiente pregunta
      const systemPrompt = openAIEngine.getStagePrompt(updatedSession.stage, updatedSession);
      if (openAIEngine.isAvailable()) {
        const aiResponse = await openAIEngine.generateOfficerResponse(sessionId, systemPrompt);
        if (aiResponse) {
          officerResponse = `Thank you, that's correct. ${aiResponse.respuesta_oficial}`;
          fluencyEvaluation = aiResponse.evaluacion_fluidez;
        } else {
          officerResponse = 'Thank you, that\'s correct. Let me ask you the next question.';
          fluencyEvaluation = fallbackEngine.generateFluencyEvaluation();
        }
      } else {
        officerResponse = 'Thank you, that\'s correct. Let me ask you the next question.';
        fluencyEvaluation = fallbackEngine.generateFluencyEvaluation();
      }
    } else {
      // Para otras etapas, simplemente confirmar y avanzar
      officerResponse = 'Thank you, that\'s correct.';
      fluencyEvaluation = {
        puntaje_pronunciacion_y_gramatica: '8/10',
        mejora_sugerida: 'Good job!',
      };
    }
  } else {
    // Si la validación falla o es poco confiable, usar OpenAI para decisión más inteligente
    const systemPrompt = openAIEngine.getStagePrompt(session.stage, session);
    
    if (openAIEngine.isAvailable()) {
      const aiResponse = await openAIEngine.generateOfficerResponse(sessionId, systemPrompt, applicantResponse);
      if (aiResponse) {
        officerResponse = aiResponse.respuesta_oficial;
        fluencyEvaluation = aiResponse.evaluacion_fluidez;
        
        // Intentar detectar si OpenAI aceptó la respuesta
        const lowerResponse = aiResponse.respuesta_oficial.toLowerCase();
        if (lowerResponse.includes('correct') || lowerResponse.includes('thank you') || 
            lowerResponse.includes('good') || lowerResponse.includes('that\'s right')) {
          shouldAdvance = true;
        }
      } else {
        officerResponse = fallbackEngine.generateOfficerResponse(session.stage, session.context);
        fluencyEvaluation = fallbackEngine.generateFluencyEvaluation();
      }
    } else {
      // Sin OpenAI, usar validación local como fallback
      if (validation.isValid) {
        officerResponse = 'Thank you, that\'s correct.';
        shouldAdvance = true;
      } else {
        officerResponse = fallbackEngine.generateOfficerResponse(session.stage, session.context);
      }
      fluencyEvaluation = fallbackEngine.generateFluencyEvaluation();
    }
  }

  // Actualizar contadores según la etapa
  if (session.stage === 'n400_review' && shouldAdvance) {
    sessionManager.updateSession(sessionId, {
      n400QuestionsAsked: session.n400QuestionsAsked + 1,
    });
  }

  // Avanzar etapa si es necesario
  if (shouldAdvance) {
    uscisInterviewEngine.advanceStageIfNeeded(sessionId);
  }

  sessionManager.addMessage(sessionId, {
    role: 'officer',
    content: officerResponse,
    timestamp: new Date(),
    shouldSpeak: true,
    fluencyEvaluation,
  });

  const updatedSession = sessionManager.getSession(sessionId)!;

  return {
    officerResponse,
    shouldSpeak: true,
    fluencyEvaluation,
    estado_entrevista: updatedSession.stage,
  };
}

async function handleCivicsStage(sessionId: string, applicantResponse: string): Promise<ProcessResponseResult> {
  const session = sessionManager.getSession(sessionId)!;
  
  // Evaluar respuesta
  const isCorrect = uscisInterviewEngine.evaluateCivicsAnswer(sessionId, applicantResponse);
  
  // Generar evaluación de fluidez
  let fluencyEvaluation;
  if (openAIEngine.isAvailable()) {
    const fluencyEval = await openAIEngine.generateFluencyEvaluation(sessionId, applicantResponse);
    fluencyEvaluation = fluencyEval || fallbackEngine.generateFluencyEvaluation();
  } else {
    fluencyEvaluation = fallbackEngine.generateFluencyEvaluation();
  }

  // Generar feedback y siguiente pregunta
  const feedback = fallbackEngine.generateCivicsFeedback(
    isCorrect,
    session.currentCivicsQuestion?.answer?.toString()
  );

  // Seleccionar siguiente pregunta
  const nextQuestion = uscisInterviewEngine.selectNextCivicsQuestion(sessionId);
  let officerResponse: string;

  if (nextQuestion) {
    officerResponse = `${feedback} Next question: ${nextQuestion.questionEn}`;
  } else {
    officerResponse = feedback;
  }

  // Actualizar contador
  sessionManager.updateSession(sessionId, {
    civicsQuestionsAsked: session.civicsQuestionsAsked + 1,
  });

  sessionManager.addMessage(sessionId, {
    role: 'officer',
    content: officerResponse,
    timestamp: new Date(),
    shouldSpeak: true,
    fluencyEvaluation,
  });

  return {
    officerResponse,
    isCorrect,
    feedback,
    shouldSpeak: true,
    fluencyEvaluation,
    estado_entrevista: 'civics',
    pregunta_id: session.currentCivicsQuestion?.id,
  };
}

