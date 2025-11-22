// src/services/aiInterviewN400Service.ts

/**
 * Servicio avanzado de Entrevista AI
 * Simula un oficial de inmigración USCIS entrenado con datos del formulario N-400
 * 
 * NOTA: Este servicio funciona con o sin OpenAI API.
 * Si tienes EXPO_PUBLIC_OPENAI_API_KEY configurada, usará GPT-4o-mini.
 * Si no, usará respuestas predefinidas inteligentes.
 */

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
          temperature: 0.3, // Lower temperature for more consistent, professional responses
          max_tokens: 250, // Limit length to ensure concise, clear speech
          // 🔑 CRÍTICO: Forzar respuesta en formato JSON
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
    const greetingResponse = await this.generateOfficerMessage(
      sessionId,
      `You are a professional and friendly USCIS immigration officer conducting a naturalization interview. You must greet ${context.applicantName} cordially and begin the citizenship interview. Be professional but friendly. Briefly explain the interview process in clear, well-structured sentences.`,
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
          `You are a professional USCIS immigration officer. Confirm that the information is correct and proceed to the next stage. If there is N-400 form data, mention that you will review the form.`,
          applicantResponse
        );
        officerResponse = jsonResponse.respuesta_oficial;
        fluencyEvaluation = jsonResponse.evaluacion_fluidez;
        break;
      }
      case 'n400_review': {
        const jsonResponse = await this.generateOfficerMessage(
          sessionId,
          `You are a professional USCIS immigration officer conducting a naturalization interview. Ask the next question about the N-400 form.`,
          applicantResponse
        );
        officerResponse = jsonResponse.respuesta_oficial;
        fluencyEvaluation = jsonResponse.evaluacion_fluidez;
        session.n400QuestionsAsked++;
        break;
      }
      case 'oath': {
        // El juramento se confirma, luego pasa automáticamente a civismo
        const jsonResponse = await this.generateOfficerMessage(
          sessionId,
          `You are a professional USCIS immigration officer. The applicant has taken or confirmed the oath of allegiance. Thank them for their commitment and proceed to the civics questions section.`,
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
          `You are a professional USCIS immigration officer conducting a naturalization interview. The applicant read: "${applicantResponse}". Evaluate if the reading was correct. If correct, confirm and proceed to the writing test.`,
          applicantResponse
        );
        officerResponse = jsonResponse.respuesta_oficial;
        fluencyEvaluation = jsonResponse.evaluacion_fluidez;
        isCorrect = applicantResponse.length > 10; // Evaluación simple
        break;
      }
      case 'writing': {
        const jsonResponse = await this.generateOfficerMessage(
          sessionId,
          `You are a professional USCIS immigration officer conducting a naturalization interview. The applicant wrote: "${applicantResponse}". Evaluate if the writing was correct. If correct, confirm and proceed to close the interview.`,
          applicantResponse
        );
        officerResponse = jsonResponse.respuesta_oficial;
        fluencyEvaluation = jsonResponse.evaluacion_fluidez;
        isCorrect = applicantResponse.length > 10; // Evaluación simple
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
   * Genera verificación de identidad
   */
  private async generateIdentityVerification(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Sesión no encontrada');

    const prompt = `You are a professional USCIS immigration officer conducting a naturalization interview. You must verify the identity of applicant ${session.context.applicantName}. Ask them to confirm their full name and date of birth. Be professional and friendly.`;

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
      return 'Continuemos con la entrevista.';
    }

    const prompt = `You are a professional USCIS immigration officer conducting a naturalization interview. You have the N-400 form from applicant ${session.context.applicantName}. Now you must ask questions about the form data to verify that the information is correct and up to date. Start with a question about basic personal information (address, work, family, etc.). Be professional and friendly.`;

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

    const prompt = `You are a professional USCIS immigration officer conducting a naturalization interview. You must administer the Oath of Allegiance. Explain that this is an important step in the naturalization process. Read the complete oath in English and ask the applicant to repeat it after you, or confirm that they are willing to take it. Be clear, professional and friendly.`;

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

    const prompt = `You are a professional USCIS immigration officer conducting a naturalization interview. Applicant ${session.context.applicantName} has completed the oath of allegiance. Now begins the civics questions section. Ask the first civics question clearly and professionally. Ask about the Constitution, government, or American rights. Maintain a friendly but professional tone.`;

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

    const prompt = `You are a professional USCIS immigration officer conducting a naturalization interview. Evaluate if the answer is correct by comparing it with: "${answerEn}". If correct, briefly confirm and ask the next question: "${randomQuestion.questionEn}". If incorrect or incomplete, provide friendly feedback and ask the next question. Question ${session.civicsQuestionsAsked + 1} of ${session.totalCivicsQuestions}. Recent conversation history: ${conversationHistory}`;

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
      '¿Cuál es la capital de Estados Unidos?',
      '¿Quién fue el primer presidente?',
      '¿Cuántos estados tiene Estados Unidos?',
      '¿Cuál es la ley suprema del país?',
      '¿Cuándo celebramos el Día de la Independencia?',
    ];

    const randomSentence = readingSentences[Math.floor(Math.random() * readingSentences.length)];

    const prompt = `You are a professional USCIS immigration officer conducting a naturalization interview. You have completed the civics questions. Now you will conduct the English reading test. Show this sentence to the applicant and ask them to read it aloud: "${randomSentence}". Explain the test clearly.`;

    const response = await this.generateOfficerMessage(sessionId, prompt, undefined);
    return `${response.respuesta_oficial}\n\nPlease read this sentence in English: "${randomSentence}"`;
  }

  /**
   * Genera resultado de prueba de lectura
   */
  private async generateReadingResult(sessionId: string, response: string): Promise<{ response: string; isCorrect: boolean }> {
    const prompt = `You are a professional USCIS immigration officer conducting a naturalization interview. The applicant read: "${response}". Evaluate if the reading was correct. If correct, confirm and proceed to the writing test. If there are minor errors, you can continue.`;

    const jsonResponse = await this.generateOfficerMessage(sessionId, prompt, response);
    const isCorrect = response.length > 10; // Evaluación simple

    return { response: jsonResponse.respuesta_oficial, isCorrect };
  }

  /**
   * Genera prueba de escritura
   */
  private async generateWritingTest(sessionId: string): Promise<string> {
    const writingSentences = [
      'Washington is the capital.',
      'The President lives in the White House.',
      'We have fifty states.',
      'The Constitution is the supreme law.',
      'Independence Day is July 4th.',
    ];

    const randomSentence = writingSentences[Math.floor(Math.random() * writingSentences.length)];

    const prompt = `You are a professional USCIS immigration officer conducting a naturalization interview. Now you will conduct the English writing test. Dictate this sentence to the applicant and ask them to write it: "${randomSentence}". Explain the test clearly.`;

    const response = await this.generateOfficerMessage(sessionId, prompt, undefined);
    return `${response.respuesta_oficial}\n\nPlease write this sentence in English: "${randomSentence}"`;
  }

  /**
   * Genera resultado de prueba de escritura
   */
  private async generateWritingResult(sessionId: string, response: string): Promise<{ response: string; isCorrect: boolean }> {
    const prompt = `You are a professional USCIS immigration officer conducting a naturalization interview. The applicant wrote: "${response}". Evaluate if the writing was correct. If correct, confirm and proceed to close the interview. If there are minor spelling errors, you can continue.`;

    const jsonResponse = await this.generateOfficerMessage(sessionId, prompt, response);
    const isCorrect = response.length > 10; // Evaluación simple

    return { response: jsonResponse.respuesta_oficial, isCorrect };
  }

  /**
   * Genera el mensaje de cierre de la entrevista
   */
  private async generateClosingStatement(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Sesión no encontrada');

    const prompt = `You are a professional USCIS immigration officer conducting a naturalization interview. You have completed the citizenship interview with ${session.context.applicantName}. Now you must make a professional closing statement, thanking the applicant for their time and explaining that they will be notified about the result of their application by mail in the coming weeks. Maintain a professional, friendly and encouraging tone.`;

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

    const unifiedPrompt = `**ROL:** Eres un Oficial de Inmigración de USCIS, formal, objetivo y profesional, conduciendo la entrevista de naturalización (Formulario N-400, prueba Cívica y prueba de Inglés).

**TAREA PRINCIPAL:**

1. **Simular la entrevista:** Guía al usuario a través de las secciones N-400 (saludo, datos, carácter moral) y realiza la prueba Cívica (hasta 10 preguntas) y las pruebas de Lectura/Escritura.

2. **Evaluar Fluidez:** En CADA respuesta del usuario, evalúa su fluidez, gramática y pronunciación en inglés (escala 1-10) y sugiere 1-2 mejoras concretas. Esta evaluación DEBE ser en español.

3. **Mantener la Coherencia:** Las preguntas deben ser conversacionales y ligeramente variadas.

**RESTRICCIONES CRÍTICAS:**

1. **IDIOMA DE LA ENTREVISTA:** TODAS tus preguntas y respuestas conversacionales (campo \`respuesta_oficial\`) deben ser **EXCLUSIVAMENTE EN INGLÉS**. Habla en inglés nativo, profesional y con gramática perfecta.

2. **FORMATO DE SALIDA:** Tu respuesta DEBE ser **SIEMPRE** un único objeto JSON válido. NUNCA respondas con texto plano.

3. **FLUJO:** Utiliza el campo \`estado_entrevista\` para señalar la etapa actual.

**FORMATO JSON REQUERIDO:**

\`\`\`json
{
  "respuesta_oficial": "The question/statement the USCIS Officer says next, in English.",
  "evaluacion_fluidez": {
    "puntaje_pronunciacion_y_gramatica": "X/10",
    "mejora_sugerida": "Breve sugerencia para mejorar la respuesta anterior del usuario (en español)."
  },
  "estado_entrevista": "VERIFICACION_IDENTIDAD | REVISION_N400 | PREGUNTA_CIVICA | PRUEBA_LECTURA | PRUEBA_ESCRITURA | CIERRE"
}
\`\`\`

**CONTEXTO ESPECÍFICO:**
${contextPrompt}

**ESTADO ACTUAL:** ${estadoEntrevista}

${applicantResponse ? `**RESPUESTA DEL SOLICITANTE:** "${applicantResponse}"` : ''}

**IMPORTANTE:** 
- Tu respuesta DEBE ser ÚNICAMENTE un objeto JSON válido, sin texto adicional antes o después
- El campo \`respuesta_oficial\` debe estar en inglés profesional y perfecto
- El campo \`evaluacion_fluidez.mejora_sugerida\` debe estar en español
- El campo \`estado_entrevista\` debe ser uno de: VERIFICACION_IDENTIDAD, REVISION_N400, PREGUNTA_CIVICA, PRUEBA_LECTURA, PRUEBA_ESCRITURA, CIERRE`;

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
