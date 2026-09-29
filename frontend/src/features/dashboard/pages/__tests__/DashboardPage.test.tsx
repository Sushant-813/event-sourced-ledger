import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from '../DashboardPage'
import { apiClient } from '@/api/client'
import { AccountStatus, AccountType } from '@/types/enums'

vi.mock('@/api/client', () => ({
  apiClient: vi.fn(),
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}))

const mockAccountsList = {
  content: [
    {
      id: 10,
      accountNumber: 'ACC-1001',
      accountName: 'Alice Savings',
      accountType: AccountType.SAVINGS,
      status: AccountStatus.ACTIVE,
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-09-20T10:00:00Z',
    },
  ],
  page: 0,
  size: 100,
  totalPages: 1,
  totalElements: 1,
}

function renderDashboardPage(queryClient?: QueryClient) {
  const qc =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders exactly three metric cards with authoritative counts', async () => {
    vi.mocked(apiClient)
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 124, totalElements: 124 })
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 117, totalElements: 117 })
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 5, totalElements: 5 })

    renderDashboardPage()

    await waitFor(() => {
      expect(screen.getByTestId('metric-total-accounts')).toBeInTheDocument()
      expect(screen.getByText('124')).toBeInTheDocument()
      expect(screen.getByText('117')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  it('displays loading indicator while queries are inflight', () => {
    vi.mocked(apiClient).mockImplementation(() => new Promise(() => {}))

    renderDashboardPage()

    expect(screen.getAllByText('Fetching metric...')).toHaveLength(3)
  })

  it('displays error state and retries on demand', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient).mockRejectedValue(new Error('Network error'))

    renderDashboardPage()

    await waitFor(() => {
      expect(screen.getAllByText('Failed to load metric')).toHaveLength(3)
    })

    const retryBtns = screen.getAllByRole('button', { name: /Retry loading/i })
    expect(retryBtns.length).toBeGreaterThan(0)

    vi.mocked(apiClient)
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 10, totalElements: 10 })
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 8, totalElements: 8 })
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 2, totalElements: 2 })

    await user.click(retryBtns[0]!)

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument()
    })
  })

  it('clicking "Create Account" opens CreateAccountModal', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient)
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 0, totalElements: 0 })
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 0, totalElements: 0 })
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 0, totalElements: 0 })

    renderDashboardPage()

    const createBtn = screen.getByTestId('quick-action-create-account')
    await user.click(createBtn)

    expect(screen.getByRole('dialog', { name: /Create New Account/i })).toBeInTheDocument()
  })

  it('clicking "Deposit" opens DepositModal in standalone mode with account selector', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient)
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 1, totalElements: 1 })
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 1, totalElements: 1 })
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 0, totalElements: 0 })
      .mockResolvedValueOnce(mockAccountsList) // for active accounts selector in modal

    renderDashboardPage()

    const depositBtn = screen.getByTestId('quick-action-deposit')
    await user.click(depositBtn)

    expect(screen.getByRole('dialog', { name: /Deposit Funds/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByTestId('deposit-account-select')).toBeInTheDocument()
    })
  })

  it('clicking "Withdrawal" opens WithdrawalModal in standalone mode with account selector', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient)
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 1, totalElements: 1 })
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 1, totalElements: 1 })
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 0, totalElements: 0 })
      .mockResolvedValueOnce(mockAccountsList) // for active accounts selector in modal

    renderDashboardPage()

    const withdrawBtn = screen.getByTestId('quick-action-withdrawal')
    await user.click(withdrawBtn)

    expect(screen.getByRole('dialog', { name: /Withdraw Funds/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByTestId('withdrawal-account-select')).toBeInTheDocument()
    })
  })

  it('clicking "Transfer" opens TransferModal in standalone mode with source/destination selectors', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient)
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 1, totalElements: 1 })
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 1, totalElements: 1 })
      .mockResolvedValueOnce({ content: [], page: 0, size: 1, totalPages: 0, totalElements: 0 })
      .mockResolvedValueOnce(mockAccountsList) // for accounts in modal

    renderDashboardPage()

    const transferBtn = screen.getByTestId('quick-action-transfer')
    await user.click(transferBtn)

    expect(screen.getByRole('dialog', { name: /Transfer Funds/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByTestId('transfer-source-select')).toBeInTheDocument()
    })
  })
})
