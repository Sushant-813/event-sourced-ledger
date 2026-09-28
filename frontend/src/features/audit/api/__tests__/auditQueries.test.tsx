import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  auditKeys,
  useAccountBalance,
  useAccountTransactions,
  useAccountLedger,
  useAccountEvents,
} from '../auditQueries'
import { apiClient } from '@/api/client'
import { EntryType, EventType, TransactionStatus, TransactionType } from '@/types/enums'
import type {
  AccountEventResponse,
  AccountLedgerEntryResponse,
  AccountTransactionResponse,
} from '../../types/audit'
import type { PagedResponse } from '@/types/common'

vi.mock('@/api/client', () => ({
  apiClient: vi.fn(),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('auditQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('auditKeys', () => {
    it('produces hierarchical query keys matching root prefixes for cache invalidation', () => {
      const accountId = '42'
      const txParams = { page: 1, size: 20 }
      const ledgerParams = { page: 0, size: 20, sortBy: 'createdAt' as const, direction: 'desc' as const, entryType: EntryType.CREDIT }
      const eventParams = { page: 0, size: 20, sortBy: 'occurredAt' as const, direction: 'asc' as const }

      expect(auditKeys.transactionsRoot(accountId)).toEqual(['accounts', '42', 'transactions'])
      expect(auditKeys.transactions(accountId, txParams)).toEqual([
        'accounts',
        '42',
        'transactions',
        txParams,
      ])

      expect(auditKeys.ledgerRoot(accountId)).toEqual(['accounts', '42', 'ledger'])
      expect(auditKeys.ledger(accountId, ledgerParams)).toEqual([
        'accounts',
        '42',
        'ledger',
        ledgerParams,
      ])

      expect(auditKeys.eventsRoot(accountId)).toEqual(['accounts', '42', 'events'])
      expect(auditKeys.events(accountId, eventParams)).toEqual([
        'accounts',
        '42',
        'events',
        eventParams,
      ])
    })
  })

  describe('useAccountTransactions', () => {
    it('fetches transactions with page and size parameters', async () => {
      const mockResponse: PagedResponse<AccountTransactionResponse> = {
        content: [
          {
            transactionId: 101,
            referenceNumber: 'TX-REF-001',
            transactionType: TransactionType.DEPOSIT,
            status: TransactionStatus.COMPLETED,
            createdAt: '2026-09-28T10:00:00Z',
          },
        ],
        page: 0,
        size: 20,
        totalPages: 1,
        totalElements: 1,
      }

      vi.mocked(apiClient).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(
        () => useAccountTransactions('10', { page: 0, size: 20 }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiClient).toHaveBeenCalledWith('/accounts/10/audit/transactions', {
        params: { page: 0, size: 20 },
      })
      expect(result.current.data).toEqual(mockResponse)
    })

    it('remains disabled when accountId is empty or undefined', () => {
      const { result } = renderHook(() => useAccountTransactions(''), {
        wrapper: createWrapper(),
      })

      expect(result.current.fetchStatus).toBe('idle')
      expect(apiClient).not.toHaveBeenCalled()
    })
  })

  describe('useAccountLedger', () => {
    it('fetches ledger entries with sorting and entryType filter', async () => {
      const mockResponse: PagedResponse<AccountLedgerEntryResponse> = {
        content: [
          {
            ledgerEntryId: 501,
            transactionId: 101,
            referenceNumber: 'TX-REF-001',
            entryType: EntryType.CREDIT,
            amount: '100.00',
            createdAt: '2026-09-28T10:00:00Z',
          },
        ],
        page: 0,
        size: 20,
        totalPages: 1,
        totalElements: 1,
      }

      vi.mocked(apiClient).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(
        () =>
          useAccountLedger('10', {
            page: 0,
            size: 20,
            sortBy: 'createdAt',
            direction: 'desc',
            entryType: EntryType.CREDIT,
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiClient).toHaveBeenCalledWith('/accounts/10/audit/ledger', {
        params: {
          page: 0,
          size: 20,
          sortBy: 'createdAt',
          direction: 'desc',
          entryType: EntryType.CREDIT,
        },
      })
      expect(result.current.data).toEqual(mockResponse)
    })
  })

  describe('useAccountEvents', () => {
    it('fetches domain events with sorting on occurredAt', async () => {
      const mockResponse: PagedResponse<AccountEventResponse> = {
        content: [
          {
            eventId: 1,
            eventType: EventType.ACCOUNT_CREATED,
            transactionId: null,
            payload: null,
            occurredAt: '2026-09-28T09:00:00Z',
          },
        ],
        page: 0,
        size: 20,
        totalPages: 1,
        totalElements: 1,
      }

      vi.mocked(apiClient).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(
        () =>
          useAccountEvents('10', {
            page: 0,
            size: 20,
            sortBy: 'occurredAt',
            direction: 'asc',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiClient).toHaveBeenCalledWith('/accounts/10/audit/events', {
        params: {
          page: 0,
          size: 20,
          sortBy: 'occurredAt',
          direction: 'asc',
        },
      })
      expect(result.current.data).toEqual(mockResponse)
    })
  })

  describe('useAccountBalance', () => {
    it('fetches balance from /audit/balance', async () => {
      vi.mocked(apiClient).mockResolvedValueOnce({ accountId: 10, balance: '250.00', asOf: null })

      const { result } = renderHook(() => useAccountBalance('10'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(apiClient).toHaveBeenCalledWith('/accounts/10/audit/balance')
      expect(result.current.data).toEqual({ accountId: 10, balance: '250.00', asOf: null })
    })
  })
})
