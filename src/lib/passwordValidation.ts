/**
 * Password Security Requirements Validator
 * Enforces strong password rules using regex:
 *  - 8+ characters
 *  - 1+ uppercase letter [A-Z]
 *  - 1+ lowercase letter [a-z]
 *  - 1+ number [0-9]
 *  - 1+ special character [!@#$%^&*...]
 */

export interface PasswordValidationResult {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  isValid: boolean;
  score: number; // 0 to 5
}

export function validatePassword(password: string): PasswordValidationResult {
  const pwd = password || "";
  const hasMinLength = pwd.length >= 8;
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasLowercase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd);

  const criteria = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
  ];
  const score = criteria.filter(Boolean).length;
  const isValid = score === 5;

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    isValid,
    score,
  };
}
