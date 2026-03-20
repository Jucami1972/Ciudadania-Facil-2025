// src/data/n400FormPractice.ts
// Datos de práctica del formulario N-400 para la entrevista de ciudadanía
// Estructura compatible con scripts/generate_n400_audio_eleven.mjs

export interface N400Question {
  id: string;
  question: string;
  questionEs: string;
  section: N400Section;
  tip: string;
  tipEs: string;
  variations: string[];
}

export interface N400Protocol {
  id: string;
  phrase: string;
  phraseEs: string;
}

export interface N400Definition {
  id: string;
  term: string;
  termEs: string;
  n400Question: string;
  n400QuestionEs: string;
}

export type N400Section =
  | 'identity'
  | 'address'
  | 'employment'
  | 'family'
  | 'travel'
  | 'legal'
  | 'loyalty'
  | 'tax'
  | 'general';

export interface N400SectionInfo {
  id: N400Section;
  key: string; // key usado en audio files (id, addr, emp, etc.)
  title: string;
  titleEs: string;
  icon: string;
  color: string;
  description: string;
  descriptionEs: string;
}

// Mapeo de secciones con metadata
export const n400Sections: N400SectionInfo[] = [
  {
    id: 'identity',
    key: 'id',
    title: 'Identity',
    titleEs: 'Identidad',
    icon: 'card-account-details',
    color: '#3B82F6',
    description: 'Personal identification questions',
    descriptionEs: 'Preguntas de identificación personal',
  },
  {
    id: 'address',
    key: 'addr',
    title: 'Address & Residence',
    titleEs: 'Dirección y Residencia',
    icon: 'home-map-marker',
    color: '#10B981',
    description: 'Where you live and have lived',
    descriptionEs: 'Dónde vive y ha vivido',
  },
  {
    id: 'employment',
    key: 'emp',
    title: 'Employment',
    titleEs: 'Empleo',
    icon: 'briefcase',
    color: '#F59E0B',
    description: 'Work history and current job',
    descriptionEs: 'Historial laboral y trabajo actual',
  },
  {
    id: 'family',
    key: 'fam',
    title: 'Family',
    titleEs: 'Familia',
    icon: 'account-group',
    color: '#EC4899',
    description: 'Marital status and family members',
    descriptionEs: 'Estado civil y miembros de la familia',
  },
  {
    id: 'travel',
    key: 'trav',
    title: 'Travel',
    titleEs: 'Viajes',
    icon: 'airplane',
    color: '#06B6D4',
    description: 'Trips outside the United States',
    descriptionEs: 'Viajes fuera de los Estados Unidos',
  },
  {
    id: 'legal',
    key: 'leg',
    title: 'Legal & Criminal',
    titleEs: 'Legal y Criminal',
    icon: 'gavel',
    color: '#EF4444',
    description: 'Legal history and background',
    descriptionEs: 'Historial legal y antecedentes',
  },
  {
    id: 'loyalty',
    key: 'loy',
    title: 'Loyalty & Oath',
    titleEs: 'Lealtad y Juramento',
    icon: 'flag',
    color: '#8B5CF6',
    description: 'Allegiance to the United States',
    descriptionEs: 'Lealtad a los Estados Unidos',
  },
  {
    id: 'tax',
    key: 'tax',
    title: 'Taxes',
    titleEs: 'Impuestos',
    icon: 'currency-usd',
    color: '#059669',
    description: 'Tax filing history',
    descriptionEs: 'Historial de declaración de impuestos',
  },
  {
    id: 'general',
    key: 'gen',
    title: 'General',
    titleEs: 'General',
    icon: 'help-circle',
    color: '#64748B',
    description: 'General questions about your application',
    descriptionEs: 'Preguntas generales sobre su solicitud',
  },
];

