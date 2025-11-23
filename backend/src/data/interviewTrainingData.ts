/**
 * Datos de Entrenamiento para el Asistente Virtual
 * Basado en entrevistas reales de USCIS
 */

export interface QuestionSet {
  question: string;
  variations: string[];
  expectedResponseType: string;
  context: string;
  naturalResponses?: string[]; // Respuestas naturales aceptables
  validationRules?: {
    ignoreCase?: boolean;
    ignorePunctuation?: boolean;
    acceptPartial?: boolean;
    synonyms?: { [key: string]: string[] };
  };
}

export interface CategoryQuestions {
  category: string;
  description: string;
  questions: QuestionSet[];
}

export interface InterviewTrainingData {
  identityVerification: CategoryQuestions;
  n400Address: CategoryQuestions;
  n400Employment: CategoryQuestions;
  n400Family: CategoryQuestions;
  n400Travel: CategoryQuestions;
  n400Legal: CategoryQuestions;
  n400Taxes: CategoryQuestions;
  loyaltyAndOath: CategoryQuestions;
  protocol: {
    swearingIn: string[];
    documentRequests: string[];
    transitions: string[];
  };
  definitions: {
    [key: string]: {
      n400Question: string;
      explanation: string;
      synonyms: string[];
    };
  };
}

