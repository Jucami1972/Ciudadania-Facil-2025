/**
 * QuestionBank - Base de datos de las 128 preguntas oficiales del USCIS
 */

import { Question } from '../types';
import { questions } from '../data/questions';

export class QuestionBank {
  private questions: Question[] = questions;

  /**
   * Obtiene todas las preguntas
   */
  getAllQuestions(): Question[] {
    return this.questions;
  }

  /**
   * Obtiene una pregunta por ID
   */
  getQuestionById(id: number): Question | undefined {
    return this.questions.find(q => q.id === id);
  }

  /**
   * Obtiene preguntas aleatorias que no se hayan usado
   */
  getRandomQuestions(count: number, excludeIds: number[] = []): Question[] {
    const available = this.questions.filter(q => !excludeIds.includes(q.id));
    
    if (available.length === 0) {
      return [];
    }

    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Obtiene una pregunta aleatoria que no se haya usado
   * Prioriza preguntas importantes (asterisk: true) pero mantiene aleatoriedad
   */
  getRandomQuestion(excludeIds: number[] = [], prioritizeImportant: boolean = true): Question | undefined {
    const available = this.questions.filter(q => !excludeIds.includes(q.id));
    
    if (available.length === 0) {
      return undefined;
    }

    // Si no hay preguntas importantes o no se priorizan, selección completamente aleatoria
    if (!prioritizeImportant) {
      const randomIndex = Math.floor(Math.random() * available.length);
      return available[randomIndex];
    }

    // Separar preguntas importantes (asterisk: true) de las demás
    const importantQuestions = available.filter(q => q.asterisk === true);
    const otherQuestions = available.filter(q => q.asterisk !== true);

    // Si hay preguntas importantes disponibles, dar 70% de probabilidad a ellas
    // Si ya se han usado muchas preguntas importantes, reducir la prioridad
    const importantRatio = importantQuestions.length / available.length;
    
    // Si hay suficientes preguntas importantes (más del 30% disponibles), priorizarlas
    if (importantQuestions.length > 0 && importantRatio > 0.3) {
      // 70% probabilidad de seleccionar una pregunta importante
      if (Math.random() < 0.7) {
        const randomIndex = Math.floor(Math.random() * importantQuestions.length);
        return importantQuestions[randomIndex];
      }
    }

    // 30% probabilidad (o si no hay suficientes importantes) de seleccionar cualquier pregunta
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }

  /**
   * Valida si una respuesta es correcta
   * Acepta CUALQUIER respuesta oficial de las 128 preguntas
   */
  validateAnswer(questionId: number, userAnswer: string): boolean {
    const question = this.getQuestionById(questionId);
    if (!question) {
      return false;
    }

    // Extraer TODAS las respuestas oficiales posibles
    let allOfficialAnswers: string[] = [];
    
    if (Array.isArray(question.answerEn)) {
      // Si ya es un array, usar todas las respuestas
      allOfficialAnswers = question.answerEn;
    } else {
      // Si es string, puede contener múltiples respuestas separadas por:
      // - Saltos de línea (\n)
      // - Puntos bullets (•)
      // - Comas (para algunas preguntas)
      const answerStr = question.answerEn;
      
      // Verificar si contiene "Answers will vary" (respuestas variables)
      const hasVariableAnswers = answerStr.toLowerCase().includes('answers will vary') || 
                                 answerStr.toLowerCase().includes('las respuestas variarán');
      
      // Si contiene "•" o "\n", separar en múltiples respuestas
      if (answerStr.includes('•') || answerStr.includes('\n')) {
        // Separar por bullets o saltos de línea
        let splitAnswers = answerStr
          .split(/[•\n]+/)  // Separar por bullets o saltos de línea (puede haber múltiples)
          .map(a => {
            // Remover bullets restantes al inicio y espacios
            let cleaned = a.trim();
            // Remover bullet al inicio si queda alguno
            if (cleaned.startsWith('•')) {
              cleaned = cleaned.substring(1).trim();
            }
            // Remover paréntesis con preferencia como "<preferred>text</preferred>"
            cleaned = cleaned.replace(/<preferred>|<\/preferred>/g, '').trim();
            return cleaned;
          })
          .filter(a => {
            // Filtrar vacíos y respuestas que solo digan "Answers will vary"
            return a.length > 0 && 
                   !a.toLowerCase().startsWith('answers will vary') && 
                   !a.toLowerCase().startsWith('las respuestas variarán') &&
                   !a.match(/^\[.*?\]$/); // No incluir instrucciones entre corchetes solas
          });
        
        // Si hay respuestas específicas además de "Answers will vary"
        if (splitAnswers.length > 0) {
          allOfficialAnswers = splitAnswers;
        } else if (hasVariableAnswers) {
          // Si solo dice "Answers will vary", aceptar cualquier respuesta razonable
          // Para preguntas como "Who is your senator?" - aceptar cualquier nombre válido
          allOfficialAnswers = [answerStr];
        } else {
          // Si no se pudo separar bien, usar la respuesta completa
          allOfficialAnswers = [answerStr];
        }
      } else if (answerStr.includes(',')) {
        // Si contiene comas, puede ser múltiples respuestas (ej: "Equality, Liberty")
        // Pero solo si no es parte de una frase normal
        const parts = answerStr.split(',');
        if (parts.length <= 5 && parts.every(p => p.trim().length < 30)) {
          // Probablemente múltiples respuestas cortas
          allOfficialAnswers = parts.map(a => a.trim());
        } else {
          // Es parte de una frase, usar la respuesta completa
          allOfficialAnswers = [answerStr];
        }
      } else {
        // Respuesta simple
        allOfficialAnswers = [answerStr];
      }
      
      // Limpiar respuestas: remover corchetes con instrucciones adicionales y paréntesis de preferencia
      allOfficialAnswers = allOfficialAnswers.map(a => {
        // Remover texto entre corchetes [como este] pero mantener el contenido si es parte de la respuesta
        let cleaned = a.replace(/\[.*?\]/g, '').trim();
        // Remover tags de preferencia HTML
        cleaned = cleaned.replace(/<preferred>|<\/preferred>/g, '').trim();
        return cleaned;
      }).filter(a => a.length > 0 && !a.match(/^\s*\[\s*\]\s*$/));
    }

    const normalizedUserAnswer = userAnswer.toLowerCase().trim();
    
    // Si no hay respuestas oficiales específicas (ej: "Answers will vary"), aceptar cualquier respuesta razonable
    if (allOfficialAnswers.length === 0 || 
        (allOfficialAnswers.length === 1 && allOfficialAnswers[0].toLowerCase().includes('answers will vary'))) {
      // Para preguntas que varían (como "Who is your senator?"), aceptar cualquier respuesta con contenido
      return normalizedUserAnswer.length > 2; // Aceptar si tiene contenido razonable
    }
    
    // Verificar si la respuesta del usuario coincide con CUALQUIERA de las respuestas oficiales
    return allOfficialAnswers.some(answer => {
      const normalizedCorrect = answer.toLowerCase().trim();
      
      // Función para normalizar texto (remover TODA puntuación, paréntesis, comas, puntos, etc.)
      // IMPORTANTE: Ignora COMPLETAMENTE paréntesis, comas, puntos, guiones y otros signos de puntuación
      const normalizeText = (text: string): string => {
        return text
          .toLowerCase()                      // Primero convertir a minúsculas
          .replace(/[.,;:!?()[\]{}'"]/g, '')  // Remover TODA puntuación: puntos, comas, paréntesis, corchetes, llaves, comillas, etc.
          .replace(/[-–—]/g, ' ')            // Remover guiones de diferentes tipos (reemplazar por espacio)
          .replace(/\s+/g, ' ')               // Normalizar espacios múltiples a un solo espacio
          .trim();                            // Eliminar espacios al inicio y final
      };
      
      // Extraer números de ambas respuestas
      const extractNumbers = (text: string): number[] => {
        const matches = text.match(/\d+/g);
        return matches ? matches.map(Number) : [];
      };
      
      const userNumbers = extractNumbers(normalizedUserAnswer);
      const correctNumbers = extractNumbers(normalizedCorrect);
      
      // Si hay números en ambas, comparar números primero
      if (userNumbers.length > 0 && correctNumbers.length > 0) {
        const numberMatch = userNumbers.some(num => correctNumbers.includes(num));
        if (numberMatch) {
          return true; // Si los números coinciden, aceptar inmediatamente
        }
      }
      
      // Normalizar texto para comparación (normalizar desde los ya en lowercase)
      const normalizedUser = normalizeText(normalizedUserAnswer);
      const normalizedCorrectText = normalizeText(normalizedCorrect);
      
      // Remover paréntesis y su contenido para comparación más flexible
      // Ej: "(U.S.) Constitution" = "Constitution" = "US Constitution" = "United States Constitution"
      const removeParentheses = (text: string): string => {
        return text.replace(/\(.*?\)/g, '').trim();
      };
      
      const userWithoutParens = removeParentheses(normalizedUser);
      const correctWithoutParens = removeParentheses(normalizedCorrectText);
      
      // Comparación exacta después de normalización (con y sin paréntesis)
      if (normalizedUser === normalizedCorrectText || userWithoutParens === correctWithoutParens) {
        return true;
      }
      
      // Comparación sin paréntesis pero con contenido principal
      if (userWithoutParens.length > 0 && correctWithoutParens.length > 0) {
        // Si el texto sin paréntesis coincide parcialmente, verificar más a fondo
        if (userWithoutParens.includes(correctWithoutParens) || correctWithoutParens.includes(userWithoutParens)) {
          return true;
        }
      }
      
      // Si la respuesta es corta, verificar si contiene las palabras clave principales
      if (normalizedCorrectText.length < 50) {
        // Extraer palabras significativas (más de 2 caracteres)
        const userWords = normalizedUser.split(/\s+/).filter(w => w.length > 2);
        const correctWords = normalizedCorrectText.split(/\s+/).filter(w => w.length > 2);
        
        // Si todas las palabras clave principales están presentes, aceptar
        if (correctWords.length > 0) {
          // Para respuestas cortas (menos de 20 caracteres), todas las palabras deben coincidir
          if (normalizedCorrectText.length < 20) {
            const allWordsMatch = correctWords.every(word => 
              userWords.some(uw => uw === word || uw.includes(word) || word.includes(uw))
            );
            if (allWordsMatch && userWords.length >= Math.max(1, correctWords.length - 1)) {
              return true;
            }
          } else {
            // Para respuestas más largas, al menos 70% de las palabras clave deben coincidir
            const matchingWords = correctWords.filter(word => 
              userWords.some(uw => uw === word || uw.includes(word) || word.includes(uw))
            );
            if (matchingWords.length >= Math.ceil(correctWords.length * 0.7)) {
              return true;
            }
          }
        }
        
        // Verificar si contiene palabras clave importantes (palabras de 4+ caracteres)
        const importantKeywords = correctWords.filter(w => w.length >= 4);
        if (importantKeywords.length > 0) {
          const matchingImportant = importantKeywords.filter(keyword => 
            normalizedUser.includes(keyword) || keyword.includes(normalizedUser.split(' ')[0])
          );
          // Si al menos una palabra clave importante coincide, aceptar
          if (matchingImportant.length > 0 && normalizedUser.length > 3) {
            return true;
          }
        }
      }
      
      // Para respuestas largas, verificar palabras clave significativas
      const keywords = normalizedCorrectText.split(/\s+/).filter(w => w.length >= 4);
      if (keywords.length > 0) {
        // Si al menos 2 palabras clave coinciden, aceptar
        const matchingKeywords = keywords.filter(keyword => normalizedUser.includes(keyword));
        if (matchingKeywords.length >= Math.min(2, Math.ceil(keywords.length * 0.5))) {
          return true;
        }
      }
      
      // Última verificación: si contiene palabras principales individuales
      const mainWords = normalizedCorrectText.split(/\s+/).filter(w => w.length >= 3);
      return mainWords.some(keyword => normalizedUser.includes(keyword));
    });
  }

  /**
   * Obtiene el número total de preguntas
   */
  getTotalQuestions(): number {
    return this.questions.length;
  }
}

// Singleton instance
export const questionBank = new QuestionBank();

