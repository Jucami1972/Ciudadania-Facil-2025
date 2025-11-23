/**
 * ResponseValidator - Validador inteligente de respuestas
 * 
 * Valida respuestas del usuario localmente antes de enviarlas a OpenAI
 * para dar más autonomía al sistema y evitar repeticiones innecesarias
 */

import { InterviewSession, InterviewMessage } from '../types';
import { questionBank } from './QuestionBank';

export interface ValidationResult {
  isValid: boolean;
  confidence: number; // 0-1
  reason?: string;
  shouldAdvance: boolean;
}

export class ResponseValidator {
  /**
   * Valida una respuesta basándose en el contexto de la entrevista
   */
  validateResponse(session: InterviewSession, userResponse: string): ValidationResult {
    const lastOfficerMessage = this.getLastOfficerMessage(session);
    if (!lastOfficerMessage) {
      return { isValid: false, confidence: 0, shouldAdvance: false };
    }

    // Determinar qué tipo de pregunta se está haciendo
    const questionType = this.detectQuestionType(lastOfficerMessage.content, session);

    switch (questionType.type) {
      case 'civics':
        return this.validateCivicsAnswer(questionType.questionId!, userResponse);
      
      case 'address':
        return this.validateAddress(session, userResponse);
      
      case 'identity':
        return this.validateIdentity(session, userResponse);
      
      case 'occupation':
        return this.validateOccupation(session, userResponse);
      
      case 'marital_status':
        return this.validateMaritalStatus(session, userResponse);
      
      case 'number':
        return this.validateNumberAnswer(questionType, userResponse);
      
      default:
        return { isValid: false, confidence: 0, shouldAdvance: false };
    }
  }

  /**
   * Detecta el tipo de pregunta basándose en el contenido
   */
  private detectQuestionType(message: string, session: InterviewSession): {
    type: 'civics' | 'address' | 'identity' | 'occupation' | 'marital_status' | 'number' | 'other';
    questionId?: number;
    expectedValue?: string | number;
  } {
    const lowerMessage = message.toLowerCase();

    // Detectar preguntas específicas de civismo y sus respuestas esperadas
    if (lowerMessage.includes('amendments') && lowerMessage.includes('constitution')) {
      return { type: 'number', expectedValue: 27 };
    }
    
    if (lowerMessage.includes('how many amendments')) {
      return { type: 'number', expectedValue: 27 };
    }

    if (lowerMessage.includes('justices') || lowerMessage.includes('supreme court')) {
      return { type: 'number', expectedValue: 9 };
    }

    if (lowerMessage.includes('states') || lowerMessage.includes('how many states')) {
      return { type: 'number', expectedValue: 50 };
    }

    if (lowerMessage.includes('amend') || lowerMessage.includes('bill of rights')) {
      return { type: 'number', expectedValue: 10 };
    }

    // Detectar preguntas de dirección
    if (lowerMessage.includes('address') || lowerMessage.includes('where do you live')) {
      return { type: 'address' };
    }

    // Detectar preguntas de identidad
    if (lowerMessage.includes('name') || lowerMessage.includes('date of birth') || lowerMessage.includes('birthday')) {
      return { type: 'identity' };
    }

    // Detectar preguntas de ocupación
    if (lowerMessage.includes('occupation') || lowerMessage.includes('work') || lowerMessage.includes('job')) {
      return { type: 'occupation' };
    }

    // Detectar preguntas de estado civil
    if (lowerMessage.includes('marital') || lowerMessage.includes('married') || lowerMessage.includes('single')) {
      return { type: 'marital_status' };
    }

    // Detectar preguntas numéricas generales
    if (lowerMessage.includes('how many')) {
      const numbers = message.match(/\d+/g);
      if (numbers) {
        return { type: 'number', expectedValue: parseInt(numbers[0]) };
      }
    }

    return { type: 'other' };
  }

  /**
   * Valida respuestas de civismo
   */
  private validateCivicsAnswer(questionId: number, userResponse: string): ValidationResult {
    const isValid = questionBank.validateAnswer(questionId, userResponse);
    return {
      isValid,
      confidence: isValid ? 0.9 : 0.1,
      shouldAdvance: isValid,
      reason: isValid ? 'Respuesta correcta' : 'Respuesta incorrecta o no reconocida'
    };
  }

