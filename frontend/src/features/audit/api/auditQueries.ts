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
import type { AuditBalanceResponse } from '../types/audit'

export const auditKeys = {
  all: ['audit'] as const,
  balance: (accountId: number | string, asOf: string | null = null) =>
    ['accounts', String(accountId), 'balance', { asOf }] as const,
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
