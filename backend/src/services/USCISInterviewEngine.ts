/**
 * USCISInterviewEngine - Motor de control de etapas de la entrevista
 * 
 * Controla el flujo completo de la entrevista N-400:
 * greeting -> identity -> n400_review -> oath -> civics -> reading -> writing -> closing
 */

import { InterviewSession, InterviewStage, FluencyEvaluation } from '../types';
import { sessionManager } from './SessionManager';
import { questionBank } from './QuestionBank';

export class USCISInterviewEngine {
  /**
   * Determina la siguiente etapa basada en el estado actual
   */
  getNextStage(currentStage: InterviewStage, session: InterviewSession): InterviewStage | null {
    switch (currentStage) {
      case 'greeting':
        return 'identity';
      
      case 'identity':
        return session.context.n400FormData ? 'n400_review' : 'oath';
      
      case 'n400_review':
        if (session.n400QuestionsAsked >= session.totalN400Questions) {
          return 'oath';
        }
        return null; // Continuar en la misma etapa
      
      case 'oath':
        return 'civics';
      
      case 'civics':
        if (session.civicsQuestionsAsked >= session.totalCivicsQuestions) {
          return 'reading';
        }
        return null; // Continuar en la misma etapa
      
      case 'reading':
        return 'writing';
      
      case 'writing':
        return 'closing';
      
      case 'closing':
        return null; // Fin de la entrevista
      
      default:
        return null;
    }
  }

  /**
   * Avanza a la siguiente etapa si es necesario
   */
  advanceStageIfNeeded(sessionId: string): boolean {
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return false;
    }

    const nextStage = this.getNextStage(session.stage, session);
    if (nextStage) {
      sessionManager.updateSession(sessionId, { stage: nextStage });
      return true;
    }
    return false;
  }

  /**
   * Selecciona una pregunta de civismo aleatoria que no se haya usado
   */
  selectNextCivicsQuestion(sessionId: string): { id: number; questionEn: string; answerEn: string | string[] } | null {
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return null;
    }

    const question = questionBank.getRandomQuestion(session.civicsQuestionsUsed);
    if (!question) {
      return null;
    }

    // Marcar como usada
    session.civicsQuestionsUsed.push(question.id);
    sessionManager.updateSession(sessionId, {
      currentCivicsQuestion: {
        id: question.id,
        question: question.questionEn,
        answer: question.answerEn,
      },
    });

    return {
      id: question.id,
      questionEn: question.questionEn,
      answerEn: question.answerEn,
    };
  }

  /**
   * Evalúa si una respuesta de civismo es correcta
   */
  evaluateCivicsAnswer(sessionId: string, userAnswer: string): boolean {
    const session = sessionManager.getSession(sessionId);
    if (!session || !session.currentCivicsQuestion) {
      return false;
    }

    return questionBank.validateAnswer(session.currentCivicsQuestion.id, userAnswer);
  }

  /**
   * Genera evaluación de fluidez básica (fallback)
   */
  generateBasicFluencyEvaluation(userAnswer: string): FluencyEvaluation {
    const length = userAnswer.trim().length;
    let score = 5; // Base score
    
    // Ajustar score basado en longitud y complejidad
    if (length > 20) score += 1;
    if (length > 50) score += 1;
    if (length < 5) score -= 2;

    const suggestions = [
      'Intenta responder con oraciones completas.',
      'Habla más claro y pausado.',
      'Practica la pronunciación de palabras clave.',
      'Mantén tus respuestas concisas pero completas.',
    ];

    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

    return {
      puntaje_pronunciacion_y_gramatica: `${Math.max(1, Math.min(10, score))}/10`,
      mejora_sugerida: randomSuggestion,
    };
  }
}

// Singleton instance
export const uscisInterviewEngine = new USCISInterviewEngine();

