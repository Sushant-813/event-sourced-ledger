/**
 * Monetary Validation Unit Tests
 *
 * Verifies strict validation boundaries per:
 *   - @DecimalMin("0.01")
 *   - @Digits(integer = 17, fraction = 2)
 *   - Strict decimal safety (zero floating-point math)
 */
import { describe, it, expect } from 'vitest'
import { validateMonetaryAmount, MONETARY_REGEX } from '../validation'

describe('MONETARY_REGEX', () => {
  it('matches valid integers and up to 2 decimal places', () => {
    expect(MONETARY_REGEX.test('100')).toBe(true)
    expect(MONETARY_REGEX.test('100.5')).toBe(true)
    expect(MONETARY_REGEX.test('100.50')).toBe(true)
    expect(MONETARY_REGEX.test('0.01')).toBe(true)
  })

  it('rejects 3 or more decimal places', () => {
    expect(MONETARY_REGEX.test('100.555')).toBe(false)
    expect(MONETARY_REGEX.test('0.001')).toBe(false)
  })

  it('rejects non-numeric characters and symbols', () => {
    expect(MONETARY_REGEX.test('-50')).toBe(false)
    expect(MONETARY_REGEX.test('₹100')).toBe(false)
    expect(MONETARY_REGEX.test('$100')).toBe(false)
    expect(MONETARY_REGEX.test('1e5')).toBe(false)
    expect(MONETARY_REGEX.test('abc')).toBe(false)
  })
})

describe('validateMonetaryAmount()', () => {
  describe('valid amounts', () => {
    it('accepts positive integer strings', () => {
      const res = validateMonetaryAmount('100')
      expect(res.isValid).toBe(true)
      expect(res.error).toBeUndefined()
      expect(res.money?.toWireString()).toBe('100.00')
    })

    it('accepts positive single decimal strings', () => {
      const res = validateMonetaryAmount('50.5')
      expect(res.isValid).toBe(true)
      expect(res.error).toBeUndefined()
      expect(res.money?.toWireString()).toBe('50.50')
    })

    it('accepts positive two decimal strings', () => {
      const res = validateMonetaryAmount('100.75')
      expect(res.isValid).toBe(true)
      expect(res.error).toBeUndefined()
      expect(res.money?.toWireString()).toBe('100.75')
    })

    it('accepts the minimum allowed positive value (0.01)', () => {
      const res = validateMonetaryAmount('0.01')
      expect(res.isValid).toBe(true)
      expect(res.error).toBeUndefined()
      expect(res.money?.toWireString()).toBe('0.01')
    })

    it('accepts maximum valid boundary (17 integer digits and 2 fraction digits)', () => {
      const maxVal = '99999999999999999.99' // 17 nines . 99
      const res = validateMonetaryAmount(maxVal)
      expect(res.isValid).toBe(true)
      expect(res.error).toBeUndefined()
      expect(res.money?.toWireString()).toBe(maxVal)
    })

    it('trims leading and trailing whitespace on valid amounts', () => {
      const res = validateMonetaryAmount('  250.00  ')
      expect(res.isValid).toBe(true)
      expect(res.money?.toWireString()).toBe('250.00')
    })
  })

  describe('invalid amounts', () => {
    it('rejects empty string', () => {
      const res = validateMonetaryAmount('')
      expect(res.isValid).toBe(false)
      expect(res.error).toBe('Amount is required')
      expect(res.money).toBeUndefined()
    })

    it('rejects whitespace-only string', () => {
      const res = validateMonetaryAmount('    ')
      expect(res.isValid).toBe(false)
      expect(res.error).toBe('Amount is required')
    })

    it('rejects zero ("0")', () => {
      const res = validateMonetaryAmount('0')
      expect(res.isValid).toBe(false)
      expect(res.error).toBe('Amount must be greater than zero')
    })

    it('rejects zero with decimals ("0.00")', () => {
      const res = validateMonetaryAmount('0.00')
      expect(res.isValid).toBe(false)
      expect(res.error).toBe('Amount must be greater than zero')
    })

    it('rejects negative numbers ("-50")', () => {
      const res = validateMonetaryAmount('-50')
      expect(res.isValid).toBe(false)
      expect(res.error).toBe('Amount must be greater than zero')
    })

    it('rejects negative decimals ("-0.01")', () => {
      const res = validateMonetaryAmount('-0.01')
      expect(res.isValid).toBe(false)
      expect(res.error).toBe('Amount must be greater than zero')
    })

    it('rejects alphabetic characters', () => {
      const res = validateMonetaryAmount('abc')
      expect(res.isValid).toBe(false)
      expect(res.error).toBe('Please enter a valid amount (e.g., 100.50)')
    })

    it('rejects mixed alphanumeric characters ("12a.50")', () => {
      const res = validateMonetaryAmount('12a.50')
      expect(res.isValid).toBe(false)
      expect(res.error).toBe('Please enter a valid amount (e.g., 100.50)')
    })

    it('rejects currency symbols in raw input ("₹100" and "$100")', () => {
      expect(validateMonetaryAmount('₹100').isValid).toBe(false)
      expect(validateMonetaryAmount('$100').isValid).toBe(false)
    })

    it('rejects scientific notation ("1e5")', () => {
      const res = validateMonetaryAmount('1e5')
      expect(res.isValid).toBe(false)
      expect(res.error).toBe('Please enter a valid amount (e.g., 100.50)')
    })

    it('rejects multiple decimal points ("10.5.2")', () => {
      const res = validateMonetaryAmount('10.5.2')
      expect(res.isValid).toBe(false)
      expect(res.error).toBe('Amount cannot have multiple decimal points')
    })

    it('rejects more than 2 decimal places ("100.001")', () => {
      const res = validateMonetaryAmount('100.001')
      expect(res.isValid).toBe(false)
      expect(res.error).toBe('Amount must have at most 2 decimal places')
    })

    it('rejects tiny fractional amount below 0.01 with 3 decimals ("0.005")', () => {
      const res = validateMonetaryAmount('0.005')
      expect(res.isValid).toBe(false)
      expect(res.error).toBe('Amount must have at most 2 decimal places')
    })

    it('rejects amounts exceeding 17 integer digits (18 digits: "123456789012345678")', () => {
      const eighteenDigits = '123456789012345678'
      const res = validateMonetaryAmount(eighteenDigits)
      expect(res.isValid).toBe(false)
      expect(res.error).toBe('Amount must have at most 17 integer digits')
    })
  })
})
