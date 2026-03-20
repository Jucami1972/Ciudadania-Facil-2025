// src/services/aiInterviewN400Service.ts

/**
 * Servicio avanzado de Entrevista AI
 * Simula un oficial de inmigración USCIS entrenado con datos del formulario N-400
 * 
 * NOTA: Este servicio funciona con o sin OpenAI API.
 * Si tienes EXPO_PUBLIC_OPENAI_API_KEY configurada, usará GPT-4o-mini.
 * Si no, usará respuestas predefinidas inteligentes.
 * 
 * También puede usar el backend si USE_BACKEND está habilitado.
 */

import { USE_BACKEND, BACKEND_URL, BACKEND_TIMEOUT } from '../constants/backend';

// Estructura completa del formulario N-400
export interface N400FormData {
  // Información Personal
  fullName?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  countryOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  spouseName?: string;
  children?: Array<{ name: string; dateOfBirth: string }>;
  
  // Información de Residencia
  currentAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  yearsInUS?: number;
  monthsInUS?: number;
  previousAddresses?: Array<{ address: string; dates: string }>;
  
  // Información de Trabajo
  currentOccupation?: string;
  employerName?: string;
  employmentHistory?: Array<{ employer: string; dates: string }>;
  
  // Información de Viajes
  tripsOutsideUS?: Array<{ destination: string; dates: string; duration: string }>;
  
  // Información Legal
  arrests?: boolean;
  criminalHistory?: Array<{ offense: string; date: string; outcome: string }>;
  taxReturns?: boolean;
  
  // Información de Ciudadanía
  parentsCitizenship?: string;
  militaryService?: boolean;
  selectiveService?: boolean;
  
  // Información de Idioma
  englishProficiency?: string;
  educationLevel?: string;
  
  // Otros campos del N-400
  [key: string]: any;
}

export interface InterviewContext {
  applicantName: string;
  applicantAge?: number;
  countryOfOrigin?: string;
  yearsInUS?: number;
  currentOccupation?: string;
  maritalStatus?: string;
  children?: number;
  n400FormData?: N400FormData; // Datos completos del formulario N-400
}

interface InterviewMessage {
  role: 'officer' | 'applicant' | 'system';
  content: string;
  timestamp: Date;
  shouldSpeak?: boolean; // Indica si el mensaje debe hablarse automáticamente
  fluencyEvaluation?: FluencyEvaluation; // Evaluación de fluidez (opcional)
}

// Tipos de estado de la entrevista
export type InterviewStage = 
  | 'VERIFICACION_IDENTIDAD' 
  | 'REVISION_N400' 
  | 'PREGUNTA_CIVICA' 
  | 'PRUEBA_LECTURA'
  | 'PRUEBA_ESCRITURA'
  | 'CIERRE';

// Evaluación de fluidez del usuario
export interface FluencyEvaluation {
  puntaje_pronunciacion_y_gramatica: string; // Formato: "X/10"
  mejora_sugerida: string; // Sugerencia en español
}

// Respuesta JSON estructurada del oficial
export interface OfficerResponseJSON {
  respuesta_oficial: string; // La pregunta/declaración del oficial (en inglés)
  evaluacion_fluidez: FluencyEvaluation; // Evaluación de la respuesta del usuario
  estado_entrevista: InterviewStage; // Estado actual de la entrevista
}

interface InterviewSession {
  sessionId: string;
  context: InterviewContext;
  messages: InterviewMessage[];
  stage: 'greeting' | 'identity' | 'n400_review' | 'oath' | 'civics' | 'reading' | 'writing' | 'closing';
  questionsAsked: number;
  totalQuestions: number;
  n400QuestionsAsked: number;
  totalN400Questions: number;
  civicsQuestionsAsked: number;
  totalCivicsQuestions: number;
  currentCivicsQuestion?: { id: number; question: string; answer: string };
}

class AIInterviewN400Service {
  private sessions: Map<string, InterviewSession> = new Map();

  constructor() {
    // El cliente de OpenAI se inicializará dinámicamente cuando se necesite
    if (__DEV__) {
      if (USE_BACKEND) {
        console.log('✅ Backend mode enabled:', BACKEND_URL);
      } else {
        console.log('ℹ️ Using local service (backend disabled)');
      }
    }
  }