export const interviewTrainingData: InterviewTrainingData = {
  identityVerification: {
    category: 'identity_verification',
    description: 'Preguntas de verificación de identidad',
    questions: [
      {
        question: 'What is your full legal name?',
        variations: [
          'Can you tell me your first name?',
          'What\'s your last name?',
          'Please spell your first name',
          'What is your name?',
          'Can you please tell me your current legal name?'
        ],
        expectedResponseType: 'Full name matching identification documents',
        context: 'First question after greeting, used to verify identity',
        naturalResponses: ['My name is [name]', 'I am [name]', '[Name]'],
        validationRules: {
          ignoreCase: true,
          acceptPartial: true
        }
      },
      {
        question: 'What is your date of birth?',
        variations: [
          'Tell me your date of birth',
          'When were you born?',
          'Can you confirm your date of birth for me please?'
        ],
        expectedResponseType: 'Date in American format: Month, Day, Year',
        context: 'Verification of birth date',
        naturalResponses: [
          'June 5th 1998',
          'July 26, 1972',
          'My birthday is [date]',
          'I was born on [date]'
        ],
        validationRules: {
          ignoreCase: true,
          acceptPartial: true
        }
      },
      {
        question: 'What is your current marital status?',
        variations: [
          'Are you married?',
          'Are you married, single, divorced, or widowed?'
        ],
        expectedResponseType: 'Marital status',
        context: 'Current marital status verification',
        naturalResponses: [
          'I am married',
          'I\'m single',
          'I am divorced',
          'I am widowed',
          'I am separated',
          'Married',
          'Single',
          'Divorced',
          'Widowed',
          'Separated',
          'Estoy casado',
          'Casado',
          'Soltero',
          'Divorciado',
          'Viudo',
          'Separado'
        ],
        validationRules: {
          ignoreCase: true,
          synonyms: {
            'married': ['married', 'casado', 'casada', 'marriage'],
            'single': ['single', 'soltero', 'soltera', 'unmarried'],
            'divorced': ['divorced', 'divorciado', 'divorciada'],
            'widowed': ['widowed', 'viudo', 'viuda'],
            'separated': ['separated', 'separado', 'separada']
          }
        }
      },
      {
        question: 'Where were you born?',
        variations: [
          'In what city were you born?',
          'What is your country of citizenship or nationality?'
        ],
        expectedResponseType: 'Country or city/country',
        context: 'Place of birth verification',
        validationRules: {
          ignoreCase: true,
          acceptPartial: true
        }
      },
      {
        question: 'What are the last four digits of your Social Security number?',
        variations: [
          'What is your social security number?',
          'Can you tell me your Social Security number?'
        ],
        expectedResponseType: 'Four digits or full SSN',
        context: 'Additional identity verification',
        validationRules: {
          ignorePunctuation: true
        }
      },
      {
        question: 'How are you eligible for naturalization?',
        variations: [
          'Why are you eligible to become a U.S citizen?',
          'How did you become a permanent resident?'
        ],
        expectedResponseType: 'Eligibility statement (e.g., LPR for 5+ years)',
        context: 'General eligibility question, often at the beginning',
        naturalResponses: [
          'I\'ve been a permanent resident for five years',
          'LPR for more than 5 years',
          'Through my job',
          'My wife petitioned me'
        ]
      }
    ]
  },

  n400Address: {
    category: 'n400_address',
    description: 'Preguntas sobre direcciones',
    questions: [
      {
        question: 'What is your current physical address?',
        variations: [
          'What is your current address?',
          'Where do you currently live?',
          'What is your current residential address?'
        ],
        expectedResponseType: 'Complete address (street, city, state, ZIP)',
        context: 'After identity verification, reviewing N-400 form data',
        naturalResponses: [
          'My address is [address]',
          'I live at [address]',
          '[address]'
        ],
        validationRules: {
          ignoreCase: true,
          ignorePunctuation: true,
          acceptPartial: true,
          synonyms: {
            'street': ['st', 'street', 'ave', 'avenue', 'rd', 'road', 'dr', 'drive'],
            'california': ['ca', 'california'],
            'los angeles': ['la', 'los angeles', 'los angeles california']
          }
        }
      },
      {
        question: 'How long have you been living at this address?',
        variations: [
          'How long have you lived at this address?',
          'How long have you lived at your current address?'
        ],
        expectedResponseType: 'Time period (e.g., 7 years, since Nov 2022)',
        context: 'Duration of residence at current address',
        naturalResponses: [
          '7 years',
          'Since November 2022',
          'I\'ve been living there for [time]'
        ],
        validationRules: {
          ignoreCase: true,
          acceptPartial: true
        }
      },
      {
        question: 'Where did you live before?',
        variations: [
          'Where did you live before moving to your current address?',
          'Where did you live prior to that address?',
          'What is your previous address?'
        ],
        expectedResponseType: 'Previous address',
        context: 'Residence history, asking for address before current',
        validationRules: {
          ignoreCase: true,
          ignorePunctuation: true,
          acceptPartial: true
        }
      },
      {
        question: 'Have you lived anywhere else during the last 5 years?',
        variations: [],
        expectedResponseType: 'Yes/No',
        context: 'Comprehensive verification of residence history for last 5 years',
        naturalResponses: ['Yes', 'No', 'Yes I have', 'No I have not']
      }
    ]
  },

  n400Employment: {
    category: 'n400_employment',
    description: 'Preguntas sobre empleo',
    questions: [
      {
        question: 'Are you currently working?',
        variations: [
          'What is your current employment status?',
          'Where do you work?',
          'Are you currently employed?'
        ],
        expectedResponseType: 'Yes/No or Status (employed, unemployed, self-employed, retired)',
        context: 'Current employment status',
        naturalResponses: [
          'Yes',
          'No',
          'Yes I am',
          'I am employed',
          'I\'m unemployed',
          'I\'m retired'
        ],
        validationRules: {
          ignoreCase: true,
          synonyms: {
            'employed': ['employed', 'working', 'trabajo'],
            'unemployed': ['unemployed', 'not working', 'no trabajo'],
            'retired': ['retired', 'retirado']
          }
        }
      },
      {
        question: 'What is your employer\'s name?',
        variations: [
          'Who is your employer?',
          'What is the name of the place where you work?',
          'Where do you work?'
        ],
        expectedResponseType: 'Company/employer name',
        context: 'Identification of current employer',
        validationRules: {
          ignoreCase: true,
          acceptPartial: true
        }
      },
      {
        question: 'What do you do there?',
        variations: [
          'What is your occupation?',
          'What is your job?'
        ],
        expectedResponseType: 'Job title (e.g., project manager, teacher)',
        context: 'Job title or description of responsibilities',
        naturalResponses: [
          'I am a [job]',
          'I work as a [job]',
          'I\'m a [job]'
        ],
        validationRules: {
          ignoreCase: true,
          acceptPartial: true
        }
      },
      {
        question: 'How long have you been working there?',
        variations: [
          'How many years have you been at your current job?',
          'When did you start working at your current job?'
        ],
        expectedResponseType: 'Time period (e.g., since March 2019, five years)',
        context: 'Duration of current employment',
        naturalResponses: [
          'Since March 2019',
          'Five years',
          'I\'ve been working there for [time]'
        ],
        validationRules: {
          ignoreCase: true,
          acceptPartial: true
        }
      }
    ]
  },

  n400Family: {
    category: 'n400_family',
    description: 'Preguntas sobre familia',
    questions: [
      {
        question: 'Are you married?',
        variations: [
          'What is your current marital status?',
          'Are you married, single, divorced, or widowed?'
        ],
        expectedResponseType: 'Yes/No or Status (Married, Unmarried, Divorced, etc.)',
        context: 'Current marital status',
        naturalResponses: [
          'Yes I am',
          'No I\'m not',
          'I am married',
          'I\'m single',
          'I am divorced',
          'I am widowed',
          'Estoy casado',
          'Soy soltero'
        ],
        validationRules: {
          ignoreCase: true,
          synonyms: {
            'yes': ['yes', 'si', 'sí', 'married', 'casado'],
            'no': ['no', 'single', 'soltero', 'unmarried']
          }
        }
      },
      {
        question: 'What is the current legal name of your spouse?',
        variations: [
          'What is the full name of your spouse?',
          'What is your spouse\'s full legal name?',
          'What is your husband\'s full name?',
          'What is your wife\'s full name?'
        ],
        expectedResponseType: 'Full name',
        context: 'Identity of current spouse',
        validationRules: {
          ignoreCase: true,
          acceptPartial: true
        }
      },
      {
        question: 'What is the date of birth of your spouse?',
        variations: [],
        expectedResponseType: 'Date of birth',
        context: 'Spouse information',
        validationRules: {
          ignoreCase: true,
          acceptPartial: true
        }
      },
      {
        question: 'How many children do you have?',
        variations: [
          'Do you have any children?',
          'Do you and your spouse have any children?'
        ],
        expectedResponseType: 'Number (including biological, stepchildren, and adopted)',
        context: 'Number of children',
        naturalResponses: [
          'I have [number] children',
          '[number]',
          'I have [number] kids'
        ],
        validationRules: {
          ignoreCase: true
        }
      },
      {
        question: 'What are your children\'s names?',
        variations: [
          'What are the ages and the names of your children?'
        ],
        expectedResponseType: 'Names',
        context: 'Identification of children',
        validationRules: {
          ignoreCase: true,
          acceptPartial: true
        }
      }
    ]
  },

  n400Travel: {
    category: 'n400_travel',
    description: 'Preguntas sobre viajes',
    questions: [
      {
        question: 'How many total trips have you taken outside the US?',
        variations: [
          'How many times have you traveled outside of the United States in the last 5 years?',
          'How many trips have you made outside of the United States in the last 5 years?',
          'How many total trips did you take outside of the U.S during the last five years?'
        ],
        expectedResponseType: 'Number',
        context: 'Frequency of trips outside US in last 5 years',
        naturalResponses: [
          'I took [number] trips',
          '[number] trips',
          '[number]'
        ],
        validationRules: {
          ignoreCase: true
        }
      },
      {
        question: 'How many total days have you spent outside the US in the past 5 years?',
        variations: [
          'What are the total amount of days you have spent outside of the United States in The Last 5 Years?'
        ],
        expectedResponseType: 'Number of days',
        context: 'Physical Presence calculation',
        naturalResponses: [
          '[number] days',
          'I spent [number] days',
          '[number]'
        ],
        validationRules: {
          ignoreCase: true
        }
      },
      {
        question: 'Tell me when and where your last trip was',
        variations: [
          'What is the last date that you traveled out of the United States?',
          'What are the dates of your most recent trip and where was that?'
        ],
        expectedResponseType: 'Date and place',
        context: 'Details of most recent trip (departure date and destination)',
        validationRules: {
          ignoreCase: true,
          acceptPartial: true
        }
      },
      {
        question: 'What was the purpose of your last trip?',
        variations: [
          'What was the purpose of your trip?',
          'Why did you travel to [Country]?'
        ],
        expectedResponseType: 'Explanation (e.g., vacation, business)',
        context: 'Reason for traveling outside US',
        naturalResponses: [
          'To visit my family',
          'For work',
          'On vacation',
          'Vacation',
          'Business',
          'Visit family'
        ],
        validationRules: {
          ignoreCase: true,
          acceptPartial: true,
          synonyms: {
            'vacation': ['vacation', 'vacaciones', 'holiday', 'trip'],
            'business': ['business', 'work', 'trabajo'],
            'family': ['family', 'familia', 'visit family', 'visiting family']
          }
        }
      },
      {
        question: 'Did any of your trips last 6 months or longer?',
        variations: [],
        expectedResponseType: 'Yes/No',
        context: 'Continuity of Residence check',
        naturalResponses: ['Yes', 'No', 'Yes they did', 'No they did not']
      }
    ]
  },

  n400Legal: {
    category: 'n400_legal',
    description: 'Preguntas legales y de carácter moral',
    questions: [
      {
        question: 'Have you ever been arrested, cited, detained or confined by any law enforcement officer?',
        variations: [
          'Have you ever been arrested by any law enforcement officer?',
          'Have you ever been arrested, cited, or detained by any law enforcement officer for any reason?'
        ],
        expectedResponseType: 'No (if yes, must provide details)',
        context: 'Law enforcement/detention history (Part 12)',
        naturalResponses: [
          'No',
          'No I have not',
          'No never',
          'No sir'
        ]
      },
      {
        question: 'Have you ever claimed to be a US citizen?',
        variations: [
          'Have you ever claimed to be a US citizen in writing or any other way?'
        ],
        expectedResponseType: 'No',
        context: 'Part 12 question',
        naturalResponses: ['No', 'No I have not', 'Never']
      },
      {
        question: 'Have you ever been a member of a terrorist organization?',
        variations: [],
        expectedResponseType: 'No',
        context: 'Part 12 question',
        naturalResponses: ['No', 'No never', 'Absolutely not']
      },
      {
        question: 'Have you ever persecuted any person because of race, religion, national origin?',
        variations: [],
        expectedResponseType: 'No',
        context: 'Part 12 question',
        naturalResponses: ['No', 'No I have not']
      },
      {
        question: 'If the law requires it, are you willing to perform work of national importance under civilian direction?',
        variations: [],
        expectedResponseType: 'Yes (I am willing to)',
        context: 'Oath/loyalty question (Part 12)',
        naturalResponses: [
          'Yes',
          'Yes I am willing to',
          'Yes I am',
          'I am willing'
        ]
      },
      {
        question: 'Do you support the Constitution and form of government of the United States?',
        variations: [
          'Do you support the Constitution of the United States?'
        ],
        expectedResponseType: 'Yes (I do)',
        context: 'Oath/loyalty question (Part 12)',
        naturalResponses: [
          'Yes',
          'Yes I do',
          'I do',
          'Absolutely yes'
        ]
      }
    ]
  },

  n400Taxes: {
    category: 'n400_taxes',
    description: 'Preguntas sobre impuestos',
    questions: [
      {
        question: 'Do you currently owe any overdue federal, state, or local taxes in the United States?',
        variations: [
          'Do you owe any overdue federal, state, or local taxes?'
        ],
        expectedResponseType: 'No',
        context: 'Tax debts (Part 12)',
        naturalResponses: ['No', 'No I do not', 'I don\'t owe any taxes']
      },
      {
        question: 'Have you ever failed to pay your taxes?',
        variations: [
          'Have you ever failed to pay your taxes?',
          'Have you ever not filed a federal, state, or local tax return since you became a lawful permanent resident?'
        ],
        expectedResponseType: 'No',
        context: 'Tax payment compliance (Part 12). Key question is "ever", not "always"',
        naturalResponses: ['No', 'No never', 'I always pay my taxes']
      },
      {
        question: 'Since you became a lawful permanent resident, have you called yourself a non-resident alien on a federal, state, or local tax return?',
        variations: [
          'Have you called yourself a non-US resident on a federal, state, or local tax return since you became a lawful permanent resident?'
        ],
        expectedResponseType: 'No',
        context: 'Non-resident status for tax purposes since becoming LPR',
        naturalResponses: ['No', 'No I have not']
      }
    ]
  },

  loyaltyAndOath: {
    category: 'loyalty_and_oath',
    description: 'Preguntas sobre lealtad y juramento',
    questions: [
      {
        question: 'Do you support the Constitution and form of government of the United States?',
        variations: [
          'Do you support the Constitution of the United States?'
        ],
        expectedResponseType: 'Yes (I do)',
        context: 'Oath/loyalty question',
        naturalResponses: [
          'Yes',
          'Yes I do',
          'I do support it',
          'Absolutely yes'
        ]
      },
      {
        question: 'Do you understand the full oath of allegiance to the United States?',
        variations: [],
        expectedResponseType: 'Yes (I do)',
        context: 'Oath understanding question',
        naturalResponses: ['Yes', 'Yes I do', 'I understand']
      },
      {
        question: 'Are you willing to take the full Oath of Allegiance to the United States?',
        variations: [],
        expectedResponseType: 'Yes',
        context: 'Willingness to take oath',
        naturalResponses: ['Yes', 'Yes I am willing', 'I am willing']
      },
      {
        question: 'If the law requires it, are you willing to bear arms on behalf of the United States?',
        variations: [],
        expectedResponseType: 'Yes (I\'m willing to)',
        context: 'Military service question',
        naturalResponses: [
          'Yes',
          'Yes I\'m willing to',
          'I am willing'
        ]
      },
      {
        question: 'If the law requires it, are you willing to perform non-combatant services in the U.S armed forces?',
        variations: [],
        expectedResponseType: 'Yes (I\'m willing to)',
        context: 'Non-combatant service question',
        naturalResponses: ['Yes', 'Yes I\'m willing', 'I am willing']
      },
      {
        question: 'If the law requires it, are you willing to perform work of national importance under civilian direction?',
        variations: [],
        expectedResponseType: 'Yes (I\'m willing to)',
        context: 'Civilian work question',
        naturalResponses: ['Yes', 'Yes I\'m willing to', 'I am willing']
      }
    ]
  },

  protocol: {
    swearingIn: [
      'Please remain standing',
      'Please raise your right hand',
      'Do you swear to tell the truth, the whole truth, and nothing but the truth?',
      'Please be seated'
    ],
    documentRequests: [
      'Can I have your green card and your appointment letter and your driver\'s license?',
      'Can I see your passport?',
      'I need to see your [document]',
      'Can I see the [document]?'
    ],
    transitions: [
      'Okay, Let\'s talk about your business',
      'Now let\'s move on to the reading and writing portions',
      'Let\'s go through civics test to check your knowledge',
      'Let\'s talk about your travels outside the US',
      'Now I\'d like to [do something]'
    ]
  },

  definitions: {
    'oath_of_allegiance': {
      n400Question: 'Do you understand the full oath of allegiance to the United States?',
      explanation: 'A promise to be loyal to the United States',
      synonyms: ['oath', 'promise', 'loyalty', 'allegiance']
    },
    'constitution': {
      n400Question: 'Do you support the Constitution of the United States?',
      explanation: 'The Supreme Law of the Land',
      synonyms: ['supreme law', 'fundamental law']
    },
    'bear_arms': {
      n400Question: 'Are you willing to bear arms on behalf of the United States?',
      explanation: 'To carry guns or use weapons and defend the United States',
      synonyms: ['carry weapons', 'use guns', 'defend']
    },
    'non_combatant_services': {
      n400Question: 'Are you willing to perform non-combatant services?',
      explanation: 'Services that do not engage in fighting during a war (e.g., translators, doctors, nurses)',
      synonyms: ['non-fighting', 'medical services', 'support services']
    },
    'work_of_national_importance': {
      n400Question: 'Are you willing to perform work of national importance under civilian direction?',
      explanation: 'Tasks that are important to a nation during a crisis (e.g., helping the Red Cross distribute water during an earthquake)',
      synonyms: ['national service', 'civilian service', 'crisis work']
    },
    'terrorist_organization': {
      n400Question: 'Have you ever been a member of a terrorist organization?',
      explanation: 'An organization that uses violence for political or religious purposes. A bad person or group of people who attack the government or the country',
      synonyms: ['terrorist group', 'violent organization']
    },
    'persecuted': {
      n400Question: 'Have you ever persecuted any person?',
      explanation: 'To hurt people on purpose',
      synonyms: ['torture', 'harm', 'hurt intentionally']
    },
    'crime': {
      n400Question: 'Have you ever committed any crime?',
      explanation: 'Against the law or illegal activities',
      synonyms: ['illegal activity', 'offense', 'law violation']
    },
    'habitual_drunkard': {
      n400Question: 'Have you ever been a habitual drunkard?',
      explanation: 'A person who is always drunk or intoxicated',
      synonyms: ['chronic alcoholic', 'always intoxicated']
    },
    'overdue': {
      n400Question: 'Do you owe any overdue taxes?',
      explanation: 'Being late or behind (related to money/debts)',
      synonyms: ['late', 'past due', 'unpaid', 'in debt']
    },
    'owe': {
      n400Question: 'Do you owe any taxes?',
      explanation: 'Not paid or in debt',
      synonyms: ['in debt', 'must pay', 'unpaid']
    }
  }
};

