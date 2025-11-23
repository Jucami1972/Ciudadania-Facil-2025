/**
 * Tipos compartidos para el backend de Entrevista AI
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
  n400FormData?: N400FormData;
}

export interface InterviewMessage {
  role: 'officer' | 'applicant' | 'system';
  content: string;
  timestamp: Date;
  shouldSpeak?: boolean;
  fluencyEvaluation?: FluencyEvaluation;
}

// Tipos de estado de la entrevista (compatibles con frontend)
// Estructura basada en el protocolo oficial USCIS de 8 fases
export type InterviewStage = 
  | 'greeting'              // Fase 1: Bienvenida y Juramento Inicial (llamado, saludo, documentos, juramento)
  | 'swearing_in'           // Juramento de decir la verdad
  | 'identity'              // Verificación de identidad (nombre, fecha de nacimiento, documentos)
  | 'n400_biographical'     // Fase 2: N-400 Datos Biográficos (elegibilidad, nombre, fechas, estado civil)
  | 'n400_residence'        // Fase 3: N-400 Domicilios, Empleo y Viajes
  | 'oath'                  // Juramento de Lealtad inicial (antes de las pruebas)
  | 'civics'                // Fase 4: Prueba Cívica (10 preguntas, necesita 6 correctas)
  | 'reading'               // Fase 4: Prueba de Lectura en Inglés
  | 'writing'               // Fase 4: Prueba de Escritura en Inglés
  | 'n400_moral_character'  // Fase 5: N-400 Carácter Moral (preguntas Sí/No y definiciones)
  | 'loyalty_oath'          // Fase 6: Lealtad y Juramento Final (apoyo a Constitución, servicios militares)
  | 'review_signature'      // Fase 7: Revisión Final y Firma
  | 'closing';              // Fase 8: Resultados y Despedida

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
  pregunta_id?: number; // ID de pregunta de civismo (si aplica)
}

// Estado de sesión de entrevista
export interface InterviewSession {
  sessionId: string;
  context: InterviewContext;
  messages: InterviewMessage[];
  stage: InterviewStage;
  questionsAsked: number;
  totalQuestions: number;
  n400QuestionsAsked: number;
  totalN400Questions: number;
  civicsQuestionsAsked: number;
  totalCivicsQuestions: number;
  currentCivicsQuestion?: { id: number; question: string; answer: string | string[] };
  civicsQuestionsUsed: number[]; // IDs de preguntas ya usadas
}

// Respuesta del endpoint /respond
export interface ProcessResponseResult {
  officerResponse: string;
  isCorrect?: boolean;
  feedback?: string;
  shouldSpeak?: boolean;
  fluencyEvaluation?: FluencyEvaluation;
  estado_entrevista: InterviewStage;
  pregunta_id?: number;
}

// Respuesta del endpoint /init
export interface InitResponse {
  sessionId: string;
  officerResponse: string;
  shouldSpeak: boolean;
  fluencyEvaluation?: FluencyEvaluation;
  estado_entrevista: InterviewStage;
}

// Respuesta del endpoint /auto
export interface AutoResponse {
  officerResponse: string;
  shouldSpeak: boolean;
  fluencyEvaluation?: FluencyEvaluation;
  estado_entrevista: InterviewStage;
}

// Pregunta de civismo
export interface Question {
  id: number;
  questionEn: string;
  questionEs: string;
  answerEn: string | string[];
  answerEs: string | string[];
  explanationEn: string;
  explanationEs: string;
  category: 'government' | 'history' | 'symbols_holidays';
  subcategory: string;
  asterisk: boolean;
}