  /**
   * Verifica si el backend está disponible
   */
  private async isBackendAvailable(): Promise<boolean> {
    if (!USE_BACKEND) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout

      const response = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      if (__DEV__) {
        console.warn('⚠️ Backend no disponible, usando servicio local:', error);
      }
      return false;
    }
  }

  /**
   * Llama al backend para inicializar la sesión
   */
  private async initBackendSession(context: InterviewContext): Promise<InterviewSession | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

      const response = await fetch(`${BACKEND_URL}/interview/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();

      // Crear sesión local compatible
      const session: InterviewSession = {
        sessionId: data.sessionId,
        context,
        messages: [
          {
            role: 'officer',
            content: data.officerResponse,
            timestamp: new Date(),
            shouldSpeak: data.shouldSpeak,
            fluencyEvaluation: data.fluencyEvaluation,
          },
        ],
        stage: data.estado_entrevista,
        questionsAsked: 0,
        totalQuestions: 20,
        n400QuestionsAsked: 0,
        totalN400Questions: context.n400FormData ? 6 : 3,
        civicsQuestionsAsked: 0,
        totalCivicsQuestions: 10,
      };

      this.sessions.set(session.sessionId, session);
      return session;
    } catch (error) {
      if (__DEV__) {
        console.error('Error calling backend init:', error);
      }
      return null;
    }
  }

  /**
   * Llama al backend para procesar una respuesta
   */
  private async processBackendResponse(
    sessionId: string,
    response: string
  ): Promise<InterviewMessage | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

      const backendResponse = await fetch(`${BACKEND_URL}/interview/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, response }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!backendResponse.ok) {
        throw new Error(`Backend error: ${backendResponse.status}`);
      }

      const data = await backendResponse.json();

      // Actualizar sesión local
      const session = this.sessions.get(sessionId);
      if (session) {
        session.messages.push({
          role: 'applicant',
          content: response,
          timestamp: new Date(),
        });

        const officerMessage: InterviewMessage = {
          role: 'officer',
          content: data.officerResponse,
          timestamp: new Date(),
          shouldSpeak: data.shouldSpeak,
          fluencyEvaluation: data.fluencyEvaluation,
        };

        session.messages.push(officerMessage);
        session.stage = data.estado_entrevista;

        if (data.pregunta_id && session.currentCivicsQuestion) {
          session.currentCivicsQuestion.id = data.pregunta_id;
        }

        if (data.isCorrect !== undefined) {
          // Actualizar contadores si es necesario
          if (session.stage === 'civics') {
            session.civicsQuestionsAsked += 1;
          }
        }
      }

      return {
        role: 'officer',
        content: data.officerResponse,
        timestamp: new Date(),
        shouldSpeak: data.shouldSpeak,
        fluencyEvaluation: data.fluencyEvaluation,
      };
    } catch (error) {
      if (__DEV__) {
        console.error('Error calling backend respond:', error);
      }
      return null;
    }
  }

  /**
   * Llama al backend para generar mensaje automático
   */
  private async generateBackendAutoMessage(sessionId: string): Promise<InterviewMessage | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

      const response = await fetch(`${BACKEND_URL}/interview/auto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();

      // Actualizar sesión local
      const session = this.sessions.get(sessionId);
      if (session) {
        const message: InterviewMessage = {
          role: 'officer',
          content: data.officerResponse,
          timestamp: new Date(),
          shouldSpeak: data.shouldSpeak,
          fluencyEvaluation: data.fluencyEvaluation,
        };

        session.messages.push(message);
        session.stage = data.estado_entrevista;
      }

      return {
        role: 'officer',
        content: data.officerResponse,
        timestamp: new Date(),
        shouldSpeak: data.shouldSpeak,
        fluencyEvaluation: data.fluencyEvaluation,
      };
    } catch (error) {
      if (__DEV__) {
        console.error('Error calling backend auto:', error);
      }
      return null;
    }
  }

  /**
   * Verifica si OpenAI está disponible
   */
  private isOpenAIAvailable(): boolean {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    const isAvailable = !!apiKey && apiKey.trim().length > 0;
    
    if (__DEV__) {
      if (isAvailable) {
        console.log('✅ OpenAI API Key detectada');
      } else {
        console.warn('⚠️ OpenAI API Key no encontrada. Usando respuestas predefinidas.');
      }
    }
    
    return isAvailable;
  }

  /**
   * Llama a la API de OpenAI usando fetch (más compatible con React Native)
   */
  private async callOpenAIAPI(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  ): Promise<string | null> {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      return null;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: 0.7,
          max_tokens: 400,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorCode = errorData?.error?.code;
        const errorType = errorData?.error?.type;
        const isQuotaError = response.status === 429 && (errorCode === 'insufficient_quota' || errorType === 'insufficient_quota');
        
        // Manejar error de cuota insuficiente específicamente
        if (isQuotaError) {
          // Solo mostrar un mensaje informativo claro, sin detalles de error innecesarios
          if (__DEV__) {
            console.warn('⚠️ OpenAI API: Cuota insuficiente. Se usará respuesta predefinida automáticamente.');
            console.warn('💡 Para resolver: Verifica tu plan y facturación en https://platform.openai.com/account/billing');
          }
          // Retornar null para activar fallback predefinido (sin log de error detallado)
          return null;
        }
        
        // Para otros errores (no cuota), mostrar log completo para debugging
        console.error('❌ Error en OpenAI API:', response.status, errorData);
        if (__DEV__) {
          console.error('Error details:', JSON.stringify(errorData, null, 2));
        }
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (__DEV__ && content) {
        console.log('✅ Respuesta de OpenAI recibida:', content.substring(0, 100) + '...');
      }
      
      return content ? content.trim() : null;
    } catch (error) {
      console.error('Error llamando a OpenAI API:', error);
      return null;
    }
  }

  /**
   * Inicia una nueva sesión de entrevista
   */
  async initializeSession(context: InterviewContext): Promise<InterviewSession> {
    // Intentar usar backend si está habilitado
    if (USE_BACKEND) {
      const backendAvailable = await this.isBackendAvailable();
      if (backendAvailable) {
        const backendSession = await this.initBackendSession(context);
        if (backendSession) {
          return backendSession;
        }
        // Si falla, continuar con servicio local
        if (__DEV__) {
          console.warn('⚠️ Backend falló, usando servicio local');
        }
      }
    }

    // Servicio local (código original)
    const sessionId = `session_${Date.now()}`;
    
    const session: InterviewSession = {
      sessionId,
      context,
      messages: [],
      stage: 'greeting',
      questionsAsked: 0,
      totalQuestions: 20, // Total de preguntas (N-400 + civismo)
      n400QuestionsAsked: 0,
      totalN400Questions: context.n400FormData ? 6 : 3, // Más preguntas si hay N-400
      civicsQuestionsAsked: 0,
      totalCivicsQuestions: 10, // 10 preguntas de civismo
    };

    this.sessions.set(sessionId, session);

    // Generar saludo inicial del oficial (se habla automáticamente)
    const contextInfo = this.buildApplicantProfile(context);
    const greetingResponse = await this.generateOfficerMessage(
      sessionId,
      `Greet the applicant ${context.applicantName} warmly but professionally. Introduce yourself by a realistic name (e.g. "Officer Johnson", "Officer Martinez"). Briefly outline what will happen during the interview: identity verification, form review, oath, civics test, and English reading/writing tests. Make small talk to put the applicant at ease — you might comment on the weather, ask how their day is going, or mention you appreciate them coming in on time. Keep it natural and conversational, not scripted.\n\nApplicant profile:\n${contextInfo}`,
      undefined
    );

    const greetingMessage: InterviewMessage = {
      role: 'officer',
      content: greetingResponse.respuesta_oficial,
      timestamp: new Date(),
      shouldSpeak: true, // SIEMPRE se habla automáticamente
      fluencyEvaluation: greetingResponse.evaluacion_fluidez,
    };

    session.messages.push(greetingMessage);

    return session;
  }

  /**
   * Genera el siguiente mensaje automático del oficial (sin esperar respuesta)
   * Útil para transiciones entre etapas
   */
  async generateNextAutomaticMessage(sessionId: string): Promise<InterviewMessage | null> {
    // Intentar usar backend si está habilitado
    if (USE_BACKEND) {
      const backendAvailable = await this.isBackendAvailable();
      if (backendAvailable) {
        const backendMessage = await this.generateBackendAutoMessage(sessionId);
        if (backendMessage) {
          return backendMessage;
        }
        // Si falla, continuar con servicio local
        if (__DEV__) {
          console.warn('⚠️ Backend falló, usando servicio local');
        }
      }
    }

    // Servicio local (código original)
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Sesión no encontrada');
    }

    let message: InterviewMessage | null = null;

    // Transiciones automáticas entre etapas
    switch (session.stage) {
      case 'greeting':
        session.stage = 'identity';
        message = {
          role: 'officer',
          content: await this.generateIdentityVerification(sessionId),
          timestamp: new Date(),
          shouldSpeak: true,
        };
        break;
      case 'identity':
        if (session.context.n400FormData) {
          session.stage = 'n400_review';
          message = {
            role: 'officer',
            content: await this.generateN400ReviewStart(sessionId),
            timestamp: new Date(),
            shouldSpeak: true,
          };
        } else {
          session.stage = 'oath';
          message = {
            role: 'officer',
            content: await this.generateOathPrompt(sessionId),
            timestamp: new Date(),
            shouldSpeak: true,
          };
        }
        break;
      case 'n400_review':
        if (session.n400QuestionsAsked >= session.totalN400Questions) {
          session.stage = 'oath';
          message = {
            role: 'officer',
            content: await this.generateOathPrompt(sessionId),
            timestamp: new Date(),
            shouldSpeak: true,
          };
        }
        break;
      case 'oath':
        session.stage = 'civics';
        message = {
          role: 'officer',
          content: await this.generateFirstCivicsQuestion(sessionId),
          timestamp: new Date(),
          shouldSpeak: true,
        };
        break;
      case 'civics':
        if (session.civicsQuestionsAsked >= session.totalCivicsQuestions) {
          session.stage = 'reading';
          message = {
            role: 'officer',
            content: await this.generateReadingTest(sessionId),
            timestamp: new Date(),
            shouldSpeak: true,
          };
        }
        break;
      case 'reading':
        session.stage = 'writing';
        message = {
          role: 'officer',
          content: await this.generateWritingTest(sessionId),
          timestamp: new Date(),
          shouldSpeak: true,
        };
        break;
      case 'writing':
        session.stage = 'closing';
        message = {
          role: 'officer',
          content: await this.generateClosingStatement(sessionId),
          timestamp: new Date(),
          shouldSpeak: true,
        };
        break;
    }

    if (message) {
      session.messages.push(message);
    }

    return message;
  }

  /**
   * Procesa la respuesta del solicitante y genera la siguiente pregunta del oficial
   */
  async processApplicantResponse(
    sessionId: string,
    applicantResponse: string
  ): Promise<{ officerResponse: string; isCorrect?: boolean; feedback?: string; shouldSpeak?: boolean; fluencyEvaluation?: FluencyEvaluation }> {
    // Intentar usar backend si está habilitado
    if (USE_BACKEND) {
      const backendAvailable = await this.isBackendAvailable();
      if (backendAvailable) {
        const backendMessage = await this.processBackendResponse(sessionId, applicantResponse);
        if (backendMessage) {
          return {
            officerResponse: backendMessage.content,
            shouldSpeak: backendMessage.shouldSpeak ?? true,
            fluencyEvaluation: backendMessage.fluencyEvaluation,
          };
        }
        // Si falla, continuar con servicio local
        if (__DEV__) {
          console.warn('⚠️ Backend falló, usando servicio local');
        }
      }
    }

    // Servicio local (código original)
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Sesión no encontrada');
    }

    // Agregar respuesta del solicitante
    session.messages.push({
      role: 'applicant',
      content: applicantResponse,
      timestamp: new Date(),
    });

    let officerResponse = '';
    let isCorrect: boolean | undefined = undefined;
    let feedback: string | undefined = undefined;
    let fluencyEvaluation: FluencyEvaluation | undefined = undefined;

    // Manejar diferentes etapas de la entrevista
    switch (session.stage) {
      case 'identity': {
        const jsonResponse = await this.generateOfficerMessage(
          sessionId,
          `The applicant just responded to your identity verification question. Acknowledge their answer naturally. If something seems off or incomplete, ask a clarifying follow-up. If the info checks out, confirm it casually (e.g. "Great, that matches what I have here") and smoothly transition to the next part. Don't just say "proceed to next stage" — act like a real officer reviewing a file. You might flip through papers, mention you're checking their record on the computer, etc.`,
          applicantResponse
        );
        officerResponse = jsonResponse.respuesta_oficial;
        fluencyEvaluation = jsonResponse.evaluacion_fluidez;
        break;
      }
      case 'n400_review': {
        const n400Data = session.context.n400FormData;
        const n400Context = n400Data ? this.buildN400QuestionContext(n400Data, session.n400QuestionsAsked) : '';
        const jsonResponse = await this.generateOfficerMessage(
          sessionId,
          `You are reviewing the applicant's N-400 form. This is question ${session.n400QuestionsAsked + 1} of ${session.totalN400Questions}.\n\nFirst, react naturally to their previous answer — confirm it, express mild curiosity, or ask a brief follow-up if something is interesting or potentially inconsistent. Then ask the NEXT question about a DIFFERENT topic from the form.\n\n${n400Context}\n\nBe conversational. Real officers don't just fire questions — they comment, they follow up, they show genuine curiosity. If the applicant mentions travel, ask where they went. If they mention work, ask what they do. Vary your phrasing each time.`,
          applicantResponse
        );
        officerResponse = jsonResponse.respuesta_oficial;
        fluencyEvaluation = jsonResponse.evaluacion_fluidez;
        session.n400QuestionsAsked++;
        break;
      }
      case 'oath': {
        const jsonResponse = await this.generateOfficerMessage(
          sessionId,
          `The applicant has just responded regarding the oath of allegiance. If they confirmed willingness to take it, thank them sincerely and say something encouraging like "That's an important commitment" or "Good, we take this very seriously." Then naturally transition to the civics test by saying something like "Now let's move on to the civics portion" or "Alright, let's test your knowledge of US history and government." Make the transition feel natural, not robotic.`,
          applicantResponse
        );
        officerResponse = jsonResponse.respuesta_oficial;
        fluencyEvaluation = jsonResponse.evaluacion_fluidez;
        break;
      }
      case 'civics': {
        const civicsResult = await this.generateNextCivicsQuestion(sessionId, applicantResponse);
        officerResponse = civicsResult.question;
        isCorrect = civicsResult.isCorrect;
        feedback = civicsResult.feedback;
        fluencyEvaluation = civicsResult.fluencyEvaluation;
        session.civicsQuestionsAsked++;
        break;
      }
      case 'reading': {
        const jsonResponse = await this.generateOfficerMessage(
          sessionId,
          `The applicant just attempted to read a sentence aloud. They said: "${applicantResponse}". Evaluate whether they read it correctly and clearly. Comment on their reading — if it was good, say something encouraging like "Very good, nice and clear." If there were issues, gently point them out. Then naturally transition to the writing test. You might say "Now I'm going to dictate a sentence, and I'd like you to write it down for me."`,
          applicantResponse
        );
        officerResponse = jsonResponse.respuesta_oficial;
        fluencyEvaluation = jsonResponse.evaluacion_fluidez;
        isCorrect = applicantResponse.length > 10;
        break;
      }
      case 'writing': {
        const jsonResponse = await this.generateOfficerMessage(
          sessionId,
          `The applicant just wrote down a dictated sentence. They wrote: "${applicantResponse}". Evaluate their writing — check for correctness and completeness. If it's good, congratulate them. If there are minor errors, be encouraging but note them. Then transition to closing the interview naturally. You might say "Alright, that wraps up the English portion" or "Good job on the writing test."`,
          applicantResponse
        );
        officerResponse = jsonResponse.respuesta_oficial;
        fluencyEvaluation = jsonResponse.evaluacion_fluidez;
        isCorrect = applicantResponse.length > 10;
        break;
      }
      case 'closing':
        officerResponse = 'The interview has concluded. Thank you for your time.';
        break;
      default:
        officerResponse = 'Thank you for your response.';
    }

    const message: InterviewMessage = {
      role: 'officer',
      content: officerResponse,
      timestamp: new Date(),
      shouldSpeak: true, // Todos los mensajes del oficial se hablan
      fluencyEvaluation: fluencyEvaluation,
    };

    session.messages.push(message);

    return { officerResponse, isCorrect, feedback, shouldSpeak: true, fluencyEvaluation };
  }

  /**
   * Carga y procesa datos del formulario N-400
   */
  async loadN400FormData(
    sessionId: string,
    formData: N400FormData
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Sesión no encontrada');
    }

    session.context.n400FormData = formData;
    // Actualizar el contexto con los datos del formulario
    if (formData.fullName) session.context.applicantName = formData.fullName;
    if (formData.dateOfBirth) {
      const birthYear = new Date(formData.dateOfBirth).getFullYear();
      session.context.applicantAge = new Date().getFullYear() - birthYear;
    }
    if (formData.countryOfBirth) session.context.countryOfOrigin = formData.countryOfBirth;
    if (formData.yearsInUS) session.context.yearsInUS = formData.yearsInUS;
    if (formData.currentOccupation) session.context.currentOccupation = formData.currentOccupation;
    if (formData.maritalStatus) session.context.maritalStatus = formData.maritalStatus;
    if (formData.children) session.context.children = formData.children.length;
    
    // Ajustar el número de preguntas N-400 si hay datos
    session.totalN400Questions = 6;
  }

  /**
   * Construye un perfil textual del aplicante para incluir en prompts
   */
  private buildApplicantProfile(context: InterviewContext): string {
    const lines: string[] = [];
    lines.push(`Name: ${context.applicantName}`);
    if (context.applicantAge) lines.push(`Age: ${context.applicantAge}`);
    if (context.countryOfOrigin && context.countryOfOrigin !== 'Desconocido') lines.push(`Country of origin: ${context.countryOfOrigin}`);
    if (context.yearsInUS) lines.push(`Years in the US: ${context.yearsInUS}`);
    if (context.currentOccupation && context.currentOccupation !== 'Desconocido') lines.push(`Occupation: ${context.currentOccupation}`);
    if (context.maritalStatus && context.maritalStatus !== 'Desconocido') lines.push(`Marital status: ${context.maritalStatus}`);
    if (context.children !== undefined) lines.push(`Children: ${context.children}`);
    if (context.n400FormData) {
      const f = context.n400FormData;
      if (f.currentAddress) lines.push(`Address: ${f.currentAddress}, ${f.city || ''} ${f.state || ''}`);
      if (f.tripsOutsideUS?.length) lines.push(`Trips outside US: ${f.tripsOutsideUS.length} trip(s)`);
      if (f.arrests) lines.push(`Has arrest history: yes`);
      if (f.criminalHistory?.length) lines.push(`Criminal history entries: ${f.criminalHistory.length}`);
      if (f.militaryService) lines.push(`Military service: yes`);
    }
    return lines.join('\n');
  }

  /**
   * Construye contexto específico para preguntas del N-400 basado en qué ya se preguntó
   */
  private buildN400QuestionContext(n400Data: N400FormData, questionsAsked: number): string {
    const topics = [
      { topic: 'current address and how long they have lived there', data: n400Data.currentAddress },
      { topic: 'employment — current job, employer, what they do', data: n400Data.currentOccupation },
      { topic: 'marital status and spouse details', data: n400Data.maritalStatus },
      { topic: 'children — names, ages, citizenship status', data: n400Data.children },
      { topic: 'travel outside the US — destinations, duration, reasons', data: n400Data.tripsOutsideUS },
      { topic: 'tax filing history and any issues', data: n400Data.taxReturns },
      { topic: 'criminal or legal history — arrests, citations, tickets', data: n400Data.arrests },
      { topic: 'previous addresses in the last 5 years', data: n400Data.previousAddresses },
      { topic: 'military or selective service registration', data: n400Data.militaryService },
      { topic: 'employment history over the last 5 years', data: n400Data.employmentHistory },
    ];

    const nextTopic = topics[questionsAsked % topics.length];
    const alreadyCovered = topics.slice(0, questionsAsked).map(t => t.topic).join(', ');

    let context = `Suggested next topic: ${nextTopic.topic}`;
    if (alreadyCovered) context += `\nTopics already covered: ${alreadyCovered}`;
    context += `\nDo NOT repeat a topic already covered. Ask about something new.`;
    return context;
  }

  /**
   * Genera verificación de identidad
   */
  private async generateIdentityVerification(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Sesión no encontrada');

    const prompt = `Now begin identity verification. Ask the applicant to confirm their full legal name as it appears on their green card, and their date of birth. You might also ask them to confirm their A-number or show their green card. Make it feel natural — like you're just double-checking your paperwork. You could say something like "Alright, let's get started. Can you state your full name for me?" or "Before we begin, I just need to verify a few things."\n\nApplicant: ${session.context.applicantName}`;

    const response = await this.generateOfficerMessage(sessionId, prompt, undefined);
    return response.respuesta_oficial;
  }

  /**
   * Genera seguimiento de verificación de identidad
   */
  private async generateIdentityFollowUp(sessionId: string, response: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Sesión no encontrada');

    const prompt = `You are a professional USCIS immigration officer. Confirm that the information is correct and proceed to the next stage. If there is N-400 form data, mention that you will review the form.`;

    const jsonResponse = await this.generateOfficerMessage(sessionId, prompt, response);
    return jsonResponse.respuesta_oficial;
  }

  /**
   * Genera inicio de revisión del N-400
   */
  private async generateN400ReviewStart(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Sesión no encontrada');

    const n400Data = session.context.n400FormData;
    if (!n400Data) {
      return 'Let\'s continue with the interview.';
    }

    const prompt = `Transition naturally to the N-400 form review. You have the applicant's form in front of you. Mention that you'll be going through some of the information they submitted to make sure everything is current and accurate. Start with an easy, non-threatening question — like confirming their current address, or asking about their current job. Make it conversational: "I have your application here, let me just go through a few things with you..." or "Okay, I'm looking at your N-400 now. Let's make sure everything is up to date."\n\nApplicant: ${session.context.applicantName}`;

    const response = await this.generateOfficerMessage(sessionId, prompt, undefined);
    return response.respuesta_oficial;
  }

  /**
   * Genera pregunta sobre el formulario N-400
   */
  private async generateN400Question(sessionId: string, previousResponse: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Sesión no encontrada');

    const n400Data = session.context.n400FormData;
    if (!n400Data) {
      const civicsResponse = await this.generateFirstCivicsQuestion(sessionId);
      return civicsResponse;
    }

    const questions = [
      { field: 'currentAddress', question: 'Can you confirm your current address?' },
      { field: 'currentOccupation', question: 'What is your current occupation?' },
      { field: 'maritalStatus', question: 'What is your marital status?' },
      { field: 'children', question: 'Do you have children? If so, how many?' },
      { field: 'tripsOutsideUS', question: 'Have you traveled outside the United States since you filed your application?' },
      { field: 'taxReturns', question: 'Have you filed your tax returns?' },
    ];

    const questionIndex = session.n400QuestionsAsked % questions.length;
    const selectedQuestion = questions[questionIndex];

    const prompt = `You are a professional USCIS immigration officer conducting a naturalization interview. Now ask the next question about the N-400 form: "${selectedQuestion.question}". If you have form data, verify that the response matches.`;

    const jsonResponse = await this.generateOfficerMessage(sessionId, prompt, previousResponse);
    return jsonResponse.respuesta_oficial;
  }

  /**
   * Genera el prompt del juramento de lealtad completo
   */
  private async generateOathPrompt(sessionId: string): Promise<string> {
    const oathText = `"I hereby declare, on oath, that I absolutely and entirely renounce and abjure all allegiance and fidelity to any foreign prince, potentate, state, or sovereignty, of whom or which I have heretofore been a subject or citizen; that I will support and defend the Constitution and laws of the United States of America against all enemies, foreign and domestic; that I will bear true faith and allegiance to the same; that I will bear arms on behalf of the United States when required by the law; that I will perform noncombatant service in the Armed Forces of the United States when required by the law; that I will perform work of national importance under civilian direction when required by the law; and that I take this obligation freely, without any mental reservation or purpose of evasion; so help me God."`;

    const prompt = `It's time for the Oath of Allegiance. Introduce it naturally — explain that this is an important and solemn part of the process. You might say something like "Now, before we continue, there's something very important I need to go over with you" or "This next part is the oath. I want you to listen carefully." Read the oath or present it, and ask if they understand and are willing to take it. Be respectful and serious but not intimidating.`;

    const response = await this.generateOfficerMessage(sessionId, prompt, undefined);
    return `${response.respuesta_oficial}\n\n${oathText}`;
  }

  /**
   * Genera confirmación del juramento
   */
  private async generateOathConfirmation(sessionId: string, response: string): Promise<string> {
    const prompt = `You are a professional USCIS immigration officer. The applicant has taken or confirmed the oath of allegiance. Thank them for their commitment and proceed to the civics questions section.`;

    const jsonResponse = await this.generateOfficerMessage(sessionId, prompt, response);
    return jsonResponse.respuesta_oficial;
  }

  /**
   * Genera la primera pregunta de civismo
   */
  private async generateFirstCivicsQuestion(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Sesión no encontrada');

    const prompt = `Transition to the civics test portion. Make it feel natural — you could say "Alright, now we're going to do the civics portion. I'll ask you up to 10 questions about US history and government. You need to get at least 6 right to pass." Then ask the FIRST civics question. Choose from official USCIS 100 questions. Phrase it conversationally — not like reading from a test sheet. For example, instead of "What is the supreme law of the land?" you might say "Let's start with an easy one — can you tell me what the supreme law of the land is?"`;

    const response = await this.generateOfficerMessage(sessionId, prompt, undefined);
    return response.respuesta_oficial;
  }

  /**
   * Normaliza una respuesta que puede ser string o array de strings a string
   */
  private normalizeAnswer(answer: string | string[]): string {
    if (Array.isArray(answer)) {
      return answer.join('\n');
    }
    return answer;
  }

  /**
   * Genera la siguiente pregunta de civismo basada en la respuesta anterior
   */
  private async generateNextCivicsQuestion(
    sessionId: string,
    applicantResponse: string
  ): Promise<{ question: string; isCorrect?: boolean; feedback?: string; fluencyEvaluation?: FluencyEvaluation }> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Sesión no encontrada');

    // Importar preguntas reales
    const { questions } = await import('../data/questions');
    
    // Seleccionar una pregunta aleatoria que no se haya usado
    const availableQuestions = questions.filter(q => 
      !session.messages.some(m => 
        m.role === 'officer' && m.content.includes(q.questionEs)
      )
    );
    
    const randomQuestion = availableQuestions[
      Math.floor(Math.random() * availableQuestions.length)
    ] || questions[0];

    // Normalizar respuestas a strings
    const answerEs = this.normalizeAnswer(randomQuestion.answerEs);
    const answerEn = this.normalizeAnswer(randomQuestion.answerEn);

    session.currentCivicsQuestion = {
      id: randomQuestion.id,
      question: randomQuestion.questionEs,
      answer: answerEs,
    };

    const conversationHistory = session.messages
      .slice(-10)
      .map((m) => {
        if (m.role === 'officer') return `Oficial: ${m.content}`;
        if (m.role === 'applicant') return `Solicitante: ${m.content}`;
        return '';
      })
      .filter(Boolean)
      .join('\n');

    const prompt = `This is civics question ${session.civicsQuestionsAsked + 1} of ${session.totalCivicsQuestions}.\n\nThe applicant just answered the previous civics question. The correct answer was: "${answerEn}".\n\nFirst, evaluate their answer. If correct, react positively and naturally — "That's right!", "Good job!", "Exactly." Vary your reactions. If wrong, be gentle: "Not quite", "Close, but..." and briefly mention the correct answer.\n\nThen ask the NEXT civics question: "${randomQuestion.questionEn}"\n\nPhrase it conversationally, not like reading from a card. For example:\n- "Okay, next one — ${randomQuestion.questionEn}"\n- "Alright, let me ask you this — ${randomQuestion.questionEn}"\n- "Here's another one for you — ${randomQuestion.questionEn}"`;

    const jsonResponse = await this.generateOfficerMessage(sessionId, prompt, applicantResponse);
    
    // Evaluación simple de la respuesta
    // answerEn ya está normalizado con normalizeAnswer(), así que es string
    const answerEnString = answerEn; // Ya es string por normalizeAnswer()
    const isCorrect = this.evaluateAnswer(applicantResponse, answerEnString);
    const firstLineOfAnswer = answerEnString.split('\n')[0];
    const feedback = jsonResponse.evaluacion_fluidez.mejora_sugerida || (isCorrect 
      ? 'Correct.' 
      : 'The answer is not completely correct. The correct answer is: ' + firstLineOfAnswer);

    return { 
      question: jsonResponse.respuesta_oficial, 
      isCorrect, 
      feedback: jsonResponse.evaluacion_fluidez.mejora_sugerida,
      fluencyEvaluation: jsonResponse.evaluacion_fluidez
    };
  }

  /**
   * Evalúa si una respuesta es correcta (método simple)
   */
  private evaluateAnswer(userAnswer: string, correctAnswer: string): boolean {
    const userLower = userAnswer.toLowerCase().trim();
    const correctLower = correctAnswer.toLowerCase();
    
    // Extraer palabras clave de la respuesta correcta
    const keyWords = correctLower
      .split(/[,\n•]/)
      .map(w => w.trim())
      .filter(w => w.length > 3)
      .slice(0, 3); // Primeras 3 palabras clave
    
    // Verificar si al menos 2 palabras clave están en la respuesta del usuario
    const matches = keyWords.filter(keyword => userLower.includes(keyword));
    return matches.length >= 2;
  }

  /**
   * Genera prueba de lectura
   */
  private async generateReadingTest(sessionId: string): Promise<string> {
    const readingSentences = [
      'Abraham Lincoln was the President during the Civil War.',
      'The United States has fifty states.',
      'Congress meets in Washington, D.C.',
      'George Washington is the Father of Our Country.',
      'Citizens have the right to vote.',
      'The President lives in the White House.',
      'The American flag has red, white, and blue.',
      'People vote for the President in November.',
      'New York was the first capital of the United States.',
      'The capital of the United States is Washington, D.C.',
    ];

    const randomSentence = readingSentences[Math.floor(Math.random() * readingSentences.length)];

    const prompt = `Transition to the English reading test. Be natural about it — you might say something like "Okay, we're almost done. I just need to check your English reading ability. I'm going to show you a sentence, and I'd like you to read it out loud for me." Then present the sentence: "${randomSentence}". Don't make it feel like a big test — keep it casual and encouraging.`;

    const response = await this.generateOfficerMessage(sessionId, prompt, undefined);
    return `${response.respuesta_oficial}\n\n📖 Read this sentence aloud: "${randomSentence}"`;
  }

  /**
   * Genera resultado de prueba de lectura
   */
  private async generateReadingResult(sessionId: string, response: string): Promise<{ response: string; isCorrect: boolean }> {
    const prompt = `The applicant just read the sentence. They said: "${response}". Evaluate whether they read it correctly. Be encouraging even if there are minor errors. Comment naturally then transition to writing.`;

    const jsonResponse = await this.generateOfficerMessage(sessionId, prompt, response);
    const isCorrect = response.length > 10;

    return { response: jsonResponse.respuesta_oficial, isCorrect };
  }

  /**
   * Genera prueba de escritura
   */
  private async generateWritingTest(sessionId: string): Promise<string> {
    const writingSentences = [
      'Washington is the capital of the United States.',
      'The President lives in the White House.',
      'Congress makes the laws.',
      'We have freedom of speech.',
      'Independence Day is in July.',
      'Citizens can vote for President.',
      'Lincoln freed the slaves.',
      'The flag has fifty stars.',
      'Everyone must pay taxes.',
      'The United States has one hundred senators.',
    ];

    const randomSentence = writingSentences[Math.floor(Math.random() * writingSentences.length)];

    const prompt = `Now do the English writing test. Explain naturally that you'll say a sentence and they need to write it down. You might say "Alright, one more thing — I'm going to say a sentence, and I'd like you to write it down for me. Ready?" Then dictate the sentence: "${randomSentence}". Speak clearly since they need to write it.`;

    const response = await this.generateOfficerMessage(sessionId, prompt, undefined);
    return `${response.respuesta_oficial}\n\n✍️ Write this sentence: "${randomSentence}"`;
  }

  /**
   * Genera resultado de prueba de escritura
   */
  private async generateWritingResult(sessionId: string, response: string): Promise<{ response: string; isCorrect: boolean }> {
    const prompt = `The applicant wrote: "${response}". Check if it's correct or close enough. Be encouraging. Then transition to closing the interview naturally.`;

    const jsonResponse = await this.generateOfficerMessage(sessionId, prompt, response);
    const isCorrect = response.length > 10;

    return { response: jsonResponse.respuesta_oficial, isCorrect };
  }

  /**
   * Genera el mensaje de cierre de la entrevista
   */
  private async generateClosingStatement(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Sesión no encontrada');

    const prompt = `The interview is now complete. Close it naturally and professionally. Thank ${session.context.applicantName} personally for their time and patience. Give a brief summary of how they did (in general terms — don't give a score). Tell them they'll receive a decision by mail in the coming weeks. You might shake their hand (figuratively), wish them well, or say something warm like "I think you did great today" or "You should be proud of the effort you've put into this." Be human and encouraging.`;

    const response = await this.generateOfficerMessage(sessionId, prompt, undefined);
    return response.respuesta_oficial;
  }

  /**
   * Genera el prompt del sistema unificado con formato JSON
   */
  private getUnifiedJSONPrompt(
    contextPrompt: string,
    currentStage: InterviewSession['stage'],
    applicantResponse?: string
  ): string {
    // Mapear stage interno a estado de entrevista
    const stageMap: Record<InterviewSession['stage'], InterviewStage> = {
      'greeting': 'VERIFICACION_IDENTIDAD',
      'identity': 'VERIFICACION_IDENTIDAD',
      'n400_review': 'REVISION_N400',
      'oath': 'VERIFICACION_IDENTIDAD',
      'civics': 'PREGUNTA_CIVICA',
      'reading': 'PRUEBA_LECTURA',
      'writing': 'PRUEBA_ESCRITURA',
      'closing': 'CIERRE',
    };

    const estadoEntrevista = stageMap[currentStage] || 'VERIFICACION_IDENTIDAD';

    const unifiedPrompt = `**ROL:** You are a REAL USCIS Immigration Officer conducting a naturalization interview. You have a unique personality — you are professional but also human. You have your own name (pick one and keep it consistent). You've been doing this job for years. You are thorough but fair, and you genuinely want applicants to succeed.

**PERSONALITY GUIDELINES:**
- You are NOT a robot reading from a script. You are a real human officer.
- You make small talk, you react to answers, you show curiosity.
- If an answer is interesting, comment on it before moving on. ("Oh, you're from Colombia? Beautiful country.")
- If an answer is vague, probe deeper naturally. ("You said you traveled abroad — where exactly did you go?")
- Vary your phrasing. Never ask two questions the same way.
- Use filler language real officers use: "Okay", "Alright", "Let me check that", "Good", "I see", "Mmhmm".
- Show appropriate empathy for nervous applicants.
- Keep responses concise (2-4 sentences max for speaking aloud), but natural.

**INTERVIEW STRUCTURE:**
1. Identity Verification — Confirm name, DOB, address, green card/A-number
2. N-400 Form Review — Go through their form: work, family, travel, legal history, etc.
3. Oath of Allegiance — Administer the oath
4. Civics Test — Up to 10 questions from the official 100, 6 to pass
5. English Reading Test — Ask them to read a sentence
6. English Writing Test — Dictate a sentence for them to write
7. Closing — Thank them, summarize, explain next steps

**CRITICAL RULES:**
1. ALL your spoken dialogue (\`respuesta_oficial\`) MUST be in **ENGLISH ONLY**.
2. Your response MUST be a single valid **JSON object**. Never respond with plain text.
3. The field \`evaluacion_fluidez.mejora_sugerida\` MUST be in **Spanish** (this is feedback for the learner).
4. React to what the applicant actually says — don't ignore their responses.
5. If the applicant gives a suspicious, inconsistent, or interesting answer, follow up on it.

**JSON FORMAT:**
\`\`\`json
{
  "respuesta_oficial": "What the officer says next (in English)",
  "evaluacion_fluidez": {
    "puntaje_pronunciacion_y_gramatica": "X/10",
    "mejora_sugerida": "Sugerencia concreta en español para mejorar."
  },
  "estado_entrevista": "VERIFICACION_IDENTIDAD | REVISION_N400 | PREGUNTA_CIVICA | PRUEBA_LECTURA | PRUEBA_ESCRITURA | CIERRE"
}
\`\`\`

**CURRENT STAGE:** ${estadoEntrevista}

**SPECIFIC CONTEXT:**
${contextPrompt}

${applicantResponse ? `**APPLICANT SAID:** "${applicantResponse}"` : ''}

**REMEMBER:** Be human. Be real. React to what they say. Don't repeat yourself. Vary your language.`;

    return unifiedPrompt;
  }

  /**
   * Genera un mensaje del oficial usando OpenAI GPT-4o-mini o respuestas predefinidas
   * Devuelve una respuesta estructurada en formato JSON
   */
  private async generateOfficerMessage(
    sessionId: string,
    systemPrompt: string,
    applicantResponse?: string
  ): Promise<OfficerResponseJSON> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Sesión no encontrada');

    // Si OpenAI está disponible, usarlo
    if (this.isOpenAIAvailable()) {
      try {
        // Construir el prompt unificado con formato JSON
        const unifiedPrompt = this.getUnifiedJSONPrompt(systemPrompt, session.stage, applicantResponse);

        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          {
            role: 'system',
            content: unifiedPrompt
          }
        ];

        // Agregar historial de conversación (últimos 15 mensajes para mejor contexto)
        const recentMessages = session.messages.slice(-15);
        for (const msg of recentMessages) {
          if (msg.role === 'officer') {
            messages.push({ role: 'assistant', content: msg.content });
          } else if (msg.role === 'applicant') {
            messages.push({ role: 'user', content: msg.content });
          }
        }

        // Si hay respuesta del solicitante, agregarla como último mensaje user
        if (applicantResponse) {
          messages.push({ role: 'user', content: applicantResponse });
        }

        const response = await this.callOpenAIAPI(messages);
        if (response) {
          // Parsear la respuesta JSON de forma segura
          try {
            // Limpiar la respuesta por si tiene markdown o texto adicional
            let cleanedResponse = response.trim();
            
            // Eliminar markdown code blocks si existen
            if (cleanedResponse.startsWith('```json')) {
              cleanedResponse = cleanedResponse.replace(/^```json\s*/i, '').replace(/\s*```\s*$/i, '');
            } else if (cleanedResponse.startsWith('```')) {
              cleanedResponse = cleanedResponse.replace(/^```\s*/i, '').replace(/\s*```\s*$/i, '');
            }
            
            // Intentar parsear el JSON
            const jsonResponse: OfficerResponseJSON = JSON.parse(cleanedResponse);
            
            // Validar que tenga los campos requeridos
            if (jsonResponse.respuesta_oficial && jsonResponse.evaluacion_fluidez && jsonResponse.estado_entrevista) {
              if (__DEV__) {
                console.log('✅ JSON parseado correctamente');
                console.log('Respuesta oficial:', jsonResponse.respuesta_oficial.substring(0, 100));
                console.log('Estado entrevista:', jsonResponse.estado_entrevista);
              }
              return jsonResponse;
            } else {
              console.warn('⚠️ Respuesta JSON incompleta:', {
                tieneRespuestaOficial: !!jsonResponse.respuesta_oficial,
                tieneEvaluacionFluidez: !!jsonResponse.evaluacion_fluidez,
                tieneEstadoEntrevista: !!jsonResponse.estado_entrevista,
                jsonResponse: jsonResponse
              });
              // Intentar construir una respuesta válida con los campos disponibles
              return {
                respuesta_oficial: jsonResponse.respuesta_oficial || 'Thank you for your response. Let\'s continue.',
                evaluacion_fluidez: jsonResponse.evaluacion_fluidez || {
                  puntaje_pronunciacion_y_gramatica: 'N/A',
                  mejora_sugerida: 'Continúa practicando tu pronunciación.'
                },
                estado_entrevista: jsonResponse.estado_entrevista || 'PREGUNTA_CIVICA'
              };
            }
          } catch (parseError: any) {
            console.error('❌ Error al parsear respuesta JSON:', parseError?.message);
            if (__DEV__) {
              console.log('Respuesta recibida (primeros 500 chars):', response.substring(0, 500));
            }
            // Continuar con fallback predefinido
          }
        } else {
          // No mostrar warning si ya sabemos que es un error de cuota (ya se mostró arriba)
          // Solo mostrar si es un caso diferente
          if (__DEV__) {
            console.warn('⚠️ No se recibió respuesta de OpenAI. Se usará respuesta predefinida.');
          }
        }
      } catch (error: any) {
        console.error('❌ Error en generateOfficerMessage:', error?.message || error);
        if (__DEV__) {
          console.error('Error completo:', error);
        }
        // Continuar con respuestas predefinidas si falla
      }
    } else {
      if (__DEV__) {
        console.log('⚠️ OpenAI no configurado, usando respuestas predefinidas');
      }
    }

    // Respuestas predefinidas como fallback (convertidas al formato JSON)
    return this.getPredefinedResponseJSON(systemPrompt, session);
  }

  /**
   * Obtiene una respuesta predefinida en formato JSON basada en el contexto
   */
  private getPredefinedResponseJSON(prompt: string, session: InterviewSession): OfficerResponseJSON {
    // Mapear stage interno a estado de entrevista
    const stageMap: Record<InterviewSession['stage'], InterviewStage> = {
      'greeting': 'VERIFICACION_IDENTIDAD',
      'identity': 'VERIFICACION_IDENTIDAD',
      'n400_review': 'REVISION_N400',
      'oath': 'VERIFICACION_IDENTIDAD',
      'civics': 'PREGUNTA_CIVICA',
      'reading': 'PRUEBA_LECTURA',
      'writing': 'PRUEBA_ESCRITURA',
      'closing': 'CIERRE',
    };

    const estadoEntrevista = stageMap[session.stage] || 'VERIFICACION_IDENTIDAD';

    if (prompt.includes('greet') || prompt.includes('begin')) {
      return {
        respuesta_oficial: `Good morning, ${session.context.applicantName}. I am the immigration officer who will conduct your citizenship interview today. The interview will consist of several parts: identity verification, N-400 form review, oath of allegiance, civics questions, and English reading and writing tests. Are you ready to begin?`,
        evaluacion_fluidez: {
          puntaje_pronunciacion_y_gramatica: 'N/A',
          mejora_sugerida: 'Esta es la bienvenida inicial. No hay respuesta del usuario para evaluar aún.',
        },
        estado_entrevista: 'VERIFICACION_IDENTIDAD',
      };
    }
    
    if (prompt.includes('identity') || prompt.includes('verify')) {
      return {
        respuesta_oficial: 'To verify your identity, please confirm your full name and date of birth.',
        evaluacion_fluidez: {
          puntaje_pronunciacion_y_gramatica: 'N/A',
          mejora_sugerida: 'Por favor, responde con claridad cuando el oficial solicite tu información.',
        },
        estado_entrevista: 'VERIFICACION_IDENTIDAD',
      };
    }
    
    if (prompt.includes('oath') || prompt.includes('Oath')) {
      return {
        respuesta_oficial: 'Before we continue, I need you to take the Oath of Allegiance. This is an important step in the naturalization process.',
        evaluacion_fluidez: {
          puntaje_pronunciacion_y_gramatica: 'N/A',
          mejora_sugerida: 'Escucha cuidadosamente el juramento y repítelo con claridad.',
        },
        estado_entrevista: 'VERIFICACION_IDENTIDAD',
      };
    }
    
    if (prompt.includes('first question') || prompt.includes('civics')) {
      return {
        respuesta_oficial: 'Perfect. Let\'s begin with the civics questions section. First question: What is the supreme law of the land?',
        evaluacion_fluidez: {
          puntaje_pronunciacion_y_gramatica: 'N/A',
          mejora_sugerida: 'Responde con confianza y claridad. La respuesta correcta es: "The Constitution".',
        },
        estado_entrevista: 'PREGUNTA_CIVICA',
      };
    }
    
    if (prompt.includes('next question')) {
      const questions = [
        'How many amendments does the Constitution have?',
        'Who was the first President of the United States?',
        'What is the capital of the United States?',
        'How many senators does each state have?',
        'What is the executive branch?',
        'Who is the head of the executive branch?',
        'How many years is a president\'s term?',
        'What is the legislative branch?',
        'How many members does Congress have?',
        'What is the judicial branch?',
      ];
      const questionIndex = session.civicsQuestionsAsked % questions.length;
      return {
        respuesta_oficial: questions[questionIndex],
        evaluacion_fluidez: {
          puntaje_pronunciacion_y_gramatica: '7/10',
          mejora_sugerida: 'Intenta responder con más claridad y confianza.',
        },
        estado_entrevista: 'PREGUNTA_CIVICA',
      };
    }
    
    if (prompt.includes('closing') || prompt.includes('completed')) {
      return {
        respuesta_oficial: `Thank you, ${session.context.applicantName}. We have completed the interview. You will receive a notification by mail about the result of your application in the coming weeks. Have a good day.`,
        evaluacion_fluidez: {
          puntaje_pronunciacion_y_gramatica: 'N/A',
          mejora_sugerida: '¡Felicitaciones por completar la entrevista!',
        },
        estado_entrevista: 'CIERRE',
      };
    }

    return {
      respuesta_oficial: 'Thank you for your response. Let\'s continue with the next question.',
      evaluacion_fluidez: {
        puntaje_pronunciacion_y_gramatica: '7/10',
        mejora_sugerida: 'Continúa esforzándote por mejorar tu pronunciación y gramática.',
      },
      estado_entrevista: estadoEntrevista,
    };
  }


  /**
   * Obtiene el historial de mensajes de la sesión
   */
  getSessionMessages(sessionId: string): InterviewMessage[] {
    const session = this.sessions.get(sessionId);
    return session?.messages || [];
  }

  /**
   * Obtiene el estado actual de la sesión
   */
  getSessionStatus(sessionId: string): InterviewSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Finaliza la sesión
   */
  endSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

export default new AIInterviewN400Service();