  /**
   * Valida respuestas numéricas
   */
  private validateNumberAnswer(
    questionType: { expectedValue?: number },
    userResponse: string
  ): ValidationResult {
    if (!questionType.expectedValue) {
      return { isValid: false, confidence: 0, shouldAdvance: false };
    }

    const expectedNumber = questionType.expectedValue;
    
    // Extraer números de la respuesta
    const numberMatches = userResponse.match(/\d+/g);
    if (numberMatches) {
      const userNumber = parseInt(numberMatches[0]);
      if (userNumber === expectedNumber) {
        return {
          isValid: true,
          confidence: 0.95,
          shouldAdvance: true,
          reason: `Número correcto: ${expectedNumber}`
        };
      }
    }

    // Verificar palabras numéricas (twenty-seven, nine, etc.)
    const numberWords: { [key: string]: number } = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
      'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
      'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23, 'twenty-four': 24,
      'twenty-five': 25, 'twenty-six': 26, 'twenty-seven': 27, 'twenty-eight': 28,
      'twenty-nine': 29, 'thirty': 30, 'fifty': 50, 'hundred': 100
    };

    const normalizedResponse = userResponse.toLowerCase()
      .replace(/[^a-z\s-]/g, '')
      .trim();

    // Buscar palabras numéricas
    for (const [word, value] of Object.entries(numberWords)) {
      if (normalizedResponse.includes(word) && value === expectedNumber) {
        return {
          isValid: true,
          confidence: 0.9,
          shouldAdvance: true,
          reason: `Número correcto (${word} = ${value})`
        };
      }
    }

    // Verificar si contiene el número escrito de forma completa
    const fullNumberWords = {
      27: ['twenty seven', 'twenty-seven'],
      9: ['nine'],
      50: ['fifty'],
      10: ['ten']
    };

    const variants = fullNumberWords[expectedNumber as keyof typeof fullNumberWords];
    if (variants) {
      for (const variant of variants) {
        if (normalizedResponse.includes(variant)) {
          return {
            isValid: true,
            confidence: 0.9,
            shouldAdvance: true,
            reason: `Número correcto: ${variant}`
          };
        }
      }
    }

