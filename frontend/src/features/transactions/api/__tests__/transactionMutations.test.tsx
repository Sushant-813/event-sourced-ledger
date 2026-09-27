/**
 * Transaction Mutations Unit Tests
 *
 * Verifies:
 *   - useDeposit, useWithdrawal, useTransfer mutation functions
 *   - Accurate API endpoints and serialized request payloads
 *   - Invalidation strictly of auditKeys.balance (and BOTH accounts on transfer)
 *   - Non-invalidation of account metadata queries (accountKeys.detail, accountKeys.lists)
 */
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDeposit, useWithdrawal, useTransfer } from '../transactionMutations'
import { apiClient } from '@/api/client'
import { auditKeys } from '@/features/audit/api/auditQueries'
import { accountKeys } from '@/features/accounts/api/accountQueries'
import { TransactionStatus, TransactionType } from '@/types/enums'

vi.mock('@/api/client', () => ({
  apiClient: vi.fn(),
}))

function createTestWrapper(queryClient: QueryClient) {
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('transactionMutations', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  describe('useDeposit', () => {
    it('dispatches POST /accounts/{accountId}/deposit with amount and invalidates balance query', async () => {
      const mockResponse = {
        transactionId: 101,
        referenceNumber: 'ref-deposit-123',
        transactionType: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        accountId: 2,
        amount: '100.50',
        createdAt: '2026-09-27T10:00:00Z',
      }
      vi.mocked(apiClient).mockResolvedValueOnce(mockResponse)

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useDeposit(), {
        wrapper: createTestWrapper(queryClient),
      })

      const res = await result.current.mutateAsync({ accountId: 2, amount: '100.50' })

      expect(apiClient).toHaveBeenCalledWith('/accounts/2/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount: '100.50' }),
      })
      expect(res).toEqual(mockResponse)

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: auditKeys.balance(2, null),
        })
      })

      // Verify that account metadata queries were NOT invalidated
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: accountKeys.detail(2),
      })
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: accountKeys.lists(),
      })
    })

    it('propagates API error when deposit fails', async () => {
      vi.mocked(apiClient).mockRejectedValueOnce(new Error('Deposit rejected'))

      const { result } = renderHook(() => useDeposit(), {
        wrapper: createTestWrapper(queryClient),
      })

      await expect(
        result.current.mutateAsync({ accountId: 2, amount: '50.00' })
      ).rejects.toThrow('Deposit rejected')
    })
  })

  describe('useWithdrawal', () => {
    it('dispatches POST /accounts/{accountId}/withdrawal with amount and invalidates balance query', async () => {
      const mockResponse = {
        transactionId: 102,
        referenceNumber: 'ref-withdrawal-456',
        transactionType: TransactionType.WITHDRAWAL,
        status: TransactionStatus.COMPLETED,
        accountId: 2,
        amount: '50.00',
        createdAt: '2026-09-27T11:00:00Z',
      }
      vi.mocked(apiClient).mockResolvedValueOnce(mockResponse)

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useWithdrawal(), {
        wrapper: createTestWrapper(queryClient),
      })

      const res = await result.current.mutateAsync({ accountId: 2, amount: '50.00' })

      expect(apiClient).toHaveBeenCalledWith('/accounts/2/withdrawal', {
        method: 'POST',
        body: JSON.stringify({ amount: '50.00' }),
      })
      expect(res).toEqual(mockResponse)

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: auditKeys.balance(2, null),
        })
      })

      // Verify that account metadata queries were NOT invalidated
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: accountKeys.detail(2),
      })
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: accountKeys.lists(),
      })
    })

    it('propagates API error when withdrawal fails', async () => {
      vi.mocked(apiClient).mockRejectedValueOnce(new Error('Insufficient funds'))

      const { result } = renderHook(() => useWithdrawal(), {
        wrapper: createTestWrapper(queryClient),
      })

      await expect(
        result.current.mutateAsync({ accountId: 2, amount: '9999.00' })
      ).rejects.toThrow('Insufficient funds')
    })
  })

  describe('useTransfer', () => {
    it('dispatches POST /transfers and invalidates balance queries for BOTH source and destination accounts', async () => {
      const mockResponse = {
        transactionId: 103,
        referenceNumber: 'ref-transfer-789',
        transactionType: TransactionType.TRANSFER,
        status: TransactionStatus.COMPLETED,
        sourceAccountId: 2,
        destinationAccountId: 5,
        amount: '75.00',
        createdAt: '2026-09-27T12:00:00Z',
      }
      vi.mocked(apiClient).mockResolvedValueOnce(mockResponse)

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useTransfer(), {
        wrapper: createTestWrapper(queryClient),
      })

      const res = await result.current.mutateAsync({
        sourceAccountId: 2,
        destinationAccountId: 5,
        amount: '75.00',
      })

      expect(apiClient).toHaveBeenCalledWith('/transfers', {
        method: 'POST',
        body: JSON.stringify({
          sourceAccountId: 2,
          destinationAccountId: 5,
          amount: '75.00',
        }),
      })
      expect(res).toEqual(mockResponse)

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: auditKeys.balance(2, null),
        })
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: auditKeys.balance(5, null),
        })
      })

      // Verify account lists/details are not invalidated
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: accountKeys.detail(2),
      })
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: accountKeys.detail(5),
      })
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: accountKeys.lists(),
      })
    })

    it('propagates API error when transfer fails', async () => {
      vi.mocked(apiClient).mockRejectedValueOnce(new Error('Invalid transfer'))

      const { result } = renderHook(() => useTransfer(), {
        wrapper: createTestWrapper(queryClient),
      })

      await expect(
        result.current.mutateAsync({
          sourceAccountId: 2,
          destinationAccountId: 2,
          amount: '10.00',
        })
      ).rejects.toThrow('Invalid transfer')
    })
  })
})
