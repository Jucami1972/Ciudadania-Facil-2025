// src/data/n400FormPractice.ts/**








































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































  n400Questions.reduce((sum, q) => sum + 1 + q.variations.length, 0);export const getTotalWithVariations = (): number =>/** Obtener el total incluyendo variaciones */export const getTotalQuestions = (): number => n400Questions.length;/** Obtener el total de preguntas */  n400Sections.find((s) => s.key === key);export const getSectionByAudioKey = (key: string): N400SectionInfo | undefined =>/** Obtener info de una sección por su key de audio (id, addr, emp, etc.) */  n400Questions.filter((q) => q.section === section);export const getQuestionsBySection = (section: N400Section): N400Question[] =>/** Obtener preguntas por sección */// ─── HELPERS ─────────────────────────────────────────────────────────];  },    n400QuestionEs: '¿Qué es un número de registro de extranjero?',    n400Question: 'What is an Alien Registration Number?',    termEs: 'Número de Registro de Extranjero',    term: 'Alien Registration Number',    id: 'def_11',  {  },    n400QuestionEs: '¿Qué son los procedimientos de remoción?',    n400Question: 'What are removal proceedings?',    termEs: 'Procedimientos de Remoción',    term: 'Removal Proceedings',    id: 'def_10',  {  },    n400QuestionEs: '¿Qué es la deportación?',    n400Question: 'What is deportation?',    termEs: 'Deportación',    term: 'Deportation',    id: 'def_9',  {  },    n400QuestionEs: '¿Qué es el Servicio Selectivo?',    n400Question: 'What is Selective Service?',    termEs: 'Servicio Selectivo',    term: 'Selective Service',    id: 'def_8',  {  },    n400QuestionEs: '¿Qué es buen carácter moral?',    n400Question: 'What is good moral character?',    termEs: 'Buen Carácter Moral',    term: 'Good Moral Character',    id: 'def_7',  {  },    n400QuestionEs: '¿Qué significa presencia física?',    n400Question: 'What does physical presence mean?',    termEs: 'Presencia Física',    term: 'Physical Presence',    id: 'def_6',  {  },    n400QuestionEs: '¿Qué significa residencia continua?',    n400Question: 'What does continuous residence mean?',    termEs: 'Residencia Continua',    term: 'Continuous Residence',    id: 'def_5',  {  },    n400QuestionEs: '¿Qué es una tarjeta verde?',    n400Question: 'What is a green card?',    termEs: 'Tarjeta Verde',    term: 'Green Card',    id: 'def_4',  {  },    n400QuestionEs: '¿Qué es un residente permanente?',    n400Question: 'What is a permanent resident?',    termEs: 'Residente Permanente',    term: 'Permanent Resident',    id: 'def_3',  {  },    n400QuestionEs: '¿Qué es la naturalización?',    n400Question: 'What is naturalization?',    termEs: 'Naturalización',    term: 'Naturalization',    id: 'def_2',  {  },    n400QuestionEs: '¿Qué es el Juramento de Lealtad?',    n400Question: 'What is the Oath of Allegiance?',    termEs: 'Juramento de Lealtad',    term: 'Oath of Allegiance',    id: 'def_1',  {export const n400Definitions: N400Definition[] = [// ─── DEFINICIONES / VOCABULARIO N-400 ────────────────────────────────];  },    phraseEs: 'Gracias por su tiempo hoy. ¿Tiene alguna pregunta para mí?',    phrase: 'Thank you for your time today. Do you have any questions for me?',    id: 'proto_13',  {  },    phraseEs: 'Estoy recomendando su solicitud para aprobación. Recibirá el aviso de su ceremonia de juramento por correo.',    phrase: 'I am recommending your application for approval. You should receive your oath ceremony notice in the mail.',    id: 'proto_12',  {  },    phraseEs: '¡Felicidades! Ha aprobado el examen de civismo.',    phrase: 'Congratulations! You have passed the civics test.',    id: 'proto_11',  {  },    phraseEs: 'Ahora le voy a hacer algunas preguntas sobre la historia y el gobierno estadounidense.',    phrase: 'I am now going to ask you some questions about American history and government.',    id: 'proto_10',  {  },    phraseEs: 'Ahora voy a evaluar su capacidad para escribir en inglés. Por favor escriba esta oración.',    phrase: 'Now I will test your ability to write English. Please write this sentence.',    id: 'proto_9',  {  },    phraseEs: 'Ahora voy a evaluar su capacidad para leer en inglés. Por favor lea esta oración en voz alta.',    phrase: 'Now I will test your ability to read English. Please read this sentence out loud.',    id: 'proto_8',  {  },    phraseEs: '¿Es todo en su solicitud verdadero y correcto?',    phrase: 'Is everything on your application true and correct?',    id: 'proto_7',  {  },    phraseEs: '¿Ha habido algún cambio desde que presentó su solicitud?',    phrase: 'Have there been any changes since you submitted your application?',    id: 'proto_6',  {  },    phraseEs: 'Si no entiende una pregunta, por favor pídame que la repita.',    phrase: 'If you do not understand a question, please ask me to repeat it.',    id: 'proto_5',  {  },    phraseEs: 'Por favor responda todas las preguntas con verdad y completamente.',    phrase: 'Please answer all questions truthfully and completely.',    id: 'proto_4',  {  },    phraseEs: 'Voy a revisar su solicitud N-400 con usted hoy.',    phrase: 'I am going to review your N-400 application with you today.',    id: 'proto_3',  {  },    phraseEs: 'Por favor tome asiento. ¿Puedo ver su tarjeta verde, pasaporte y cualquier documento de viaje?',    phrase: 'Please have a seat. May I see your green card, passport, and any travel documents?',    id: 'proto_2',  {  },    phraseEs: 'Buenos días. Por favor levante su mano derecha. ¿Jura decir la verdad, toda la verdad y nada más que la verdad?',    phrase: 'Good morning. Please raise your right hand. Do you swear to tell the truth, the whole truth, and nothing but the truth?',    id: 'proto_1',  {export const n400Protocol: N400Protocol[] = [// ─── FRASES DE PROTOCOLO ─────────────────────────────────────────────];  },    ],      'What date did you get your green card?',    variations: [    tipEs: 'Diga la fecha en que recibió su tarjeta verde.',    tip: 'State the date you received your green card.',    section: 'general',    questionEs: '¿Cuándo se convirtió en residente permanente?',    question: 'When did you become a permanent resident?',    id: 'gen_3',  {  },    ],      'What was the basis for your permanent residence?',      'How did you get your green card?',    variations: [    tipEs: 'Explique si fue a través de familia, empleo, lotería, etc.',    tip: 'Explain if through family, employment, lottery, etc.',    section: 'general',    questionEs: '¿Cómo se convirtió en residente permanente?',    question: 'How did you become a permanent resident?',    id: 'gen_2',  {  },    ],      'Why are you seeking U.S. citizenship?',      'What is your reason for applying for citizenship?',    variations: [    tipEs: 'Hable de corazón sobre sus motivaciones.',    tip: 'Speak from the heart about your motivations.',    section: 'general',    questionEs: '¿Por qué quiere convertirse en ciudadano estadounidense?',    question: 'Why do you want to become a U.S. citizen?',    id: 'gen_1',  {  // ═══ GENERAL (gen) ═══  },    ],      'Did you ever claim U.S. citizenship falsely?',    variations: [    tipEs: 'Esto incluye en formularios de impuestos o documentos oficiales.',    tip: 'This includes on tax forms or any official documents.',    section: 'tax',    questionEs: '¿Alguna vez ha afirmado ser ciudadano estadounidense cuando no lo era?',    question: 'Have you ever claimed to be a U.S. citizen when you were not?',    id: 'tax_3',  {  },    ],      'Do you have any unpaid taxes?',      'Are your taxes up to date?',    variations: [    tipEs: 'Si debe impuestos, explique su plan de pago.',    tip: 'If you owe taxes, explain your payment plan.',    section: 'tax',    questionEs: '¿Debe impuestos atrasados federales, estatales o locales?',    question: 'Do you owe any overdue Federal, State, or local taxes?',    id: 'tax_2',  {  },    ],      'Do you file your taxes every year?',    variations: [    tipEs: 'Debe presentar impuestos cada año como residente permanente.',    tip: 'You must file taxes every year as a permanent resident.',    section: 'tax',    questionEs: '¿Ha presentado sus declaraciones de impuestos cada año?',    question: 'Have you filed your income tax returns every year?',    id: 'tax_1',  {  // ═══ TAX (tax) ═══  },    variations: [],    tipEs: 'Debe renunciar a cualquier título de nobleza extranjero.',    tip: 'You must give up any foreign titles of nobility.',    section: 'loyalty',    questionEs: '¿Renuncia a todos los títulos de nobleza de cualquier país extranjero?',    question: 'Do you renounce all titles of nobility from any foreign country?',    id: 'loy_6',  {  },    variations: [],    tipEs: 'Debe demostrar lealtad a la Constitución de los EE.UU.',    tip: 'You must demonstrate allegiance to the U.S. Constitution.',    section: 'loyalty',    questionEs: '¿Apoya la Constitución y la forma de gobierno de los Estados Unidos?',    question: 'Do you support the Constitution and form of government of the United States?',    id: 'loy_5',  {  },    variations: [],    tipEs: 'Esto se refiere al servicio civil durante emergencias nacionales.',    tip: 'This refers to civilian service during national emergencies.',    section: 'loyalty',    questionEs: '¿Está dispuesto a realizar trabajo de importancia nacional si la ley lo requiere?',    question: 'Are you willing to perform work of national importance if required by law?',    id: 'loy_4',  {  },    variations: [],    tipEs: 'Esto significa servir en un rol que no es de combate.',    tip: 'This means serving in a non-fighting role.',    section: 'loyalty',    questionEs: '¿Está dispuesto a prestar servicios no combatientes para los Estados Unidos si la ley lo requiere?',    question: 'Are you willing to perform noncombatant services for the United States if required by law?',    id: 'loy_3',  {  },    variations: [],    tipEs: 'Puede solicitar una exención por razones religiosas o morales.',    tip: 'You can request an exemption for religious or moral reasons.',    section: 'loyalty',    questionEs: '¿Está dispuesto a portar armas en nombre de los Estados Unidos si la ley lo requiere?',    question: 'Are you willing to bear arms on behalf of the United States if required by law?',    id: 'loy_2',  {  },    ],      'Will you take the Oath of Allegiance?',    variations: [    tipEs: 'Debe estar dispuesto a jurar lealtad a los EE.UU.',    tip: 'You must be willing to pledge loyalty to the U.S.',    section: 'loyalty',    questionEs: '¿Está dispuesto a tomar el Juramento de Lealtad completo a los Estados Unidos?',    question: 'Are you willing to take the full Oath of Allegiance to the United States?',    id: 'loy_1',  {  // ═══ LOYALTY (loy) ═══  },    ],      'Do you currently owe child support?',    variations: [    tipEs: 'Debe mantener a sus dependientes y pagar cualquier manutención ordenada por el tribunal.',    tip: 'You must support your dependents and pay any court-ordered support.',    section: 'legal',    questionEs: '¿Alguna vez ha dejado de mantener a sus dependientes o pagar pensión alimenticia?',    question: 'Have you ever failed to support your dependents or pay alimony?',    id: 'leg_14',  {  },    ],      'Have you participated in any illegal gambling?',    variations: [    tipEs: 'Esto incluye apuestas sin licencia.',    tip: 'This includes unlicensed gambling.',    section: 'legal',    questionEs: '¿Alguna vez ha apostado ilegalmente?',    question: 'Have you ever gambled illegally?',    id: 'leg_13',  {  },    variations: [],    tipEs: 'Sea honesto sobre cualquier uso de drogas.',    tip: 'Be honest about any drug use.',    section: 'legal',    questionEs: '¿Alguna vez ha usado drogas ilegales?',    question: 'Have you ever used illegal drugs?',    id: 'leg_12',  {  },    ],      'Do you have any issues with alcohol?',    variations: [    tipEs: 'Esto se refiere al abuso crónico de alcohol.',    tip: 'This refers to chronic alcohol abuse.',    section: 'legal',    questionEs: '¿Alguna vez ha sido un bebedor habitual?',    question: 'Have you ever been a habitual drunkard?',    id: 'leg_11',  {  },    variations: [],    tipEs: 'Incluya servicio en cualquier país.',    tip: 'Include service in any country.',    section: 'legal',    questionEs: '¿Alguna vez ha servido en alguna unidad militar, policial o paramilitar?',    question: 'Have you ever served in any military, police, or paramilitary unit?',    id: 'leg_10',  {  },    variations: [],    tipEs: 'Esta pregunta trata sobre genocidio y persecución.',    tip: 'This question is about genocide and persecution.',    section: 'legal',    questionEs: '¿Alguna vez ha perseguido a alguien por su raza, religión o nacionalidad?',    question: 'Have you ever persecuted anyone because of their race, religion, or nationality?',    id: 'leg_9',  {  },    variations: [],    tipEs: 'Esto incluye cualquier forma de apoyo al terrorismo.',    tip: 'This includes any form of support for terrorism.',    section: 'legal',    questionEs: '¿Alguna vez ha sido terrorista o ha participado en actividades terroristas?',    question: 'Have you ever been a terrorist or involved in terrorist activities?',    id: 'leg_8',  {  },    ],      'Have you had any affiliation with the Communist Party?',      'Were you ever part of a communist organization?',    variations: [    tipEs: 'Responda honestamente.',    tip: 'Answer honestly.',    section: 'legal',    questionEs: '¿Alguna vez ha sido miembro del Partido Comunista?',    question: 'Have you ever been a member of the Communist Party?',    id: 'leg_7',  {  },    ],      'Do you belong to any groups or organizations?',    variations: [    tipEs: 'Incluya partidos políticos, clubes y organizaciones.',    tip: 'Include political parties, clubs, and organizations.',    section: 'legal',    questionEs: '¿Alguna vez ha sido miembro de alguna organización o grupo?',    question: 'Have you ever been a member of any organization or group?',    id: 'leg_6',  {  },    variations: [],    tipEs: 'Sea sincero sobre su historial de inmigración.',    tip: 'Be truthful about your immigration history.',    section: 'legal',    questionEs: '¿Alguna vez mintió para obtener beneficios de inmigración?',    question: 'Have you ever lied to get immigration benefits?',    id: 'leg_5',  {  },    variations: [],    tipEs: 'Incluya cualquier procedimiento ante la corte de inmigración.',    tip: 'Include any immigration court proceedings.',    section: 'legal',    questionEs: '¿Alguna vez ha sido puesto en procedimientos de remoción o deportación?',    question: 'Have you ever been placed in removal or deportation proceedings?',    id: 'leg_4',  {  },    variations: [],    tipEs: 'Una condena es cuando un tribunal lo declara culpable.',    tip: 'A conviction is when a court finds you guilty.',    section: 'legal',    questionEs: '¿Alguna vez ha sido condenado por un crimen?',    question: 'Have you ever been convicted of a crime?',    id: 'leg_3',  {  },    ],      'Have you been charged with a crime?',    variations: [    tipEs: 'Incluya cualquier cargo criminal, sin importar el resultado.',    tip: 'Include any criminal charges, regardless of outcome.',    section: 'legal',    questionEs: '¿Alguna vez ha sido acusado de cometer algún crimen?',    question: 'Have you ever been charged with committing any crime?',    id: 'leg_2',  {  },    ],      'Have you ever been stopped or detained?',      'Have you had any encounters with the police?',    variations: [    tipEs: 'Incluya todos los incidentes, incluso si se retiraron los cargos.',    tip: 'Include all incidents, even if charges were dropped.',    section: 'legal',    questionEs: '¿Ha sido arrestado, citado o detenido por algún oficial de la ley?',    question: 'Have you ever been arrested, cited, or detained by any law enforcement officer?',    id: 'leg_1',  {  // ═══ LEGAL (leg) ═══  },    variations: [],    tipEs: 'Debe declarar impuestos cada año como residente permanente.',    tip: 'You must file taxes every year as a permanent resident.',    section: 'travel',    questionEs: '¿Desde que se convirtió en residente permanente, ha dejado de declarar impuestos?',    question: 'Since becoming a permanent resident, have you ever not filed taxes?',    id: 'trav_5',  {  },    ],      'How many total days were you outside the U.S.?',    variations: [    tipEs: 'Sume todos los días de sus viajes.',    tip: 'Add up all the days from your trips.',    section: 'travel',    questionEs: '¿Cuál fue el tiempo total que pasó fuera de los Estados Unidos?',    question: 'What was the total time you spent outside the United States?',    id: 'trav_4',  {  },    ],      'Have you been away from the U.S. for long periods?',      'Did you take any extended trips outside the country?',    variations: [    tipEs: 'Viajes de más de 6 meses pueden afectar su elegibilidad.',    tip: 'Trips longer than 6 months may affect your eligibility.',    section: 'travel',    questionEs: '¿Ha estado fuera de los Estados Unidos por más de 6 meses seguidos?',    question: 'Have you ever been outside the United States for more than 6 months at a time?',    id: 'trav_3',  {  },    ],      'Where did you go and how long were you there?',    variations: [    tipEs: 'Para cada viaje, diga el país, las fechas y la duración.',    tip: 'For each trip, state the country, dates, and duration.',    section: 'travel',    questionEs: '¿Qué países visitó y por cuánto tiempo?',    question: 'What countries did you visit and for how long?',    id: 'trav_2',  {  },    ],      'Have you been abroad recently?',      'Did you leave the country at any time?',      'Have you taken any trips outside the U.S.?',    variations: [    tipEs: 'Mencione todos los viajes, incluyendo los cortos.',    tip: 'List all trips, including short ones.',    section: 'travel',    questionEs: '¿Ha viajado fuera de los Estados Unidos en los últimos 5 años?',    question: 'Have you traveled outside the United States in the past 5 years?',    id: 'trav_1',  {  // ═══ TRAVEL (trav) ═══  },    ],      'Where did your wedding take place?',      'What was the date of your marriage?',    variations: [    tipEs: 'Dé la fecha y la ciudad/país del matrimonio.',    tip: 'Give the date and city/country of marriage.',    section: 'family',    questionEs: '¿Cuándo y dónde se casó?',    question: 'When and where did you get married?',    id: 'fam_7',  {  },    ],      'Is this your first marriage?',      'Have you been married before?',    variations: [    tipEs: 'Incluya todos los matrimonios, pasados y presentes.',    tip: 'Include all marriages, past and present.',    section: 'family',    questionEs: '¿Cuántas veces ha estado casado?',    question: 'How many times have you been married?',    id: 'fam_6',  {  },    ],      'Can you list your children\'s names?',    variations: [    tipEs: 'Mencione el nombre completo y la fecha de nacimiento de cada hijo.',    tip: 'List each child\'s full name and date of birth.',    section: 'family',    questionEs: '¿Cuáles son los nombres y fechas de nacimiento de sus hijos?',    question: 'What are the names and dates of birth of your children?',    id: 'fam_5',  {  },    ],      'Tell me about your children.',      'Do you have any children?',    variations: [    tipEs: 'Incluya a todos los hijos, sin importar edad o residencia.',    tip: 'Include all children, regardless of age or residence.',    section: 'family',    questionEs: '¿Cuántos hijos tiene?',    question: 'How many children do you have?',    id: 'fam_4',  {  },    variations: [],    tipEs: 'Responda sí o no, y explique si es necesario.',    tip: 'Answer yes or no, and explain if applicable.',    section: 'family',    questionEs: '¿Es su cónyuge ciudadano estadounidense?',    question: 'Is your spouse a U.S. citizen?',    id: 'fam_3',  {  },    ],      'What is your husband\'s name?',      'What is your wife\'s name?',      'What is the name of your spouse?',      'Can you tell me your husband\'s or wife\'s full name?',    variations: [    tipEs: 'Dé el nombre legal completo de su cónyuge.',    tip: 'Give your spouse\'s full legal name.',    section: 'family',    questionEs: '¿Cuál es el nombre de su cónyuge?',    question: 'What is your spouse\'s name?',    id: 'fam_2',  {  },    ],      'What is your marital status?',      'Are you married?',    variations: [    tipEs: 'Responda soltero, casado, divorciado, viudo, etc.',    tip: 'Answer single, married, divorced, widowed, etc.',    section: 'family',    questionEs: '¿Cuál es su estado civil actual?',    question: 'What is your current marital status?',    id: 'fam_1',  {  // ═══ FAMILY (fam) ═══  },    ],      'Have you had any periods without work?',      'Were there any gaps in your employment?',    variations: [    tipEs: 'Sea honesto sobre cualquier brecha en el empleo.',    tip: 'Be honest about any gaps in employment.',    section: 'employment',    questionEs: '¿Ha estado desempleado por más de 6 meses?',    question: 'Have you ever been unemployed for more than 6 months?',    id: 'emp_5',  {  },    ],      'Can you tell me about your work history?',      'What was your previous job?',    variations: [    tipEs: 'Mencione sus empleadores anteriores de los últimos 5 años.',    tip: 'List your previous employers for the past 5 years.',    section: 'employment',    questionEs: '¿Dónde trabajaba antes de su empleo actual?',    question: 'Where did you work before your current job?',    id: 'emp_4',  {  },    ],      'How many years have you been employed there?',      'When did you start your current position?',    variations: [    tipEs: 'Diga la duración en años y meses.',    tip: 'State the duration in years and months.',    section: 'employment',    questionEs: '¿Cuánto tiempo ha estado trabajando en su empleo actual?',    question: 'How long have you been working at your current job?',    id: 'emp_3',  {  },    ],      'What is your employer\'s name?',      'What company do you work at?',      'Who do you work for?',    variations: [    tipEs: 'Dé el nombre completo de la compañía o negocio.',    tip: 'Give the full name of the company or business.',    section: 'employment',    questionEs: '¿Cuál es el nombre de su empleador actual?',    question: 'What is the name of your current employer?',    id: 'emp_2',  {  },    ],      'What is your job?',      'Where do you work?',      'What do you do for a living?',    variations: [    tipEs: 'Diga el título de su trabajo o describa lo que hace.',    tip: 'State your job title or describe what you do.',    section: 'employment',    questionEs: '¿Cuál es su ocupación actual?',    question: 'What is your current occupation?',    id: 'emp_1',  {  // ═══ EMPLOYMENT (emp) ═══  },    variations: [],    tipEs: 'Solo si su dirección postal es diferente a la de su hogar.',    tip: 'Only if your mailing address differs from your home address.',    section: 'address',    questionEs: '¿Tiene una dirección postal diferente a su dirección de casa?',    question: 'Do you have a mailing address different from your home address?',    id: 'addr_4',  {  },    ],      'Where else have you lived recently?',      'Can you list your addresses for the past five years?',      'What was your previous address?',    variations: [    tipEs: 'Mencione las direcciones anteriores de los últimos 5 años.',    tip: 'List previous addresses for the last 5 years.',    section: 'address',    questionEs: '¿Dónde vivía antes de su dirección actual?',    question: 'Where did you live before your current address?',    id: 'addr_3',  {  },    ],      'Since when have you been living there?',      'When did you move to your current address?',    variations: [    tipEs: 'Diga el número de años y meses.',    tip: 'State the number of years and months.',    section: 'address',    questionEs: '¿Cuánto tiempo ha vivido en su dirección actual?',    question: 'How long have you lived at your current address?',    id: 'addr_2',  {  },    ],      'Can you give me your home address?',      'What is your residential address?',      'Where do you currently live?',    variations: [    tipEs: 'Dé su dirección completa incluyendo ciudad, estado y código postal.',    tip: 'Give your complete address including city, state, and zip code.',    section: 'address',    questionEs: '¿Cuál es su dirección actual?',    question: 'What is your current home address?',    id: 'addr_1',  {  // ═══ ADDRESS (addr) ═══  },    ],      'What is your current weight?',      'How much do you weigh?',    variations: [    tipEs: 'Diga su peso en libras.',    tip: 'State your weight in pounds.',    section: 'identity',    questionEs: '¿Cuál es su peso?',    question: 'What is your weight?',    id: 'id_10',  {  },    ],      'Can you tell me your height?',      'How tall are you?',    variations: [    tipEs: 'Diga su estatura en pies y pulgadas.',    tip: 'State your height in feet and inches.',    section: 'identity',    questionEs: '¿Cuál es su estatura?',    question: 'What is your height?',    id: 'id_9',  {  },    ],      'What sex is listed on your identification?',      'Are you male or female?',    variations: [    tipEs: 'Responda masculino o femenino como aparece en sus documentos.',    tip: 'Answer male or female as shown on your documents.',    section: 'identity',    questionEs: '¿Cuál es su género?',    question: 'What is your gender?',    id: 'id_8',  {  },    ],      'Have you gone by any other name?',    variations: [    tipEs: 'Incluya nombres de soltera, apodos usados legalmente, etc.',    tip: 'Include maiden names, nicknames used legally, etc.',    section: 'identity',    questionEs: '¿Ha usado alguna vez otros nombres?',    question: 'Have you ever used any other names?',    id: 'id_7',  {  },    ],      'Can you tell me your alien number?',      'What is your A-Number?',    variations: [    tipEs: 'Este es el número A en su tarjeta verde.',    tip: 'This is the A-Number on your green card.',    section: 'identity',    questionEs: '¿Cuál es su número de registro de extranjero?',    question: 'What is your Alien Registration Number?',    id: 'id_6',  {  },    ],      'What SSN do you have?',      'Can you provide your Social Security Number?',    variations: [    tipEs: 'Diga su número de 9 dígitos claramente.',    tip: 'State your 9-digit SSN clearly.',    section: 'identity',    questionEs: '¿Cuál es su número de Seguro Social?',    question: 'What is your Social Security Number?',    id: 'id_5',  {  },    ],      'What is your current nationality?',      'What country are you currently a citizen of?',    variations: [    tipEs: 'Este es el país de su ciudadanía actual.',    tip: 'This is the country of your current citizenship.',    section: 'identity',    questionEs: '¿Cuál es su país de nacionalidad?',    question: 'What is your country of nationality?',    id: 'id_4',  {  },    ],      'In which country were you born?',      'Where were you born?',    variations: [    tipEs: 'Diga el nombre del país donde nació.',    tip: 'Name the country where you were born.',    section: 'identity',    questionEs: '¿Cuál es su país de nacimiento?',    question: 'What is your country of birth?',    id: 'id_3',  {  },    ],      'What is your birth date?',      'Can you tell me your birthday?',      'When were you born?',    variations: [    tipEs: 'Diga mes, día y año claramente.',    tip: 'State month, day, and year clearly.',    section: 'identity',    questionEs: '¿Cuál es su fecha de nacimiento?',    question: 'What is your date of birth?',    id: 'id_2',  {  },    ],      'What is the name you currently go by legally?',      'Tell me your first, middle, and last name.',      'What name appears on your permanent resident card?',      'Can you tell me your full name?',      'Please state your complete legal name.',    variations: [    tipEs: 'Diga su nombre completo tal como aparece en su tarjeta verde.',    tip: 'Say your full name as it appears on your green card.',    section: 'identity',    questionEs: '¿Cuál es su nombre legal completo?',    question: 'What is your full legal name?',    id: 'id_1',  {  // ═══ IDENTITY (id) ═══export const n400Questions: N400Question[] = [// ─── PREGUNTAS PRINCIPALES DEL N-400 ─────────────────────────────────];  },    descriptionEs: 'Preguntas generales sobre su solicitud',    description: 'General questions about your application',    color: '#64748B',    icon: 'help-circle',    titleEs: 'General',    title: 'General',    key: 'gen',    id: 'general',  {  },    descriptionEs: 'Historial de declaración de impuestos',    description: 'Tax filing history',    color: '#059669',    icon: 'currency-usd',    titleEs: 'Impuestos',    title: 'Taxes',    key: 'tax',    id: 'tax',  {  },    descriptionEs: 'Lealtad a los Estados Unidos',    description: 'Allegiance to the United States',    color: '#8B5CF6',    icon: 'flag',    titleEs: 'Lealtad y Juramento',    title: 'Loyalty & Oath',    key: 'loy',    id: 'loyalty',  {  },    descriptionEs: 'Historial legal y antecedentes',    description: 'Legal history and background',    color: '#EF4444',    icon: 'gavel',    titleEs: 'Legal y Criminal',    title: 'Legal & Criminal',    key: 'leg',    id: 'legal',  {  },    descriptionEs: 'Viajes fuera de los Estados Unidos',    description: 'Trips outside the United States',    color: '#06B6D4',    icon: 'airplane',    titleEs: 'Viajes',    title: 'Travel',    key: 'trav',    id: 'travel',  {  },    descriptionEs: 'Estado civil y miembros de la familia',    description: 'Marital status and family members',    color: '#EC4899',    icon: 'account-group',    titleEs: 'Familia',    title: 'Family',    key: 'fam',    id: 'family',  {  },    descriptionEs: 'Historial laboral y trabajo actual',    description: 'Work history and current job',    color: '#F59E0B',    icon: 'briefcase',    titleEs: 'Empleo',    title: 'Employment',    key: 'emp',    id: 'employment',  {  },    descriptionEs: 'Dónde vive y ha vivido',    description: 'Where you live and have lived',    color: '#10B981',    icon: 'home-map-marker',    titleEs: 'Dirección y Residencia',    title: 'Address & Residence',    key: 'addr',    id: 'address',  {  },    descriptionEs: 'Preguntas de identificación personal',    description: 'Personal identification questions',    color: '#3B82F6',    icon: 'card-account-details',    titleEs: 'Identidad',    title: 'Identity',    key: 'id',    id: 'identity',  {export const n400Sections: N400SectionInfo[] = [// Mapeo de secciones con metadata}  descriptionEs: string;  description: string;  color: string;  icon: string;  titleEs: string;  title: string;  key: string; // key usado en audio files (id, addr, emp, etc.)  id: N400Section;export interface N400SectionInfo {  | 'general';  | 'tax'  | 'loyalty'  | 'legal'  | 'travel'  | 'family'  | 'employment'  | 'address'  | 'identity'export type N400Section =}  n400QuestionEs: string;  n400Question: string;  termEs: string;  term: string;  id: string;export interface N400Definition {}  phraseEs: string;  phrase: string;  id: string;export interface N400Protocol {}  variations: string[];  tipEs: string;  tip: string;  section: N400Section;  questionEs: string;  question: string;  id: string;export interface N400Question {// Estructura compatible con scripts/generate_n400_audio_eleven.mjs// Datos de práctica del formulario N-400 para la entrevista de ciudadanía * Datos de Práctica del Formulario N-400
 * Adaptado de interviewTrainingData.ts para uso offline en el frontend
 * 56 preguntas principales + variaciones + protocolo + definiciones
 */

