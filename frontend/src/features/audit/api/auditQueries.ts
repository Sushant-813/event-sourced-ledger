/**
 * Audit Query Hooks (F1 Scope)
 *
 * Provides query hooks for fetching authoritative balance from the backend.
 *
 * CRITICAL FINANCIAL RULES (FRONTEND_ARCHITECTURE.md §12.1):
 *   - The backend is the sole authority for account balances.
 *   - The frontend NEVER calculates or reconstructs balances client-side.
 *   - No optimistic updates to financial values.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { ENDPOINTS } from '@/api/endpoints'
import type { PagedResponse } from '@/types/common'
import type {
  AccountEventParams,
  AccountEventResponse,
  AccountLedgerParams,
  AccountLedgerEntryResponse,
  AccountTransactionParams,
  AccountTransactionResponse,
  AuditBalanceResponse,
} from '../types/audit'

export const auditKeys = {
  all: ['audit'] as const,
  balance: (accountId: number | string, asOf: string | null = null) =>
    ['accounts', String(accountId), 'balance', { asOf }] as const,

  // Transactions history keys
  transactionsRoot: (accountId: number | string) =>
    ['accounts', String(accountId), 'transactions'] as const,
  transactions: (accountId: number | string, params?: AccountTransactionParams) =>
    [...auditKeys.transactionsRoot(accountId), params] as const,

  // Ledger history keys
  ledgerRoot: (accountId: number | string) =>
    ['accounts', String(accountId), 'ledger'] as const,
  ledger: (accountId: number | string, params?: AccountLedgerParams) =>
    [...auditKeys.ledgerRoot(accountId), params] as const,

  // Events history keys
  eventsRoot: (accountId: number | string) =>
    ['accounts', String(accountId), 'events'] as const,
  events: (accountId: number | string, params?: AccountEventParams) =>
    [...auditKeys.eventsRoot(accountId), params] as const,
}

/**
 * Fetches the authoritative reconstructed current balance for an account.
 * Endpoint: GET /accounts/{accountId}/audit/balance
 */
export function useAccountBalance(
  accountId: number | string | undefined,
  options?: { enabled?: boolean }
): UseQueryResult<AuditBalanceResponse, unknown> {
  const accountIdStr = accountId !== undefined ? String(accountId) : ''
  const isEnabled = (options?.enabled ?? true) && Boolean(accountIdStr)

  return useQuery({
    queryKey: auditKeys.balance(accountIdStr, null),
    queryFn: () => apiClient<AuditBalanceResponse>(ENDPOINTS.audit.balance(accountIdStr)),
    enabled: isEnabled,
  })
}

/**
 * Fetches paginated transaction history for an account in event-derived sequence.
 * Endpoint: GET /accounts/{accountId}/audit/transactions
 */
export function useAccountTransactions(
  accountId: number | string | undefined,
  params?: AccountTransactionParams,
  options?: { enabled?: boolean }
): UseQueryResult<PagedResponse<AccountTransactionResponse>, unknown> {
  const accountIdStr = accountId !== undefined ? String(accountId) : ''
  const isEnabled = (options?.enabled ?? true) && Boolean(accountIdStr)

  return useQuery({
    queryKey: auditKeys.transactions(accountIdStr, params),
    queryFn: () =>
      apiClient<PagedResponse<AccountTransactionResponse>>(
        ENDPOINTS.audit.transactions(accountIdStr),
        {
          params: {
            page: params?.page,
            size: params?.size,
          },
        }
      ),
    enabled: isEnabled,
  })
}

/**
 * Fetches paginated double-entry ledger entries for an account.
 * Endpoint: GET /accounts/{accountId}/audit/ledger
 */
export function useAccountLedger(
  accountId: number | string | undefined,
  params?: AccountLedgerParams,
  options?: { enabled?: boolean }
): UseQueryResult<PagedResponse<AccountLedgerEntryResponse>, unknown> {
  const accountIdStr = accountId !== undefined ? String(accountId) : ''
  const isEnabled = (options?.enabled ?? true) && Boolean(accountIdStr)

  return useQuery({
    queryKey: auditKeys.ledger(accountIdStr, params),
    queryFn: () =>
      apiClient<PagedResponse<AccountLedgerEntryResponse>>(
        ENDPOINTS.audit.ledger(accountIdStr),
        {
          params: {
            page: params?.page,
            size: params?.size,
            sortBy: params?.sortBy,
            direction: params?.direction,
            entryType: params?.entryType,
          },
        }
      ),
    enabled: isEnabled,
  })
}

/**
 * Fetches paginated domain event history for an account.
 * Endpoint: GET /accounts/{accountId}/audit/events
 */
export function useAccountEvents(
  accountId: number | string | undefined,
  params?: AccountEventParams,
  options?: { enabled?: boolean }
): UseQueryResult<PagedResponse<AccountEventResponse>, unknown> {
  const accountIdStr = accountId !== undefined ? String(accountId) : ''
  const isEnabled = (options?.enabled ?? true) && Boolean(accountIdStr)

  return useQuery({
    queryKey: auditKeys.events(accountIdStr, params),
    queryFn: () =>
      apiClient<PagedResponse<AccountEventResponse>>(
        ENDPOINTS.audit.events(accountIdStr),
        {
          params: {
            page: params?.page,
            size: params?.size,
            sortBy: params?.sortBy,
            direction: params?.direction,
          },
        }
      ),
    enabled: isEnabled,
  })
}
