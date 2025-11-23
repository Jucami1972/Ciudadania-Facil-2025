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
      case 'greeting':
        return `${basePrompt}
        
        Greet the applicant warmly and professionally. Briefly explain the interview process. 
        Keep your greeting to 2-3 sentences. Be welcoming but maintain professionalism.`;

      case 'identity':
        return `${basePrompt}
        
        Verify the applicant's identity. Ask them to confirm their full name and date of birth.
        Be clear and professional.`;

      case 'n400_review':
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
          ${n400Data.spouseName ? `- Spouse Name: ${n400Data.spouseName}` : ''}
          ${n400Data.children && n400Data.children.length > 0 ? `- Children: ${n400Data.children.length} child(ren)` : ''}
          
          CRITICAL VALIDATION RULES - Be VERY flexible when comparing addresses and other information:
          
          1. IGNORE case (uppercase/lowercase): "123 Main Street" = "123 MAIN STREET" = "123 main street"
          2. IGNORE punctuation: Remove all commas, periods, dashes, etc. before comparing
          3. IGNORE abbreviations: "St" = "Street", "Ave" = "Avenue", "CA" = "California", "LA" = "Los Angeles"
          4. IGNORE extra words: "My address is 123 Main Street" should match "123 Main Street"
          5. IGNORE word order variations: "Los Angeles, California" = "California, Los Angeles"
          6. FOCUS on key content: Extract and compare only the essential information (numbers, street names, city names)
          
          Examples of VALID matches:
          - Form: "123 Main Street, Los Angeles, CA 90001"
          - User: "123 main st los angeles california 90001" → ACCEPT
          - User: "My address is 123 Main Street, Los Angeles" → ACCEPT
          - User: "123 Main St., L.A., CA" → ACCEPT
          - User: "Los Angeles, 123 Main Street" → ACCEPT
          
          When the applicant responds about their address:
          - Normalize both the form data and user response (remove punctuation, lowercase, ignore extra words)
          - Extract key elements: street number, street name, city, state, zip
          - If the key elements match (even with different formatting), ACCEPT and move to next question
          - Only ask for clarification if essential information is missing or clearly different
          
          Apply the same flexible matching rules to ALL N-400 questions (occupation, marital status, etc.).`;
        }
        
        return `${basePrompt}
        
        Review the N-400 form with the applicant. Ask questions about their personal information, 
        address, work, family, or travel history. Verify that the information is correct and up to date.
        Ask ONE question at a time.${n400Context}`;

      case 'oath':
        return `${basePrompt}
        
        Administer the Oath of Allegiance. Explain its importance. Read the complete oath clearly.
        Ask the applicant to repeat it or confirm they are willing to take it.`;

      case 'civics':
        return `${basePrompt}
        
        Ask civics questions about American government, history, and symbols. 
        Ask ONE question at a time. If the answer is correct, briefly confirm and move to the next question.
        If incorrect, provide friendly feedback and continue.`;

      case 'reading':
        return `${basePrompt}
        
        Conduct the reading test. Ask the applicant to read a simple sentence in English.
        Provide a sentence for them to read.`;

      case 'writing':
        return `${basePrompt}
        
        Conduct the writing test. Dictate a simple sentence for the applicant to write.
        Provide a sentence for them to write.`;

      case 'closing':
        return `${basePrompt}
        
        Close the interview professionally. Thank the applicant for their time and cooperation.
        Inform them about next steps if appropriate.`;

      default:
        return basePrompt;
    }
  }
}

// Singleton instance
export const openAIEngine = new OpenAIEngine();

