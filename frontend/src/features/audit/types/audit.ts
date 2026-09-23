/**
 * Audit Feature Types (F1 Scope)
 *
 * Minimal types required for authoritative balance query in F1.
 * Matches backend contracts in docs/API_GUIDELINES.md §21.
 * Full audit types (trail, ledger entries, events) are deferred to F3/F4.
 */

/**
 * Balance reconstruction response returned by GET /accounts/{id}/audit/balance.
 * API_GUIDELINES.md §21.
 *
 * Wire format note:
 * `balance` may be emitted as a JSON string (e.g. "100.50") or defensively as a number.
 * Always parse through Money.fromWire(balance). Never perform client-side arithmetic.
 */
export interface AuditBalanceResponse {
  accountId: number
  balance: string | number
  asOf: string | null
}
