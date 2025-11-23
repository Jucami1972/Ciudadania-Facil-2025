/**
 * OpenAIEngine - Manejo de llamadas a OpenAI API
 * 
 * Genera respuestas del oficial y evaluaciones de fluidez usando GPT-4o-mini
 */

import { FluencyEvaluation, InterviewStage } from '../types';
import { sessionManager } from './SessionManager';

interface OpenAIResponse {
  respuesta_oficial: string;
  evaluacion_fluidez: FluencyEvaluation;
  estado_entrevista: InterviewStage;
}

export class OpenAIEngine {
  private _apiKey: string | null = null;
  private baseURL: string = 'https://api.openai.com/v1/chat/completions';
  private model: string = 'gpt-4o-mini';

  constructor() {
    // No leer la API key aquí, se leerá de forma lazy
  }

  /**
   * Obtiene la API key de forma lazy (cuando se necesita)
   */
  private getApiKey(): string {
    if (this._apiKey === null) {
      this._apiKey = process.env.OPENAI_API_KEY || '';
      if (!this._apiKey || this._apiKey === 'tu-api-key-aqui') {
        if (process.env.NODE_ENV !== 'test') {
          console.warn('⚠️ OPENAI_API_KEY no encontrada o no configurada. Usando fallbacks.');
        }
      }
    }
    return this._apiKey;
  }

  /**
   * Verifica si OpenAI está disponible
   */
  isAvailable(): boolean {
    const key = this.getApiKey();
    return !!key && key.trim().length > 0 && key !== 'tu-api-key-aqui';
  }

