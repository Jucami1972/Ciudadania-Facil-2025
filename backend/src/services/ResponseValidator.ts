/**
 * ResponseValidator - Validador inteligente de respuestas
 * 
 * Valida respuestas del usuario localmente antes de enviarlas a OpenAI
 * para dar más autonomía al sistema y evitar repeticiones innecesarias
 */

import { InterviewSession, InterviewMessage } from '../types';
import { questionBank } from './QuestionBank';
import { interviewTrainingData, findQuestionByText, getQuestionsByCategory } from '../data/interviewTrainingData';

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
        if (typeof questionType.expectedValue === 'number') {
          return this.validateNumberAnswer({ expectedValue: questionType.expectedValue }, userResponse);
        }
        return { isValid: false, confidence: 0, shouldAdvance: false };
      
      default:
        // Para preguntas de travel, family, legal, taxes, loyalty, usar validación genérica
        const lowerMessage = lastOfficerMessage.content.toLowerCase();
        if (lowerMessage.includes('travel') || lowerMessage.includes('trip')) {
          return this.validateTravel(session, userResponse);
        }
        if (lowerMessage.includes('family') || lowerMessage.includes('children') || lowerMessage.includes('spouse')) {
          return this.validateFamily(session, userResponse);
        }
        if (lowerMessage.includes('legal') || lowerMessage.includes('arrest') || lowerMessage.includes('citizen')) {
          return this.validateYesNoQuestion(userResponse, 'legal');
        }
        if (lowerMessage.includes('tax') || lowerMessage.includes('taxes')) {
          return this.validateYesNoQuestion(userResponse, 'taxes');
        }
        if (lowerMessage.includes('constitution') || lowerMessage.includes('loyalty') || lowerMessage.includes('oath')) {
          return this.validateYesNoQuestion(userResponse, 'loyalty');
        }
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
   * Valida direcciones - MUY FLEXIBLE para aceptar cualquier formato
   */
  private validateAddress(session: InterviewSession, userResponse: string): ValidationResult {
    // Si no hay datos del N-400, aceptar cualquier dirección que parezca válida
    const n400Data = session.context.n400FormData;
    if (!n400Data || !n400Data.currentAddress) {
      // Validar que la respuesta parece una dirección (contiene números y palabras)
      const hasNumber = /\d+/.test(userResponse);
      const hasWords = /[a-zA-Z]{2,}/.test(userResponse);
      if (hasNumber && hasWords) {
        return {
          isValid: true,
          confidence: 0.9,
          shouldAdvance: true,
          reason: 'Dirección aceptada (sin datos de formulario para comparar)'
        };
      }
      return { isValid: false, confidence: 0, shouldAdvance: false };
    }

    // Normalizar ambas direcciones de forma muy flexible
    const formAddress = this.normalizeAddress(
      `${n400Data.currentAddress} ${n400Data.city} ${n400Data.state} ${n400Data.zipCode || ''}`
    );
    const userAddress = this.normalizeAddress(userResponse);

    // Extraer elementos clave con normalización mejorada
    const formElements = this.extractAddressElements(formAddress);
    const userElements = this.extractAddressElements(userAddress);

    // Comparar elementos clave con mucha flexibilidad
    let matches = 0;
    let total = 0;

    // Comparar número de calle
    if (formElements.streetNumber && userElements.streetNumber) {
      total++;
      if (formElements.streetNumber === userElements.streetNumber) matches++;
    }

    // Comparar nombre de calle (muy flexible)
    if (formElements.streetName && userElements.streetName) {
      total++;
      if (this.stringsMatchFlexible(formElements.streetName, userElements.streetName)) matches++;
    }

    // Comparar ciudad (muy flexible)
    if (formElements.city && userElements.city) {
      total++;
      if (this.stringsMatchFlexible(formElements.city, userElements.city)) matches++;
    }

    // Comparar estado (muy flexible, incluye abreviaciones)
    if (formElements.state && userElements.state) {
      total++;
      if (this.stringsMatchFlexible(formElements.state, userElements.state)) matches++;
    }

    // Aceptar si:
    // 1. Al menos 1 elemento coincide (muy flexible)
    // 2. O la dirección contiene palabras clave del formulario
    // 3. O si no hay elementos extraídos, hacer comparación de substrings
    let isValid = false;
    let confidence = 0;

    if (total > 0) {
      const matchRatio = matches / total;
      isValid = matches >= 1 || matchRatio >= 0.3; // Muy flexible: solo 1 elemento o 30% de coincidencia
      confidence = matchRatio;
    } else {
      // Si no se extrajeron elementos, hacer comparación por substrings
      const formWords = formAddress.split(/\s+/).filter(w => w.length > 2);
      const userWords = userAddress.split(/\s+/).filter(w => w.length > 2);
      const commonWords = formWords.filter(w => userWords.some(uw => uw.includes(w) || w.includes(uw)));
      
      if (commonWords.length >= 2) {
        isValid = true;
        confidence = Math.min(0.8, commonWords.length / formWords.length);
      }
    }

    return {
      isValid,
      confidence: Math.max(confidence, isValid ? 0.7 : 0),
      shouldAdvance: isValid,
      reason: isValid ? `Dirección aceptada (${matches}/${total} elementos coinciden)` : 'Dirección no coincide'
    };
  }

  /**
   * Normaliza una dirección para comparación - MUY FLEXIBLE
   */
  private normalizeAddress(address: string): string {
    // Remover prefijos comunes como "My address is", "I live at", etc.
    let normalized = address.toLowerCase()
      .replace(/^(my address is|i live at|it's|it is|the address is|address:)\s*/i, '')
      .trim();

    // Normalizar abreviaciones direccionales
    normalized = normalized
      .replace(/\bnw\b/g, 'northwest')
      .replace(/\bne\b/g, 'northeast')
      .replace(/\bsw\b/g, 'southwest')
      .replace(/\bse\b/g, 'southeast')
      .replace(/\bn\b/g, 'north')
      .replace(/\bs\b/g, 'south')
      .replace(/\be\b/g, 'east')
      .replace(/\bw\b/g, 'west');

    // Normalizar números ordinales (23rd -> 23, 1st -> 1, etc.)
    normalized = normalized.replace(/(\d+)(st|nd|rd|th)\b/g, '$1');

    // Normalizar abreviaciones de calles
    normalized = normalized
      .replace(/\bst\b/g, 'street')
      .replace(/\bave\b/g, 'avenue')
      .replace(/\brd\b/g, 'road')
      .replace(/\bdr\b/g, 'drive')
      .replace(/\bln\b/g, 'lane')
      .replace(/\bblvd\b/g, 'boulevard')
      .replace(/\bapt\b/g, 'apartment')
      .replace(/#(\d+)/g, 'apartment $1')
      .replace(/apt\s*(\d+)/g, 'apartment $1');

    // Normalizar estados
    const stateNormalization: { [key: string]: string } = {
      'ok': 'oklahoma',
      'ca': 'california',
      'ny': 'new york',
      'tx': 'texas',
      'fl': 'florida',
      'il': 'illinois',
      'pa': 'pennsylvania',
      'oh': 'ohio',
      'ga': 'georgia',
      'nc': 'north carolina',
      'mi': 'michigan',
      'az': 'arizona',
      'wa': 'washington',
      'co': 'colorado',
      'ma': 'massachusetts',
      'tn': 'tennessee',
      'in': 'indiana',
      'mo': 'missouri',
      'md': 'maryland',
      'wi': 'wisconsin',
      'va': 'virginia',
      'ut': 'utah',
      'or': 'oregon',
      'nv': 'nevada',
      'nm': 'new mexico',
      'ct': 'connecticut',
      'mn': 'minnesota',
      'ar': 'arkansas',
      'ia': 'iowa',
      'ks': 'kansas',
      'la': 'louisiana',
      'ms': 'mississippi',
      'al': 'alabama',
      'sc': 'south carolina',
      'ky': 'kentucky',
      'wv': 'west virginia',
      'ne': 'nebraska',
      'id': 'idaho',
      'hi': 'hawaii',
      'nh': 'new hampshire',
      'me': 'maine',
      'mt': 'montana',
      'ri': 'rhode island',
      'de': 'delaware',
      'sd': 'south dakota',
      'nd': 'north dakota',
      'ak': 'alaska',
      'vt': 'vermont',
      'wy': 'wyoming'
    };

    for (const [abbr, full] of Object.entries(stateNormalization)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'g');
      normalized = normalized.replace(regex, full);
    }

    // Remover puntuación y normalizar espacios
    normalized = normalized
      .replace(/[.,;:!?()[\]{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return normalized;
  }

  /**
   * Extrae elementos de una dirección - MEJORADO para ser más flexible
   */
  private extractAddressElements(address: string): {
    streetNumber?: string;
    streetName?: string;
    city?: string;
    state?: string;
  } {
    const result: any = {};
    const words = address.split(/\s+/);

    // Extraer número de calle (cualquier número al inicio)
    const streetNumberMatch = address.match(/(\d+)/);
    if (streetNumberMatch) {
      result.streetNumber = streetNumberMatch[1];
    }

    // Extraer nombre de calle (después del número, hasta ciudad/estado)
    const streetKeywords = ['street', 'st', 'avenue', 'ave', 'road', 'rd', 'drive', 'dr', 
                           'lane', 'ln', 'boulevard', 'blvd', 'circle', 'cir', 'court', 'ct',
                           'parkway', 'pkwy', 'place', 'pl', 'way', 'northwest', 'nw', 'northeast', 
                           'ne', 'southwest', 'sw', 'southeast', 'se', 'north', 'n', 'south', 
                           's', 'east', 'e', 'west', 'w'];
    
    let streetNameEndIndex = -1;
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();
      if (streetKeywords.some(kw => word.includes(kw) || kw.includes(word))) {
        streetNameEndIndex = i + 1;
        break;
      }
    }

    if (streetNameEndIndex > 0) {
      // Incluir todo desde el inicio hasta la palabra clave de calle
      let streetStart = 0;
      // Saltar el número de calle si está al inicio
      if (result.streetNumber && words[0] === result.streetNumber) {
        streetStart = 1;
      }
      result.streetName = words.slice(streetStart, streetNameEndIndex).join(' ');
    } else if (result.streetNumber) {
      // Si no encontramos palabra clave, tomar las primeras palabras después del número
      const numberIndex = words.findIndex(w => w === result.streetNumber);
      if (numberIndex >= 0 && numberIndex < words.length - 2) {
        result.streetName = words.slice(numberIndex + 1, Math.min(numberIndex + 4, words.length - 2)).join(' ');
      }
    }

    // Detectar estado (completos o abreviaciones) - lista completa
    const states: { [key: string]: string } = {
      'oklahoma': 'oklahoma', 'ok': 'oklahoma',
      'california': 'california', 'ca': 'california',
      'new york': 'new york', 'ny': 'new york',
      'texas': 'texas', 'tx': 'texas',
      'florida': 'florida', 'fl': 'florida',
      'illinois': 'illinois', 'il': 'illinois',
      'pennsylvania': 'pennsylvania', 'pa': 'pennsylvania',
      'ohio': 'ohio', 'oh': 'ohio',
      'georgia': 'georgia', 'ga': 'georgia',
      'north carolina': 'north carolina', 'nc': 'north carolina',
      'michigan': 'michigan', 'mi': 'michigan',
      'arizona': 'arizona', 'az': 'arizona',
      'washington': 'washington', 'wa': 'washington',
      'colorado': 'colorado', 'co': 'colorado',
      'massachusetts': 'massachusetts', 'ma': 'massachusetts',
      'tennessee': 'tennessee', 'tn': 'tennessee',
      'indiana': 'indiana', 'in': 'indiana',
      'missouri': 'missouri', 'mo': 'missouri',
      'maryland': 'maryland', 'md': 'maryland',
      'wisconsin': 'wisconsin', 'wi': 'wisconsin',
      'virginia': 'virginia', 'va': 'virginia',
      'utah': 'utah', 'ut': 'utah',
      'oregon': 'oregon', 'or': 'oregon',
      'nevada': 'nevada', 'nv': 'nevada',
      'new mexico': 'new mexico', 'nm': 'new mexico',
      'connecticut': 'connecticut', 'ct': 'connecticut',
      'minnesota': 'minnesota', 'mn': 'minnesota',
      'arkansas': 'arkansas', 'ar': 'arkansas',
      'iowa': 'iowa', 'ia': 'iowa',
      'kansas': 'kansas', 'ks': 'kansas',
      'louisiana': 'louisiana', 'la': 'louisiana',
      'mississippi': 'mississippi', 'ms': 'mississippi',
      'alabama': 'alabama', 'al': 'alabama',
      'south carolina': 'south carolina', 'sc': 'south carolina',
      'kentucky': 'kentucky', 'ky': 'kentucky',
      'west virginia': 'west virginia', 'wv': 'west virginia',
      'nebraska': 'nebraska', 'ne': 'nebraska',
      'idaho': 'idaho', 'id': 'idaho',
      'hawaii': 'hawaii', 'hi': 'hawaii',
      'new hampshire': 'new hampshire', 'nh': 'new hampshire',
      'maine': 'maine', 'me': 'maine',
      'montana': 'montana', 'mt': 'montana',
      'rhode island': 'rhode island', 'ri': 'rhode island',
      'delaware': 'delaware', 'de': 'delaware',
      'south dakota': 'south dakota', 'sd': 'south dakota',
      'north dakota': 'north dakota', 'nd': 'north dakota',
      'alaska': 'alaska', 'ak': 'alaska',
      'vermont': 'vermont', 'vt': 'vermont',
      'wyoming': 'wyoming', 'wy': 'wyoming'
    };

    // Buscar estado (normalmente al final de la dirección)
    for (const [key, fullState] of Object.entries(states)) {
      if (address.includes(key)) {
        result.state = fullState;
        // Intentar extraer ciudad (palabra antes del estado)
        const stateIndex = address.indexOf(key);
        if (stateIndex > 0) {
          const beforeState = address.substring(0, stateIndex).trim();
          const parts = beforeState.split(/\s+/).filter(p => p.length > 2);
          // La ciudad suele ser la última palabra significativa antes del estado
          if (parts.length > 0) {
            // Buscar ciudad (normalmente 1-2 palabras antes del estado)
            const cityCandidates = parts.slice(-2);
            result.city = cityCandidates.join(' ');
          }
        }
        break;
      }
    }

    return result;
  }

  /**
   * Compara dos strings de forma MUY flexible
   */
  private stringsMatchFlexible(str1: string, str2: string): boolean {
    if (!str1 || !str2) return false;
    
    const normalize = (s: string) => s.toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,;:!?()[\]{}]/g, '')
      .trim();
    
    const n1 = normalize(str1);
    const n2 = normalize(str2);

    // Comparación exacta
    if (n1 === n2) return true;

    // Verificar si uno contiene al otro
    if (n1.includes(n2) || n2.includes(n1)) return true;

    // Comparar palabras clave (muy flexible - solo necesitan coincidir parcialmente)
    const words1 = n1.split(/\s+/).filter(w => w.length > 1);
    const words2 = n2.split(/\s+/).filter(w => w.length > 1);
    
    if (words1.length === 0 || words2.length === 0) return false;
    
    // Buscar palabras que coincidan (parcial o completo)
    const matches = words1.filter(w1 => 
      words2.some(w2 => w1.includes(w2) || w2.includes(w1) || w1 === w2)
    );
    
    // Aceptar si al menos 50% de las palabras coinciden
    return matches.length >= Math.ceil(Math.min(words1.length, words2.length) * 0.5);
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
   * Valida estado civil con respuestas naturales
   */
  private validateMaritalStatus(session: InterviewSession, userResponse: string): ValidationResult {
    const n400Data = session.context.n400FormData;
    
    // Respuestas naturales aceptables
    const naturalResponses = [
      'i am married', 'i\'m married', 'married', 'casado', 'casada', 'estoy casado',
      'i am single', 'i\'m single', 'single', 'soltero', 'soltera', 'soy soltero',
      'i am divorced', 'i\'m divorced', 'divorced', 'divorciado', 'divorciada', 'estoy divorciado',
      'i am widowed', 'i\'m widowed', 'widowed', 'viudo', 'viuda', 'soy viudo',
      'i am separated', 'i\'m separated', 'separated', 'separado', 'separada', 'estoy separado'
    ];

    const normalizedUser = userResponse.toLowerCase().trim();
    
    // Verificar si la respuesta es una respuesta natural válida
    const isValidNaturalResponse = naturalResponses.some(resp => 
      normalizedUser.includes(resp) || normalizedUser === resp
    );

    if (!isValidNaturalResponse) {
      return {
        isValid: false,
        confidence: 0.3,
        shouldAdvance: false,
        reason: 'Respuesta no reconocida como estado civil válido'
      };
    }

    // Si hay datos del N-400, validar contra ellos
    if (n400Data && n400Data.maritalStatus) {
      const statusMap: { [key: string]: string[] } = {
        'single': ['single', 'soltero', 'soltera', 'unmarried', 'i am single', 'i\'m single'],
        'married': ['married', 'casado', 'casada', 'marriage', 'i am married', 'i\'m married', 'estoy casado'],
        'divorced': ['divorced', 'divorciado', 'divorciada', 'i am divorced', 'i\'m divorced', 'estoy divorciado'],
        'widowed': ['widowed', 'viudo', 'viuda', 'i am widowed', 'i\'m widowed'],
        'separated': ['separated', 'separado', 'separada', 'i am separated', 'i\'m separated', 'estoy separado']
      };

      const normalizedForm = n400Data.maritalStatus.toLowerCase();
      
      // Buscar coincidencia
      for (const [key, variants] of Object.entries(statusMap)) {
        const formMatches = variants.some(v => normalizedForm.includes(v));
        const userMatches = variants.some(v => normalizedUser.includes(v));
        
        if (formMatches && userMatches) {
          return {
            isValid: true,
            confidence: 0.95,
            shouldAdvance: true,
            reason: 'Estado civil coincide con el formulario'
          };
        }
      }
      
      // Si no coincide exactamente pero es una respuesta válida, aceptar con menor confianza
      return {
        isValid: true,
        confidence: 0.7,
        shouldAdvance: true,
        reason: 'Estado civil válido pero no coincide completamente con el formulario'
      };
    }

    // Si no hay datos del formulario, aceptar cualquier respuesta natural válida
    return {
      isValid: true,
      confidence: 0.85,
      shouldAdvance: true,
      reason: 'Estado civil válido aceptado'
    };
  }

  /**
   * Valida usando datos de entrenamiento
   */
  private validateUsingTrainingData(questionData: any, userResponse: string, session: InterviewSession): ValidationResult {
    const normalizedUser = userResponse.toLowerCase().trim();
    
    // Verificar respuestas naturales esperadas
    if (questionData.naturalResponses && questionData.naturalResponses.length > 0) {
      const naturalMatch = questionData.naturalResponses.some((expected: string) => {
        const normalizedExpected = expected.toLowerCase().replace(/\[.*?\]/g, '.*').trim();
        const regex = new RegExp(normalizedExpected, 'i');
        return regex.test(normalizedUser) || normalizedUser.includes(expected.toLowerCase());
      });

      if (naturalMatch) {
        return {
          isValid: true,
          confidence: 0.9,
          shouldAdvance: true,
          reason: 'Respuesta natural válida reconocida'
        };
      }
    }

    // Aplicar reglas de validación
    if (questionData.validationRules) {
      const rules = questionData.validationRules;
      let normalizedForComparison = userResponse;

      if (rules.ignoreCase) {
        normalizedForComparison = normalizedForComparison.toLowerCase();
      }

      if (rules.ignorePunctuation) {
        normalizedForComparison = normalizedForComparison.replace(/[.,;:!?()[\]{}]/g, '');
      }

      // Validar sinónimos
      if (rules.synonyms) {
        for (const [key, synonyms] of Object.entries(rules.synonyms)) {
          const keyMatch = normalizedForComparison.includes(key.toLowerCase());
          const synonymArray = Array.isArray(synonyms) ? synonyms : [];
          const synonymMatch = synonymArray.some((syn: string) => normalizedForComparison.includes(syn.toLowerCase()));
          
          if (keyMatch || synonymMatch) {
            return {
              isValid: true,
              confidence: 0.85,
              shouldAdvance: true,
              reason: 'Respuesta válida reconocida mediante sinónimos'
            };
          }
        }
      }
    }

    // Si hay datos del N-400 para comparar
    if (questionData.expectedResponseType && session.context.n400FormData) {
      return this.validateAgainstN400Data(questionData, userResponse, session);
    }

    // Si no se puede validar específicamente, aceptar si tiene contenido razonable
    if (userResponse.trim().length > 2) {
      return {
        isValid: true,
        confidence: 0.6,
        shouldAdvance: true,
        reason: 'Respuesta con contenido válido'
      };
    }

    return {
      isValid: false,
      confidence: 0.2,
      shouldAdvance: false,
      reason: 'Respuesta no reconocida'
    };
  }

  /**
   * Valida contra datos del N-400
   */
  private validateAgainstN400Data(questionData: any, userResponse: string, session: InterviewSession): ValidationResult {
    const n400Data = session.context.n400FormData;
    if (!n400Data) {
      return { isValid: false, confidence: 0, shouldAdvance: false };
    }

    const questionLower = questionData.question.toLowerCase();
    const userLower = userResponse.toLowerCase().trim();

    // Validar según el tipo de pregunta
    if (questionLower.includes('occupation') || questionLower.includes('work') || questionLower.includes('job')) {
      if (n400Data.currentOccupation) {
        const isValid = this.stringsMatch(n400Data.currentOccupation, userResponse);
        return {
          isValid,
          confidence: isValid ? 0.9 : 0.3,
          shouldAdvance: isValid,
          reason: isValid ? 'Ocupación coincide' : 'Ocupación no coincide completamente'
        };
      }
    }

    return {
      isValid: true,
      confidence: 0.7,
      shouldAdvance: true,
      reason: 'Validación básica pasada'
    };
  }

  /**
   * Valida preguntas de viajes
   */
  private validateTravel(session: InterviewSession, userResponse: string): ValidationResult {
    const normalizedUser = userResponse.toLowerCase().trim();
    
    // Validar números (días, viajes)
    const numberMatches = normalizedUser.match(/\d+/g);
    if (numberMatches) {
      return {
        isValid: true,
        confidence: 0.85,
        shouldAdvance: true,
        reason: 'Número de viajes/días reconocido'
      };
    }

    // Validar respuestas sobre propósito de viaje
    const travelPurposes = ['vacation', 'business', 'family', 'visit', 'work', 'vacaciones', 'trabajo', 'familia'];
    const hasPurpose = travelPurposes.some(purpose => normalizedUser.includes(purpose));
    
    if (hasPurpose) {
      return {
        isValid: true,
        confidence: 0.8,
        shouldAdvance: true,
        reason: 'Propósito de viaje reconocido'
      };
    }

    return {
      isValid: true,
      confidence: 0.6,
      shouldAdvance: true,
      reason: 'Respuesta sobre viajes aceptada'
    };
  }

  /**
   * Valida preguntas sobre familia
   */
  private validateFamily(session: InterviewSession, userResponse: string): ValidationResult {
    const normalizedUser = userResponse.toLowerCase().trim();
    
    // Validar números (número de hijos)
    const numberMatches = normalizedUser.match(/\d+/g);
    if (numberMatches) {
      return {
        isValid: true,
        confidence: 0.9,
        shouldAdvance: true,
        reason: 'Número de hijos reconocido'
      };
    }

    // Validar nombres
    if (normalizedUser.length > 2 && !normalizedUser.match(/^(yes|no|si|sí)$/i)) {
      return {
        isValid: true,
        confidence: 0.8,
        shouldAdvance: true,
        reason: 'Nombre reconocido'
      };
    }

    return {
      isValid: true,
      confidence: 0.7,
      shouldAdvance: true,
      reason: 'Respuesta sobre familia aceptada'
    };
  }

  /**
   * Valida preguntas de Sí/No (legal, taxes, loyalty)
   */
  private validateYesNoQuestion(userResponse: string, questionType: string): ValidationResult {
    const normalizedUser = userResponse.toLowerCase().trim();
    
    // Respuestas afirmativas aceptables
    const yesResponses = ['yes', 'si', 'sí', 'yes i do', 'yes i am', 'yes i\'m willing', 'i am willing', 'i do', 'absolutely yes', 'absolutely'];
    
    // Respuestas negativas aceptables
    const noResponses = ['no', 'no i have not', 'no never', 'never', 'no i do not', 'i don\'t', 'no sir'];
    
    const isYes = yesResponses.some(resp => normalizedUser.includes(resp) || normalizedUser === resp);
    const isNo = noResponses.some(resp => normalizedUser.includes(resp) || normalizedUser === resp);

    if (isYes || isNo) {
      return {
        isValid: true,
        confidence: 0.9,
        shouldAdvance: true,
        reason: `${isYes ? 'Respuesta afirmativa' : 'Respuesta negativa'} reconocida`
      };
    }

    return {
      isValid: false,
      confidence: 0.3,
      shouldAdvance: false,
      reason: 'Respuesta no reconocida como Sí/No válida'
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

