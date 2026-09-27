/**
 * Monetary and Form Validation Utilities
 *
 * Provides pre-flight client-side validation for monetary inputs.
 * Invariants:
 *   - Zero JavaScript floating-point arithmetic.
 *   - Strictly enforces backend @DecimalMin("0.01") and @Digits(integer = 17, fraction = 2).
 *   - Constructs a verified Money value object upon valid input.
 *
 * Source: FRONTEND_ARCHITECTURE.md §8, FRONTEND_TRD.md §7
 */
import { Money } from './money'

/**
 * Validates decimal strings with optional fractional part of up to 2 decimal places.
 * Disallows leading/trailing non-digits, negative signs, currency symbols, and scientific notation.
 */
export const MONETARY_REGEX = /^\d+(\.\d{1,2})?$/

export interface MonetaryValidationResult {
  isValid: boolean
  error?: string
  money?: Money
}

/**
 * Validates a user-entered monetary amount string before submission.
 *
 * Rules:
 *   - Non-empty, non-whitespace
 *   - Matches MONETARY_REGEX (positive decimal, at most 2 decimal digits)
 *   - At most 17 integer digits
 *   - Strictly greater than 0.00 (minimum 0.01)
 *
 * @param rawInput - Raw string from an input control
 * @returns Result object containing boolean isValid, optional error message, and validated Money instance
 */
export function validateMonetaryAmount(rawInput: string): MonetaryValidationResult {
  if (!rawInput || !rawInput.trim()) {
    return { isValid: false, error: 'Amount is required' }
  }

  const trimmed = rawInput.trim()

  if (!MONETARY_REGEX.test(trimmed)) {
    if (trimmed.startsWith('-')) {
      return { isValid: false, error: 'Amount must be greater than zero' }
    }
    if (trimmed.includes('.')) {
      const parts = trimmed.split('.')
      if (parts.length > 2) {
        return { isValid: false, error: 'Amount cannot have multiple decimal points' }
      }
      const fractionPart = parts[1]
      if (fractionPart !== undefined && fractionPart.length > 2) {
        return { isValid: false, error: 'Amount must have at most 2 decimal places' }
      }
    }
    return { isValid: false, error: 'Please enter a valid amount (e.g., 100.50)' }
  }

  const integerPart = trimmed.split('.')[0] ?? ''
  const nonLeadingZeroInt = integerPart.replace(/^0+/, '') || '0'
  if (nonLeadingZeroInt.length > 17) {
    return { isValid: false, error: 'Amount must have at most 17 integer digits' }
  }

  const money = Money.fromInput(trimmed)

  if (money.isZero()) {
    return { isValid: false, error: 'Amount must be greater than zero' }
  }

  const minAllowed = Money.fromInput('0.01')
  if (money.lt(minAllowed)) {
    return { isValid: false, error: 'Amount must be at least 0.01' }
  }

  return { isValid: true, money }
}
