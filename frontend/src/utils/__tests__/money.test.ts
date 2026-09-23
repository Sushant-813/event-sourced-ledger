/**
 * Money Value Object — Unit Tests
 *
 * Tests cover all behaviors documented in F0 Implementation Plan §J.1
 * and the architectural constraints in FRONTEND_ARCHITECTURE.md §6 /
 * FRONTEND_TRD.md §7.
 *
 * Critical property being verified: the distinction between the precise
 * JSON-string path and the defensive JSON-number path.
 */
import { describe, it, expect } from 'vitest'
import { Money } from '../money'

describe('Money.fromWire()', () => {
  it('accepts a JSON string and produces the exact value (preferred path)', () => {
    const m = Money.fromWire('100.00')
    expect(m.toWireString()).toBe('100.00')
  })

  it('accepts a JSON string with trailing zeros preserved', () => {
    const m = Money.fromWire('100.50')
    expect(m.toWireString()).toBe('100.50')
  })

  it('accepts a JSON number (defensive path) and coerces without further FP arithmetic', () => {
    // NOTE: This tests the defensive path only.
    // JSON.parse may have already lost precision for very large values.
    // For 100.50 (a simple value within 53 bits), String(100.50) === "100.5",
    // which Decimal normalizes to "100.50" with toFixed(2).
    const m = Money.fromWire(100.50)
    expect(m.toWireString()).toBe('100.50')
  })

  it('demonstrates that string input preserves arbitrary precision while number input is bounded by IEEE-754', () => {
    // Exact 18-digit financial value:
    const largeExactString = '1234567890123456.78'
    const fromString = Money.fromWire(largeExactString)
    // String path preserves exact precision:
    expect(fromString.toWireString()).toBe('1234567890123456.78')

    // When the backend sends an unquoted JSON number, JSON.parse converts it to a JS Number:
    const wireParsedNumber = JSON.parse('{"amount": 1234567890123456.78}').amount as number
    // In JavaScript, IEEE-754 double precision truncated this at parse time to 1234567890123456.8:
    const fromNumber = Money.fromWire(wireParsedNumber)
    // Money.fromWire(number) defensively prevents further arithmetic errors,
    // but CANNOT recover the precision already lost by JSON.parse/IEEE-754:
    expect(fromNumber.toWireString()).not.toBe(largeExactString)
    expect(fromNumber.toWireString()).toBe('1234567890123456.80')
  })

  it('accepts a JSON number integer (defensive path)', () => {
    const m = Money.fromWire(1000)
    expect(m.toWireString()).toBe('1000.00')
  })

  it('returns Money.zero() for null', () => {
    const m = Money.fromWire(null)
    expect(m.isZero()).toBe(true)
    expect(m.toWireString()).toBe('0.00')
  })

  it('returns Money.zero() for undefined', () => {
    const m = Money.fromWire(undefined)
    expect(m.isZero()).toBe(true)
    expect(m.toWireString()).toBe('0.00')
  })

  it('handles negative string values (balanceChange in audit trail)', () => {
    const m = Money.fromWire('-250.00')
    expect(m.isNegative()).toBe(true)
    expect(m.toWireString()).toBe('-250.00')
  })

  it('handles zero string value', () => {
    const m = Money.fromWire('0.00')
    expect(m.isZero()).toBe(true)
  })
})

describe('Money.zero()', () => {
  it('creates a zero-value Money instance', () => {
    const m = Money.zero()
    expect(m.isZero()).toBe(true)
    expect(m.toWireString()).toBe('0.00')
  })
})

describe('Money.fromInput()', () => {
  it('creates Money from a validated input string', () => {
    const m = Money.fromInput('500.75')
    expect(m.toWireString()).toBe('500.75')
  })
})

describe('Money predicates', () => {
  it('isPositive() returns true for positive values', () => {
    expect(Money.fromWire('100.00').isPositive()).toBe(true)
  })

  it('isPositive() returns false for zero', () => {
    expect(Money.zero().isPositive()).toBe(false)
  })

  it('isPositive() returns false for negative values', () => {
    expect(Money.fromWire('-100.00').isPositive()).toBe(false)
  })

  it('isNegative() returns true for negative values', () => {
    expect(Money.fromWire('-250.00').isNegative()).toBe(true)
  })

  it('isNegative() returns false for positive values', () => {
    expect(Money.fromWire('100.00').isNegative()).toBe(false)
  })

  it('isZero() returns false for positive values', () => {
    expect(Money.fromWire('100.00').isZero()).toBe(false)
  })
})

describe('Money.abs()', () => {
  it('returns absolute value of a negative amount', () => {
    const m = Money.fromWire('-250.00')
    expect(m.abs().toWireString()).toBe('250.00')
  })

  it('returns the same value for a positive amount', () => {
    const m = Money.fromWire('100.00')
    expect(m.abs().toWireString()).toBe('100.00')
  })
})

describe('Money.toWireString()', () => {
  it('always returns exactly 2 decimal places', () => {
    expect(Money.fromInput('100').toWireString()).toBe('100.00')
    expect(Money.fromInput('100.5').toWireString()).toBe('100.50')
    expect(Money.fromInput('100.00').toWireString()).toBe('100.00')
  })
})

describe('Money.format()', () => {
  it('formats zero as "0.00" — never blank (FRONTEND_PRD.md §13.3)', () => {
    expect(Money.zero().format()).toBe('0.00')
  })

  it('formats positive value with thousands separator', () => {
    expect(Money.fromWire('1000.00').format()).toBe('1,000.00')
  })

  it('formats larger positive value', () => {
    expect(Money.fromWire('1234567.89').format()).toBe('1,234,567.89')
  })

  it('formats a small positive value with no thousands separator', () => {
    expect(Money.fromWire('100.00').format()).toBe('100.00')
  })

  it('formats negative value with leading minus sign', () => {
    expect(Money.fromWire('-250.00').format()).toBe('-250.00')
  })

  it('formats negative value with thousands separator', () => {
    expect(Money.fromWire('-1250.75').format()).toBe('-1,250.75')
  })

  it('adds "+" prefix for positive with showPositiveSign option', () => {
    expect(Money.fromWire('1000.00').format({ showPositiveSign: true })).toBe('+1,000.00')
  })

  it('does NOT add "+" prefix for zero even with showPositiveSign', () => {
    expect(Money.zero().format({ showPositiveSign: true })).toBe('0.00')
  })

  it('formats negative normally even with showPositiveSign (negative takes precedence)', () => {
    expect(Money.fromWire('-250.00').format({ showPositiveSign: true })).toBe('-250.00')
  })

  it('never returns a blank string', () => {
    const cases = ['0.00', '0', null, undefined] as const
    for (const c of cases) {
      const result = Money.fromWire(c).format()
      expect(result.length).toBeGreaterThan(0)
    }
  })
})

describe('Money comparisons', () => {
  it('gte() returns true when equal', () => {
    expect(Money.fromWire('100.00').gte(Money.fromWire('100.00'))).toBe(true)
  })

  it('gte() returns true when greater', () => {
    expect(Money.fromWire('200.00').gte(Money.fromWire('100.00'))).toBe(true)
  })

  it('gte() returns false when less', () => {
    expect(Money.fromWire('50.00').gte(Money.fromWire('100.00'))).toBe(false)
  })

  it('gt() returns true when greater', () => {
    expect(Money.fromWire('200.00').gt(Money.fromWire('100.00'))).toBe(true)
  })
})