/**
 * Obtiene todas las preguntas de una categoría específica
 */
export function getQuestionsByCategory(category: string): QuestionSet[] {
  const categoryMap: { [key: string]: CategoryQuestions } = {
    identity_verification: interviewTrainingData.identityVerification,
    n400_address: interviewTrainingData.n400Address,
    n400_employment: interviewTrainingData.n400Employment,
    n400_family: interviewTrainingData.n400Family,
    n400_travel: interviewTrainingData.n400Travel,
    n400_legal: interviewTrainingData.n400Legal,
    n400_taxes: interviewTrainingData.n400Taxes,
    loyalty_and_oath: interviewTrainingData.loyaltyAndOath
  };

  return categoryMap[category]?.questions || [];
}

/**
 * Busca una pregunta por texto (buscando en pregunta y variaciones)
 */
export function findQuestionByText(text: string): QuestionSet | null {
  const allCategories = [
    interviewTrainingData.identityVerification,
    interviewTrainingData.n400Address,
    interviewTrainingData.n400Employment,
    interviewTrainingData.n400Family,
    interviewTrainingData.n400Travel,
    interviewTrainingData.n400Legal,
    interviewTrainingData.n400Taxes,
    interviewTrainingData.loyaltyAndOath
  ];

  const lowerText = text.toLowerCase();

  for (const category of allCategories) {
    for (const question of category.questions) {
      if (question.question.toLowerCase().includes(lowerText) ||
          question.variations.some(v => v.toLowerCase().includes(lowerText))) {
        return question;
      }
    }
  }

  return null;
}