export interface N400Question {
  id: string;
  question: string;
  questionEs?: string;
  variations: string[];
  expectedResponseType: string;
  context: string;
  contextEs: string;
  answerGuide?: string;
  ifYes?: string;
  mustSayYes?: string;
  risk?: 'low' | 'medium' | 'high';
  recommendedResponse: string;
  recommendedResponseAudio: string;
  categoryId: string;
}

export interface N400Category {
  id: string;
  key: string;
  title: string;
  titleEn: string;
  description: string;
  icon: string;
  gradient: [string, string];
  questions: N400Question[];
}

export interface N400ProtocolPhrase {
  id: string;
  phrase: string;
  type: 'swearing' | 'document' | 'transition';
  contextEs: string;
}

export interface N400Definition {
  id: string;
  term: string;
  n400Question: string;
  explanation: string;
  explanationEs: string;
  synonyms: string[];
}

// ─── 9 CATEGORÍAS CON PREGUNTAS ────────────────────────────────

export const n400Categories: N400Category[] = [
  {
    id: 'identity',
    key: 'identityVerification',
    title: 'Verificación de Identidad',
    titleEn: 'Identity Verification',
    description: 'Nombre, fecha de nacimiento, estado civil',
    icon: 'card-account-details',
    gradient: ['#3B82F6', '#1D4ED8'],
    questions: [
      {
        id: 'id_1',
        question: 'What is your full legal name?',
        variations: [
          'Can you tell me your first name?',
          'What\'s your last name?',
          'Please spell your first name',
          'What is your name?',
          'Can you please tell me your current legal name?',
        ],
        expectedResponseType: 'Full name matching identification documents',
        context: 'First question after greeting, used to verify identity',
        contextEs: 'Tu nombre legal completo tal como aparece en tus documentos',
        questionEs: '¿Cuál es su nombre legal completo?',
        answerGuide: 'Di tu nombre exactamente como aparece en tu Green Card y en el N-400. No uses apodos.',
        risk: 'low',
        recommendedResponse: 'My name is [your name]',
        recommendedResponseAudio: 'My name is Maria Garcia Lopez',
        categoryId: 'identity',
      },
      {
        id: 'id_2',
        question: 'What is your date of birth?',
        variations: [
          'Tell me your date of birth',
          'When were you born?',
          'Can you confirm your date of birth for me please?',
        ],
        expectedResponseType: 'Date in American format: Month, Day, Year',
        context: 'Verification of birth date',
        contextEs: 'Tu fecha de nacimiento en formato americano (mes, día, año)',
        questionEs: '¿Cuál es su fecha de nacimiento?',
        answerGuide: 'Di mes, día y año en inglés. Ejemplo: March 15, 1985. Debe coincidir con tu Green Card.',
        risk: 'low',
        recommendedResponse: 'I was born on [month day, year]',
        recommendedResponseAudio: 'I was born on March 15, 1985',
        categoryId: 'identity',
      },
      {
        id: 'id_3',
        question: 'What is your current marital status?',
        variations: [
          'Are you married?',
          'Are you married, single, divorced, or widowed?',
        ],
        expectedResponseType: 'Marital status',
        context: 'Current marital status verification',
        contextEs: 'Tu estado civil actual (casado, soltero, divorciado, viudo)',
        questionEs: '¿Cuál es su estado civil actual?',
        answerGuide: 'Responde: Single, Married, Divorced, Widowed, o Separated. Debe coincidir con el N-400.',
        risk: 'low',
        recommendedResponse: 'I am married',
        recommendedResponseAudio: 'I am married',
        categoryId: 'identity',
      },
      {
        id: 'id_4',
        question: 'Where were you born?',
        variations: [
          'In what city were you born?',
          'What is your country of citizenship or nationality?',
        ],
        expectedResponseType: 'Country or city/country',
        context: 'Place of birth verification',
        contextEs: 'Tu país o ciudad de nacimiento',
        questionEs: '¿Dónde nació usted?',
        answerGuide: 'Di el nombre del país donde naciste. Si ese país ya no existe, di el nombre actual.',
        risk: 'low',
        recommendedResponse: 'I was born in [country]',
        recommendedResponseAudio: 'I was born in Mexico',
        categoryId: 'identity',
      },
      {
        id: 'id_5',
        question: 'What are the last four digits of your Social Security number?',
        variations: [
          'What is your social security number?',
          'Can you tell me your Social Security number?',
        ],
        expectedResponseType: 'Four digits or full SSN',
        context: 'Additional identity verification',
        contextEs: 'Los últimos 4 dígitos de tu número de Seguro Social',
        questionEs: '¿Cuáles son los últimos 4 dígitos de su Seguro Social?',
        answerGuide: 'El oficial puede pedir los últimos 4 dígitos o el número completo para verificar tu identidad.',
        risk: 'low',
        recommendedResponse: 'The last four digits are [number]',
        recommendedResponseAudio: 'The last four digits are 4 5 6 7',
        categoryId: 'identity',
      },
      {
        id: 'id_6',
        question: 'How are you eligible for naturalization?',
        variations: [
          'Why are you eligible to become a U.S citizen?',
          'How did you become a permanent resident?',
        ],
        expectedResponseType: 'Eligibility statement (e.g., LPR for 5+ years)',
        context: 'General eligibility question, often at the beginning',
        contextEs: 'Por qué eres elegible para la ciudadanía (residente permanente 5+ años)',
        questionEs: '¿Cómo es usted elegible para la naturalización?',
        answerGuide: 'Explica cómo calificas: residente permanente por 5+ años, cónyuge de ciudadano por 3+ años, o servicio militar.',
        risk: 'low',
        recommendedResponse: 'I have been a permanent resident for five years',
        recommendedResponseAudio: 'I have been a permanent resident for five years',
        categoryId: 'identity',
      },
      {
        id: 'id_7',
        question: 'Do you want to legally change your name?',
        variations: [
          'Would you like to change your name?',
        ],
        expectedResponseType: 'Yes/No',
        context: 'Name change request during naturalization',
        contextEs: 'Si deseas cambiar tu nombre legalmente al naturalizarte',
        questionEs: '¿Desea cambiar su nombre legalmente?',
        answerGuide: 'Si marcaste "Yes" en el N-400 con el nombre nuevo, di ese nombre. Si no quieres cambiar, di "No."',
        ifYes: 'My new name will be [first name] [last name]. I marked it on my application.',
        risk: 'low',
        recommendedResponse: 'No, I do not',
        recommendedResponseAudio: 'No, I do not',
        categoryId: 'identity',
      },
      {
        id: 'id_8',
        question: 'Have you used any other names since birth?',
        variations: [
          'Have you ever gone by any other name?',
          'Do you have any aliases or other names?',
        ],
        expectedResponseType: 'Yes/No + names if yes',
        context: 'Verification of name history',
        contextEs: 'Si has usado otros nombres desde tu nacimiento (apellido de soltera, apodos legales)',
        questionEs: '¿Ha usado otros nombres desde su nacimiento?',
        answerGuide: 'Incluye nombres de soltera, nombres anteriores al matrimonio, apodos usados en documentos legales.',
        ifYes: 'Yes, I also used the name [nombre]. I included it in my application.',
        mustSayYes: 'Si alguna vez usaste un nombre diferente en documentos legales, de trabajo, o de gobierno — debes decir SÍ.',
        risk: 'medium',
        recommendedResponse: 'No',
        recommendedResponseAudio: 'No',
        categoryId: 'identity',
      },
      {
        id: 'id_9',
        question: 'What is your country of nationality or citizenship?',
        variations: [
          'What country are you a citizen of?',
          'What is your current nationality?',
        ],
        expectedResponseType: 'Country name',
        context: 'Current nationality/citizenship verification',
        contextEs: 'Tu país de ciudadanía o nacionalidad actual',
        questionEs: '¿Cuál es su país de ciudadanía o nacionalidad?',
        answerGuide: 'Di el país cuyo pasaporte tienes actualmente. Si tienes doble ciudadanía, menciona ambos.',
        risk: 'low',
        recommendedResponse: 'I am a citizen of [country]',
        recommendedResponseAudio: 'I am a citizen of Mexico',
        categoryId: 'identity',
      },
      {
        id: 'id_10',
        question: 'When did you become a Lawful Permanent Resident?',
        variations: [
          'When did you get your green card?',
          'What is the date you became a permanent resident?',
        ],
        expectedResponseType: 'Date',
        context: 'LPR date verification',
        contextEs: 'Cuándo te convertiste en residente permanente legal (fecha de tu Green Card)',
        questionEs: '¿Cuándo se convirtió en Residente Permanente Legal?',
        answerGuide: 'Di la fecha que aparece en tu Green Card. Ejemplo: I became a permanent resident on June 3, 2018.',
        risk: 'low',
        recommendedResponse: 'I became a permanent resident on [date]',
        recommendedResponseAudio: 'I became a permanent resident on June 3, 2018',
        categoryId: 'identity',
      },
    ],
  },
  {
    id: 'address',
    key: 'n400Address',
    title: 'Dirección',
    titleEn: 'Address',
    description: 'Dirección actual, historial de residencia',
    icon: 'home-map-marker',
    gradient: ['#10B981', '#059669'],
    questions: [
      {
        id: 'addr_1',
        question: 'What is your current physical address?',
        variations: [
          'What is your current address?',
          'Where do you currently live?',
          'What is your current residential address?',
        ],
        expectedResponseType: 'Complete address (street, city, state, ZIP)',
        context: 'After identity verification, reviewing N-400 form data',
        contextEs: 'Tu dirección actual completa (calle, ciudad, estado, ZIP)',
        questionEs: '¿Cuál es su dirección actual?',
        answerGuide: 'Di tu dirección completa: número, calle, ciudad, estado y código postal. Debe coincidir con el N-400.',
        risk: 'low',
        recommendedResponse: 'My address is [full address]',
        recommendedResponseAudio: 'My address is 123 Main Street, Miami, Florida, 33101',
        categoryId: 'address',
      },
      {
        id: 'addr_2',
        question: 'How long have you been living at this address?',
        variations: [
          'How long have you lived at this address?',
          'How long have you lived at your current address?',
        ],
        expectedResponseType: 'Time period (e.g., 7 years, since Nov 2022)',
        context: 'Duration of residence at current address',
        contextEs: 'Cuánto tiempo llevas viviendo en tu dirección actual',
        questionEs: '¿Cuánto tiempo lleva viviendo en su dirección actual?',
        answerGuide: 'Da el número de meses o años. Ejemplo: I have lived there for three years.',
        risk: 'low',
        recommendedResponse: 'I have been living there for [time]',
        recommendedResponseAudio: 'I have been living there for three years',
        categoryId: 'address',
      },
      {
        id: 'addr_3',
        question: 'Where did you live before?',
        variations: [
          'Where did you live before moving to your current address?',
          'Where did you live prior to that address?',
          'What is your previous address?',
        ],
        expectedResponseType: 'Previous address',
        context: 'Residence history',
        contextEs: 'Dónde vivías antes de tu dirección actual',
        questionEs: '¿Dónde vivía usted antes?',
        answerGuide: 'Menciona las direcciones de los últimos 5 años tal como las pusiste en el N-400.',
        risk: 'low',
        recommendedResponse: 'Before that, I lived at [previous address]',
        recommendedResponseAudio: 'Before that, I lived at 456 Oak Avenue, Houston, Texas',
        categoryId: 'address',
      },
      {
        id: 'addr_4',
        question: 'Have you lived anywhere else during the last 5 years?',
        variations: [],
        expectedResponseType: 'Yes/No',
        context: 'Comprehensive verification of residence history for last 5 years',
        contextEs: 'Si has vivido en otros lugares en los últimos 5 años',
        questionEs: '¿Ha vivido en otros lugares en los últimos 5 años?',
        answerGuide: 'Repasa los últimos 5 años y menciona cualquier otra dirección donde hayas vivido.',
        risk: 'low',
        recommendedResponse: 'No, I have not',
        recommendedResponseAudio: 'No, I have not',
        categoryId: 'address',
      },
    ],
  },
  {
    id: 'employment',
    key: 'n400Employment',
    title: 'Empleo',
    titleEn: 'Employment',
    description: 'Trabajo actual, empleador, ocupación',
    icon: 'briefcase',
    gradient: ['#F59E0B', '#D97706'],
    questions: [
      {
        id: 'emp_1',
        question: 'Are you currently working?',
        variations: [
          'What is your current employment status?',
          'Where do you work?',
          'Are you currently employed?',
        ],
        expectedResponseType: 'Yes/No or Status (employed, unemployed, self-employed, retired)',
        context: 'Current employment status',
        contextEs: 'Si estás trabajando actualmente o tu situación laboral',
        questionEs: '¿Está trabajando actualmente?',
        answerGuide: 'Di tu situación. Si estás desempleado: I am currently unemployed. Si retirado: I am retired.',
        risk: 'low',
        recommendedResponse: 'Yes, I am employed',
        recommendedResponseAudio: 'Yes, I am employed',
        categoryId: 'employment',
      },
      {
        id: 'emp_2',
        question: 'What is your employer\'s name?',
        variations: [
          'Who is your employer?',
          'What is the name of the place where you work?',
          'Where do you work?',
        ],
        expectedResponseType: 'Company/employer name',
        context: 'Identification of current employer',
        contextEs: 'El nombre de tu empleador o empresa donde trabajas',
        questionEs: '¿Cuál es el nombre de su empleador?',
        answerGuide: 'Di el nombre completo de la empresa o persona para quien trabajas.',
        risk: 'low',
        recommendedResponse: 'I work at [company name]',
        recommendedResponseAudio: 'I work at Walmart',
        categoryId: 'employment',
      },
      {
        id: 'emp_3',
        question: 'What do you do there?',
        variations: [
          'What is your occupation?',
          'What is your job?',
        ],
        expectedResponseType: 'Job title (e.g., project manager, teacher)',
        context: 'Job title or description of responsibilities',
        contextEs: 'Qué haces en tu trabajo o cuál es tu puesto',
        questionEs: '¿Qué hace usted en su trabajo?',
        answerGuide: 'Describe tu puesto. Ejemplo: I am a project manager, I work as a teacher.',
        risk: 'low',
        recommendedResponse: 'I work as a [job title]',
        recommendedResponseAudio: 'I work as a cashier',
        categoryId: 'employment',
      },
      {
        id: 'emp_4',
        question: 'How long have you been working there?',
        variations: [
          'How many years have you been at your current job?',
          'When did you start working at your current job?',
        ],
        expectedResponseType: 'Time period (e.g., since March 2019, five years)',
        context: 'Duration of current employment',
        contextEs: 'Cuánto tiempo llevas en tu trabajo actual',
        questionEs: '¿Cuánto tiempo lleva trabajando ahí?',
        answerGuide: 'Da el tiempo o fecha de inicio. Ejemplo: Since March 2019 o Five years.',
        risk: 'low',
        recommendedResponse: 'I have been working there for [time]',
        recommendedResponseAudio: 'I have been working there for five years',
        categoryId: 'employment',
      },
      {
        id: 'emp_5',
        question: 'Where have you worked in the last 5 years?',
        variations: [
          'What jobs have you had in the last five years?',
          'Can you list your employment history for the past 5 years?',
        ],
        expectedResponseType: 'List of employers and dates',
        context: 'Employment history over last 5 years',
        contextEs: 'Dónde has trabajado en los últimos 5 años (historial laboral)',
        questionEs: '¿Dónde ha trabajado en los últimos 5 años?',
        answerGuide: 'Menciona todos los empleadores de los últimos 5 años como los pusiste en el N-400. Incluye períodos de desempleo.',
        risk: 'low',
        recommendedResponse: 'I have worked at [company] since [date]',
        recommendedResponseAudio: 'I have worked at Target since January 2020',
        categoryId: 'employment',
      },
    ],
  },
  {
    id: 'family',
    key: 'n400Family',
    title: 'Familia',
    titleEn: 'Family',
    description: 'Esposo/a, hijos, estado civil',
    icon: 'account-group',
    gradient: ['#EC4899', '#DB2777'],
    questions: [
      {
        id: 'fam_1',
        question: 'Are you married?',
        variations: [
          'What is your current marital status?',
          'Are you married, single, divorced, or widowed?',
        ],
        expectedResponseType: 'Yes/No or Status',
        context: 'Current marital status',
        contextEs: 'Si estás casado(a) actualmente',
        questionEs: '¿Está casado(a)?',
        answerGuide: 'Responde con tu estado civil actual. Debe coincidir con lo que pusiste en el N-400.',
        risk: 'low',
        recommendedResponse: 'Yes, I am married',
        recommendedResponseAudio: 'Yes, I am married',
        categoryId: 'family',
      },
      {
        id: 'fam_2',
        question: 'What is the current legal name of your spouse?',
        variations: [
          'What is the full name of your spouse?',
          'What is your spouse\'s full legal name?',
          'What is your husband\'s full name?',
          'What is your wife\'s full name?',
        ],
        expectedResponseType: 'Full name',
        context: 'Identity of current spouse',
        contextEs: 'El nombre legal completo de tu esposo(a)',
        questionEs: '¿Cuál es el nombre de su cónyuge?',
        answerGuide: 'Di el nombre completo de tu esposo(a) tal como aparece en sus documentos.',
        risk: 'low',
        recommendedResponse: 'My spouse\'s name is [full name]',
        recommendedResponseAudio: 'My spouse\'s name is Carlos Rodriguez',
        categoryId: 'family',
      },
      {
        id: 'fam_3',
        question: 'What is the date of birth of your spouse?',
        variations: [],
        expectedResponseType: 'Date of birth',
        context: 'Spouse information',
        contextEs: 'La fecha de nacimiento de tu esposo(a)',
        questionEs: '¿Cuál es la fecha de nacimiento de su cónyuge?',
        answerGuide: 'Di la fecha de nacimiento de tu esposo(a) en formato americano: mes, día, año.',
        risk: 'low',
        recommendedResponse: 'My spouse was born on [date]',
        recommendedResponseAudio: 'My spouse was born on April 10, 1982',
        categoryId: 'family',
      },
      {
        id: 'fam_4',
        question: 'How many children do you have?',
        variations: [
          'Do you have any children?',
          'Do you and your spouse have any children?',
        ],
        expectedResponseType: 'Number (including biological, stepchildren, and adopted)',
        context: 'Number of children',
        contextEs: 'Cuántos hijos tienes (biológicos, adoptivos e hijastros)',
        questionEs: '¿Cuántos hijos tiene?',
        answerGuide: 'Incluye hijos biológicos, adoptivos y hijastros. Da el número total.',
        risk: 'low',
        recommendedResponse: 'I have [number] children',
        recommendedResponseAudio: 'I have two children',
        categoryId: 'family',
      },
      {
        id: 'fam_5',
        question: 'What are your children\'s names?',
        variations: [
          'What are the ages and the names of your children?',
        ],
        expectedResponseType: 'Names',
        context: 'Identification of children',
        contextEs: 'Los nombres y edades de tus hijos',
        questionEs: '¿Cuáles son los nombres de sus hijos?',
        answerGuide: 'Di los nombres completos. El oficial puede pedir también las edades.',
        risk: 'low',
        recommendedResponse: 'Their names are [names]',
        recommendedResponseAudio: 'Their names are Sofia and Daniel',
        categoryId: 'family',
      },
      {
        id: 'fam_6',
        question: 'How many times have you been married?',
        variations: [
          'Have you been married before?',
          'Is this your first marriage?',
        ],
        expectedResponseType: 'Number',
        context: 'Total marriage history',
        contextEs: 'Cuántas veces te has casado en total (incluye matrimonios anteriores)',
        questionEs: '¿Cuántas veces ha estado casado(a)?',
        answerGuide: 'Cuenta TODOS los matrimonios, incluyendo los divorciados o anulados. No omitas ninguno.',
        mustSayYes: 'Muchas personas olvidan contar matrimonios anteriores. El USCIS puede verificar esto. Siempre menciona TODOS.',
        risk: 'high',
        recommendedResponse: 'This is my first marriage',
        recommendedResponseAudio: 'This is my first marriage',
        categoryId: 'family',
      },
      {
        id: 'fam_7',
        question: 'Is your spouse a U.S. citizen?',
        variations: [
          'Is your husband/wife a citizen?',
          'What is the immigration status of your spouse?',
        ],
        expectedResponseType: 'Yes/No',
        context: 'Spouse citizenship status',
        contextEs: 'Si tu esposo(a) es ciudadano(a) de EE.UU.',
        questionEs: '¿Es su cónyuge ciudadano(a) de EE.UU.?',
        answerGuide: 'Si aplicas por la categoría de cónyuge de ciudadano (3 años), di Yes y la fecha en que se hizo ciudadano(a).',
        risk: 'low',
        recommendedResponse: 'Yes, my spouse is a U.S. citizen',
        recommendedResponseAudio: 'Yes, my spouse is a U.S. citizen',
        categoryId: 'family',
      },
    ],
  },
  {
    id: 'travel',
    key: 'n400Travel',
    title: 'Viajes',
    titleEn: 'Travel',
    description: 'Viajes fuera de EE.UU., presencia física',
    icon: 'airplane',
    gradient: ['#06B6D4', '#0891B2'],
    questions: [
      {
        id: 'trav_1',
        question: 'How many total trips have you taken outside the US?',
        variations: [
          'How many times have you traveled outside of the United States in the last 5 years?',
          'How many trips have you made outside of the United States in the last 5 years?',
          'How many total trips did you take outside of the U.S during the last five years?',
        ],
        expectedResponseType: 'Number',
        context: 'Frequency of trips outside US in last 5 years',
        contextEs: 'Cuántos viajes has hecho fuera de EE.UU. en los últimos 5 años',
        questionEs: '¿Cuántos viajes ha hecho fuera de EE.UU.?',
        answerGuide: 'Debes reportar TODOS los viajes, incluyendo los cortos. Ten el número exacto memorizado.',
        risk: 'medium',
        recommendedResponse: 'I took [number] trips',
        recommendedResponseAudio: 'I took three trips',
        categoryId: 'travel',
      },
      {
        id: 'trav_2',
        question: 'How many total days have you spent outside the US in the past 5 years?',
        variations: [
          'What are the total amount of days you have spent outside of the United States in The Last 5 Years?',
        ],
        expectedResponseType: 'Number of days',
        context: 'Physical Presence calculation',
        contextEs: 'Total de días que pasaste fuera de EE.UU. en los últimos 5 años',
        questionEs: '¿Cuántos días en total ha pasado fuera de EE.UU.?',
        answerGuide: 'Ten el total de días calculado antes de la entrevista.',
        risk: 'medium',
        recommendedResponse: 'I spent [number] days outside the United States',
        recommendedResponseAudio: 'I spent forty five days outside the United States',
        categoryId: 'travel',
      },
      {
        id: 'trav_3',
        question: 'Tell me when and where your last trip was',
        variations: [
          'What is the last date that you traveled out of the United States?',
          'What are the dates of your most recent trip and where was that?',
        ],
        expectedResponseType: 'Date and place',
        context: 'Details of most recent trip',
        contextEs: 'Cuándo y a dónde fue tu último viaje fuera de EE.UU.',
        questionEs: '¿Cuándo y a dónde fue su último viaje?',
        answerGuide: 'Di el país, la fecha de salida y la fecha de regreso de tu viaje más reciente.',
        risk: 'low',
        recommendedResponse: 'My last trip was to [country] on [date]',
        recommendedResponseAudio: 'My last trip was to Mexico in December 2024',
        categoryId: 'travel',
      },
      {
        id: 'trav_4',
        question: 'What was the purpose of your last trip?',
        variations: [
          'What was the purpose of your trip?',
          'Why did you travel to [Country]?',
        ],
        expectedResponseType: 'Explanation (e.g., vacation, business)',
        context: 'Reason for traveling outside US',
        contextEs: 'El propósito o motivo de tu viaje fuera de EE.UU.',
        questionEs: '¿Cuál fue el propósito de su viaje?',
        answerGuide: 'Sé honesto: vacaciones, visita familiar, trabajo, emergencia. No inventes razones.',
        risk: 'low',
        recommendedResponse: 'To visit my family',
        recommendedResponseAudio: 'To visit my family',
        categoryId: 'travel',
      },
      {
        id: 'trav_5',
        question: 'Did any of your trips last 6 months or longer?',
        variations: [],
        expectedResponseType: 'Yes/No',
        context: 'Continuity of Residence check',
        contextEs: 'Si alguno de tus viajes duró 6 meses o más',
        questionEs: '¿Algún viaje duró 6 meses o más?',
        answerGuide: 'Un viaje de 6+ meses puede afectar tu residencia continua. Si pasó, ten evidencia de lazos con EE.UU.',
        risk: 'high',
        recommendedResponse: 'No, they did not',
        recommendedResponseAudio: 'No, they did not',
        categoryId: 'travel',
      },
    ],
  },
  {
    id: 'legal',
    key: 'n400Legal',
    title: 'Legal / Carácter Moral',
    titleEn: 'Legal / Good Moral Character',
    description: 'Arrestos, antecedentes, organizaciones',
    icon: 'scale-balance',
    gradient: ['#EF4444', '#DC2626'],
    questions: [
      {
        id: 'leg_1',
        question: 'Have you ever been arrested, cited, detained or confined by any law enforcement officer?',
        variations: [
          'Have you ever been arrested by any law enforcement officer?',
          'Have you ever been arrested, cited, or detained by any law enforcement officer for any reason?',
        ],
        expectedResponseType: 'No (if yes, must provide details)',
        context: 'Law enforcement/detention history (Part 12)',
        contextEs: 'Si alguna vez fuiste arrestado, citado o detenido por la policía',
        questionEs: '¿Ha sido arrestado, citado o detenido alguna vez?',
        answerGuide: 'Incluye TODO: multas de tráfico con citación a corte, arrestos sin condena, casos sellados. El USCIS puede verificar.',
        ifYes: 'Yes, I was arrested/cited in [año] for [cargo]. The charges were dismissed / I paid a fine. I have documentation.',
        mustSayYes: 'SIEMPRE di SÍ si tuviste cualquier contacto con la policía — aunque el caso fue desestimado o expungido.',
        risk: 'high',
        recommendedResponse: 'No, I have not',
        recommendedResponseAudio: 'No, I have not',
        categoryId: 'legal',
      },
      {
        id: 'leg_2',
        question: 'Have you ever claimed to be a US citizen?',
        variations: [
          'Have you ever claimed to be a US citizen in writing or any other way?',
        ],
        expectedResponseType: 'No',
        context: 'Part 12 question',
        contextEs: 'Si alguna vez dijiste o reclamaste ser ciudadano de EE.UU.',
        questionEs: '¿Ha afirmado alguna vez ser ciudadano de EE.UU.?',
        answerGuide: 'Incluye marcar "citizen" en formularios de empleo (I-9), registrarse para votar, o decirle a un oficial.',
        ifYes: 'Yes, I mistakenly checked the wrong box on the I-9 form. I corrected it with my employer immediately.',
        mustSayYes: 'Si alguna vez marcaste "U.S. Citizen" en un formulario I-9 o cualquier documento — DEBES decir SÍ.',
        risk: 'high',
        recommendedResponse: 'No, I have not',
        recommendedResponseAudio: 'No, I have not',
        categoryId: 'legal',
      },
      {
        id: 'leg_3',
        question: 'Have you ever been a member of a terrorist organization?',
        variations: [],
        expectedResponseType: 'No',
        context: 'Part 12 question',
        contextEs: 'Si has sido miembro de una organización terrorista',
        questionEs: '¿Ha sido miembro de una organización terrorista?',
        answerGuide: 'La mayoría responde No. Si fuiste miembro bajo presión, consulta con un abogado antes.',
        risk: 'high',
        recommendedResponse: 'No, absolutely not',
        recommendedResponseAudio: 'No, absolutely not',
        categoryId: 'legal',
      },
      {
        id: 'leg_4',
        question: 'Have you ever persecuted any person because of race, religion, national origin?',
        variations: [],
        expectedResponseType: 'No',
        context: 'Part 12 question',
        contextEs: 'Si has perseguido a alguien por su raza, religión u origen nacional',
        questionEs: '¿Ha perseguido a alguien por raza, religión u origen?',
        answerGuide: 'La respuesta esperada es No. Incluye cualquier forma de persecución o discriminación activa.',
        risk: 'high',
        recommendedResponse: 'No, I have not',
        recommendedResponseAudio: 'No, I have not',
        categoryId: 'legal',
      },
      {
        id: 'leg_5',
        question: 'If the law requires it, are you willing to perform work of national importance under civilian direction?',
        variations: [],
        expectedResponseType: 'Yes (I am willing to)',
        context: 'Oath/loyalty question (Part 12)',
        contextEs: 'Si estás dispuesto a hacer trabajo civil de importancia nacional',
        questionEs: '¿Está dispuesto a realizar trabajo de importancia nacional bajo dirección civil?',
        answerGuide: 'La respuesta esperada es Yes. Se refiere a trabajo civil en caso de emergencia nacional.',
        risk: 'low',
        recommendedResponse: 'Yes, I am willing',
        recommendedResponseAudio: 'Yes, I am willing',
        categoryId: 'legal',
      },
      {
        id: 'leg_6',
        question: 'Do you support the Constitution and form of government of the United States?',
        variations: [
          'Do you support the Constitution of the United States?',
        ],
        expectedResponseType: 'Yes (I do)',
        context: 'Oath/loyalty question (Part 12)',
        contextEs: 'Si apoyas la Constitución y el gobierno de EE.UU.',
        questionEs: '¿Apoya la Constitución y forma de gobierno de EE.UU.?',
        answerGuide: 'Responde Yes, I do. Esta es una pregunta de lealtad básica.',
        risk: 'low',
        recommendedResponse: 'Yes, I do',
        recommendedResponseAudio: 'Yes, I do',
        categoryId: 'legal',
      },
      {
        id: 'leg_7',
        question: 'Have you ever registered to vote or voted in a U.S. election?',
        variations: [
          'Have you ever voted in any US election?',
          'Are you registered to vote?',
        ],
        expectedResponseType: 'No',
        context: 'Voting as non-citizen check (Part 9)',
        contextEs: 'Si alguna vez te registraste para votar o votaste sin ser ciudadano',
        questionEs: '¿Se registró para votar o votó en una elección de EE.UU.?',
        answerGuide: 'Votar sin ser ciudadano es una violación grave. Si lo hiciste sin saber que estaba prohibido, explícalo.',
        ifYes: 'Yes. I registered because I was incorrectly told I was eligible. I did not know it was prohibited. I have never actually voted.',
        mustSayYes: 'Si te registraste o votaste, di SÍ. Mentir puede resultar en deportación. Si fue un error, explícalo.',
        risk: 'high',
        recommendedResponse: 'No, I have never voted',
        recommendedResponseAudio: 'No, I have never voted',
        categoryId: 'legal',
      },
      {
        id: 'leg_8',
        question: 'Have you ever been a member of the Communist Party or any totalitarian party?',
        variations: [],
        expectedResponseType: 'No',
        context: 'Political party membership check (Part 9)',
        contextEs: 'Si has sido miembro del Partido Comunista o de algún partido totalitario',
        questionEs: '¿Ha sido miembro del Partido Comunista o algún partido totalitario?',
        answerGuide: 'La mayoría responde No. Si fuiste miembro bajo presión o como requisito, hay excepciones. Consulta un abogado.',
        ifYes: 'Yes, I was required to be a member in [país] to [razón]. It was not voluntary. I have not been a member since [año].',
        mustSayYes: 'Si fuiste miembro — aunque sea por obligación — di SÍ. Existen excepciones para membresías involuntarias.',
        risk: 'high',
        recommendedResponse: 'No, I have not',
        recommendedResponseAudio: 'No, I have not',
        categoryId: 'legal',
      },
      {
        id: 'leg_9',
        question: 'Have you ever been married to more than one person at the same time?',
        variations: [],
        expectedResponseType: 'No',
        context: 'Bigamy check (Part 9)',
        contextEs: 'Si has estado casado(a) con más de una persona al mismo tiempo (bigamia)',
        questionEs: '¿Ha estado casado(a) con más de una persona al mismo tiempo?',
        answerGuide: 'Bigamia es causa de negación. Verifica que las fechas de divorcio anterior y nuevo matrimonio no se traslapen.',
        mustSayYes: 'Revisa que las fechas de tu divorcio y nuevo matrimonio no se traslapen. Si hay conflicto, consulta un abogado.',
        risk: 'high',
        recommendedResponse: 'No, I have not',
        recommendedResponseAudio: 'No, I have not',
        categoryId: 'legal',
      },
      {
        id: 'leg_10',
        question: 'Have you ever married someone in order to obtain an immigration benefit?',
        variations: [],
        expectedResponseType: 'No',
        context: 'Marriage fraud check (Part 9)',
        contextEs: 'Si te casaste con alguien para obtener un beneficio de inmigración',
        questionEs: '¿Se casó para obtener un beneficio de inmigración?',
        answerGuide: 'El matrimonio fraudulento es causa de deportación. La respuesta correcta es No para casi todos.',
        risk: 'high',
        recommendedResponse: 'No, my marriage is genuine',
        recommendedResponseAudio: 'No, my marriage is genuine',
        categoryId: 'legal',
      },
      {
        id: 'leg_11',
        question: 'Have you ever helped anyone enter the United States illegally?',
        variations: [
          'Have you ever smuggled anyone into the US?',
        ],
        expectedResponseType: 'No',
        context: 'Immigration smuggling check (Part 9)',
        contextEs: 'Si alguna vez ayudaste a alguien a entrar ilegalmente a EE.UU.',
        questionEs: '¿Alguna vez ayudó a alguien a entrar ilegalmente a EE.UU.?',
        answerGuide: 'Incluye pagar a un coyote para otra persona, transportar personas o guiarlas para cruzar sin documentos.',
        mustSayYes: 'Si ayudaste económicamente a alguien para cruzar sin documentos, aunque sea familiar, di SÍ.',
        risk: 'high',
        recommendedResponse: 'No, I have not',
        recommendedResponseAudio: 'No, I have not',
        categoryId: 'legal',
      },
      {
        id: 'leg_12',
        question: 'Have you ever lied to a U.S. Government official to get an immigration benefit?',
        variations: [],
        expectedResponseType: 'No',
        context: 'Misrepresentation check (Part 9)',
        contextEs: 'Si alguna vez mentiste a un oficial del gobierno para obtener un beneficio migratorio',
        questionEs: '¿Mintió a un oficial del gobierno para obtener un beneficio migratorio?',
        answerGuide: 'Mentir al gobierno puede resultar en deportación. La respuesta correcta es No para casi todos.',
        mustSayYes: 'Si diste información incorrecta — aunque fue un error — di SÍ y explica. Ocultar es más peligroso.',
        risk: 'high',
        recommendedResponse: 'No, I have not',
        recommendedResponseAudio: 'No, I have not',
        categoryId: 'legal',
      },
      {
        id: 'leg_13',
        question: 'Have you ever been removed or deported from the United States?',
        variations: [
          'Have you ever been deported?',
        ],
        expectedResponseType: 'No',
        context: 'Deportation history check (Part 9)',
        contextEs: 'Si alguna vez fuiste removido o deportado de los Estados Unidos',
        questionEs: '¿Ha sido removido o deportado de los Estados Unidos?',
        answerGuide: 'Si tienes una deportación previa y ahora tienes Green Card, tu caso fue resuelto. Explícalo con fecha y circunstancias.',
        ifYes: 'Yes, I was deported in [año]. After that, I applied through my [cónyuge/empleador] and was approved. I have been a lawful resident since [fecha].',
        risk: 'high',
        recommendedResponse: 'No, I have not',
        recommendedResponseAudio: 'No, I have not',
        categoryId: 'legal',
      },
      {
        id: 'leg_14',
        question: 'Are you a male who lived in the United States between age 18 and 26? Did you register for Selective Service?',
        variations: [
          'Did you register for the Selective Service?',
        ],
        expectedResponseType: 'Yes (if applicable)',
        context: 'Selective Service registration (Part 9)',
        contextEs: 'Si eres varón que vivió en EE.UU. entre 18-26 años y te registraste en el Servicio Selectivo',
        questionEs: '¿Se registró en el Servicio Selectivo (si es varón, 18-26 años)?',
        answerGuide: 'Si eres hombre y viviste en EE.UU. entre 18-26 años, DEBES haberte registrado. Si no lo hiciste, puedes obtener carta de explicación.',
        ifYes: 'Yes, I registered. My Selective Service number is [número].',
        mustSayYes: 'Si no te registraste y tenías 18-26 cuando vivías en EE.UU., consulta un abogado. Puedes obtener carta del SSS.',
        risk: 'high',
        recommendedResponse: 'Yes, I am registered',
        recommendedResponseAudio: 'Yes, I am registered',
        categoryId: 'legal',
      },
    ],
  },
  {
    id: 'taxes',
    key: 'n400Taxes',
    title: 'Impuestos',
    titleEn: 'Taxes',
    description: 'Deudas fiscales, declaraciones',
    icon: 'cash-multiple',
    gradient: ['#8B5CF6', '#7C3AED'],
    questions: [
      {
        id: 'tax_1',
        question: 'Do you currently owe any overdue federal, state, or local taxes in the United States?',
        variations: [
          'Do you owe any overdue federal, state, or local taxes?',
        ],
        expectedResponseType: 'No',
        context: 'Tax debts (Part 12)',
        contextEs: 'Si debes impuestos federales, estatales o locales atrasados',
        questionEs: '¿Debe actualmente impuestos atrasados?',
        answerGuide: 'Si debes taxes y tienes un plan de pago con el IRS, di Yes y explica. Estar al día con un plan de pago suele ser aceptable.',
        ifYes: 'Yes, I have a payment plan with the IRS and I am current on my payments. I can provide documentation.',
        risk: 'high',
        recommendedResponse: 'No, I do not owe any taxes',
        recommendedResponseAudio: 'No, I do not owe any taxes',
        categoryId: 'taxes',
      },
      {
        id: 'tax_2',
        question: 'Have you ever failed to pay your taxes?',
        variations: [
          'Have you ever failed to pay your taxes?',
          'Have you ever not filed a federal, state, or local tax return since you became a lawful permanent resident?',
        ],
        expectedResponseType: 'No',
        context: 'Tax payment compliance (Part 12)',
        contextEs: 'Si alguna vez dejaste de pagar o presentar tus impuestos',
        questionEs: '¿Alguna vez dejó de pagar o presentar sus impuestos?',
        answerGuide: 'Como residente permanente, debes presentar taxes SIEMPRE. Si no presentaste, busca asesoría antes de la entrevista.',
        risk: 'high',
        recommendedResponse: 'No, I always pay my taxes',
        recommendedResponseAudio: 'No, I always pay my taxes',
        categoryId: 'taxes',
      },
      {
        id: 'tax_3',
        question: 'Since you became a lawful permanent resident, have you called yourself a non-resident alien on a federal, state, or local tax return?',
        variations: [
          'Have you called yourself a non-US resident on a federal, state, or local tax return since you became a lawful permanent resident?',
        ],
        expectedResponseType: 'No',
        context: 'Non-resident status for tax purposes since becoming LPR',
        contextEs: 'Si te declaraste no-residente en tus impuestos siendo residente permanente',
        questionEs: '¿Se ha declarado no-residente en sus impuestos desde ser residente permanente?',
        answerGuide: 'Como residente permanente (LPR), NUNCA debes declarar impuestos como no-residente. La respuesta debe ser No.',
        risk: 'high',
        recommendedResponse: 'No, I have not',
        recommendedResponseAudio: 'No, I have not',
        categoryId: 'taxes',
      },
    ],
  },
  {
    id: 'loyalty',
    key: 'loyaltyAndOath',
    title: 'Lealtad y Juramento',
    titleEn: 'Loyalty & Oath',
    description: 'Constitución, juramento, servicio militar',
    icon: 'shield-star',
    gradient: ['#1E3A8A', '#1E40AF'],
    questions: [
      {
        id: 'loy_1',
        question: 'Do you support the Constitution and form of government of the United States?',
        variations: [
          'Do you support the Constitution of the United States?',
        ],
        expectedResponseType: 'Yes (I do)',
        context: 'Oath/loyalty question',
        contextEs: 'Si apoyas la Constitución de los Estados Unidos (pregunta de lealtad)',
        questionEs: '¿Apoya la Constitución y forma de gobierno de EE.UU.?',
        answerGuide: 'Responde Yes, I do. Es una pregunta de lealtad fundamental del juramento.',
        risk: 'low',
        recommendedResponse: 'Yes, I do',
        recommendedResponseAudio: 'Yes, I do',
        categoryId: 'loyalty',
      },
      {
        id: 'loy_2',
        question: 'Do you understand the full oath of allegiance to the United States?',
        variations: [],
        expectedResponseType: 'Yes (I do)',
        context: 'Oath understanding question',
        contextEs: 'Si entiendes el juramento completo de lealtad a EE.UU.',
        questionEs: '¿Entiende el juramento de lealtad completo?',
        answerGuide: 'Di Yes, I do. El oficial puede pedirte que expliques qué significa en tus propias palabras.',
        ifYes: 'Yes. It means I give up my loyalty to any other country and promise to support and defend the United States and its Constitution.',
        risk: 'low',
        recommendedResponse: 'Yes, I understand',
        recommendedResponseAudio: 'Yes, I understand',
        categoryId: 'loyalty',
      },
      {
        id: 'loy_3',
        question: 'Are you willing to take the full Oath of Allegiance to the United States?',
        variations: [],
        expectedResponseType: 'Yes',
        context: 'Willingness to take oath',
        contextEs: 'Si estás dispuesto a tomar el juramento de lealtad completo',
        questionEs: '¿Está dispuesto a tomar el juramento de lealtad?',
        answerGuide: 'Responde Yes, I am. Incluye renunciar a lealtades extranjeras y defender la Constitución.',
        risk: 'low',
        recommendedResponse: 'Yes, I am willing',
        recommendedResponseAudio: 'Yes, I am willing',
        categoryId: 'loyalty',
      },
      {
        id: 'loy_4',
        question: 'If the law requires it, are you willing to bear arms on behalf of the United States?',
        variations: [],
        expectedResponseType: 'Yes (I\'m willing to)',
        context: 'Military service question',
        contextEs: 'Si estás dispuesto a portar armas en nombre de EE.UU.',
        questionEs: '¿Está dispuesto a portar armas por EE.UU. si la ley lo requiere?',
        answerGuide: 'La respuesta esperada es Yes. Si tienes objeciones religiosas, puedes solicitar excepción con documentación.',
        risk: 'medium',
        recommendedResponse: 'Yes, I am willing',
        recommendedResponseAudio: 'Yes, I am willing',
        categoryId: 'loyalty',
      },
      {
        id: 'loy_5',
        question: 'If the law requires it, are you willing to perform non-combatant services in the U.S armed forces?',
        variations: [],
        expectedResponseType: 'Yes (I\'m willing to)',
        context: 'Non-combatant service question',
        contextEs: 'Si estás dispuesto a servir como no combatiente en las fuerzas armadas',
        questionEs: '¿Está dispuesto a prestar servicios no combatientes en las fuerzas armadas?',
        answerGuide: 'La respuesta esperada es Yes. Los servicios no combatientes incluyen trabajo médico, logística, etc.',
        risk: 'low',
        recommendedResponse: 'Yes, I am willing',
        recommendedResponseAudio: 'Yes, I am willing',
        categoryId: 'loyalty',
      },
      {
        id: 'loy_6',
        question: 'If the law requires it, are you willing to perform work of national importance under civilian direction?',
        variations: [],
        expectedResponseType: 'Yes (I\'m willing to)',
        context: 'Civilian work question',
        contextEs: 'Si harías trabajo civil de importancia nacional si la ley lo requiere',
        questionEs: '¿Está dispuesto a realizar trabajo civil de importancia nacional?',
        answerGuide: 'La respuesta esperada es Yes. Esto se refiere a trabajo civil en caso de emergencia nacional.',
        risk: 'low',
        recommendedResponse: 'Yes, I am willing',
        recommendedResponseAudio: 'Yes, I am willing',
        categoryId: 'loyalty',
      },
    ],
  },
  {
    id: 'general',
    key: 'n400General',
    title: 'Preguntas Generales',
    titleEn: 'General Questions',
    description: 'Preguntas comunes al final de la entrevista',
    icon: 'comment-question',
    gradient: ['#64748B', '#475569'],
    questions: [
      {
        id: 'gen_1',
        question: 'Why do you want to become a U.S. citizen?',
        variations: [
          'What is the reason you want to become a citizen?',
          'Why are you applying for citizenship?',
        ],
        expectedResponseType: 'Personal explanation',
        context: 'Common interview question about motivation',
        contextEs: 'Por qué quieres convertirte en ciudadano(a) de EE.UU.',
        questionEs: '¿Por qué quiere convertirse en ciudadano(a) de EE.UU.?',
        answerGuide: 'No hay respuesta incorrecta, pero sé sincero y específico. Evita respuestas muy genéricas.',
        risk: 'low',
        recommendedResponse: 'I want to be fully part of this country',
        recommendedResponseAudio: 'I want to be fully part of this country',
        categoryId: 'general',
      },
      {
        id: 'gen_2',
        question: 'Is all the information in your application true and correct?',
        variations: [
          'Is everything on your N-400 accurate?',
          'Do you need to make any changes to your application?',
        ],
        expectedResponseType: 'Yes (or correction)',
        context: 'Final verification of application accuracy',
        contextEs: 'Si toda la información en tu solicitud N-400 es verdadera y correcta',
        questionEs: '¿Es toda la información en su solicitud verdadera y correcta?',
        answerGuide: 'Si hay algún error en tu N-400, INFÓRMALO AHORA. Di "Yes, it is correct" si todo está bien. Si hay un error: "I need to make a correction."',
        risk: 'high',
        recommendedResponse: 'Yes, it is all true and correct',
        recommendedResponseAudio: 'Yes, it is all true and correct',
        categoryId: 'general',
      },
      {
        id: 'gen_3',
        question: 'Do you have any additional information you would like to add?',
        variations: [
          'Is there anything else you want to tell me?',
        ],
        expectedResponseType: 'No (or explanation)',
        context: 'Final opportunity to add or clarify information',
        contextEs: 'Si tienes información adicional que quieras agregar',
        questionEs: '¿Tiene información adicional que desee agregar?',
        answerGuide: 'Esta es tu oportunidad de aclarar algo del N-400. Si todo está correcto: "No, everything is covered in my application."',
        risk: 'low',
        recommendedResponse: 'No, I believe my application is complete',
        recommendedResponseAudio: 'No, I believe my application is complete',
        categoryId: 'general',
      },
    ],
  },
];