// ─── PREGUNTAS PRINCIPALES DEL N-400 ─────────────────────────────────
export const n400Questions: N400Question[] = [
  // ═══ IDENTITY (id) ═══
  {
    id: 'id_1',
    question: 'What is your full legal name?',
    questionEs: '¿Cuál es su nombre legal completo?',
    section: 'identity',
    tip: 'Say your full name as it appears on your green card.',
    tipEs: 'Diga su nombre completo tal como aparece en su tarjeta verde.',
    variations: [
      'Please state your complete legal name.',
      'Can you tell me your full name?',
      'What name appears on your permanent resident card?',
      'Tell me your first, middle, and last name.',
      'What is the name you currently go by legally?',
    ],
  },
  {
    id: 'id_2',
    question: 'What is your date of birth?',
    questionEs: '¿Cuál es su fecha de nacimiento?',
    section: 'identity',
    tip: 'State month, day, and year clearly.',
    tipEs: 'Diga mes, día y año claramente.',
    variations: [
      'When were you born?',
      'Can you tell me your birthday?',
      'What is your birth date?',
    ],
  },
  {
    id: 'id_3',
    question: 'What is your country of birth?',
    questionEs: '¿Cuál es su país de nacimiento?',
    section: 'identity',
    tip: 'Name the country where you were born.',
    tipEs: 'Diga el nombre del país donde nació.',
    variations: [
      'Where were you born?',
      'In which country were you born?',
    ],
  },
  {
    id: 'id_4',
    question: 'What is your country of nationality?',
    questionEs: '¿Cuál es su país de nacionalidad?',
    section: 'identity',
    tip: 'This is the country of your current citizenship.',
    tipEs: 'Este es el país de su ciudadanía actual.',
    variations: [
      'What country are you currently a citizen of?',
      'What is your current nationality?',
    ],
  },
  {
    id: 'id_5',
    question: 'What is your Social Security Number?',
    questionEs: '¿Cuál es su número de Seguro Social?',
    section: 'identity',
    tip: 'State your 9-digit SSN clearly.',
    tipEs: 'Diga su número de 9 dígitos claramente.',
    variations: [
      'Can you provide your Social Security Number?',
      'What SSN do you have?',
    ],
  },
  {
    id: 'id_6',
    question: 'What is your Alien Registration Number?',
    questionEs: '¿Cuál es su número de registro de extranjero?',
    section: 'identity',
    tip: 'This is the A-Number on your green card.',
    tipEs: 'Este es el número A en su tarjeta verde.',
    variations: [
      'What is your A-Number?',
      'Can you tell me your alien number?',
    ],
  },
  {
    id: 'id_7',
    question: 'Have you ever used any other names?',
    questionEs: '¿Ha usado alguna vez otros nombres?',
    section: 'identity',
    tip: 'Include maiden names, nicknames used legally, etc.',
    tipEs: 'Incluya nombres de soltera, apodos usados legalmente, etc.',
    variations: [
      'Have you gone by any other name?',
    ],
  },
  {
    id: 'id_8',
    question: 'What is your gender?',
    questionEs: '¿Cuál es su género?',
    section: 'identity',
    tip: 'Answer male or female as shown on your documents.',
    tipEs: 'Responda masculino o femenino como aparece en sus documentos.',
    variations: [
      'Are you male or female?',
      'What sex is listed on your identification?',
    ],
  },
  {
    id: 'id_9',
    question: 'What is your height?',
    questionEs: '¿Cuál es su estatura?',
    section: 'identity',
    tip: 'State your height in feet and inches.',
    tipEs: 'Diga su estatura en pies y pulgadas.',
    variations: [
      'How tall are you?',
      'Can you tell me your height?',
    ],
  },
  {
    id: 'id_10',
    question: 'What is your weight?',
    questionEs: '¿Cuál es su peso?',
    section: 'identity',
    tip: 'State your weight in pounds.',
    tipEs: 'Diga su peso en libras.',
    variations: [
      'How much do you weigh?',
      'What is your current weight?',
    ],
  },

  // ═══ ADDRESS (addr) ═══
  {
    id: 'addr_1',
    question: 'What is your current home address?',
    questionEs: '¿Cuál es su dirección actual?',
    section: 'address',
    tip: 'Give your complete address including city, state, and zip code.',
    tipEs: 'Dé su dirección completa incluyendo ciudad, estado y código postal.',
    variations: [
      'Where do you currently live?',
      'What is your residential address?',
      'Can you give me your home address?',
    ],
  },
  {
    id: 'addr_2',
    question: 'How long have you lived at your current address?',
    questionEs: '¿Cuánto tiempo ha vivido en su dirección actual?',
    section: 'address',
    tip: 'State the number of years and months.',
    tipEs: 'Diga el número de años y meses.',
    variations: [
      'When did you move to your current address?',
      'Since when have you been living there?',
    ],
  },
  {
    id: 'addr_3',
    question: 'Where did you live before your current address?',
    questionEs: '¿Dónde vivía antes de su dirección actual?',
    section: 'address',
    tip: 'List previous addresses for the last 5 years.',
    tipEs: 'Mencione las direcciones anteriores de los últimos 5 años.',
    variations: [
      'What was your previous address?',
      'Can you list your addresses for the past five years?',
      'Where else have you lived recently?',
    ],
  },
  {
    id: 'addr_4',
    question: 'Do you have a mailing address different from your home address?',
    questionEs: '¿Tiene una dirección postal diferente a su dirección de casa?',
    section: 'address',
    tip: 'Only if your mailing address differs from your home address.',
    tipEs: 'Solo si su dirección postal es diferente a la de su hogar.',
    variations: [],
  },

  // ═══ EMPLOYMENT (emp) ═══
  {
    id: 'emp_1',
    question: 'What is your current occupation?',
    questionEs: '¿Cuál es su ocupación actual?',
    section: 'employment',
    tip: 'State your job title or describe what you do.',
    tipEs: 'Diga el título de su trabajo o describa lo que hace.',
    variations: [
      'What do you do for a living?',
      'Where do you work?',
      'What is your job?',
    ],
  },
  {
    id: 'emp_2',
    question: 'What is the name of your current employer?',
    questionEs: '¿Cuál es el nombre de su empleador actual?',
    section: 'employment',
    tip: 'Give the full name of the company or business.',
    tipEs: 'Dé el nombre completo de la compañía o negocio.',
    variations: [
      'Who do you work for?',
      'What company do you work at?',
      'What is your employer\'s name?',
    ],
  },
  {
    id: 'emp_3',
    question: 'How long have you been working at your current job?',
    questionEs: '¿Cuánto tiempo ha estado trabajando en su empleo actual?',
    section: 'employment',
    tip: 'State the duration in years and months.',
    tipEs: 'Diga la duración en años y meses.',
    variations: [
      'When did you start your current position?',
      'How many years have you been employed there?',
    ],
  },
  {
    id: 'emp_4',
    question: 'Where did you work before your current job?',
    questionEs: '¿Dónde trabajaba antes de su empleo actual?',
    section: 'employment',
    tip: 'List your previous employers for the past 5 years.',
    tipEs: 'Mencione sus empleadores anteriores de los últimos 5 años.',
    variations: [
      'What was your previous job?',
      'Can you tell me about your work history?',
    ],
  },
  {
    id: 'emp_5',
    question: 'Have you ever been unemployed for more than 6 months?',
    questionEs: '¿Ha estado desempleado por más de 6 meses?',
    section: 'employment',
    tip: 'Be honest about any gaps in employment.',
    tipEs: 'Sea honesto sobre cualquier brecha en el empleo.',
    variations: [
      'Were there any gaps in your employment?',
      'Have you had any periods without work?',
    ],
  },

  // ═══ FAMILY (fam) ═══
  {
    id: 'fam_1',
    question: 'What is your current marital status?',
    questionEs: '¿Cuál es su estado civil actual?',
    section: 'family',
    tip: 'Answer single, married, divorced, widowed, etc.',
    tipEs: 'Responda soltero, casado, divorciado, viudo, etc.',
    variations: [
      'Are you married?',
      'What is your marital status?',
    ],
  },
  {
    id: 'fam_2',
    question: 'What is your spouse\'s name?',
    questionEs: '¿Cuál es el nombre de su cónyuge?',
    section: 'family',
    tip: 'Give your spouse\'s full legal name.',
    tipEs: 'Dé el nombre legal completo de su cónyuge.',
    variations: [
      'Can you tell me your husband\'s or wife\'s full name?',
      'What is the name of your spouse?',
      'What is your wife\'s name?',
      'What is your husband\'s name?',
    ],
  },
  {
    id: 'fam_3',
    question: 'Is your spouse a U.S. citizen?',
    questionEs: '¿Es su cónyuge ciudadano estadounidense?',
    section: 'family',
    tip: 'Answer yes or no, and explain if applicable.',
    tipEs: 'Responda sí o no, y explique si es necesario.',
    variations: [],
  },
  {
    id: 'fam_4',
    question: 'How many children do you have?',
    questionEs: '¿Cuántos hijos tiene?',
    section: 'family',
    tip: 'Include all children, regardless of age or residence.',
    tipEs: 'Incluya a todos los hijos, sin importar edad o residencia.',
    variations: [
      'Do you have any children?',
      'Tell me about your children.',
    ],
  },
  {
    id: 'fam_5',
    question: 'What are the names and dates of birth of your children?',
    questionEs: '¿Cuáles son los nombres y fechas de nacimiento de sus hijos?',
    section: 'family',
    tip: 'List each child\'s full name and date of birth.',
    tipEs: 'Mencione el nombre completo y la fecha de nacimiento de cada hijo.',
    variations: [
      'Can you list your children\'s names?',
    ],
  },
  {
    id: 'fam_6',
    question: 'How many times have you been married?',
    questionEs: '¿Cuántas veces ha estado casado?',
    section: 'family',
    tip: 'Include all marriages, past and present.',
    tipEs: 'Incluya todos los matrimonios, pasados y presentes.',
    variations: [
      'Have you been married before?',
      'Is this your first marriage?',
    ],
  },
  {
    id: 'fam_7',
    question: 'When and where did you get married?',
    questionEs: '¿Cuándo y dónde se casó?',
    section: 'family',
    tip: 'Give the date and city/country of marriage.',
    tipEs: 'Dé la fecha y la ciudad/país del matrimonio.',
    variations: [
      'What was the date of your marriage?',
      'Where did your wedding take place?',
    ],
  },

  // ═══ TRAVEL (trav) ═══
  {
    id: 'trav_1',
    question: 'Have you traveled outside the United States in the past 5 years?',
    questionEs: '¿Ha viajado fuera de los Estados Unidos en los últimos 5 años?',
    section: 'travel',
    tip: 'List all trips, including short ones.',
    tipEs: 'Mencione todos los viajes, incluyendo los cortos.',
    variations: [
      'Have you taken any trips outside the U.S.?',
      'Did you leave the country at any time?',
      'Have you been abroad recently?',
    ],
  },
  {
    id: 'trav_2',
    question: 'What countries did you visit and for how long?',
    questionEs: '¿Qué países visitó y por cuánto tiempo?',
    section: 'travel',
    tip: 'For each trip, state the country, dates, and duration.',
    tipEs: 'Para cada viaje, diga el país, las fechas y la duración.',
    variations: [
      'Where did you go and how long were you there?',
    ],
  },
  {
    id: 'trav_3',
    question: 'Have you ever been outside the United States for more than 6 months at a time?',
    questionEs: '¿Ha estado fuera de los Estados Unidos por más de 6 meses seguidos?',
    section: 'travel',
    tip: 'Trips longer than 6 months may affect your eligibility.',
    tipEs: 'Viajes de más de 6 meses pueden afectar su elegibilidad.',
    variations: [
      'Did you take any extended trips outside the country?',
      'Have you been away from the U.S. for long periods?',
    ],
  },
  {
    id: 'trav_4',
    question: 'What was the total time you spent outside the United States?',
    questionEs: '¿Cuál fue el tiempo total que pasó fuera de los Estados Unidos?',
    section: 'travel',
    tip: 'Add up all the days from your trips.',
    tipEs: 'Sume todos los días de sus viajes.',
    variations: [
      'How many total days were you outside the U.S.?',
    ],
  },
  {
    id: 'trav_5',
    question: 'Since becoming a permanent resident, have you ever not filed taxes?',
    questionEs: '¿Desde que se convirtió en residente permanente, ha dejado de declarar impuestos?',
    section: 'travel',
    tip: 'You must file taxes every year as a permanent resident.',
    tipEs: 'Debe declarar impuestos cada año como residente permanente.',
    variations: [],
  },

  // ═══ LEGAL (leg) ═══
  {
    id: 'leg_1',
    question: 'Have you ever been arrested, cited, or detained by any law enforcement officer?',
    questionEs: '¿Ha sido arrestado, citado o detenido por algún oficial de la ley?',
    section: 'legal',
    tip: 'Include all incidents, even if charges were dropped.',
    tipEs: 'Incluya todos los incidentes, incluso si se retiraron los cargos.',
    variations: [
      'Have you had any encounters with the police?',
      'Have you ever been stopped or detained?',
    ],
  },
  {
    id: 'leg_2',
    question: 'Have you ever been charged with committing any crime?',
    questionEs: '¿Alguna vez ha sido acusado de cometer algún crimen?',
    section: 'legal',
    tip: 'Include any criminal charges, regardless of outcome.',
    tipEs: 'Incluya cualquier cargo criminal, sin importar el resultado.',
    variations: [
      'Have you been charged with a crime?',
    ],
  },
  {
    id: 'leg_3',
    question: 'Have you ever been convicted of a crime?',
    questionEs: '¿Alguna vez ha sido condenado por un crimen?',
    section: 'legal',
    tip: 'A conviction is when a court finds you guilty.',
    tipEs: 'Una condena es cuando un tribunal lo declara culpable.',
    variations: [],
  },
  {
    id: 'leg_4',
    question: 'Have you ever been placed in removal or deportation proceedings?',
    questionEs: '¿Alguna vez ha sido puesto en procedimientos de remoción o deportación?',
    section: 'legal',
    tip: 'Include any immigration court proceedings.',
    tipEs: 'Incluya cualquier procedimiento ante la corte de inmigración.',
    variations: [],
  },
  {
    id: 'leg_5',
    question: 'Have you ever lied to get immigration benefits?',
    questionEs: '¿Alguna vez mintió para obtener beneficios de inmigración?',
    section: 'legal',
    tip: 'Be truthful about your immigration history.',
    tipEs: 'Sea sincero sobre su historial de inmigración.',
    variations: [],
  },
  {
    id: 'leg_6',
    question: 'Have you ever been a member of any organization or group?',
    questionEs: '¿Alguna vez ha sido miembro de alguna organización o grupo?',
    section: 'legal',
    tip: 'Include political parties, clubs, and organizations.',
    tipEs: 'Incluya partidos políticos, clubes y organizaciones.',
    variations: [
      'Do you belong to any groups or organizations?',
    ],
  },
  {
    id: 'leg_7',
    question: 'Have you ever been a member of the Communist Party?',
    questionEs: '¿Alguna vez ha sido miembro del Partido Comunista?',
    section: 'legal',
    tip: 'Answer honestly.',
    tipEs: 'Responda honestamente.',
    variations: [
      'Were you ever part of a communist organization?',
      'Have you had any affiliation with the Communist Party?',
    ],
  },
  {
    id: 'leg_8',
    question: 'Have you ever been a terrorist or involved in terrorist activities?',
    questionEs: '¿Alguna vez ha sido terrorista o ha participado en actividades terroristas?',
    section: 'legal',
    tip: 'This includes any form of support for terrorism.',
    tipEs: 'Esto incluye cualquier forma de apoyo al terrorismo.',
    variations: [],
  },
  {
    id: 'leg_9',
    question: 'Have you ever persecuted anyone because of their race, religion, or nationality?',
    questionEs: '¿Alguna vez ha perseguido a alguien por su raza, religión o nacionalidad?',
    section: 'legal',
    tip: 'This question is about genocide and persecution.',
    tipEs: 'Esta pregunta trata sobre genocidio y persecución.',
    variations: [],
  },
  {
    id: 'leg_10',
    question: 'Have you ever served in any military, police, or paramilitary unit?',
    questionEs: '¿Alguna vez ha servido en alguna unidad militar, policial o paramilitar?',
    section: 'legal',
    tip: 'Include service in any country.',
    tipEs: 'Incluya servicio en cualquier país.',
    variations: [],
  },
  {
    id: 'leg_11',
    question: 'Have you ever been a habitual drunkard?',
    questionEs: '¿Alguna vez ha sido un bebedor habitual?',
    section: 'legal',
    tip: 'This refers to chronic alcohol abuse.',
    tipEs: 'Esto se refiere al abuso crónico de alcohol.',
    variations: [
      'Do you have any issues with alcohol?',
    ],
  },
  {
    id: 'leg_12',
    question: 'Have you ever used illegal drugs?',
    questionEs: '¿Alguna vez ha usado drogas ilegales?',
    section: 'legal',
    tip: 'Be honest about any drug use.',
    tipEs: 'Sea honesto sobre cualquier uso de drogas.',
    variations: [],
  },
  {
    id: 'leg_13',
    question: 'Have you ever gambled illegally?',
    questionEs: '¿Alguna vez ha apostado ilegalmente?',
    section: 'legal',
    tip: 'This includes unlicensed gambling.',
    tipEs: 'Esto incluye apuestas sin licencia.',
    variations: [
      'Have you participated in any illegal gambling?',
    ],
  },
  {
    id: 'leg_14',
    question: 'Have you ever failed to support your dependents or pay alimony?',
    questionEs: '¿Alguna vez ha dejado de mantener a sus dependientes o pagar pensión alimenticia?',
    section: 'legal',
    tip: 'You must support your dependents and pay any court-ordered support.',
    tipEs: 'Debe mantener a sus dependientes y pagar cualquier manutención ordenada por el tribunal.',
    variations: [
      'Do you currently owe child support?',
    ],
  },

  // ═══ LOYALTY (loy) ═══
  {
    id: 'loy_1',
    question: 'Are you willing to take the full Oath of Allegiance to the United States?',
    questionEs: '¿Está dispuesto a tomar el Juramento de Lealtad completo a los Estados Unidos?',
    section: 'loyalty',
    tip: 'You must be willing to pledge loyalty to the U.S.',
    tipEs: 'Debe estar dispuesto a jurar lealtad a los EE.UU.',
    variations: [
      'Will you take the Oath of Allegiance?',
    ],
  },
  {
    id: 'loy_2',
    question: 'Are you willing to bear arms on behalf of the United States if required by law?',
    questionEs: '¿Está dispuesto a portar armas en nombre de los Estados Unidos si la ley lo requiere?',
    section: 'loyalty',
    tip: 'You can request an exemption for religious or moral reasons.',
    tipEs: 'Puede solicitar una exención por razones religiosas o morales.',
    variations: [],
  },
  {
    id: 'loy_3',
    question: 'Are you willing to perform noncombatant services for the United States if required by law?',
    questionEs: '¿Está dispuesto a prestar servicios no combatientes para los Estados Unidos si la ley lo requiere?',
    section: 'loyalty',
    tip: 'This means serving in a non-fighting role.',
    tipEs: 'Esto significa servir en un rol que no es de combate.',
    variations: [],
  },
  {
    id: 'loy_4',
    question: 'Are you willing to perform work of national importance if required by law?',
    questionEs: '¿Está dispuesto a realizar trabajo de importancia nacional si la ley lo requiere?',
    section: 'loyalty',
    tip: 'This refers to civilian service during national emergencies.',
    tipEs: 'Esto se refiere al servicio civil durante emergencias nacionales.',
    variations: [],
  },
  {
    id: 'loy_5',
    question: 'Do you support the Constitution and form of government of the United States?',
    questionEs: '¿Apoya la Constitución y la forma de gobierno de los Estados Unidos?',
    section: 'loyalty',
    tip: 'You must demonstrate allegiance to the U.S. Constitution.',
    tipEs: 'Debe demostrar lealtad a la Constitución de los EE.UU.',
    variations: [],
  },
  {
    id: 'loy_6',
    question: 'Do you renounce all titles of nobility from any foreign country?',
    questionEs: '¿Renuncia a todos los títulos de nobleza de cualquier país extranjero?',
    section: 'loyalty',
    tip: 'You must give up any foreign titles of nobility.',
    tipEs: 'Debe renunciar a cualquier título de nobleza extranjero.',
    variations: [],
  },

  // ═══ TAX (tax) ═══
  {
    id: 'tax_1',
    question: 'Have you filed your income tax returns every year?',
    questionEs: '¿Ha presentado sus declaraciones de impuestos cada año?',
    section: 'tax',
    tip: 'You must file taxes every year as a permanent resident.',
    tipEs: 'Debe presentar impuestos cada año como residente permanente.',
    variations: [
      'Do you file your taxes every year?',
    ],
  },
  {
    id: 'tax_2',
    question: 'Do you owe any overdue Federal, State, or local taxes?',
    questionEs: '¿Debe impuestos atrasados federales, estatales o locales?',
    section: 'tax',
    tip: 'If you owe taxes, explain your payment plan.',
    tipEs: 'Si debe impuestos, explique su plan de pago.',
    variations: [
      'Are your taxes up to date?',
      'Do you have any unpaid taxes?',
    ],
  },
  {
    id: 'tax_3',
    question: 'Have you ever claimed to be a U.S. citizen when you were not?',
    questionEs: '¿Alguna vez ha afirmado ser ciudadano estadounidense cuando no lo era?',
    section: 'tax',
    tip: 'This includes on tax forms or any official documents.',
    tipEs: 'Esto incluye en formularios de impuestos o documentos oficiales.',
    variations: [
      'Did you ever claim U.S. citizenship falsely?',
    ],
  },

  // ═══ GENERAL (gen) ═══
  {
    id: 'gen_1',
    question: 'Why do you want to become a U.S. citizen?',
    questionEs: '¿Por qué quiere convertirse en ciudadano estadounidense?',
    section: 'general',
    tip: 'Speak from the heart about your motivations.',
    tipEs: 'Hable de corazón sobre sus motivaciones.',
    variations: [
      'What is your reason for applying for citizenship?',
      'Why are you seeking U.S. citizenship?',
    ],
  },
  {
    id: 'gen_2',
    question: 'How did you become a permanent resident?',
    questionEs: '¿Cómo se convirtió en residente permanente?',
    section: 'general',
    tip: 'Explain if through family, employment, lottery, etc.',
    tipEs: 'Explique si fue a través de familia, empleo, lotería, etc.',
    variations: [
      'How did you get your green card?',
      'What was the basis for your permanent residence?',
    ],
  },
  {
    id: 'gen_3',
    question: 'When did you become a permanent resident?',
    questionEs: '¿Cuándo se convirtió en residente permanente?',
    section: 'general',
    tip: 'State the date you received your green card.',
    tipEs: 'Diga la fecha en que recibió su tarjeta verde.',
    variations: [
      'What date did you get your green card?',
    ],
  },
];

