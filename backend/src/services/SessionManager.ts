/**
 * SessionManager - Manejo de sesiones en memoria (MVP)
 * 
 * En producción, esto se puede migrar a Redis fácilmente
 */

import { InterviewSession, InterviewContext } from '../types';

export class SessionManager {
  private sessions: Map<string, InterviewSession> = new Map();

  /**
   * Crea una nueva sesión de entrevista
   */
  createSession(context: InterviewContext): InterviewSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: InterviewSession = {
      sessionId,
      context,
      messages: [],
      stage: 'greeting',
      questionsAsked: 0,
      totalQuestions: 20,
      n400QuestionsAsked: 0,
      totalN400Questions: context.n400FormData ? 6 : 3,
      civicsQuestionsAsked: 0,
      totalCivicsQuestions: 10,
      civicsQuestionsUsed: [],
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Obtiene una sesión por ID
   */
  getSession(sessionId: string): InterviewSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Actualiza una sesión
   */
  updateSession(sessionId: string, updates: Partial<InterviewSession>): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    Object.assign(session, updates);
    this.sessions.set(sessionId, session);
  }

  /**
   * Elimina una sesión
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Obtiene todos los mensajes de una sesión
   */
  getSessionMessages(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    return session.messages;
  }

  /**
   * Agrega un mensaje a la sesión
   */
  addMessage(sessionId: string, message: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    session.messages.push(message);
  }

  /**
   * Limpia sesiones antiguas (opcional, para evitar memory leaks)
   */
  cleanupOldSessions(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      const sessionAge = now - new Date(session.messages[0]?.timestamp || now).getTime();
      if (sessionAge > maxAge) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

