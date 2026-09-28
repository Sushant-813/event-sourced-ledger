import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AccountTransactionsPage } from '../AccountTransactionsPage'
import { apiClient } from '@/api/client'
import { ApiError } from '@/api/errors'
import { AccountStatus, AccountType, TransactionStatus, TransactionType } from '@/types/enums'
import type { AccountResponse } from '@/features/accounts/types/account'
import type { AccountTransactionResponse } from '../../types/transaction'
import type { PagedResponse } from '@/types/common'

vi.mock('@/api/client', () => ({
  apiClient: vi.fn(),
}))

const mockAccount: AccountResponse = {
  id: 10,
  accountNumber: 'ACC-1001',
  accountName: 'Alice Savings',
  accountType: AccountType.SAVINGS,
  status: AccountStatus.ACTIVE,
  createdAt: '2026-09-20T10:00:00Z',
  updatedAt: '2026-09-20T10:00:00Z',
}

vi.mock('@/routes/AccountLayout', () => ({
  useAccountContext: () => ({
    account: mockAccount,
    refetchAccount: vi.fn(),
    balanceString: '1,000.00',
    isBalanceLoading: false,
    balanceError: null,
    refetchBalance: vi.fn(),
  }),
}))

function renderTransactionsPage(initialUrl = '/accounts/10/transactions') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <Routes>
          <Route
            path="/accounts/:accountId/transactions"
            element={<AccountTransactionsPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AccountTransactionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page header and transactions table with expected columns and ZERO amount column', async () => {
    const mockData: PagedResponse<AccountTransactionResponse> = {
      content: [
        {
          transactionId: 101,
          referenceNumber: 'TX-REF-101',
          transactionType: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          createdAt: '2026-09-20T10:00:00Z',
        },
      ],
      page: 0,
      size: 20,
      totalPages: 1,
      totalElements: 1,
    }

    vi.mocked(apiClient).mockResolvedValueOnce(mockData)

    renderTransactionsPage()

    expect(screen.getByRole('heading', { level: 2, name: 'Transactions' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('TX-REF-101')).toBeInTheDocument()
    })

    // Verify expected table headers
    expect(screen.getByRole('columnheader', { name: 'Date' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Reference #' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Type' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument()

    // CRITICAL INVARIANT: Amount column must NOT be present
    expect(screen.queryByRole('columnheader', { name: /amount/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /debit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /credit/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/₹/)).not.toBeInTheDocument()
  })

  it('displays empty state when account has 0 transactions', async () => {
    const emptyResponse: PagedResponse<AccountTransactionResponse> = {
      content: [],
      page: 0,
      size: 20,
      totalPages: 0,
      totalElements: 0,
    }

    vi.mocked(apiClient).mockResolvedValueOnce(emptyResponse)

    renderTransactionsPage()

    await waitFor(() => {
      expect(screen.getByText('No Transactions Found')).toBeInTheDocument()
    })
  })

  it('displays ErrorDisplay on API failure and allows retry', async () => {
    vi.mocked(apiClient).mockRejectedValueOnce(
      new ApiError(500, 'Server Error', 'Failed to retrieve transactions', '/accounts/10/audit/transactions')
    )

    renderTransactionsPage()

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Transactions')).toBeInTheDocument()
      expect(screen.getByText('Failed to retrieve transactions')).toBeInTheDocument()
    })

    const retryBtn = screen.getByRole('button', { name: /retry/i })
    expect(retryBtn).toBeInTheDocument()

    // When clicking retry, apiClient should be called again
    vi.mocked(apiClient).mockResolvedValueOnce({
      content: [],
      page: 0,
      size: 20,
      totalPages: 0,
      totalElements: 0,
    })

    const user = userEvent.setup()
    await user.click(retryBtn)

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledTimes(2)
    })
  })

  it('opens TransactionDetailModal with transaction information when clicking View Details', async () => {
    const mockData: PagedResponse<AccountTransactionResponse> = {
      content: [
        {
          transactionId: 202,
          referenceNumber: 'TX-REF-202',
          transactionType: TransactionType.TRANSFER,
          status: TransactionStatus.COMPLETED,
          createdAt: '2026-09-22T14:30:00Z',
        },
      ],
      page: 0,
      size: 20,
      totalPages: 1,
      totalElements: 1,
    }

    vi.mocked(apiClient).mockResolvedValueOnce(mockData)

    const user = userEvent.setup()
    renderTransactionsPage()

    await waitFor(() => {
      expect(screen.getByText('TX-REF-202')).toBeInTheDocument()
    })

    const detailsBtn = screen.getByRole('button', { name: /view details for transaction tx-ref-202/i })
    await user.click(detailsBtn)

    // Modal opens
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Internal Transaction ID')).toBeInTheDocument()
      expect(screen.getByText('202')).toBeInTheDocument()
      expect(screen.getByText('Account Context')).toBeInTheDocument()
      expect(screen.getByText('Alice Savings')).toBeInTheDocument()
    })

    // Close modal
    const closeBtn = screen.getByRole('button', { name: 'Close' })
    await user.click(closeBtn)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
