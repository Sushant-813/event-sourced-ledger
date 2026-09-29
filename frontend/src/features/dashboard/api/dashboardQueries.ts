/**
 * Dashboard Query Hooks
 *
 * Dispatches 3 parallel lightweight requests to GET /accounts to aggregate
 * the 3 authoritative dashboard metrics:
 *   1. Total Accounts: GET /accounts?page=0&size=1
 *   2. Active Accounts: GET /accounts?status=ACTIVE&page=0&size=1
 *   3. Frozen Accounts: GET /accounts?status=FROZEN&page=0&size=1
 *
 * INVARIANTS:
 *   - Concurrent execution via Promise.all
 *   - Extracts totalElements strictly from PagedResponse<AccountResponse>
 *   - Zero client-side derived financial metrics
 *   - Uses queryKey with accountKeys.lists() prefix so existing account mutations
 *     automatically invalidate dashboard metrics cache.
 *
 * Source: FRONTEND_ARCHITECTURE.md §13, PROJECT_ROADMAP.md §Phase F5
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { ENDPOINTS } from '@/api/endpoints'
import { accountKeys } from '@/features/accounts/api/accountQueries'
import { AccountStatus } from '@/types/enums'
import type { PagedResponse } from '@/types/common'
import type { AccountResponse } from '@/features/accounts/types/account'

export interface DashboardMetrics {
  totalAccounts: number
  activeAccounts: number
  frozenAccounts: number
}

export const dashboardKeys = {
  all: () => [...accountKeys.lists(), 'dashboard-metrics'] as const,
  metrics: () => [...accountKeys.lists(), 'dashboard-metrics'] as const,
}

export function useDashboardMetrics(): UseQueryResult<DashboardMetrics, Error> {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: async () => {
      const [totalRes, activeRes, frozenRes] = await Promise.all([
        apiClient<PagedResponse<AccountResponse>>(ENDPOINTS.accounts.base(), {
          params: { page: 0, size: 1 },
        }),
        apiClient<PagedResponse<AccountResponse>>(ENDPOINTS.accounts.base(), {
          params: { status: AccountStatus.ACTIVE, page: 0, size: 1 },
        }),
        apiClient<PagedResponse<AccountResponse>>(ENDPOINTS.accounts.base(), {
          params: { status: AccountStatus.FROZEN, page: 0, size: 1 },
        }),
      ])

      return {
        totalAccounts: totalRes.totalElements,
        activeAccounts: activeRes.totalElements,
        frozenAccounts: frozenRes.totalElements,
      }
    },
  })
}