// ─── FRASES DE PROTOCOLO ─────────────────────────────────────────────
export const n400Protocol: N400Protocol[] = [
  {
    id: 'proto_1',
    phrase: 'Good morning. Please raise your right hand. Do you swear to tell the truth, the whole truth, and nothing but the truth?',
    phraseEs: 'Buenos días. Por favor levante su mano derecha. ¿Jura decir la verdad, toda la verdad y nada más que la verdad?',
  },
  {
    id: 'proto_2',
    phrase: 'Please have a seat. May I see your green card, passport, and any travel documents?',
    phraseEs: 'Por favor tome asiento. ¿Puedo ver su tarjeta verde, pasaporte y cualquier documento de viaje?',
  },
  {
    id: 'proto_3',
    phrase: 'I am going to review your N-400 application with you today.',
    phraseEs: 'Voy a revisar su solicitud N-400 con usted hoy.',
  },
  {
    id: 'proto_4',
    phrase: 'Please answer all questions truthfully and completely.',
    phraseEs: 'Por favor responda todas las preguntas con verdad y completamente.',
  },
  {
    id: 'proto_5',
    phrase: 'If you do not understand a question, please ask me to repeat it.',
    phraseEs: 'Si no entiende una pregunta, por favor pídame que la repita.',
  },
  {
    id: 'proto_6',
    phrase: 'Have there been any changes since you submitted your application?',
    phraseEs: '¿Ha habido algún cambio desde que presentó su solicitud?',
  },
  {
    id: 'proto_7',
    phrase: 'Is everything on your application true and correct?',
    phraseEs: '¿Es todo en su solicitud verdadero y correcto?',
  },
  {
    id: 'proto_8',
    phrase: 'Now I will test your ability to read English. Please read this sentence out loud.',
    phraseEs: 'Ahora voy a evaluar su capacidad para leer en inglés. Por favor lea esta oración en voz alta.',
  },
  {
    id: 'proto_9',
    phrase: 'Now I will test your ability to write English. Please write this sentence.',
    phraseEs: 'Ahora voy a evaluar su capacidad para escribir en inglés. Por favor escriba esta oración.',
  },
  {
    id: 'proto_10',
    phrase: 'I am now going to ask you some questions about American history and government.',
    phraseEs: 'Ahora le voy a hacer algunas preguntas sobre la historia y el gobierno estadounidense.',
  },
  {
    id: 'proto_11',
    phrase: 'Congratulations! You have passed the civics test.',
    phraseEs: '¡Felicidades! Ha aprobado el examen de civismo.',
  },
  {
    id: 'proto_12',
    phrase: 'I am recommending your application for approval. You should receive your oath ceremony notice in the mail.',
    phraseEs: 'Estoy recomendando su solicitud para aprobación. Recibirá el aviso de su ceremonia de juramento por correo.',
  },
  {
    id: 'proto_13',
    phrase: 'Thank you for your time today. Do you have any questions for me?',
    phraseEs: 'Gracias por su tiempo hoy. ¿Tiene alguna pregunta para mí?',
  },
];

