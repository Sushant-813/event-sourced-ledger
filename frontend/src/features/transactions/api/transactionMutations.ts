/**
 * Transaction Mutation Hooks
 *
 * TanStack React Query mutation hooks for monetary operations:
 *   - useDeposit: POST /accounts/{accountId}/deposit
 *   - useWithdrawal: POST /accounts/{accountId}/withdrawal
 *   - useTransfer: POST /transfers
 *
 * CRITICAL FINANCIAL INVARIANTS:
 *   - Zero optimistic updates for financial balances or accounting entries.
 *   - Invalidate ONLY affected authoritative balance queries (auditKeys.balance).
 *   - Do NOT invalidate accountKeys.detail() or accountKeys.lists() because AccountResponse
 *     contains no financial state and account metadata is not modified by monetary operations.
 *   - The backend is the sole authority for balance reconstruction.
 *
 * Source: FRONTEND_ARCHITECTURE.md §14, FRONTEND_PRD.md §9
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { ENDPOINTS } from '@/api/endpoints'
import { auditKeys } from '@/features/audit/api/auditQueries'
import type {
  DepositRequest,
  WithdrawalRequest,
  TransferRequest,
  TransactionResponse,
  TransferResponse,
} from '../types/transaction'

export interface DepositVariables {
  accountId: number | string
  amount: string
}

export interface WithdrawalVariables {
  accountId: number | string
  amount: string
}

/**
 * Mutation hook for depositing funds into an account.
 * Endpoint: POST /accounts/{accountId}/deposit
 */
export function useDeposit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ accountId, amount }: DepositVariables) => {
      const request: DepositRequest = { amount }
      return apiClient<TransactionResponse>(ENDPOINTS.accounts.deposit(accountId), {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    onSuccess: (_data, variables) => {
      // Invalidate strictly the authoritative balance query for this account
      void queryClient.invalidateQueries({
        queryKey: auditKeys.balance(variables.accountId, null),
      })
    },
  })
}

/**
 * Mutation hook for withdrawing funds from an account.
 * Endpoint: POST /accounts/{accountId}/withdrawal
 */
export function useWithdrawal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ accountId, amount }: WithdrawalVariables) => {
      const request: WithdrawalRequest = { amount }
      return apiClient<TransactionResponse>(ENDPOINTS.accounts.withdrawal(accountId), {
        method: 'POST',
        body: JSON.stringify(request),
      })
    },
    onSuccess: (_data, variables) => {
      // Invalidate strictly the authoritative balance query for this account
      void queryClient.invalidateQueries({
        queryKey: auditKeys.balance(variables.accountId, null),
      })
    },
  })
}

/**
 * Mutation hook for transferring funds between two accounts.
 * Endpoint: POST /transfers
 */
export function useTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: TransferRequest) =>
      apiClient<TransferResponse>(ENDPOINTS.transfers.base(), {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    onSuccess: (_data, variables) => {
      // Invalidate authoritative balance queries for BOTH source and destination accounts
      void queryClient.invalidateQueries({
        queryKey: auditKeys.balance(variables.sourceAccountId, null),
      })
      void queryClient.invalidateQueries({
        queryKey: auditKeys.balance(variables.destinationAccountId, null),
      })
    },
  })
}
