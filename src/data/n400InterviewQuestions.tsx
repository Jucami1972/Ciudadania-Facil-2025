// src/data/n400InterviewQuestions.tsx
// Preguntas de entrevista N-400 organizadas por etapas del proceso real
// Usado por N400SectionPracticeScreen para simular la entrevista

import { N400Section } from './n400FormPractice';

export interface N400InterviewStep {
  id: string;
  stage: 'oath' | 'documents' | 'review' | 'civics' | 'reading' | 'writing' | 'closing';
  officerSays: string;
  officerSaysEs: string;
  expectedResponse?: string;
  expectedResponseEs?: string;
  tip?: string;
  tipEs?: string;
}

// Pasos completos de la entrevista N-400 en orden cronológico
export const n400InterviewSteps: N400InterviewStep[] = [
  // ── OATH / JURAMENTO ──
  {
    id: 'step_oath',
    stage: 'oath',
    officerSays: 'Please raise your right hand. Do you swear to tell the truth, the whole truth, and nothing but the truth?',
    officerSaysEs: 'Por favor levante su mano derecha. ¿Jura decir la verdad, toda la verdad y nada más que la verdad?',
    expectedResponse: 'Yes, I do.',
    expectedResponseEs: 'Sí, lo juro.',
    tip: 'Stand, raise your right hand, and answer clearly.',
    tipEs: 'Levántese, levante su mano derecha y responda claramente.',
  },
  // ── DOCUMENTS / DOCUMENTOS ──
  {
    id: 'step_docs',
    stage: 'documents',
    officerSays: 'Please have a seat. May I see your green card, passport, and any travel documents?',
    officerSaysEs: 'Por favor tome asiento. ¿Puedo ver su tarjeta verde, pasaporte y documentos de viaje?',
    expectedResponse: 'Yes, here they are.',
    expectedResponseEs: 'Sí, aquí están.',
    tip: 'Have all documents ready before the interview.',
    tipEs: 'Tenga todos los documentos listos antes de la entrevista.',
  },
  // ── REVIEW INTRO ──
  {
    id: 'step_review_intro',
    stage: 'review',
    officerSays: 'I am going to review your N-400 application with you today. Please answer all questions truthfully.',
    officerSaysEs: 'Voy a revisar su solicitud N-400 con usted hoy. Por favor responda todas las preguntas con verdad.',
    tip: 'Listen carefully and answer honestly.',
    tipEs: 'Escuche con atención y responda honestamente.',
  },
  // ── CIVICS INTRO ──
  {
    id: 'step_civics_intro',
    stage: 'civics',
    officerSays: 'I am now going to ask you some questions about American history and government.',
    officerSaysEs: 'Ahora le voy a hacer algunas preguntas sobre la historia y el gobierno estadounidense.',
    tip: 'You need to answer 6 out of 10 civics questions correctly.',
    tipEs: 'Necesita responder correctamente 6 de 10 preguntas de civismo.',
  },
  // ── READING TEST ──
  {
    id: 'step_reading',
    stage: 'reading',
    officerSays: 'Now I will test your ability to read English. Please read this sentence out loud.',
    officerSaysEs: 'Ahora voy a evaluar su capacidad para leer en inglés. Por favor lea esta oración en voz alta.',
    tip: 'Read slowly and clearly. You get 3 chances.',
    tipEs: 'Lea despacio y claro. Tiene 3 oportunidades.',
  },
  // ── WRITING TEST ──
  {
    id: 'step_writing',
    stage: 'writing',
    officerSays: 'Now I will test your ability to write English. Please write this sentence.',
    officerSaysEs: 'Ahora voy a evaluar su capacidad para escribir en inglés. Por favor escriba esta oración.',
    tip: 'Write neatly. Spelling must be correct. You get 3 chances.',
    tipEs: 'Escriba con letra clara. La ortografía debe ser correcta. Tiene 3 oportunidades.',
  },
  // ── CLOSING ──
  {
    id: 'step_closing',
    stage: 'closing',
    officerSays: 'Thank you for your time today. Do you have any questions for me?',
    officerSaysEs: 'Gracias por su tiempo hoy. ¿Tiene alguna pregunta para mí?',
    tip: 'You can ask about next steps or the oath ceremony.',
    tipEs: 'Puede preguntar sobre los próximos pasos o la ceremonia de juramento.',
  },
];

// Mapeo de secciones N-400 a las etapas de la entrevista 
export const sectionToStage: Record<N400Section, string> = {
  identity: 'Identity Verification',
  address: 'N-400 Review',
  employment: 'N-400 Review',
  family: 'N-400 Review',
  travel: 'N-400 Review',
  legal: 'N-400 Review',
  loyalty: 'Oath & Loyalty',
  tax: 'N-400 Review',
  general: 'General Questions',
};
