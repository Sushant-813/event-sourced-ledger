/**
 * Account Query Hooks
 *
 * TanStack React Query hooks for fetching accounts.
 * Conforms to FRONTEND_ARCHITECTURE.md §4, §5.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { ENDPOINTS } from '@/api/endpoints'
import type { PagedResponse } from '@/types/common'
import type { AccountResponse, AccountListParams } from '../types/account'

export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  list: (params?: AccountListParams) => [...accountKeys.lists(), params] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...accountKeys.all, String(id)] as const,
  byNumber: (accountNumber: string) =>
    [...accountKeys.all, 'byNumber', accountNumber] as const,
}

/**
 * Hook to fetch paginated and filtered accounts list.
 * Endpoint: GET /accounts
 */
export function useAccounts(
  params?: AccountListParams
): UseQueryResult<PagedResponse<AccountResponse>, unknown> {
  return useQuery({
    queryKey: accountKeys.list(params),
    queryFn: () =>
      apiClient<PagedResponse<AccountResponse>>(ENDPOINTS.accounts.base(), {
        params: {
          page: params?.page,
          size: params?.size,
          sortBy: params?.sortBy,
          direction: params?.direction,
          status: params?.status,
          accountType: params?.accountType,
        },
      }),
  })
}

/**
 * Hook to fetch a single account by internal ID.
 * Endpoint: GET /accounts/{id}
 */
export function useAccount(
  id: number | string | undefined
): UseQueryResult<AccountResponse, unknown> {
  const idStr = id !== undefined ? String(id) : ''
  const isEnabled = Boolean(idStr)

  return useQuery({
    queryKey: accountKeys.detail(idStr),
    queryFn: () => apiClient<AccountResponse>(ENDPOINTS.accounts.byId(idStr)),
    enabled: isEnabled,
  })
}

/**
 * Hook to fetch a single account by business account number.
 * Endpoint: GET /accounts/by-number/{accountNumber}
 */
export function useAccountByNumber(
  accountNumber: string | undefined
): UseQueryResult<AccountResponse, unknown> {
  const isEnabled = Boolean(accountNumber && accountNumber.trim().length > 0)

  return useQuery({
    queryKey: accountKeys.byNumber(accountNumber ?? ''),
    queryFn: () =>
      apiClient<AccountResponse>(ENDPOINTS.accounts.byNumber(accountNumber!)),
    enabled: isEnabled,
  })
}
