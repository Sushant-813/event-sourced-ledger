/**
 * Money — Arbitrary-Precision Decimal Value Object
 *
 * Encapsulates all monetary arithmetic and formatting for the
 * Event-Sourced Ledger frontend.
 *
 * ═══════════════════════════════════════════════════════════════
 * MONETARY WIRE FORMAT — IMPORTANT PRECISION NOTES
 * ═══════════════════════════════════════════════════════════════
 *
 * PREFERRED WIRE FORMAT: JSON string  (e.g.  "amount": "100.50")
 *   When the backend emits a monetary field as a JSON string, fromWire()
 *   receives a JavaScript string and passes it directly to Decimal's
 *   constructor — this is the EXACT, fully precision-safe path.
 *   JSON strings preserve the backend BigDecimal's exact decimal
 *   representation with no intermediate floating-point step.
 *
 * DEFENSIVE WIRE FORMAT: JSON number  (e.g.  "amount": 100.50)
 *   When the backend emits a monetary field as an unquoted JSON number,
 *   JSON.parse() constructs an IEEE 754 double-precision JavaScript Number
 *   BEFORE application code runs. By the time fromWire(number) is called,
 *   precision may already have been lost — particularly for values with
 *   more than ~15 significant decimal digits.
 *
 *   ⚠ String(number) does NOT recover precision that was lost at
 *     JSON.parse time. fromWire(number) coerces via String() only to
 *     prevent further floating-point arithmetic inside the application;
 *     it does NOT make the JSON-number path precision-safe.
 *
 *   If the live backend is found to emit JSON numbers rather than JSON
 *   strings, this constitutes a serialization risk requiring a backend
 *   fix (see wire-format verification ADR). fromWire(number) remains as
 *   a defensive compatibility measure only.
 *
 * PROHIBITION:
 *   Native JavaScript Number arithmetic (+, -, *, /) is forbidden for
 *   monetary values. parseFloat() and Number() are forbidden for monetary
 *   parsing. All monetary operations must use this class.
 *
 * Sources: FRONTEND_ARCHITECTURE.md §6, FRONTEND_TRD.md §7,
 *          F0 Implementation Plan §F (Revision 2)
 * ═══════════════════════════════════════════════════════════════
 */

import { Decimal } from 'decimal.js'

// Configure Decimal.js for financial use:
//   precision  20  — sufficient for NUMERIC(19,2) with headroom
//   rounding HALF_UP — standard financial rounding
//   toExpPos   21  — never use exponential notation in outputs
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP, toExpPos: 21 })

export class Money {
  private readonly value: Decimal

  private constructor(value: Decimal) {
    this.value = value
  }

  // ---------------------------------------------------------------------------
  // Construction
  // ---------------------------------------------------------------------------

  /**
   * Constructs a Money instance from a backend wire value.
   *
   * String input (PREFERRED — exact, precision-safe):
   *   Money.fromWire("100.50") — string passed directly to Decimal constructor.
   *
   * Number input (DEFENSIVE — may already have lost precision at JSON.parse time):
   *   Money.fromWire(100.50) — coerced via String() before Decimal construction.
   *   String(number) prevents further floating-point arithmetic but CANNOT
   *   recover precision lost when JSON.parse converted the JSON number to
   *   an IEEE 754 float.
   *
   * null / undefined → Money.zero()
   */
  static fromWire(value: string | number | null | undefined): Money {
    if (value === null || value === undefined) {
      return Money.zero()
    }
    // String(value): for string inputs, String() is a no-op — the value
    // passes through to Decimal unchanged. For number inputs, this prevents
    // any further floating-point arithmetic but does NOT recover precision
    // that may have been lost at JSON.parse.
    return new Money(new Decimal(String(value)))
  }

  /**
   * Constructs Money from a validated user-input string.
   * The input must already be pre-validated as a well-formed decimal string.
   * Do not pass raw user input without validation.
   */
  static fromInput(input: string): Money {
    return new Money(new Decimal(input))
  }

  /** Returns a Money instance representing zero. */
  static zero(): Money {
    return new Money(new Decimal(0))
  }

  // ---------------------------------------------------------------------------
  // Predicates
  // ---------------------------------------------------------------------------

  isZero(): boolean     { return this.value.isZero() }
  isPositive(): boolean { return this.value.greaterThan(0) }
  isNegative(): boolean { return this.value.lessThan(0) }

  // ---------------------------------------------------------------------------
  // Comparisons
  // ---------------------------------------------------------------------------

  gte(other: Money): boolean { return this.value.gte(other.value) }
  gt(other: Money): boolean  { return this.value.gt(other.value) }
  lte(other: Money): boolean { return this.value.lte(other.value) }
  lt(other: Money): boolean  { return this.value.lt(other.value) }

  // ---------------------------------------------------------------------------
  // Transformations
  // ---------------------------------------------------------------------------

  /** Returns the absolute value as a new Money instance. */
  abs(): Money { return new Money(this.value.abs()) }

  // ---------------------------------------------------------------------------
  // Serialization
  // ---------------------------------------------------------------------------

  /**
   * Returns the wire-safe string representation for use in request bodies.
   * Always exactly 2 decimal places (matching backend @Digits(fraction=2)).
   *
   * Examples: "100.00", "0.01", "10000.50"
   */
  toWireString(): string {
    return this.value.toFixed(2)
  }

  /**
   * Returns a display-formatted string for UI rendering.
   *
   * Rules (DESIGN.md §5, §28):
   *   - Always 2 decimal places — never a bare integer
   *   - Thousands separator on the integer part
   *   - Zero renders as "0.00" — NEVER blank (FRONTEND_PRD.md §13.3)
   *   - Negative values prefixed with "-" (e.g. "-250.00")
   *   - Positive sign opt-in for audit trail balanceChange column only
   *
   * @param options.showPositiveSign — prefix "+" for positive values.
   *   Use only for audit trail balanceChange where the sign conveys direction.
   *   Do NOT use for regular balance display.
   *
   * Examples:
   *   Money.fromWire("1000.00").format()                        → "1,000.00"
   *   Money.fromWire("1000.00").format({ showPositiveSign: true }) → "+1,000.00"
   *   Money.fromWire("-250.00").format()                        → "-250.00"
   *   Money.fromWire("0.00").format()                           → "0.00"
   */
  format(options?: { showPositiveSign?: boolean }): string {
    const absFixed = this.value.abs().toFixed(2)
    const dotIndex = absFixed.indexOf('.')
    const intPart  = dotIndex >= 0 ? absFixed.slice(0, dotIndex) : absFixed
    const decPart  = dotIndex >= 0 ? absFixed.slice(dotIndex + 1) : '00'
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    const formatted = `${formattedInt}.${decPart}`

    if (this.isNegative()) return `-${formatted}`
    if (options?.showPositiveSign === true && this.isPositive()) return `+${formatted}`
    return formatted
  }

  toString(): string {
    return this.toWireString()
  }
}
