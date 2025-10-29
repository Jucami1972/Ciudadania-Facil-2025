// src/data/practiceQuestions.tsx
// Preguntas de práctica basadas en el examen oficial de ciudadanía 2025 (128 preguntas)
// Extraídas directamente del archivo questions.tsx

export interface PracticeQuestion {
  id: number;
  question: string;
  answer: string;
  category: 'government' | 'history' | 'symbols_holidays';
  difficulty: 'easy' | 'medium' | 'hard';
  requiredQuantity?: number; // Cantidad de elementos requeridos (1, 2, 3, etc.)
  questionType?: 'single' | 'multiple' | 'choice'; // Tipo de pregunta
}

export const practiceQuestions: PracticeQuestion[] = [
  // --- AMERICAN GOVERNMENT (GOBIERNO AMERICANO) ---
  // A: Principles of American Government (Principios del Gobierno Americano)
  {
    id: 1,
    question: "What is the form of government of the United States?",
    answer: "Republic, Constitution-based federal republic, Representative democracy",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 2,
    question: "What is the supreme law of the land?",
    answer: "U.S. Constitution",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 3,
    question: "Name one thing the U.S. Constitution does.",
    answer: "Forms the government, Defines powers of government, Defines the parts of government, Protects the rights of the people",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 4,
    question: "The U.S. Constitution starts with the words 'We the People.' What does 'We the People' mean?",
    answer: "Self-government, Popular sovereignty, Consent of the governed, People should govern themselves, Social contract",
    category: "government",
    difficulty: "medium"
  },
  {
    id: 5,
    question: "How are changes made to the U.S. Constitution?",
    answer: "Amendments, The amendment process",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 6,
    question: "What does the Bill of Rights protect?",
    answer: "The basic rights of Americans, The basic rights of people living in the United States",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 7,
    question: "How many amendments does the U.S. Constitution have?",
    answer: "Twenty-seven",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 8,
    question: "Why is the Declaration of Independence important?",
    answer: "It says America is free from British control, It says all people are created equal, It identifies inherent rights, It identifies individual freedoms",
    category: "government",
    difficulty: "medium"
  },
  {
    id: 9,
    question: "What founding document said the American colonies were free from Britain?",
    answer: "Declaration of Independence",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 10,
    question: "Name two important ideas from the Declaration of Independence and the U.S. Constitution.",
    answer: "Equality, Liberty, Social contract, Natural rights, Limited government, Self-government",
    category: "government",
    difficulty: "medium",
    requiredQuantity: 2
  },
  {
    id: 11,
    question: "The words 'Life, Liberty, and the pursuit of Happiness' are in what founding document?",
    answer: "Declaration of Independence",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 12,
    question: "What is the economic system of the United States?",
    answer: "Capitalism, Free market economy",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 13,
    question: "What is the rule of law?",
    answer: "Everyone must follow the law, Leaders must obey the law, Government must obey the law, No one is above the law",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 14,
    question: "Many documents influenced the U.S. Constitution. Name one.",
    answer: "Declaration of Independence, Articles of Confederation, Federalist Papers, Anti-Federalist Papers, Virginia Declaration of Rights, Fundamental Orders of Connecticut, Mayflower Compact, Iroquois Great Law of Peace",
    category: "government",
    difficulty: "medium"
  },
  {
    id: 15,
    question: "There are three branches of government. Why?",
    answer: "So one part does not become too powerful, Checks and balances, Separation of powers",
    category: "government",
    difficulty: "easy"
  },

  // B: System of Government (Sistema de Gobierno)
  {
    id: 16,
    question: "Name the three branches of government.",
    answer: "Legislative executive and judicial, Congress president and the courts",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 17,
    question: "The President of the United States is in charge of which branch of government?",
    answer: "Executive branch",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 18,
    question: "What part of the federal government writes laws?",
    answer: "U.S. Congress, U.S. or national legislature, Legislative branch",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 19,
    question: "What are the two parts of the U.S. Congress?",
    answer: "Senate and House of Representatives",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 20,
    question: "Name one power of the U.S. Congress.",
    answer: "Writes laws, Declares war, Makes the federal budget",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 21,
    question: "How many U.S. senators are there?",
    answer: "One hundred",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 22,
    question: "How long is a term for a U.S. senator?",
    answer: "Six years",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 23,
    question: "Who is one of your state's U.S. senators now?",
    answer: "Answers will vary. District of Columbia residents and residents of U.S. territories should answer that D.C. or the territory where the applicant lives has no U.S. senators.",
    category: "government",
    difficulty: "medium"
  },
  {
    id: 24,
    question: "How many voting members are in the House of Representatives?",
    answer: "Four hundred thirty-five",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 25,
    question: "How long is a term for a member of the House of Representatives?",
    answer: "Two years",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 26,
    question: "Why do U.S. representatives serve shorter terms than U.S. senators?",
    answer: "To more closely follow public opinion",
    category: "government",
    difficulty: "medium"
  },
  {
    id: 27,
    question: "How many senators does each state have?",
    answer: "Two",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 28,
    question: "Why does each state have two senators?",
    answer: "Equal representation for small states, The Great Compromise Connecticut Compromise",
    category: "government",
    difficulty: "medium"
  },
  {
    id: 29,
    question: "Name your U.S. representative.",
    answer: "Answers will vary. Residents of territories with nonvoting Delegates or Resident Commissioners may provide the name of that Delegate or Commissioner. Also acceptable is any statement that the territory has no voting representatives in Congress.",
    category: "government",
    difficulty: "medium"
  },
  {
    id: 30,
    question: "What is the name of the Speaker of the House of Representatives now?",
    answer: "Visit uscis.gov/citizenship/testupdates for the name of the Speaker of the House of Representatives.",
    category: "government",
    difficulty: "medium"
  },
  {
    id: 31,
    question: "Who does a U.S. senator represent?",
    answer: "Citizens of their state, People of their state",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 32,
    question: "Who elects U.S. senators?",
    answer: "Citizens from their state",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 33,
    question: "Who does a member of the House of Representatives represent?",
    answer: "Citizens in their congressional district, People from their congressional district",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 34,
    question: "Who elects members of the House of Representatives?",
    answer: "Citizens from their congressional district",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 35,
    question: "Some states have more representatives than other states. Why?",
    answer: "Because of the state's population, Because they have more people",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 36,
    question: "The President of the United States is elected for how many years?",
    answer: "Four years",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 37,
    question: "The President of the United States can serve only two terms. Why?",
    answer: "Because of the 22nd Amendment, To keep the president from becoming too powerful",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 38,
    question: "What is the name of the President of the United States now?",
    answer: "Donald J. Trump",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 39,
    question: "What is the name of the Vice President of the United States now?",
    answer: "J. D. Vance",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 40,
    question: "If the president can no longer serve, who becomes president?",
    answer: "The Vice President of the United States",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 41,
    question: "Name one power of the president.",
    answer: "Signs bills into law, Vetoes bills, Enforces laws, Commander in Chief of the military, Chief diplomat, Appoints federal judges",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 42,
    question: "Who is Commander in Chief of the U.S. military?",
    answer: "The President of the United States",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 43,
    question: "Who signs bills to become laws?",
    answer: "The President of the United States",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 44,
    question: "Who vetoes bills?",
    answer: "The President of the United States",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 45,
    question: "Who appoints federal judges?",
    answer: "The President of the United States",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 46,
    question: "The executive branch has many parts. Name one.",
    answer: "President of the United States, Cabinet, Federal departments and agencies",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 47,
    question: "What does the President's Cabinet do?",
    answer: "Advises the President of the United States",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 48,
    question: "What are two Cabinet-level positions?",
    answer: "Vice-President, Secretary of State",
    category: "government",
    difficulty: "easy",
    requiredQuantity: 2
  },
  {
    id: 49,
    question: "Why is the Electoral College important?",
    answer: "It decides who is elected president, It provides a compromise between the popular election of the president and congressional selection",
    category: "government",
    difficulty: "medium"
  },
  {
    id: 50,
    question: "What is one part of the judicial branch?",
    answer: "Supreme Court, Federal Courts",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 51,
    question: "What does the judicial branch do?",
    answer: "Reviews laws, Explains laws, Resolves disputes about the law, Decides if a law goes against the U.S. Constitution",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 52,
    question: "What is the highest court in the United States?",
    answer: "Supreme Court",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 53,
    question: "How many seats are on the Supreme Court?",
    answer: "Nine",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 54,
    question: "How many Supreme Court justices are usually needed to decide a case?",
    answer: "Five",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 55,
    question: "How long do Supreme Court justices serve?",
    answer: "For life, Lifetime appointment, Until retirement",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 56,
    question: "Supreme Court justices serve for life. Why?",
    answer: "To be independent of politics, To limit outside political influence",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 57,
    question: "Who is the Chief Justice of the United States now?",
    answer: "John G. Roberts Jr.",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 58,
    question: "Name one power that is only for the federal government.",
    answer: "Print paper money, Mint coins, Declare war, Create an army, Make treaties, Set foreign policy",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 59,
    question: "Name one power that is only for the states.",
    answer: "Provide schooling and education, Provide protection police, Provide safety fire departments, Give a driver's license, Approve zoning and land use",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 60,
    question: "What is the purpose of the 10th Amendment?",
    answer: "It states that the powers not given to the federal government belong to the states or to the people",
    category: "government",
    difficulty: "medium"
  },
  {
    id: 61,
    question: "Who is the governor of your state now?",
    answer: "Answers will vary. District of Columbia residents should answer that D.C. does not have a governor.",
    category: "government",
    difficulty: "medium"
  },
  {
    id: 62,
    question: "What is the capital of your state?",
    answer: "Answers will vary. District of Columbia residents should answer that D.C. is not a state and does not have a capital. Residents of U.S. territories should name the capital of the territory.",
    category: "government",
    difficulty: "medium"
  },

  // C: Rights and Responsibilities (Derechos y Responsabilidades)
  {
    id: 63,
    question: "There are four amendments to the U.S. Constitution about who can vote. Describe one of them.",
    answer: "Citizens eighteen and older can vote, You don't have to pay a poll tax to vote, Any citizen can vote. Women and men can vote, A male citizen of any race can vote",
    category: "government",
    difficulty: "medium"
  },
  {
    id: 64,
    question: "Who can vote in federal elections, run for federal office, and serve on a jury in the United States?",
    answer: "Citizens, Citizens of the United States, U.S. citizens",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 65,
    question: "What are three rights of everyone living in the United States?",
    answer: "Freedom of expression, Freedom of speech, Freedom of assembly, Freedom to petition the government, Freedom of religion, The right to bear arms",
    category: "government",
    difficulty: "easy",
    requiredQuantity: 3
  },
  {
    id: 66,
    question: "What do we show loyalty to when we say the Pledge of Allegiance?",
    answer: "The United States, The flag",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 67,
    question: "Name two promises that new citizens make in the Oath of Allegiance.",
    answer: "Give up loyalty to other countries, Defend the U.S. Constitution, Obey the laws of the United States, Serve in the military if needed, Serve the nation if needed, Be loyal to the United States",
    category: "government",
    difficulty: "easy",
    requiredQuantity: 2
  },
  {
    id: 68,
    question: "How can people become United States citizens?",
    answer: "Be born in the United States under the conditions set by the 14th Amendment, Naturalize, Derive citizenship under conditions set by Congress",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 69,
    question: "What are two examples of civic participation in the United States?",
    answer: "Vote, Run for office, Join a political party, Help with a campaign, Join a civic group, Join a community group, Give an elected official your opinion on an issue, Contact elected officials, Support or oppose an issue or policy, Write to a newspaper",
    category: "government",
    difficulty: "easy",
    requiredQuantity: 2
  },
  {
    id: 70,
    question: "What is one way Americans can serve their country?",
    answer: "Vote, Pay taxes, Obey the law, Serve in the military, Run for office, Work for local state or federal government",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 71,
    question: "Why is it important to pay federal taxes?",
    answer: "Required by law, All people pay to fund the federal government, Required by the U.S. Constitution 16th Amendment, Civic duty",
    category: "government",
    difficulty: "easy"
  },
  {
    id: 72,
    question: "It is important for all men age 18 through 25 to register for the Selective Service. Name one reason why.",
    answer: "Required by law, Civic duty, Makes the draft fair if needed",
    category: "government",
    difficulty: "easy"
  },

  // --- AMERICAN HISTORY (HISTORIA AMERICANA) ---
  // A: Colonial Period and Independence (Período Colonial e Independencia)
  {
    id: 73,
    question: "The colonists came to America for many reasons. Name one.",
    answer: "Freedom, Political liberty, Religious freedom, Economic opportunity, Escape persecution",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 74,
    question: "Who lived in America before the Europeans arrived?",
    answer: "American Indians, Native Americans",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 75,
    question: "What group of people was taken and sold as slaves?",
    answer: "Africans, People from Africa",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 76,
    question: "What war did the Americans fight to win independence from Britain?",
    answer: "American Revolution, The American Revolutionary War, War for American Independence",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 77,
    question: "Name one reason why the Americans declared independence from Britain.",
    answer: "High taxes, Taxation without representation, British soldiers stayed in Americans' houses boarding quartering, They did not have self-government, Boston Massacre, Boston Tea Party Tea Act, Stamp Act",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 78,
    question: "Who wrote the Declaration of Independence?",
    answer: "Thomas Jefferson",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 79,
    question: "When was the Declaration of Independence adopted?",
    answer: "July 4 1776",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 80,
    question: "The American Revolution had many important events. Name one.",
    answer: "Battle of Bunker Hill, Declaration of Independence, Washington Crossing the Delaware Battle of Trenton, Battle of Saratoga, Valley Forge Encampment, Battle of Yorktown British surrender at Yorktown",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 81,
    question: "There were 13 original states. Name five.",
    answer: "New Hampshire, Massachusetts, Rhode Island, Connecticut, New York, New Jersey, Pennsylvania, Delaware, Maryland, Virginia, North Carolina, South Carolina, Georgia",
    category: "history",
    difficulty: "medium",
    requiredQuantity: 5
  },
  {
    id: 82,
    question: "What founding document was written in 1787?",
    answer: "U.S. Constitution",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 83,
    question: "The Federalist Papers supported the passage of the U.S. Constitution. Name one of the writers.",
    answer: "James Madison, Alexander Hamilton, John Jay, Publius",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 84,
    question: "Why were the Federalist Papers important?",
    answer: "They helped people understand the U.S. Constitution, They supported passing the U.S. Constitution",
    category: "history",
    difficulty: "medium"
  },
  {
    id: 85,
    question: "Benjamin Franklin is famous for many things. Name one.",
    answer: "Founded the first free public libraries, First Postmaster General of the United States, Helped write the Declaration of Independence, Inventor, U.S. diplomat",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 86,
    question: "George Washington is famous for many things. Name one.",
    answer: "Father of Our Country, First president of the United States, General of the Continental Army, President of the Constitutional Convention",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 87,
    question: "Thomas Jefferson is famous for many things. Name one.",
    answer: "Writer of the Declaration of Independence, Third president of the United States, Doubled the size of the United States Louisiana Purchase, First Secretary of State, Founded the University of Virginia",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 88,
    question: "James Madison is famous for many things. Name one.",
    answer: "Father of the Constitution, Fourth president of the United States, President during the War of 1812, One of the writers of the Federalist Papers",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 89,
    question: "Alexander Hamilton is famous for many things. Name one.",
    answer: "First Secretary of the Treasury, One of the writers of the Federalist Papers, Helped establish the First Bank of the United States, Aide to General George Washington",
    category: "history",
    difficulty: "easy"
  },

  // B: 1800s
  {
    id: 90,
    question: "What territory did the United States buy from France in 1803?",
    answer: "Louisiana Territory, Louisiana",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 91,
    question: "Name one war fought by the United States in the 1800s.",
    answer: "War of 1812, Mexican-American War, Civil War, Spanish-American War",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 92,
    question: "Name the U.S. war between the North and the South.",
    answer: "The Civil War",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 93,
    question: "The Civil War had many important events. Name one.",
    answer: "Battle of Fort Sumter, Emancipation Proclamation, Battle of Vicksburg, Battle of Gettysburg, Sherman's March, Surrender at Appomattox, Battle of Antietam Sharpsburg",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 94,
    question: "Abraham Lincoln is famous for many things. Name one.",
    answer: "Freed the slaves Emancipation Proclamation, Saved or preserved the Union, Led the United States during the Civil War, 16th president of the United States, Delivered the Gettysburg Address",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 95,
    question: "What did the Emancipation Proclamation do?",
    answer: "Freed the slaves, Freed slaves in the Confederacy, Freed slaves in the Confederate states, Freed slaves in most Southern states",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 96,
    question: "What U.S. war ended slavery?",
    answer: "The Civil War",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 97,
    question: "What amendment says all persons born or naturalized in the United States, and subject to the jurisdiction thereof, are U.S. citizens?",
    answer: "14th Amendment",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 98,
    question: "When did all men get the right to vote?",
    answer: "After the Civil War, During Reconstruction, With the 15th Amendment, 1870",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 99,
    question: "Name one leader of the women's rights movement in the 1800s.",
    answer: "Susan B. Anthony, Elizabeth Cady Stanton, Sojourner Truth, Harriet Tubman, Lucretia Mott, Lucy Stone",
    category: "history",
    difficulty: "easy"
  },

  // C: Recent American History and Other Important Historical Information (Historia Americana Reciente y Otra Información Histórica Importante)
  {
    id: 100,
    question: "Name one war fought by the United States in the 1900s.",
    answer: "World War I, World War II, Korean War, Vietnam War, Persian Gulf War",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 101,
    question: "Why did the United States enter World War I?",
    answer: "Because Germany attacked U.S. civilian ships, To support the Allied Powers England France Italy and Russia, To oppose the Central Powers Germany Austria-Hungary the Ottoman Empire and Bulgaria",
    category: "history",
    difficulty: "medium"
  },
  {
    id: 102,
    question: "When did all women get the right to vote?",
    answer: "1920, After World War I, With the 19th Amendment",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 103,
    question: "What was the Great Depression?",
    answer: "Longest economic recession in modern history",
    category: "history",
    difficulty: "medium"
  },
  {
    id: 104,
    question: "When did the Great Depression start?",
    answer: "The Great Crash 1929, Stock market crash of 1929",
    category: "history",
    difficulty: "medium"
  },
  {
    id: 105,
    question: "Who was president during the Great Depression and World War II?",
    answer: "Franklin Roosevelt",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 106,
    question: "Why did the United States enter World War II?",
    answer: "Bombing of Pearl Harbor, Japanese attacked Pearl Harbor, To support the Allied Powers England France and Russia, To oppose the Axis Powers Germany Italy and Japan",
    category: "history",
    difficulty: "medium"
  },
  {
    id: 107,
    question: "Dwight Eisenhower is famous for many things. Name one.",
    answer: "General during World War II, President at the end of during the Korean War, 34th president of the United States, Signed the Federal-Aid Highway Act of 1956 Created the Interstate System",
    category: "history",
    difficulty: "medium"
  },
  {
    id: 108,
    question: "Who was the United States' main rival during the Cold War?",
    answer: "Soviet Union, USSR, Russia",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 109,
    question: "During the Cold War, what was one main concern of the United States?",
    answer: "Communism, Nuclear war",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 110,
    question: "Why did the United States enter the Korean War?",
    answer: "To stop the spread of communism",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 111,
    question: "Why did the United States enter the Vietnam War?",
    answer: "To stop the spread of communism",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 112,
    question: "What did the civil rights movement do?",
    answer: "Fought to end racial discrimination",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 113,
    question: "Martin Luther King Jr. is famous for many things. Name one.",
    answer: "Fought for civil rights, Worked for equality for all Americans, Worked to ensure that people would not be judged by the color of their skin but by the content of their character",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 114,
    question: "Why did the United States enter the Persian Gulf War?",
    answer: "To force the Iraqi military from Kuwait",
    category: "history",
    difficulty: "medium"
  },
  {
    id: 115,
    question: "What major event happened on September 11 2001 in the United States?",
    answer: "Terrorists attacked the United States, Terrorists took over two planes and crashed them into the World Trade Center in New York City, Terrorists took over a plane and crashed into the Pentagon in Arlington Virginia",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 116,
    question: "Name one U.S. military conflict after the September 11 2001 attacks.",
    answer: "Global War on Terror, War in Afghanistan, War in Iraq",
    category: "history",
    difficulty: "easy"
  },
  {
    id: 117,
    question: "Name one American Indian tribe in the United States.",
    answer: "Apache, Blackfeet, Cayuga, Cherokee, Cheyenne, Chippewa, Choctaw, Creek, Crow, Hopi, Huron, Inupiat, Lakota, Mohawk, Navajo, Oneida, Onondaga, Pueblo, Seminole, Seneca, Shawnee, Sioux, Teton, Tuscarora",
    category: "history",
    difficulty: "medium"
  },
  {
    id: 118,
    question: "Name one example of an American innovation.",
    answer: "Light bulb, Automobile cars internal combustion engine, Skyscrapers, Airplane, Assembly line, Landing on the moon, Integrated circuit IC",
    category: "history",
    difficulty: "easy"
  },

  // --- SYMBOLS AND HOLIDAYS (SÍMBOLOS Y DÍAS FESTIVOS) ---
  // A: Symbols (Símbolos)
  {
    id: 119,
    question: "What is the capital of the United States?",
    answer: "Washington D.C.",
    category: "symbols_holidays",
    difficulty: "easy"
  },
  {
    id: 120,
    question: "Where is the Statue of Liberty?",
    answer: "New York Harbor, Liberty Island",
    category: "symbols_holidays",
    difficulty: "easy"
  },
  {
    id: 121,
    question: "Why does the flag have 13 stripes?",
    answer: "Because there were 13 original colonies, Because the stripes represent the original colonies",
    category: "symbols_holidays",
    difficulty: "easy"
  },
  {
    id: 122,
    question: "Why does the flag have 50 stars?",
    answer: "Because there is one star for each state, Because each star represents a state, Because there are 50 states",
    category: "symbols_holidays",
    difficulty: "easy"
  },
  {
    id: 123,
    question: "What is the name of the national anthem?",
    answer: "The Star-Spangled Banner",
    category: "symbols_holidays",
    difficulty: "easy"
  },
  {
    id: 124,
    question: "The Nation's first motto was 'E Pluribus Unum.' What does that mean?",
    answer: "Out of many one, We all become one",
    category: "symbols_holidays",
    difficulty: "medium"
  },

  // B: Holidays (Días Festivos)
  {
    id: 125,
    question: "What is Independence Day?",
    answer: "A holiday to celebrate U.S. independence from Britain, The country's birthday",
    category: "symbols_holidays",
    difficulty: "easy"
  },
  {
    id: 126,
    question: "Name three national U.S. holidays.",
    answer: "New Year's Day, Martin Luther King Jr. Day, Presidents Day Washington's Birthday, Memorial Day, Juneteenth, Independence Day, Labor Day, Columbus Day, Veterans Day, Thanksgiving Day, Christmas Day",
    category: "symbols_holidays",
    difficulty: "medium",
    requiredQuantity: 3
  },
  {
    id: 127,
    question: "What is Memorial Day?",
    answer: "A holiday to honor soldiers who died in military service",
    category: "symbols_holidays",
    difficulty: "easy"
  },
  {
    id: 128,
    question: "What is Veterans Day?",
    answer: "A holiday to honor people in the U.S. military, A holiday to honor people who have served in the U.S. military",
    category: "symbols_holidays",
    difficulty: "easy"
  }
];

