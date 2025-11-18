/**
 * Utilidades para validación de respuestas
 * Extraído de CategoryPracticeScreen.tsx para separar lógica de UI
 */

/**
 * Limpia el texto removiendo símbolos, corchetes y asteriscos
 * @param text Texto a limpiar
 * @returns Texto limpio
 */
export const cleanText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    // Remover símbolos comunes
    .replace(/[•·\-\*]/g, '')
    // Remover corchetes y su contenido
    .replace(/\[.*?\]/g, '')
    // Remover paréntesis y su contenido
    .replace(/\(.*?\)/g, '')
    // Remover asteriscos
    .replace(/\*/g, '')
    // Remover espacios múltiples
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Compara la respuesta del usuario con la respuesta correcta
 * Usa limpieza de texto y permite coincidencias parciales
 * @param userAnswer Respuesta del usuario
 * @param correctAnswer Respuesta correcta (puede contener múltiples opciones separadas por comas)
 * @param questionText Texto de la pregunta (para logging)
 * @returns true si la respuesta es correcta
 */
export const isAnswerCorrect = (
  userAnswer: string,
  correctAnswer: string,
  questionText?: string
): boolean => {
  if (questionText) {
    console.log('=== VALIDACIÓN CON LIMPIEZA DE TEXTO ===');
    console.log('Question:', questionText);
    console.log('User Answer (original):', userAnswer);
    console.log('Correct Answer (original):', correctAnswer);
  }

  // Limpiar ambas respuestas
  const cleanUserAnswer = cleanText(userAnswer);
  const cleanCorrectAnswer = cleanText(correctAnswer);

  if (questionText) {
    console.log('User Answer (cleaned):', cleanUserAnswer);
    console.log('Correct Answer (cleaned):', cleanCorrectAnswer);
  }

  // Dividir la respuesta correcta en opciones (separadas por comas o saltos de línea)
  const correctOptions = cleanCorrectAnswer
    .split(/[,•\n]/)
    .map(opt => opt.trim())
    .filter(opt => opt.length > 0);

  if (questionText) {
    console.log('Correct Options:', correctOptions);
  }

  // Verificar si la respuesta del usuario coincide con alguna opción
  const isMatch = correctOptions.some(option => {
    const normalizedOption = cleanText(option);
    return (
      cleanUserAnswer === normalizedOption ||
      cleanUserAnswer.includes(normalizedOption) ||
      normalizedOption.includes(cleanUserAnswer)
    );
  });

  if (questionText) {
    console.log('Is Match:', isMatch);
    console.log('=== FIN VALIDACIÓN ===');
  }

  return isMatch;
};

