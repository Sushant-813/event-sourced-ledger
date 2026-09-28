import type { EntryType, EventType, TransactionStatus, TransactionType } from '@/types/enums'
import type { SortDirection } from '@/types/common'

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

/**
 * Account transaction history item returned by GET /accounts/{accountId}/audit/transactions.
 * API_GUIDELINES.md §21, FRONTEND_PRD.md §10.1.
 *
 * NOTE: `amount` is intentionally absent in AccountTransactionResponse per backend DTO design.
 * The frontend must not fabricate or derive an amount for this record.
 */
export interface AccountTransactionResponse {
  transactionId: number
  referenceNumber: string
  transactionType: TransactionType
  status: TransactionStatus
  createdAt: string
}

/**
 * Query parameters for GET /accounts/{accountId}/audit/transactions.
 * Note: Sort and filter are not supported by the backend for this endpoint.
 */
export interface AccountTransactionParams {
  page?: number
  size?: number
}

/**
 * Account ledger entry response returned by GET /accounts/{accountId}/audit/ledger.
 * API_GUIDELINES.md §21, FRONTEND_PRD.md §11.1.
 *
 * `amount` is ingested via Money.fromWire(amount).
 */
export interface AccountLedgerEntryResponse {
  ledgerEntryId: number
  transactionId: number
  referenceNumber: string
  entryType: EntryType
  amount: string | number
  createdAt: string
}

/**
 * Query parameters for GET /accounts/{accountId}/audit/ledger.
 * API_GUIDELINES.md §21: sortBy is restricted to 'createdAt' only; entryType is optional filter.
 */
export interface AccountLedgerParams {
  page?: number
  size?: number
  sortBy?: 'createdAt'
  direction?: SortDirection
  entryType?: EntryType
}

/**
 * Account domain event response returned by GET /accounts/{accountId}/audit/events.
 * API_GUIDELINES.md §21, FRONTEND_PRD.md §12.1.
 */
export interface AccountEventResponse {
  eventId: number
  eventType: EventType
  transactionId: number | null
  payload: string | null
  occurredAt: string
}

/**
 * Query parameters for GET /accounts/{accountId}/audit/events.
 * API_GUIDELINES.md §21: sortBy is restricted to 'occurredAt' only.
 * No eventType filter is supported (complete event stream preserved).
 */
export interface AccountEventParams {
  page?: number
  size?: number
  sortBy?: 'occurredAt'
  direction?: SortDirection
}
