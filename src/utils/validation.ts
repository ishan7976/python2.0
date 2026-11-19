import type { SemesterStatus } from '../types/placepath';

export interface ValidationResult {
  valid: boolean;
  error: string;
}

export function validateRequiredText(
  value: string,
  fieldName: string,
  maxLength = 200
): ValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, error: `${fieldName} is required.` };
  }
  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must be at most ${maxLength} characters.` };
  }
  return { valid: true, error: '' };
}

export function validateSgpa(sgpa: number | null, status: SemesterStatus): ValidationResult {
  if (sgpa === null || Number.isNaN(sgpa)) {
    if (status === 'Completed') {
      return { valid: false, error: 'SGPA is required for a completed semester.' };
    }
    return { valid: true, error: '' };
  }
  if (sgpa < 0 || sgpa > 10) {
    return { valid: false, error: 'SGPA must be between 0.00 and 10.00.' };
  }
  return { valid: true, error: '' };
}

export function validateCredits(
  totalCredits: number | null,
  completedCredits: number | null
): ValidationResult {
  if (totalCredits !== null && totalCredits < 0) {
    return { valid: false, error: 'Total credits cannot be negative.' };
  }
  if (completedCredits !== null && completedCredits < 0) {
    return { valid: false, error: 'Completed credits cannot be negative.' };
  }
  if (totalCredits !== null && completedCredits !== null && completedCredits > totalCredits) {
    return { valid: false, error: 'Completed credits cannot exceed total credits.' };
  }
  return { valid: true, error: '' };
}

export function validateUrl(url: string, fieldName = 'URL'): ValidationResult {
  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: true, error: '' };
  }
  try {
    const parsed = new URL(trimmed);
    if (
      (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') ||
      !parsed.hostname.includes('.')
    ) {
      return { valid: false, error: `${fieldName} must be a valid http:// or https:// URL.` };
    }
    return { valid: true, error: '' };
  } catch {
    return { valid: false, error: `${fieldName} must be a valid http:// or https:// URL.` };
  }
}

export function validateDateOrder(
  startDate: string,
  endDate: string,
  startLabel = 'Start date',
  endLabel = 'Target date'
): ValidationResult {
  if (!startDate || !endDate) {
    return { valid: true, error: '' };
  }
  if (endDate < startDate) {
    return { valid: false, error: `${endLabel} cannot be earlier than ${startLabel}.` };
  }
  return { valid: true, error: '' };
}
