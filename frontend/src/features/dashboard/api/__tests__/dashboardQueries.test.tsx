import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDashboardMetrics, dashboardKeys } from '../dashboardQueries'
import { apiClient } from '@/api/client'
import { accountKeys } from '@/features/accounts/api/accountQueries'
import { AccountStatus } from '@/types/enums'

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

describe('dashboardQueries', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
  })

  describe('dashboardKeys', () => {
    it('uses a key with accountKeys.lists() prefix for automatic cache invalidation', () => {
      const key = dashboardKeys.metrics()
      expect(key).toEqual([...accountKeys.lists(), 'dashboard-metrics'])
    })
  })

  describe('useDashboardMetrics', () => {
    it('dispatches 3 parallel GET /accounts requests with exact query parameters', async () => {
      const mockTotalRes = { content: [], page: 0, size: 1, totalPages: 124, totalElements: 124 }
      const mockActiveRes = { content: [], page: 0, size: 1, totalPages: 117, totalElements: 117 }
      const mockFrozenRes = { content: [], page: 0, size: 1, totalPages: 5, totalElements: 5 }

      vi.mocked(apiClient)
        .mockResolvedValueOnce(mockTotalRes)
        .mockResolvedValueOnce(mockActiveRes)
        .mockResolvedValueOnce(mockFrozenRes)

      const { result } = renderHook(() => useDashboardMetrics(), {
        wrapper: createTestWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(apiClient).toHaveBeenCalledTimes(3)
      expect(apiClient).toHaveBeenNthCalledWith(1, '/accounts', {
        params: { page: 0, size: 1 },
      })
      expect(apiClient).toHaveBeenNthCalledWith(2, '/accounts', {
        params: { status: AccountStatus.ACTIVE, page: 0, size: 1 },
      })
      expect(apiClient).toHaveBeenNthCalledWith(3, '/accounts', {
        params: { status: AccountStatus.FROZEN, page: 0, size: 1 },
      })

      expect(result.current.data).toEqual({
        totalAccounts: 124,
        activeAccounts: 117,
        frozenAccounts: 5,
      })
    })

    it('handles query failure if any request rejects', async () => {
      vi.mocked(apiClient).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useDashboardMetrics(), {
        wrapper: createTestWrapper(queryClient),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })
  })
})
