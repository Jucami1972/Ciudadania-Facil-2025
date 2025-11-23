/**
 * USCISInterviewEngine - Motor de control de etapas de la entrevista
 * 
 * Controla el flujo completo de la entrevista N-400 según protocolo oficial USCIS:
 * greeting -> swearing_in -> identity -> n400_biographical -> n400_residence -> 
 * oath -> civics -> reading -> writing -> n400_moral_character -> 
 * loyalty_oath -> review_signature -> closing
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
      // Fase 1: Bienvenida y Juramento Inicial
      case 'greeting':
        return 'swearing_in';
      
      case 'swearing_in':
        return 'identity';
      
      // Verificación de identidad
      case 'identity':
        return 'n400_biographical';
      
      // Fase 2: N-400 Datos Biográficos
      case 'n400_biographical':
        // Contar preguntas biográficas si existe tracking específico
        // Por ahora, avanzar después de verificar identidad
        return 'n400_residence';
      
      // Fase 3: N-400 Domicilios, Empleo y Viajes
      case 'n400_residence':
        if (session.n400QuestionsAsked >= session.totalN400Questions) {
          return 'oath';
        }
        return null; // Continuar en la misma etapa si no se alcanzó el límite
      
      // Juramento antes de las pruebas
      case 'oath':
        return 'civics';
      
      // Fase 4: Pruebas de Inglés y Cívicas
      case 'civics':
        if (session.civicsQuestionsAsked >= session.totalCivicsQuestions) {
          return 'reading';
        }
        return null; // Continuar en la misma etapa si no se completaron las 10 preguntas
      
      case 'reading':
        return 'writing';
      
      case 'writing':
        return 'n400_moral_character';
      
      // Fase 5: N-400 Carácter Moral
      case 'n400_moral_character':
        // Continuar hasta completar preguntas de carácter moral
        // Por ahora, avanzar después de un número determinado de preguntas
        return 'loyalty_oath';
      
      // Fase 6: Lealtad y Juramento Final
      case 'loyalty_oath':
        return 'review_signature';
      
      // Fase 7: Revisión Final y Firma
      case 'review_signature':
        return 'closing';
      
      // Fase 8: Resultados y Despedida
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
   * Prioriza preguntas importantes (asterisk: true) pero mantiene aleatoriedad
   */
  selectNextCivicsQuestion(sessionId: string): { id: number; questionEn: string; answerEn: string | string[] } | null {
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return null;
    }

    // Priorizar preguntas importantes (asterisk: true) pero mantener aleatoriedad
    // Las primeras preguntas tienen mayor probabilidad de ser importantes
    const questionsAsked = session.civicsQuestionsAsked || 0;
    const prioritizeImportant = questionsAsked < 3; // Priorizar en las primeras 3 preguntas
    
    const question = questionBank.getRandomQuestion(session.civicsQuestionsUsed, prioritizeImportant);
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

