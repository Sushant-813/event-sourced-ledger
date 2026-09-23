/**
 * Account Mutation Hooks
 *
 * TanStack React Query mutation hooks for creating and managing account lifecycle.
 * Invariants:
 *   - No optimistic updates for account or financial state.
 *   - Invalidate server cache on success to refetch authoritative data.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { ENDPOINTS } from '@/api/endpoints'
import { accountKeys } from './accountQueries'
import { auditKeys } from '@/features/audit/api/auditQueries'
import type { AccountResponse, CreateAccountRequest } from '../types/account'

/**
 * Mutation to create a new account.
 * Endpoint: POST /accounts
 */
export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (newAccount: CreateAccountRequest) =>
      apiClient<AccountResponse>(ENDPOINTS.accounts.base(), {
        method: 'POST',
        body: JSON.stringify(newAccount),
      }),
    onSuccess: (data) => {
      // Invalidate account lists so the directory reflects the new account
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      // Seed detail cache for immediate view if needed
      queryClient.setQueryData(accountKeys.detail(data.id), data)
    },
  })
}

/**
 * Mutation to freeze an ACTIVE account.
 * Endpoint: PATCH /accounts/{id}/freeze
 */
export function useFreezeAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number | string) =>
      apiClient<AccountResponse>(ENDPOINTS.accounts.freeze(id), {
        method: 'PATCH',
      }),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      queryClient.invalidateQueries({ queryKey: auditKeys.balance(id, null) })
      queryClient.setQueryData(accountKeys.detail(id), data)
    },
  })
}

/**
 * Mutation to activate a FROZEN account.
 * Endpoint: PATCH /accounts/{id}/activate
 */
export function useActivateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number | string) =>
      apiClient<AccountResponse>(ENDPOINTS.accounts.activate(id), {
        method: 'PATCH',
      }),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      queryClient.invalidateQueries({ queryKey: auditKeys.balance(id, null) })
      queryClient.setQueryData(accountKeys.detail(id), data)
    },
  })
}

/**
 * Mutation to close an ACTIVE or FROZEN account (terminal state).
 * Endpoint: PATCH /accounts/{id}/close
 */
export function useCloseAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number | string) =>
      apiClient<AccountResponse>(ENDPOINTS.accounts.close(id), {
        method: 'PATCH',
      }),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() })
      queryClient.invalidateQueries({ queryKey: auditKeys.balance(id, null) })
      queryClient.setQueryData(accountKeys.detail(id), data)
    },
  })
}