    return {
      isValid: false,
      confidence: 0.2,
      shouldAdvance: false,
      reason: `Número esperado: ${expectedNumber}`
    };
  }

  /**
   * Valida direcciones
   */
  private validateAddress(session: InterviewSession, userResponse: string): ValidationResult {
    const n400Data = session.context.n400FormData;
    if (!n400Data || !n400Data.currentAddress) {
      return { isValid: false, confidence: 0, shouldAdvance: false };
    }

    const formAddress = this.normalizeAddress(
      `${n400Data.currentAddress} ${n400Data.city} ${n400Data.state} ${n400Data.zipCode || ''}`
    );
    const userAddress = this.normalizeAddress(userResponse);

    // Extraer elementos clave
    const formElements = this.extractAddressElements(formAddress);
    const userElements = this.extractAddressElements(userAddress);

    // Comparar elementos clave
    let matches = 0;
    let total = 0;

    if (formElements.streetNumber && userElements.streetNumber) {
      total++;
      if (formElements.streetNumber === userElements.streetNumber) matches++;
    }

    if (formElements.streetName && userElements.streetName) {
      total++;
      if (this.stringsMatch(formElements.streetName, userElements.streetName)) matches++;
    }

    if (formElements.city && userElements.city) {
      total++;
      if (this.stringsMatch(formElements.city, userElements.city)) matches++;
    }

    if (formElements.state && userElements.state) {
      total++;
      if (this.stringsMatch(formElements.state, userElements.state)) matches++;
    }

    // Si al menos 2 de 4 elementos coinciden, o todos los elementos presentes coinciden
    const matchRatio = total > 0 ? matches / total : 0;
    const isValid = matchRatio >= 0.5 || (matches >= 2 && total >= 3);

    return {
      isValid,
      confidence: matchRatio,
      shouldAdvance: isValid,
      reason: isValid ? `Dirección coincide (${matches}/${total} elementos)` : 'Dirección no coincide'
    };
  }

  /**
   * Normaliza una dirección para comparación
   */
  private normalizeAddress(address: string): string {
    return address
      .toLowerCase()
      .replace(/[.,;:!?()[\]{}]/g, '')  // Remover puntuación
      .replace(/\s+/g, ' ')              // Normalizar espacios
      .trim();
  }

  /**
   * Extrae elementos de una dirección
   */
  private extractAddressElements(address: string): {
    streetNumber?: string;
    streetName?: string;
    city?: string;
    state?: string;
  } {
    // Abreviaciones comunes
    const stateAbbr: { [key: string]: string } = {
      'ca': 'california', 'ny': 'new york', 'tx': 'texas', 'fl': 'florida',
      'il': 'illinois', 'pa': 'pennsylvania', 'oh': 'ohio', 'ga': 'georgia'
    };

    const words = address.split(/\s+/);
    const result: any = {};

    // Extraer número de calle (primer número)
    const streetNumberMatch = address.match(/^(\d+)/);
    if (streetNumberMatch) {
      result.streetNumber = streetNumberMatch[1];
    }

    // Extraer nombre de calle (después del número, antes de la ciudad)
    const streetKeywords = ['street', 'st', 'avenue', 'ave', 'road', 'rd', 'drive', 'dr', 'lane', 'ln', 'boulevard', 'blvd'];
    for (let i = 0; i < words.length; i++) {
      if (streetKeywords.some(kw => words[i].includes(kw))) {
        result.streetName = words.slice(0, i + 1).join(' ').replace(/^\d+\s*/, '');
        break;
      }
    }

    // Detectar ciudad y estado (normalmente al final)
    for (const [abbr, full] of Object.entries(stateAbbr)) {
      if (address.includes(abbr) || address.includes(full)) {
        result.state = full;
        // La ciudad está antes del estado
        const stateIndex = address.indexOf(full) !== -1 ? address.indexOf(full) : address.indexOf(abbr);
        if (stateIndex > 0) {
          const beforeState = address.substring(0, stateIndex).trim();
          const parts = beforeState.split(/\s+/);
          if (parts.length > 0) {
            result.city = parts[parts.length - 1];
          }
        }
        break;
      }
    }

    return result;
  }

  /**
   * Compara dos strings de forma flexible
   */
  private stringsMatch(str1: string, str2: string): boolean {
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
    const n1 = normalize(str1);
    const n2 = normalize(str2);

    // Comparación exacta
    if (n1 === n2) return true;

    // Verificar si uno contiene al otro
    if (n1.includes(n2) || n2.includes(n1)) return true;

    // Verificar palabras clave
    const words1 = n1.split(/\s+/);
    const words2 = n2.split(/\s+/);
    
    const matches = words1.filter(w => words2.some(w2 => w.includes(w2) || w2.includes(w)));
    return matches.length >= Math.min(words1.length, words2.length) * 0.7;
  }

  /**
   * Valida respuestas de identidad
   */
  private validateIdentity(session: InterviewSession, userResponse: string): ValidationResult {
    // Para identidad, siempre aceptar (muy flexible)
    return {
      isValid: true,
      confidence: 0.8,
      shouldAdvance: true,
      reason: 'Información de identidad aceptada'
    };
  }

  /**
   * Valida ocupación
   */
  private validateOccupation(session: InterviewSession, userResponse: string): ValidationResult {
    const n400Data = session.context.n400FormData;
    if (!n400Data || !n400Data.currentOccupation) {
      return { isValid: true, confidence: 0.7, shouldAdvance: true };
    }

    const isValid = this.stringsMatch(n400Data.currentOccupation, userResponse);
    return {
      isValid,
      confidence: isValid ? 0.9 : 0.3,
      shouldAdvance: isValid,
      reason: isValid ? 'Ocupación coincide' : 'Ocupación no coincide completamente'
    };
  }

  /**
   * Valida estado civil
   */
  private validateMaritalStatus(session: InterviewSession, userResponse: string): ValidationResult {
    const n400Data = session.context.n400FormData;
    if (!n400Data || !n400Data.maritalStatus) {
      return { isValid: true, confidence: 0.7, shouldAdvance: true };
    }

    const statusMap: { [key: string]: string[] } = {
      'single': ['single', 'soltero', 'soltera', 'unmarried'],
      'married': ['married', 'casado', 'casada', 'marriage'],
      'divorced': ['divorced', 'divorciado', 'divorciada'],
      'widowed': ['widowed', 'viudo', 'viuda']
    };

    const normalizedForm = n400Data.maritalStatus.toLowerCase();
    const normalizedUser = userResponse.toLowerCase();

    // Buscar coincidencia
    for (const [key, variants] of Object.entries(statusMap)) {
      const formMatches = variants.some(v => normalizedForm.includes(v));
      const userMatches = variants.some(v => normalizedUser.includes(v));
      
      if (formMatches && userMatches) {
        return {
          isValid: true,
          confidence: 0.9,
          shouldAdvance: true,
          reason: 'Estado civil coincide'
        };
      }
    }

    // Si no hay datos del formulario, aceptar cualquier respuesta razonable
    return {
      isValid: true,
      confidence: 0.7,
      shouldAdvance: true,
      reason: 'Estado civil aceptado'
    };
  }

  /**
   * Obtiene el último mensaje del oficial
   */
  private getLastOfficerMessage(session: InterviewSession): InterviewMessage | null {
    for (let i = session.messages.length - 1; i >= 0; i--) {
      if (session.messages[i].role === 'officer') {
        return session.messages[i];
      }
    }
    return null;
  }
}

// Singleton instance
export const responseValidator = new ResponseValidator();

