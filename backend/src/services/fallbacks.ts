/**
 * Fallbacks - Respuestas predefinidas cuando OpenAI no está disponible
 */

import { FluencyEvaluation, InterviewStage } from '../types';

export class FallbackEngine {
  /**
   * Genera respuesta del oficial predefinida según la etapa
   */
  generateOfficerResponse(stage: InterviewStage, context?: any): string {
    const applicantName = context?.applicantName || 'applicant';

    switch (stage) {
      case 'greeting':
        return `Good morning, ${applicantName}. Welcome to your naturalization interview. I will be conducting your interview today. We will go through several sections including identity verification, questions about your application, the oath of allegiance, civics questions, and reading and writing tests. Please answer my questions clearly and honestly. Let's begin.`;

      case 'swearing_in':
        return `Please remain standing. Please raise your right hand. Do you swear to tell the truth, the whole truth, and nothing but the truth?`;

      case 'identity':
        return `Can I have your green card and your appointment letter and your driver's license or state issued ID? Can you please confirm your full name and date of birth?`;

      case 'n400_biographical':
        return `Now I'd like to review your N-400 application with you. Why are you eligible to become a U.S citizen?`;

      case 'n400_residence':
        return `Now I'd like to verify your residence information. What is your current physical address?`;

      case 'oath':
        return `Now I will administer the Oath of Allegiance. This is an important step in becoming a U.S. citizen. Please repeat after me: "I hereby declare, on oath, that I absolutely and entirely renounce and abjure all allegiance and fidelity to any foreign prince, potentate, state, or sovereignty..."`;

      case 'civics':
        return `Now we will move to the civics questions. Please listen carefully and answer each question. What is the supreme law of the land?`;

      case 'reading':
        return `Now I will test your ability to read in English. Please read this sentence: "What is the capital of the United States?"`;

      case 'writing':
        return `Now I will test your ability to write in English. Please write this sentence: "Washington, D.C. is the capital of the United States."`;

      case 'n400_moral_character':
        return `Now I will ask you some questions about your moral character. Have you ever claimed to be a U.S citizen in writing or any other way?`;

      case 'loyalty_oath':
        return `Do you support the Constitution and form of government of the United States? Are you willing to take the full Oath of Allegiance to the United States?`;

      case 'review_signature':
        return `I'm going to have you review your application form on the tablet in front of you to make sure everything is correct and accurate, and then I want you to print, sign, and date. Please review this form and let me know if it is correct.`;

      case 'closing':
        return `Congratulations. You have passed the citizenship interview. Your application has been approved. You will receive a notice in the mail with instructions for the oath ceremony. This will be scheduled in approximately one to two weeks. Thank you for your cooperation today. Have a good day.`;

      default:
        return 'Thank you for your response.';
    }
  }

  /**
   * Genera evaluación de fluidez predefinida
   */
  generateFluencyEvaluation(): FluencyEvaluation {
    return {
      puntaje_pronunciacion_y_gramatica: '7/10',
      mejora_sugerida: 'Continúa practicando tu pronunciación y gramática en inglés. Habla más claro y pausado.',
    };
  }

  /**
   * Genera feedback para respuesta de civismo
   */
  generateCivicsFeedback(isCorrect: boolean, correctAnswer?: string): string {
    if (isCorrect) {
      return 'That is correct. Well done.';
    } else {
      return `That is not quite correct. The correct answer is: ${correctAnswer || 'Please review the study materials.'}`;
    }
  }
}

// Singleton instance
export const fallbackEngine = new FallbackEngine();