// ─── DEFINICIONES / VOCABULARIO N-400 ────────────────────────────────
export const n400Definitions: N400Definition[] = [
  {
    id: 'def_1',
    term: 'Oath of Allegiance',
    termEs: 'Juramento de Lealtad',
    n400Question: 'What is the Oath of Allegiance?',
    n400QuestionEs: '¿Qué es el Juramento de Lealtad?',
  },
  {
    id: 'def_2',
    term: 'Naturalization',
    termEs: 'Naturalización',
    n400Question: 'What is naturalization?',
    n400QuestionEs: '¿Qué es la naturalización?',
  },
  {
    id: 'def_3',
    term: 'Permanent Resident',
    termEs: 'Residente Permanente',
    n400Question: 'What is a permanent resident?',
    n400QuestionEs: '¿Qué es un residente permanente?',
  },
  {
    id: 'def_4',
    term: 'Green Card',
    termEs: 'Tarjeta Verde',
    n400Question: 'What is a green card?',
    n400QuestionEs: '¿Qué es una tarjeta verde?',
  },
  {
    id: 'def_5',
    term: 'Continuous Residence',
    termEs: 'Residencia Continua',
    n400Question: 'What does continuous residence mean?',
    n400QuestionEs: '¿Qué significa residencia continua?',
  },
  {
    id: 'def_6',
    term: 'Physical Presence',
    termEs: 'Presencia Física',
    n400Question: 'What does physical presence mean?',
    n400QuestionEs: '¿Qué significa presencia física?',
  },
  {
    id: 'def_7',
    term: 'Good Moral Character',
    termEs: 'Buen Carácter Moral',
    n400Question: 'What is good moral character?',
    n400QuestionEs: '¿Qué es buen carácter moral?',
  },
  {
    id: 'def_8',
    term: 'Selective Service',
    termEs: 'Servicio Selectivo',
    n400Question: 'What is Selective Service?',
    n400QuestionEs: '¿Qué es el Servicio Selectivo?',
  },
  {
    id: 'def_9',
    term: 'Deportation',
    termEs: 'Deportación',
    n400Question: 'What is deportation?',
    n400QuestionEs: '¿Qué es la deportación?',
  },
  {
    id: 'def_10',
    term: 'Removal Proceedings',
    termEs: 'Procedimientos de Remoción',
    n400Question: 'What are removal proceedings?',
    n400QuestionEs: '¿Qué son los procedimientos de remoción?',
  },
  {
    id: 'def_11',
    term: 'Alien Registration Number',
    termEs: 'Número de Registro de Extranjero',
    n400Question: 'What is an Alien Registration Number?',
    n400QuestionEs: '¿Qué es un número de registro de extranjero?',
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────

/** Obtener preguntas por sección */
export const getQuestionsBySection = (section: N400Section): N400Question[] =>
  n400Questions.filter((q) => q.section === section);

/** Obtener info de una sección por su key de audio (id, addr, emp, etc.) */
export const getSectionByAudioKey = (key: string): N400SectionInfo | undefined =>
  n400Sections.find((s) => s.key === key);

/** Obtener el total de preguntas */
export const getTotalQuestions = (): number => n400Questions.length;

/** Obtener el total incluyendo variaciones */
export const getTotalWithVariations = (): number =>
  n400Questions.reduce((sum, q) => sum + 1 + q.variations.length, 0);
