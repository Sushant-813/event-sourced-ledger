/**
 * Date Utilities — Unit Tests
 *
 * Tests cover: formatTimestamp, formatDate, normalizeAsOf, nowUtcIso
 * Edge cases: null, undefined, empty string, invalid date strings.
 *
 * Note on timezone-dependent assertions:
 *   formatTimestamp / formatDate convert UTC → local time, which varies
 *   by environment. Tests verify structural correctness (returns a string
 *   with expected components) rather than exact locale-formatted output.
 */
import { describe, it, expect } from 'vitest'
import { formatTimestamp, formatDate, normalizeAsOf, nowUtcIso } from '../date'

describe('formatTimestamp()', () => {
  it('returns a non-empty string for a valid UTC ISO-8601 input', () => {
    const result = formatTimestamp('2026-09-10T09:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    expect(result).not.toBe('—')
    expect(result).not.toBe('Invalid date')
  })

  it('returns "—" for null', () => {
    expect(formatTimestamp(null)).toBe('—')
  })

  it('returns "—" for undefined', () => {
    expect(formatTimestamp(undefined)).toBe('—')
  })

  it('returns "—" for empty string', () => {
    expect(formatTimestamp('')).toBe('—')
  })

  it('returns "Invalid date" for a non-date string', () => {
    expect(formatTimestamp('not-a-date')).toBe('Invalid date')
  })

  it('returns "Invalid date" for a malformed ISO string', () => {
    expect(formatTimestamp('2026-99-99T99:99:99Z')).toBe('Invalid date')
  })
})

describe('formatDate()', () => {
  it('returns a non-empty string for a valid UTC ISO-8601 input', () => {
    const result = formatDate('2026-09-10T09:00:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    expect(result).not.toBe('—')
    expect(result).not.toBe('Invalid date')
  })

  it('returns "—" for null', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('returns "—" for undefined', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('returns "Invalid date" for an invalid string', () => {
    expect(formatDate('garbage')).toBe('Invalid date')
  })
})

describe('normalizeAsOf()', () => {
  it('converts a local datetime-local string to a UTC ISO-8601 string', () => {
    // datetime-local format: "2026-09-10T17:30"
    const result = normalizeAsOf('2026-09-10T17:30')
    expect(result).not.toBeNull()
    expect(typeof result).toBe('string')
    // Must end with 'Z' (UTC indicator)
    expect(result!.endsWith('Z')).toBe(true)
    // Must be a parseable date
    expect(isNaN(new Date(result!).getTime())).toBe(false)
  })

  it('returns null for null input', () => {
    expect(normalizeAsOf(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(normalizeAsOf(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(normalizeAsOf('')).toBeNull()
  })

  it('returns null for an invalid datetime string', () => {
    expect(normalizeAsOf('not-a-date')).toBeNull()
  })
})

describe('nowUtcIso()', () => {
  it('returns a string ending with Z (UTC)', () => {
    const result = nowUtcIso()
    expect(result.endsWith('Z')).toBe(true)
  })

  it('returns a parseable ISO-8601 date string', () => {
    const result = nowUtcIso()
    expect(isNaN(new Date(result).getTime())).toBe(false)
  })

  it('returns a date close to the current time', () => {
    const before = Date.now()
    const result = nowUtcIso()
    const after = Date.now()
    const parsed = new Date(result).getTime()
    expect(parsed).toBeGreaterThanOrEqual(before)
    expect(parsed).toBeLessThanOrEqual(after)
  })
})
