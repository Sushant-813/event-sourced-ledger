/**
 * Shared Enumerations
 *
 * These enums mirror the backend domain enumerations used across the
 * Event-Sourced Ledger API (docs/API_GUIDELINES.md §21).
 *
 * String values match exactly what the backend serializes in JSON responses.
 * Do not add values not present in the backend domain.
 */

/**
 * Account lifecycle status.
 * DESIGN.md §10, API_GUIDELINES.md §21 (GET /accounts).
 *
 * Lifecycle transitions:
 *   ACTIVE → FROZEN → ACTIVE (reactivate)
 *   ACTIVE → CLOSED (terminal)
 *   FROZEN → CLOSED (terminal)
 */
export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  CLOSED = 'CLOSED',
}

/**
 * Account type classification.
 * API_GUIDELINES.md §21 (POST /accounts).
 */
export enum AccountType {
  SAVINGS = 'SAVINGS',
  CURRENT = 'CURRENT',
}

/**
 * Double-entry ledger entry type.
 * API_GUIDELINES.md §21 (GET /accounts/{id}/audit/ledger).
 * DESIGN.md §13: "Do NOT color DEBIT red or CREDIT green in ledger tables."
 */
export enum EntryType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

/**
 * Transaction type.
 * API_GUIDELINES.md §21 (POST /accounts/{id}/deposit, withdrawal, /transfers).
 */
export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
}

/**
 * Transaction status.
 * API_GUIDELINES.md §21.
 */
export enum TransactionStatus {
  COMPLETED = 'COMPLETED',
}

/**
 * Domain event type for the account event stream.
 * API_GUIDELINES.md §21 (GET /accounts/{id}/audit/events).
 * Event stream completeness is preserved — no filtering by eventType allowed.
 */
export enum EventType {
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_FROZEN = 'ACCOUNT_FROZEN',
  ACCOUNT_ACTIVATED = 'ACCOUNT_ACTIVATED',
  ACCOUNT_CLOSED = 'ACCOUNT_CLOSED',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER_DEBIT = 'TRANSFER_DEBIT',
  TRANSFER_CREDIT = 'TRANSFER_CREDIT',
}
