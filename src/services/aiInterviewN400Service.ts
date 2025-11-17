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
    return !!apiKey && apiKey.trim().length > 0;
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
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error en OpenAI API:', response.status, errorData);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
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
    const greeting = await this.generateOfficerMessage(
      sessionId,
      `You are a professional and friendly USCIS immigration officer. You must greet ${context.applicantName} cordially and begin the citizenship interview. 
      Be professional but friendly. Briefly explain the interview process.
      Respond in English clearly and concisely.`
    );

    const greetingMessage: InterviewMessage = {
      role: 'officer',
      content: greeting,
      timestamp: new Date(),
      shouldSpeak: true, // SIEMPRE se habla automáticamente
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
  ): Promise<{ officerResponse: string; isCorrect?: boolean; feedback?: string; shouldSpeak?: boolean }> {
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

    // Manejar diferentes etapas de la entrevista
    switch (session.stage) {
      case 'identity':
        officerResponse = await this.generateIdentityFollowUp(sessionId, applicantResponse);
        break;
      case 'n400_review':
        officerResponse = await this.generateN400Question(sessionId, applicantResponse);
        session.n400QuestionsAsked++;
        break;
      case 'oath':
        // El juramento se confirma, luego pasa automáticamente a civismo
        officerResponse = await this.generateOathConfirmation(sessionId, applicantResponse);
        break;
      case 'civics':
        const civicsResult = await this.generateNextCivicsQuestion(sessionId, applicantResponse);
        officerResponse = civicsResult.question;
        isCorrect = civicsResult.isCorrect;
        feedback = civicsResult.feedback;
        session.civicsQuestionsAsked++;
        break;
      case 'reading':
        const readingResult = await this.generateReadingResult(sessionId, applicantResponse);
        officerResponse = readingResult.response;
        isCorrect = readingResult.isCorrect;
        break;
      case 'writing':
        const writingResult = await this.generateWritingResult(sessionId, applicantResponse);
        officerResponse = writingResult.response;
        isCorrect = writingResult.isCorrect;
        break;
      case 'closing':
        officerResponse = 'La entrevista ha finalizado. Gracias por su tiempo.';
        break;
      default:
        officerResponse = 'Gracias por su respuesta.';
    }

    const message: InterviewMessage = {
      role: 'officer',
      content: officerResponse,
      timestamp: new Date(),
      shouldSpeak: true, // Todos los mensajes del oficial se hablan
    };

    session.messages.push(message);

    return { officerResponse, isCorrect, feedback, shouldSpeak: true };
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

    const prompt = `You are a USCIS immigration officer. You must verify the identity of applicant ${session.context.applicantName}.
    Ask them to confirm their full name and date of birth. Be professional and friendly. Respond in English.`;

    return this.generateOfficerMessage(sessionId, prompt);
  }

  /**
   * Genera seguimiento de verificación de identidad
   */
  private async generateIdentityFollowUp(sessionId: string, response: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Sesión no encontrada');

    const prompt = `The applicant responded about their identity: "${response}".
    Confirm that the information is correct and proceed to the next stage. If there is N-400 form data, mention that you will review the form.
    Respond in English in a professional and concise manner.`;

    return this.generateOfficerMessage(sessionId, prompt);
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

    const prompt = `You are a USCIS immigration officer. You have the N-400 form from applicant ${session.context.applicantName}.
    Now you must ask questions about the form data to verify that the information is correct and up to date.
    Start with a question about basic personal information (address, work, family, etc.).
    Be professional and friendly. Respond in English.`;

    return this.generateOfficerMessage(sessionId, prompt);
  }

  /**
   * Genera pregunta sobre el formulario N-400
   */
  private async generateN400Question(sessionId: string, previousResponse: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Sesión no encontrada');

    const n400Data = session.context.n400FormData;
    if (!n400Data) {
      return await this.generateFirstCivicsQuestion(sessionId);
    }

    const questions = [
      { field: 'currentAddress', question: '¿Puede confirmar su dirección actual?' },
      { field: 'currentOccupation', question: '¿Cuál es su ocupación actual?' },
      { field: 'maritalStatus', question: '¿Cuál es su estado civil?' },
      { field: 'children', question: '¿Tiene hijos? Si es así, ¿cuántos?' },
      { field: 'tripsOutsideUS', question: '¿Ha viajado fuera de Estados Unidos desde que presentó su solicitud?' },
      { field: 'taxReturns', question: '¿Ha presentado sus declaraciones de impuestos?' },
    ];

    const questionIndex = session.n400QuestionsAsked % questions.length;
    const selectedQuestion = questions[questionIndex];

    const prompt = `You are a USCIS immigration officer. The applicant responded: "${previousResponse}".
    Now ask the next question about the N-400 form: "${selectedQuestion.question}"
    If you have form data, verify that the response matches.
    Respond in English in a professional manner.`;

    return this.generateOfficerMessage(sessionId, prompt);
  }

  /**
   * Genera el prompt del juramento de lealtad completo
   */
  private async generateOathPrompt(sessionId: string): Promise<string> {
    const oathText = `"I hereby declare, on oath, that I absolutely and entirely renounce and abjure all allegiance and fidelity to any foreign prince, potentate, state, or sovereignty, of whom or which I have heretofore been a subject or citizen; that I will support and defend the Constitution and laws of the United States of America against all enemies, foreign and domestic; that I will bear true faith and allegiance to the same; that I will bear arms on behalf of the United States when required by the law; that I will perform noncombatant service in the Armed Forces of the United States when required by the law; that I will perform work of national importance under civilian direction when required by the law; and that I take this obligation freely, without any mental reservation or purpose of evasion; so help me God."`;

    const prompt = `You are a professional USCIS immigration officer. You must administer the Oath of Allegiance.
    Explain that this is an important step in the naturalization process.
    Read the complete oath in English and ask the applicant to repeat it after you, or confirm that they are willing to take it.
    Be clear, professional and friendly. Respond in English.`;

    const response = await this.generateOfficerMessage(sessionId, prompt);
    return `${response}\n\n${oathText}`;
  }

  /**
   * Genera confirmación del juramento
   */
  private async generateOathConfirmation(sessionId: string, response: string): Promise<string> {
    const prompt = `The applicant has taken or confirmed the oath of allegiance. 
    Thank them for their commitment and proceed to the civics questions section.
    Respond in English in a professional and encouraging manner.`;

    return this.generateOfficerMessage(sessionId, prompt);
  }

  /**
   * Genera la primera pregunta de civismo
   */
  private async generateFirstCivicsQuestion(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Sesión no encontrada');

    const prompt = `You are a USCIS immigration officer. Applicant ${session.context.applicantName} 
    has completed the oath of allegiance. Now begins the civics questions section.
    Ask the first civics question clearly and professionally.
    Ask about the Constitution, government, or American rights.
    Maintain a friendly but professional tone. Respond in English.`;

    return this.generateOfficerMessage(sessionId, prompt);
  }

  /**
   * Genera la siguiente pregunta de civismo basada en la respuesta anterior
   */
  private async generateNextCivicsQuestion(
    sessionId: string,
    applicantResponse: string
  ): Promise<{ question: string; isCorrect?: boolean; feedback?: string }> {
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

    session.currentCivicsQuestion = {
      id: randomQuestion.id,
      question: randomQuestion.questionEs,
      answer: randomQuestion.answerEs,
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

    const prompt = `You are a professional USCIS immigration officer. The applicant responded: "${applicantResponse}"

    Recent history:
    ${conversationHistory}

    Evaluate if the answer is correct by comparing it with: "${randomQuestion.answerEn}"
    If correct, briefly confirm and ask the next question: "${randomQuestion.questionEn}"
    If incorrect or incomplete, provide friendly feedback and ask the next question.
    Question ${session.civicsQuestionsAsked + 1} of ${session.totalCivicsQuestions}.
    Respond in English clearly and concisely.`;

    const response = await this.generateOfficerMessage(sessionId, prompt);
    
    // Evaluación simple de la respuesta
    const isCorrect = this.evaluateAnswer(applicantResponse, randomQuestion.answerEn);
    const feedback = isCorrect 
      ? 'Correct.' 
      : 'The answer is not completely correct. The correct answer is: ' + randomQuestion.answerEn.split('\n')[0];

    return { question: response, isCorrect, feedback };
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

    const prompt = `You are a USCIS immigration officer. You have completed the civics questions.
    Now you will conduct the English reading test. Show this sentence to the applicant and ask them to read it aloud:
    "${randomSentence}"
    Respond in English explaining the test.`;

    return this.generateOfficerMessage(sessionId, prompt) + `\n\nPlease read this sentence in English: "${randomSentence}"`;
  }

  /**
   * Genera resultado de prueba de lectura
   */
  private async generateReadingResult(sessionId: string, response: string): Promise<{ response: string; isCorrect: boolean }> {
    const prompt = `The applicant read: "${response}". 
    Evaluate if the reading was correct. If correct, confirm and proceed to the writing test.
    If there are minor errors, you can continue. Respond in English in a professional manner.`;

    const officerResponse = await this.generateOfficerMessage(sessionId, prompt);
    const isCorrect = response.length > 10; // Evaluación simple

    return { response: officerResponse, isCorrect };
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

    const prompt = `You are a USCIS immigration officer. Now you will conduct the English writing test.
    Dictate this sentence to the applicant and ask them to write it:
    "${randomSentence}"
    Respond in English explaining the test.`;

    return this.generateOfficerMessage(sessionId, prompt) + `\n\nPlease write this sentence in English: "${randomSentence}"`;
  }

  /**
   * Genera resultado de prueba de escritura
   */
  private async generateWritingResult(sessionId: string, response: string): Promise<{ response: string; isCorrect: boolean }> {
    const prompt = `The applicant wrote: "${response}". 
    Evaluate if the writing was correct. If correct, confirm and proceed to close the interview.
    If there are minor spelling errors, you can continue. Respond in English in a professional manner.`;

    const officerResponse = await this.generateOfficerMessage(sessionId, prompt);
    const isCorrect = response.length > 10; // Evaluación simple

    return { response: officerResponse, isCorrect };
  }

  /**
   * Genera el mensaje de cierre de la entrevista
   */
  private async generateClosingStatement(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Sesión no encontrada');

    const prompt = `You are a USCIS immigration officer. You have completed the citizenship interview with ${session.context.applicantName}.
    Now you must make a professional closing statement, thanking the applicant for their time and explaining that they will be notified about the result of their application by mail in the coming weeks.
    Maintain a professional, friendly and encouraging tone. Respond in English.`;

    return this.generateOfficerMessage(sessionId, prompt);
  }

  /**
   * Genera un mensaje del oficial usando OpenAI GPT-4o-mini o respuestas predefinidas
   */
  private async generateOfficerMessage(
    sessionId: string,
    systemPrompt: string
  ): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Sesión no encontrada');

    // Si OpenAI está disponible, usarlo
    if (this.isOpenAIAvailable()) {
      try {
        // Construir el historial de mensajes para OpenAI
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          {
            role: 'system',
            content: systemPrompt
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

        const response = await this.callOpenAIAPI(messages);
        if (response) {
          console.log('✅ Respuesta de OpenAI recibida');
          return response;
        }
      } catch (error) {
        console.error('Error en OpenAI:', error);
        // Continuar con respuestas predefinidas si falla
      }
    } else {
      console.log('⚠️ OpenAI no configurado, usando respuestas predefinidas');
    }

    // Respuestas predefinidas como fallback
    return this.getPredefinedResponse(systemPrompt, session);
  }

  /**
   * Obtiene una respuesta predefinida basada en el contexto
   */
  private getPredefinedResponse(prompt: string, session: InterviewSession): string {
    if (prompt.includes('greet') || prompt.includes('begin')) {
      return `Good morning, ${session.context.applicantName}. I am the immigration officer who will conduct your citizenship interview today. 
      The interview will consist of several parts: identity verification, N-400 form review, oath of allegiance, civics questions, and English reading and writing tests.
      Are you ready to begin?`;
    }
    
    if (prompt.includes('identity') || prompt.includes('verify')) {
      return `To verify your identity, please confirm your full name and date of birth.`;
    }
    
    if (prompt.includes('oath') || prompt.includes('Oath')) {
      return `Before we continue, I need you to take the Oath of Allegiance. This is an important step in the naturalization process.`;
    }
    
    if (prompt.includes('first question') || prompt.includes('civics')) {
      return `Perfect. Let's begin with the civics questions section. First question: What is the supreme law of the land?`;
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
      return questions[questionIndex];
    }
    
    if (prompt.includes('closing') || prompt.includes('completed')) {
      return `Thank you, ${session.context.applicantName}. We have completed the interview. You will receive a notification by mail about the result of your application in the coming weeks. Have a good day.`;
    }

    return 'Thank you for your response. Let\'s continue with the next question.';
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
