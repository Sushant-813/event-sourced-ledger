/**
 * Transaction and Transfer DTO Types
 *
 * Request and response contracts for monetary operations:
 *   - POST /accounts/{accountId}/deposit
 *   - POST /accounts/{accountId}/withdrawal
 *   - POST /transfers
 *
 * Financial Invariants:
 *   - Request amount is serialized as a verified decimal wire string (e.g., "100.50").
 *   - Response amount accepts string | number at the wire boundary to safely handle
 *     backend JSON serialization differences without early precision loss (ADR-030).
 *   - Zero client-invented fields.
 *
 * Source: API_GUIDELINES.md §21, FRONTEND_ARCHITECTURE.md §5.3
 */
import type { TransactionStatus, TransactionType } from '@/types/enums'

/**
 * Request body for depositing funds into an account.
 * Endpoint: POST /accounts/{accountId}/deposit
 */
export interface DepositRequest {
  amount: string
}

/**
 * Request body for withdrawing funds from an account.
 * Endpoint: POST /accounts/{accountId}/withdrawal
 */
export interface WithdrawalRequest {
  amount: string
}

/**
 * Request body for transferring funds between two accounts.
 * Endpoint: POST /transfers
 */
export interface TransferRequest {
  sourceAccountId: number
  destinationAccountId: number
  amount: string
}

/**
 * Response returned after a successful deposit or withdrawal.
 * Note: amount is string | number at the wire boundary and must be ingested via Money.fromWire().
 */
export interface TransactionResponse {
  transactionId: number
  referenceNumber: string
  transactionType: TransactionType
  status: TransactionStatus
  accountId: number
  amount: string | number
  createdAt: string
}

/**
 * Response returned after a successful transfer between two accounts.
 * Note: amount is string | number at the wire boundary and must be ingested via Money.fromWire().
 */
export interface TransferResponse {
  transactionId: number
  referenceNumber: string
  transactionType: TransactionType
  status: TransactionStatus
  sourceAccountId: number
  destinationAccountId: number
  amount: string | number
  createdAt: string
}