// Función para obtener preguntas por categoría
export const getQuestionsByCategory = (category: 'government' | 'history' | 'symbols_holidays'): PracticeQuestion[] => {
  return getProcessedQuestions().filter(q => q.category === category);
};

// Función para obtener preguntas aleatorias por categoría
export const getRandomQuestionsByCategory = (category: 'government' | 'history' | 'symbols_holidays', count: number): PracticeQuestion[] => {
  const categoryQuestions = getQuestionsByCategory(category);
  const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// Función para detectar automáticamente la cantidad requerida en una pregunta
export const detectRequiredQuantity = (question: string): number => {
  const lowerQuestion = question.toLowerCase();
  
  // Detectar preguntas que piden múltiples elementos
  if (lowerQuestion.includes('name three') || lowerQuestion.includes('three words')) {
    return 3;
  }
  
  if (lowerQuestion.includes('name two') || lowerQuestion.includes('two rights') || 
      lowerQuestion.includes('two parts') || lowerQuestion.includes('two cabinet') ||
      lowerQuestion.includes('two major') || lowerQuestion.includes('two national')) {
    return 2;
  }
  
  if (lowerQuestion.includes('name five')) {
    return 5;
  }
  
  // Por defecto, 1 elemento
  return 1;
};

// Función para detectar el tipo de pregunta basado en el texto
export const detectQuestionType = (question: string): 'single' | 'multiple' | 'choice' => {
  const questionLower = question.toLowerCase();
  
  // Preguntas que requieren múltiples respuestas
  if (questionLower.includes('name two') || 
      questionLower.includes('name three') || 
      questionLower.includes('name five') ||
      questionLower.includes('what are two') ||
      questionLower.includes('what are three') ||
      questionLower.includes('list two') ||
      questionLower.includes('list three') ||
      questionLower.includes('give two') ||
      questionLower.includes('give three')) {
    return 'multiple';
  }
  
  // Preguntas de opción única
  if (questionLower.includes('what is') || 
      questionLower.includes('who is') || 
      questionLower.includes('when was') ||
      questionLower.includes('where is') ||
      questionLower.includes('how many') ||
      questionLower.includes('which') ||
      questionLower.includes('what does') ||
      questionLower.includes('what did')) {
    return 'single';
  }
  
  // Preguntas de elección
  if (questionLower.includes('one of') || 
      questionLower.includes('choose') ||
      questionLower.includes('select')) {
    return 'choice';
  }
  
  return 'single';
};

// Función para procesar las preguntas y agregar metadatos automáticamente
export const getProcessedQuestions = (): PracticeQuestion[] => {
  return practiceQuestions.map(q => ({
    ...q,
    requiredQuantity: q.requiredQuantity || detectRequiredQuantity(q.question),
    questionType: q.questionType || detectQuestionType(q.question)
  }));
};

export default {
  practiceQuestions,
  getQuestionsByCategory,
  getRandomQuestionsByCategory,
  detectRequiredQuantity,
  detectQuestionType,
  getProcessedQuestions
};