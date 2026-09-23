/**
 * Account Feature Types
 *
 * Domain DTOs and query parameters for Account features.
 * Imports shared enums from @/types/enums (does not duplicate them).
 * Matches backend contracts in docs/API_GUIDELINES.md §21.
 */
import { AccountStatus, AccountType } from '@/types/enums'
import type { PaginationParams, SortParams } from '@/types/common'

/**
 * Account representation returned by the backend.
 * API_GUIDELINES.md §21 (GET /accounts, POST /accounts, GET /accounts/{id}).
 */
export interface AccountResponse {
  id: number
  accountNumber: string
  accountName: string
  accountType: AccountType
  status: AccountStatus
  createdAt: string
  updatedAt: string
}

/**
 * Request payload for creating a new account.
 * API_GUIDELINES.md §21 (POST /accounts).
 */
export interface CreateAccountRequest {
  accountNumber: string
  accountName: string
  accountType: AccountType
}

/**
 * Query parameters for filtering and paginating the account directory.
 * API_GUIDELINES.md §11, §12, §21.
 */
export interface AccountListParams extends PaginationParams, SortParams {
  status?: AccountStatus
  accountType?: AccountType
}

/**
 * Shared context provided by AccountLayout to child sub-views via useOutletContext.
 */
export interface AccountOutletContext {
  account: AccountResponse
  refetchAccount: () => Promise<unknown>
  balanceString: string
  isBalanceLoading: boolean
  balanceError: unknown
  refetchBalance: () => Promise<unknown>
}