// ─── PROTOCOLO ──────────────────────────────────────────────────

export const n400Protocol: N400ProtocolPhrase[] = [
  // Juramento
  { id: 'proto_1', phrase: 'Please remain standing', type: 'swearing', contextEs: 'Al inicio — el oficial te pide que permanezcas de pie' },
  { id: 'proto_2', phrase: 'Please raise your right hand', type: 'swearing', contextEs: 'Antes de jurar decir la verdad' },
  { id: 'proto_3', phrase: 'Do you swear to tell the truth, the whole truth, and nothing but the truth?', type: 'swearing', contextEs: 'Juramento de veracidad — debes responder "Yes, I do"' },
  { id: 'proto_4', phrase: 'Please be seated', type: 'swearing', contextEs: 'Después de jurar, te pide sentarte' },
  // Documentos
  { id: 'proto_5', phrase: 'Can I have your green card and your appointment letter and your driver\'s license?', type: 'document', contextEs: 'Te pide documentos: green card, carta de cita y licencia' },
  { id: 'proto_6', phrase: 'Can I see your passport?', type: 'document', contextEs: 'Te pide mostrar tu pasaporte' },
  { id: 'proto_7', phrase: 'I need to see your identification', type: 'document', contextEs: 'Te pide una identificación' },
  { id: 'proto_8', phrase: 'Can I see your travel documents?', type: 'document', contextEs: 'Te pide documentos de viaje' },
  // Transiciones
  { id: 'proto_9', phrase: 'Okay, let\'s talk about your background', type: 'transition', contextEs: 'Transición: ahora el oficial hablará sobre tu historial' },
  { id: 'proto_10', phrase: 'Now let\'s move on to the reading and writing portions', type: 'transition', contextEs: 'Transición: pasaremos a la prueba de lectura y escritura' },
  { id: 'proto_11', phrase: 'Let\'s go through the civics test to check your knowledge', type: 'transition', contextEs: 'Transición: pasaremos al examen de educación cívica' },
  { id: 'proto_12', phrase: 'Let\'s talk about your travels outside the US', type: 'transition', contextEs: 'Transición: hablaremos de tus viajes fuera de EE.UU.' },
  { id: 'proto_13', phrase: 'Congratulations, you passed your interview today!', type: 'transition', contextEs: '¡Felicidades! El oficial te informa que pasaste' },
];