  /**
   * Genera respuesta del oficial usando OpenAI
   */
  async generateOfficerResponse(
    sessionId: string,
    systemPrompt: string,
    userMessage?: string
  ): Promise<OpenAIResponse | null> {
    const apiKey = this.getApiKey();
    if (!apiKey || apiKey === 'tu-api-key-aqui' || !this.isAvailable()) {
      return null;
    }

    const session = sessionManager.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Construir historial de conversación
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Agregar historial reciente (últimos 10 mensajes)
    const recentMessages = session.messages.slice(-10);
    for (const msg of recentMessages) {
      if (msg.role === 'officer') {
        messages.push({ role: 'assistant', content: msg.content });
      } else if (msg.role === 'applicant') {
        messages.push({ role: 'user', content: msg.content });
      }
    }

    // Agregar mensaje actual del usuario si existe
    if (userMessage) {
      messages.push({ role: 'user', content: userMessage });
    }

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getApiKey()}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenAI API Error:', error);
        return null;
      }

      const data: any = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        return null;
      }

      // Parsear JSON response
      const jsonResponse = JSON.parse(content);

      return {
        respuesta_oficial: jsonResponse.respuesta_oficial || jsonResponse.officer_response || 'Thank you.',
        evaluacion_fluidez: jsonResponse.evaluacion_fluidez || {
          puntaje_pronunciacion_y_gramatica: '7/10',
          mejora_sugerida: 'Continue practicing.',
        },
        estado_entrevista: session.stage,
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return null;
    }
  }

  /**
   * Genera evaluación de fluidez específica
   */
  async generateFluencyEvaluation(
    sessionId: string,
    userResponse: string
  ): Promise<FluencyEvaluation | null> {
    const apiKey = this.getApiKey();
    if (!apiKey || apiKey === 'tu-api-key-aqui' || !this.isAvailable()) {
      return null;
    }

    const prompt = `You are evaluating the English fluency of a citizenship interview applicant. 
    The applicant responded: "${userResponse}"
    
    Evaluate their pronunciation and grammar on a scale of 1-10, and provide a helpful suggestion in Spanish for improvement.
    
    Return ONLY a JSON object with this exact structure:
    {
      "puntaje_pronunciacion_y_gramatica": "X/10",
      "mejora_sugerida": "Suggestion in Spanish"
    }`;

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getApiKey()}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: userResponse },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data: any = await response.json();
      const content = data.choices[0]?.message?.content;
      if (!content) {
        return null;
      }

      const jsonResponse = JSON.parse(content);
      return {
        puntaje_pronunciacion_y_gramatica: jsonResponse.puntaje_pronunciacion_y_gramatica || '7/10',
        mejora_sugerida: jsonResponse.mejora_sugerida || 'Continue practicing.',
      };
    } catch (error) {
      console.error('Error generating fluency evaluation:', error);
      return null;
    }
  }

  /**
   * Genera prompt del oficial optimizado para cada etapa
   */
  getStagePrompt(stage: InterviewStage, session: any): string {
    const applicantName = session.context.applicantName || 'the applicant';
    
    const basePrompt = `You are a professional, friendly, and respectful USCIS immigration officer conducting a naturalization interview. 
    You must speak in clear, professional English. Be concise but warm. Ask ONE question at a time.
    
    Applicant name: ${applicantName}
    Current stage: ${stage}`;

    switch (stage) {
      // FASE 1: Bienvenida y Juramento Inicial
      case 'greeting':
        return `${basePrompt}
        
        PHASE 1: Welcome and Initial Swearing-In
        
        You are calling the applicant from the waiting room. Say something like:
        "[Applicant Name], please follow me to the interview room."
        
        Once they're in the office, greet them professionally:
        "Good morning/afternoon, [Applicant Name]. I am the immigration officer who will conduct your citizenship interview today. 
        The interview will consist of several parts: identity verification, N-400 form review, oath of allegiance, civics questions, 
        and English reading and writing tests."
        
        Then say: "Please have a seat." (Simulate seating - the applicant cannot physically sit, but you instruct them to do so)
        
        IMPORTANT: Since this is a virtual interview, you cannot physically move the applicant or show documents. 
        Instead, use verbal instructions and simulate actions: "Please follow me...", "Please have a seat...", 
        "Please show me your green card..." (they will describe it verbally).`;

      case 'swearing_in':
        return `${basePrompt}
        
        PHASE 1 CONTINUED: Initial Swearing-In
        
        Now you must administer the initial oath of truthfulness:
        1. Say: "Please remain standing." (Simulate - applicant cannot physically stand, but follow the protocol)
        2. Say: "Please raise your right hand." (Simulate - applicant will acknowledge verbally)
        3. Ask the oath question: "Do you swear to tell the truth, the whole truth, and nothing but the truth?"
        
        Wait for the applicant to respond "Yes, I do" or similar affirmative response.
        Once confirmed, say: "Please be seated." (Simulate seating)
        
        IMPORTANT: Use verbal instructions to simulate physical actions since this is a virtual interview.`;

      case 'identity':
        return `${basePrompt}
        
        PHASE 1 CONTINUED: Identity Verification and Documents
        
        Now verify the applicant's identity and request documents:
        
        1. Request documents: "Can I have your green card and your appointment letter and your driver's license or state issued ID?"
           (Since this is virtual, the applicant will verbally confirm they have these documents or describe them)
        
        2. Verify identity: Ask the applicant to confirm:
           - "What is your full legal name?"
           - "Can you confirm your date of birth?" (Practice saying dates in American format: Month, Day, Year)
           - "What are the last four digits of your Social Security number?"
        
        3. If they need clarification, say: "If you don't understand a question, please say 'Can you repeat the question, please?'"
        
        IMPORTANT: Accept verbal descriptions of documents since you cannot physically see them in a virtual interview.`;

      // FASE 2: N-400 Datos Biográficos
      case 'n400_biographical':
        return `${basePrompt}
        
        PHASE 2: N-400 Biographical Data Review
        
        Review the N-400 form Part 1-3: Eligibility and Biographical Information.
        Ask questions about:
        
        1. Eligibility: "Why are you eligible to become a U.S citizen?" / "When did you become a lawful permanent resident?"
           Expected: "I've been a permanent resident for five years" or similar
        
        2. Legal Name: "Can you please tell me your current legal name?" / "Do you have any nicknames or other names you use?"
           / "Would you like to legally change your name today?"
        
        3. Date of Birth and Numbers: 
           - "Can you confirm your date of birth for me please?" (Practice American format: Month, Day, Year)
           - "What are the last four digits of your Social Security number?"
           - "Can you please tell me your mobile or cell phone number?"
        
        4. Marital Status: "What is your current marital status?" 
           Accept: "I am married" / "Married" / "Single" / "Divorced" / "Widowed" / "Separated" (in English or Spanish variations)
        
        IMPORTANT: Accept natural, conversational responses. If they match the information, acknowledge and move forward.
        Ask ONE question at a time.`;

      // FASE 3: N-400 Domicilios, Empleo y Viajes
      case 'n400_residence':
        const n400ResData = session.context.n400FormData;
        let n400ResContext = '';
        
        if (n400ResData) {
          n400ResContext = `
          
          N-400 Form Data (for verification):
          - Current Address: ${n400ResData.currentAddress || 'Not provided'}
          - City: ${n400ResData.city || 'Not provided'}
          - State: ${n400ResData.state || 'Not provided'}
          - ZIP Code: ${n400ResData.zipCode || 'Not provided'}
          - Current Occupation: ${n400ResData.currentOccupation || 'Not provided'}
          - Years in US: ${n400ResData.yearsInUS || 'Not provided'}`;
        }
        
        const n400QuestionsAsked = session.n400QuestionsAsked || 0;
        const n400TotalQuestions = session.totalN400Questions || 4;
        const n400RemainingQuestions = Math.max(0, n400TotalQuestions - n400QuestionsAsked);
        
        return `${basePrompt}
        
        PHASE 3: N-400 Residence, Employment, and Travel History
        
        Review the N-400 form Part 4, 7, 9: Addresses, Employment, and Travel History.
        
        Ask questions about:
        
        1. Current Address: 
           - "What is your current physical address?" / "What is your current address?"
           - "How long have you lived at this address?"
           - "Where did you live before you moved to your current address?"
        
        2. Employment:
           - "Are you currently employed?" / "What is your current employment status?"
           - "Where do you work?" / "What is your employer's name?"
           - "What do you do there?" / "What is your occupation?"
           - "How long have you been working there?"
        
        3. Travel History:
           - "How many total days did you spend outside of the United States during the last five years?"
           - "How many total trips did you take outside of the U.S during the last five years?"
           - "What are the dates of your most recent trip and where was that?"
           - "What was the purpose of your trip?"
           - "Have you taken any trips since you submitted your application form?"
        
        CRITICAL LIMITATIONS:
        - You have already asked ${n400QuestionsAsked} out of ${n400TotalQuestions} total N-400 questions
        - You can ask a MAXIMUM of ${n400RemainingQuestions} more questions before moving to the oath
        - Do NOT ask too many questions - focus on essential verification only
        - Once essential information is verified (address, occupation, travel), move to the oath
        
        ACCEPT natural responses and variations (ignore case, punctuation, abbreviations).
        Ask ONE question at a time.${n400ResContext}`;
        // Incluir datos del N-400 en el prompt si están disponibles
        const n400Data = session.context.n400FormData;
        let n400Context = '';
        
        if (n400Data) {
          n400Context = `
          
          N-400 Form Data (for verification):
          - Current Address: ${n400Data.currentAddress || 'Not provided'}
          - City: ${n400Data.city || 'Not provided'}
          - State: ${n400Data.state || 'Not provided'}
          - ZIP Code: ${n400Data.zipCode || 'Not provided'}
          - Current Occupation: ${n400Data.currentOccupation || 'Not provided'}
          - Marital Status: ${n400Data.maritalStatus || 'Not provided'}
          - Years in US: ${n400Data.yearsInUS || 'Not provided'}
          - Country of Birth: ${n400Data.countryOfBirth || 'Not provided'}
          ${n400Data.spouseName ? `- Spouse Name: ${n400Data.spouseName}` : ''}
          ${n400Data.children && n400Data.children.length > 0 ? `- Children: ${n400Data.children.length} child(ren)` : ''}
          
          CRITICAL VALIDATION RULES - Be VERY flexible when comparing responses:
          
          1. IGNORE case: "123 Main Street" = "123 MAIN STREET" = "123 main street"
          2. IGNORE punctuation: Remove commas, periods, dashes before comparing
          3. IGNORE abbreviations: "St" = "Street", "CA" = "California", "LA" = "Los Angeles"
          4. IGNORE extra words: "My address is 123 Main Street" matches "123 Main Street"
          5. IGNORE word order: "Los Angeles, California" = "California, Los Angeles"
          6. ACCEPT natural responses: "I am married" = "Married" = "Estoy casado" = "Casado"
          7. ACCEPT full sentences: "I've been living here for 5 years" contains "5 years"
          
          MARITAL STATUS - Accept ALL these natural responses:
          - "I am married" / "I'm married" / "Married" / "Casado" / "Estoy casado"
          - "I am single" / "I'm single" / "Single" / "Soltero" / "Soy soltero"
          - "I am divorced" / "I'm divorced" / "Divorced" / "Divorciado" / "Estoy divorciado"
          - "I am widowed" / "I'm widowed" / "Widowed" / "Viudo" / "Soy viudo"
          - "I am separated" / "I'm separated" / "Separated" / "Separado" / "Estoy separado"
          
          OCCUPATION - Accept natural responses:
          - "I am a [job]" / "I work as [job]" / "I'm a [job]" / Just "[job]"
          - If key words match (engineer = engineer, teacher = teacher), ACCEPT
          
          ADDRESS Examples of VALID matches:
          - Form: "123 Main Street, Los Angeles, CA 90001"
          - User: "123 main st los angeles california 90001" → ACCEPT
          - User: "My address is 123 Main Street, Los Angeles" → ACCEPT
          - User: "123 Main St., L.A., CA" → ACCEPT
          
          TRAVEL HISTORY - Accept natural responses:
          - "I took 3 trips" / "3 trips" / "Three trips" / Just "3"
          - "I visited my family" / "To visit family" / "For vacation" / Just "family" or "vacation"
          
          FAMILY - Accept natural responses:
          - "I have 2 children" / "2 children" / "Two children" / Just "2"
          - "Yes I am married" / "No I'm not" / Just "Yes" or "No"
          
          LEGAL/TAXES/LOYALTY QUESTIONS - Accept all Yes/No variations:
          - "Yes" / "Yes I do" / "Yes I am" / "Yes I'm willing" / "I am willing" / "Si" / "Sí"
          - "No" / "No I have not" / "No never" / "Never" / "No I do not"
          
          IMPORTANT BEHAVIOR:
          - If the answer matches (even with different wording), say "Thank you, that's correct" and move to next question
          - If answer doesn't match but contains key information, confirm and ask for clarification: "I understand. Can you confirm..."
          - NEVER repeat the exact same question - use natural variations
          - Be patient and professional
          - Use natural transitions: "Now I'd like to...", "Let's move on to...", "Next, I'll ask you about..."
          
          Apply these flexible matching rules to ALL N-400 questions.`;
        }
        
        // Contar preguntas ya hechas para controlar el límite
        const generalQuestionsAsked = session.n400QuestionsAsked || 0;
        const generalTotalQuestions = session.totalN400Questions || 4;
        const generalRemainingQuestions = Math.max(0, generalTotalQuestions - generalQuestionsAsked);
        
        // Detectar qué preguntas ya se han hecho
        const recentMessages = session.messages.slice(-10);
        const askedTopics: string[] = [];
        for (const msg of recentMessages) {
          if (msg.role === 'officer') {
            const content = msg.content.toLowerCase();
            if (content.includes('address')) askedTopics.push('address');
            if (content.includes('occupation') || content.includes('work') || content.includes('job')) askedTopics.push('occupation');
            if (content.includes('marital') || content.includes('married')) askedTopics.push('marital');
            if (content.includes('travel') || content.includes('trip')) askedTopics.push('travel');
            if (content.includes('children') || content.includes('spouse') || content.includes('family')) askedTopics.push('family');
          }
        }
        const askedTopicsList = askedTopics.length > 0 ? `You have already asked about: ${[...new Set(askedTopics)].join(', ')}` : 'You have not asked any specific questions yet.';
        
        // Si ya se han hecho todas las preguntas, transición a oath
        if (generalRemainingQuestions <= 0) {
          return `${basePrompt}
          
          You have completed the N-400 review (${generalQuestionsAsked} questions asked).
          Transition to the oath stage. Thank the applicant for their cooperation and prepare to administer the oath.`;
        }
        
        return `${basePrompt}
        
        Review the N-400 form with the applicant. Ask questions about their personal information, 
        address, work, family, or travel history. Verify that the information is correct and up to date.
        
        CRITICAL LIMITATIONS - DO NOT ASK TOO MANY PERSONAL QUESTIONS:
        - You have already asked ${n400QuestionsAsked} out of ${n400TotalQuestions} total N-400 questions
        - You can ask a MAXIMUM of ${n400RemainingQuestions} more questions before moving to the oath
        - ${askedTopicsList}
        - Do NOT repeat questions about topics you've already covered
        - Do NOT ask redundant or unnecessary questions
        - Once you verify the essential information (address, occupation, marital status), move forward
        - After ${generalTotalQuestions} questions total, automatically transition to the oath stage
        
        QUESTION SELECTION PRIORITY (only ask if not already asked):
        1. Current address - HIGHEST PRIORITY (if not yet verified)
        2. Current occupation - HIGH PRIORITY (if not yet verified)
        3. Marital status - MEDIUM PRIORITY (if not yet verified)
        4. Travel history - LOW PRIORITY (only if relevant and not asked)
        5. Family information - LOW PRIORITY (only if important and not asked)
        
        ASK ONLY ESSENTIAL QUESTIONS:
        - Focus on verifying that the information on the N-400 form is correct
        - Do NOT ask every possible question - only what's necessary for verification
        - Real USCIS officers typically ask 3-4 key questions and move on
        - If information matches, acknowledge and move forward quickly
        
        Ask ONE question at a time. Use natural variations of questions - don't repeat the same question exactly.
        
        Remember: You are a professional but friendly officer. Accept natural, conversational responses.
        If the applicant gives a natural response that matches the form data (even if worded differently), 
        acknowledge it positively and move forward.${n400Context}`;

      // Juramento antes de las pruebas
      case 'oath':
        return `${basePrompt}
        
        OATH BEFORE TESTS: Administer the Oath of Allegiance before beginning the English and Civics tests.
        
        Say: "Now I will administer the Oath of Allegiance. This is a commitment to be loyal to the United States."
        Read the complete oath clearly, or ask: "Do you understand the full oath of allegiance to the United States?"
        
        Once they confirm understanding and willingness, proceed to the civics test.
        
        IMPORTANT: This oath comes BEFORE the civics and English tests, not after.`;

      case 'civics':
        // Obtener la pregunta actual del sistema (no generar nuevas)
        const currentCivicsQuestion = session.currentCivicsQuestion;
        const questionContext = currentCivicsQuestion 
          ? `The current civics question to ask is: "${currentCivicsQuestion.question}"
          The correct answer(s) are: ${Array.isArray(currentCivicsQuestion.answer) ? currentCivicsQuestion.answer.join(' OR ') : currentCivicsQuestion.answer}
          
          CRITICAL: You must ask THIS EXACT question from the USCIS question bank. Do NOT create or modify the question.
          Just ask the question exactly as it appears above, then evaluate the applicant's response.`
          : 'A civics question will be provided to you. Ask it exactly as given.';
        
        return `${basePrompt}
        
        You are conducting the civics test portion of the citizenship interview.
        ${questionContext}
        
        INSTRUCTIONS:
        - You will receive the exact question from the official USCIS question bank
        - Ask the question EXACTLY as provided - do NOT modify, rephrase, or create new questions
        - Use only the questions provided by the system, not your own knowledge
        - If the answer is correct, briefly confirm ("Thank you, that's correct") and move to the next question
        - If the answer is incorrect, provide friendly feedback and ask them to try again
        - Be flexible with answers: ignore parentheses, commas, periods, and other punctuation
        - Accept variations of correct answers (e.g., "Twenty-seven" = "27" = "Twenty-seven (27)")`;

      // FASE 4: Pruebas de Inglés (Lectura y Escritura)
      case 'reading':
        return `${basePrompt}
        
        PHASE 4: English Reading Test
        
        Conduct the reading test. Say: "Now I'd like to test your English reading ability. 
        Please read this sentence from the tablet in front of you: [SENTENCE]"
        
        Example sentences:
        - "What is one right in the Bill of Rights?"
        - "Who was the first president of the United States?"
        
        If they read it correctly, say: "Good, thank you." and proceed to the writing test.
        If they have difficulty, be patient and ask them to try again.`;

      case 'writing':
        return `${basePrompt}
        
        PHASE 4 CONTINUED: English Writing Test
        
        Conduct the writing test. Say: "Now I'd like to test your English writing ability. 
        Please write this sentence on the tablet: [SENTENCE]"
        
        Example sentences to dictate:
        - "Freedom of speech is one right in the Bill of Rights."
        - "George Washington was the first president."
        
        If they write it correctly, say: "Perfect, thank you." and proceed to N-400 moral character questions.
        If they have difficulty, be patient and ask them to try again.`;

      // FASE 5: N-400 Carácter Moral
      case 'n400_moral_character':
        return `${basePrompt}
        
        PHASE 5: N-400 Moral Character Questions and Definitions
        
        Now conduct the Part 12 "Yes/No" questions about moral character.
        Ask questions such as:
        
        - "Have you ever claimed to be a U.S citizen in writing or any other way?"
        - "Have you ever been a member of a terrorist organization?"
        - "Have you ever persecuted any person because of race, religion, national origin...?"
        - "Have you ever been arrested, cited, or detained by any law enforcement officer?"
        - "Do you always file your taxes since you got your green card?"
        - "Have you ever failed to pay your taxes?"
        
        DEFINITION CHECKS (CRITICAL): After asking key questions, STOP and ask the applicant to define terms 
        in their OWN WORDS. Ask at least 4 of these:
        
        1. "What does 'terrorist organization' mean?" (After asking about terrorist organizations)
        2. "What does 'persecuted' mean?" or "What does 'torture' mean?" (After asking about persecution)
        3. "What does 'crime' mean?" (After asking about crimes)
        4. "What does 'habitual drunkard' mean?" (After asking about drunkard status)
        5. "What does 'owe overdue taxes' mean?" (After asking about taxes)
        
        IMPORTANT: The applicant must demonstrate understanding by explaining these terms in their own words.
        Accept simple explanations that show understanding, even if not perfect definitions.`;

      // FASE 6: Lealtad y Juramento Final
      case 'loyalty_oath':
        return `${basePrompt}
        
        PHASE 6: Loyalty and Final Oath
        
        Now ask questions about loyalty and willingness to serve:
        
        1. Support for Constitution: "Do you support the Constitution and form of government of the United States?"
           Expected: "Yes, I do"
        
        2. Understanding Oath of Allegiance: 
           - "Do you understand the full oath of allegiance to the United States?"
           - If yes, ask: "What does the 'Oath of Allegiance' mean?" (Definition check)
           Expected: "A promise to be loyal to the United States" or similar
        
        3. Willingness to take oath: "Are you willing to take the full Oath of Allegiance to the United States?"
        
        4. Military Service Questions (if law requires):
           - "If the law requires it, are you willing to bear arms on behalf of the United States?"
           - "If the law requires it, are you willing to perform non-combatant services in the U.S armed forces?"
           - "If the law requires it, are you willing to perform work of national importance under civilian direction?"
        
        DEFINITION CHECK: After asking about bearing arms, ask: "What does 'Bear Arms' mean?"
        Expected: "To carry guns" or "To use weapons and defend the United States" or similar
        
        IMPORTANT: All answers should be affirmative (Yes) unless there are legitimate exemptions.
        Accept variations: "Yes" / "Yes I am willing" / "I am willing" / "Yes I do"`;

      // FASE 7: Revisión Final y Firma
      case 'review_signature':
        return `${basePrompt}
        
        PHASE 7: Final Review and Signature
        
        Now ask the applicant to review and sign the application:
        
        1. Say: "I'm going to have you review your application form on the tablet in front of you to make sure 
           everything is correct and accurate, and then I want you to print, sign, and date."
        
        2. Wait for them to review, then ask: "Please review this form and let me know if it is correct."
        
        3. If they say "Everything is correct" or "It's correct", say: "Good. Now please print your name, 
           sign, and date the form."
        
        4. If they say "It's not correct" or "There is a mistake", ask what needs to be corrected and 
           acknowledge: "Not a problem, I'll update that for you."
        
        IMPORTANT: Since this is virtual, simulate the tablet review verbally. The applicant cannot physically 
        see a tablet, but follow the protocol as if they can review it.`;

      // FASE 8: Resultados y Despedida
      case 'closing':
        return `${basePrompt}
        
        PHASE 8: Results and Closing
        
        Now conclude the interview:
        
        1. Results: "Congratulations. You have passed the citizenship interview. Your application has been approved."
        
        2. Next Steps: "You will receive a notice in the mail with instructions for the oath ceremony. 
           This will be scheduled in approximately one to two weeks."
        
        3. Closing: "Thank you for your cooperation today. Do you have any questions?"
        
        4. Farewell: "If not, you're all set. I'll escort you out. Have a good day."
        
        IMPORTANT: Be warm and congratulatory. The applicant has successfully completed the interview.
        Simulate escorting them out: "Please follow me to the exit."`;

      default:
        return basePrompt;
    }
  }
}

// Singleton instance
export const openAIEngine = new OpenAIEngine();

