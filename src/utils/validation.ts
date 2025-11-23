// src/utils/validation.ts

/**
 * Utilidades para validación de formularios
 */

/**
 * Valida formato de email
 * @param email Email a validar
 * @returns true si el email es válido, false en caso contrario
 */
export function isValidEmail(email: string): boolean {
  if (!email || !email.trim()) {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida fortaleza de contraseña
 * @param password Contraseña a validar
 * @returns Objeto con validez y mensaje de error si aplica
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  if (!password) {
    return {
      isValid: false,
      errors: ['La contraseña es requerida'],
    };
  }
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (password.length > 128) {
    errors.push('La contraseña no puede tener más de 128 caracteres');
  }
  
  // Opcional: validaciones adicionales de fortaleza
  // if (!/[A-Z]/.test(password)) {
  //   errors.push('La contraseña debe contener al menos una letra mayúscula');
  // }
  // if (!/[a-z]/.test(password)) {
  //   errors.push('La contraseña debe contener al menos una letra minúscula');
  // }
  // if (!/[0-9]/.test(password)) {
  //   errors.push('La contraseña debe contener al menos un número');
  // }
  // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  //   errors.push('La contraseña debe contener al menos un carácter especial');
  // }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida que dos contraseñas coincidan
 * @param password Primera contraseña
 * @param confirmPassword Segunda contraseña (confirmación)
 * @returns true si coinciden, false en caso contrario
 */
export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}

/**
 * Valida que un campo no esté vacío
 * @param value Valor a validar
 * @param fieldName Nombre del campo (para mensajes de error)
 * @returns Objeto con validez y mensaje de error si aplica
 */
export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateRequired(value: string, fieldName: string = 'Campo'): FieldValidationResult {
  if (!value || !value.trim()) {
    return {
      isValid: false,
      error: `${fieldName} es requerido`,
    };
  }
  
  return {
    isValid: true,
  };
}

/**
 * Valida nombre de usuario
 * @param name Nombre a validar
 * @returns Objeto con validez y mensaje de error si aplica
 */
export function validateName(name: string): FieldValidationResult {
  if (!name || !name.trim()) {
    return {
      isValid: false,
      error: 'El nombre es requerido',
    };
  }
  
  if (name.trim().length < 2) {
    return {
      isValid: false,
      error: 'El nombre debe tener al menos 2 caracteres',
    };
  }
  
  if (name.trim().length > 50) {
    return {
      isValid: false,
      error: 'El nombre no puede tener más de 50 caracteres',
    };
  }
  
  return {
    isValid: true,
  };
}