// ─── DEFINICIONES DE VOCABULARIO DIFÍCIL ────────────────────────

export const n400Definitions: N400Definition[] = [
  {
    id: 'def_1',
    term: 'Oath of Allegiance',
    n400Question: 'Do you understand the full oath of allegiance to the United States?',
    explanation: 'A promise to be loyal to the United States',
    explanationEs: 'Una promesa de ser leal a los Estados Unidos',
    synonyms: ['oath', 'promise', 'loyalty', 'allegiance'],
  },
  {
    id: 'def_2',
    term: 'Constitution',
    n400Question: 'Do you support the Constitution of the United States?',
    explanation: 'The Supreme Law of the Land',
    explanationEs: 'La Ley Suprema del país',
    synonyms: ['supreme law', 'fundamental law'],
  },
  {
    id: 'def_3',
    term: 'Bear Arms',
    n400Question: 'Are you willing to bear arms on behalf of the United States?',
    explanation: 'To carry guns or use weapons and defend the United States',
    explanationEs: 'Portar armas o usar armas y defender a los Estados Unidos',
    synonyms: ['carry weapons', 'use guns', 'defend'],
  },
  {
    id: 'def_4',
    term: 'Non-combatant Services',
    n400Question: 'Are you willing to perform non-combatant services?',
    explanation: 'Services that do not engage in fighting during a war (e.g., translators, doctors, nurses)',
    explanationEs: 'Servicios que no implican pelear en una guerra (traductores, doctores, enfermeras)',
    synonyms: ['non-fighting', 'medical services', 'support services'],
  },
  {
    id: 'def_5',
    term: 'Work of National Importance',
    n400Question: 'Are you willing to perform work of national importance under civilian direction?',
    explanation: 'Tasks that are important to a nation during a crisis (e.g., helping the Red Cross)',
    explanationEs: 'Tareas importantes para el país en una crisis (ej: ayudar a la Cruz Roja)',
    synonyms: ['national service', 'civilian service', 'crisis work'],
  },
  {
    id: 'def_6',
    term: 'Terrorist Organization',
    n400Question: 'Have you ever been a member of a terrorist organization?',
    explanation: 'An organization that uses violence for political or religious purposes',
    explanationEs: 'Una organización que usa violencia con fines políticos o religiosos',
    synonyms: ['terrorist group', 'violent organization'],
  },
  {
    id: 'def_7',
    term: 'Persecuted',
    n400Question: 'Have you ever persecuted any person?',
    explanation: 'To hurt people on purpose',
    explanationEs: 'Lastimar a personas a propósito',
    synonyms: ['torture', 'harm', 'hurt intentionally'],
  },
  {
    id: 'def_8',
    term: 'Crime',
    n400Question: 'Have you ever committed any crime?',
    explanation: 'Against the law or illegal activities',
    explanationEs: 'Actividades contra la ley o ilegales',
    synonyms: ['illegal activity', 'offense', 'law violation'],
  },
  {
    id: 'def_9',
    term: 'Habitual Drunkard',
    n400Question: 'Have you ever been a habitual drunkard?',
    explanation: 'A person who is always drunk or intoxicated',
    explanationEs: 'Una persona que siempre está borracha o intoxicada',
    synonyms: ['chronic alcoholic', 'always intoxicated'],
  },
  {
    id: 'def_10',
    term: 'Overdue',
    n400Question: 'Do you owe any overdue taxes?',
    explanation: 'Being late or behind (related to money/debts)',
    explanationEs: 'Estar atrasado o con deuda (relacionado con dinero)',
    synonyms: ['late', 'past due', 'unpaid', 'in debt'],
  },
  {
    id: 'def_11',
    term: 'Owe',
    n400Question: 'Do you owe any taxes?',
    explanation: 'Not paid or in debt',
    explanationEs: 'No pagado o con deuda',
    synonyms: ['in debt', 'must pay', 'unpaid'],
  },
];

// ─── HELPERS ────────────────────────────────────────────────────

/** Total de preguntas principales */
export const TOTAL_N400_QUESTIONS = n400Categories.reduce(
  (sum, cat) => sum + cat.questions.length, 0
);

/** Total de variaciones */
export const TOTAL_N400_VARIATIONS = n400Categories.reduce(
  (sum, cat) => sum + cat.questions.reduce((s, q) => s + q.variations.length, 0), 0
);

/** Obtener todas las preguntas como array plano */
export function getAllN400Questions(): N400Question[] {
  return n400Categories.flatMap(cat => cat.questions);
}

/** Obtener preguntas de una categoría */
export function getN400QuestionsByCategory(categoryId: string): N400Question[] {
  return n400Categories.find(c => c.id === categoryId)?.questions ?? [];
}

/** Obtener una pregunta + todas sus variaciones como strings */
export function getQuestionWithVariations(questionId: string): string[] {
  for (const cat of n400Categories) {
    for (const q of cat.questions) {
      if (q.id === questionId) {
        return [q.question, ...q.variations];
      }
    }
  }
  return [];
}
