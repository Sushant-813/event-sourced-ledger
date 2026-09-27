/**
 * AccountOverviewPage Monetary Integration Tests
 *
 * Tests cover:
 *   - Monetary operations buttons (Deposit, Withdraw, Transfer) shown for ACTIVE accounts
 *   - Monetary operations suspended for FROZEN accounts
 *   - Monetary operations unavailable for CLOSED accounts
 *   - Clicking Deposit opens DepositModal
 *   - Clicking Withdraw opens WithdrawalModal
 *   - Clicking Transfer opens TransferModal
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AccountOverviewPage } from '../AccountOverviewPage'
import { AccountStatus, AccountType } from '@/types/enums'
import type { AccountResponse, AccountOutletContext } from '../../types/account'

const mockAccount: AccountResponse = {
  id: 10,
  accountNumber: 'ACC-1001',
  accountName: 'Alice Savings',
  accountType: AccountType.SAVINGS,
  status: AccountStatus.ACTIVE,
  createdAt: '2026-09-20T10:00:00Z',
  updatedAt: '2026-09-20T10:00:00Z',
}

let mockContextValue: AccountOutletContext = {
  account: mockAccount,
  refetchAccount: vi.fn(),
  balanceString: '1,000.00',
  isBalanceLoading: false,
  balanceError: null,
  refetchBalance: vi.fn(),
}

vi.mock('@/routes/AccountLayout', () => ({
  useAccountContext: () => mockContextValue,
}))

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('@/api/client', () => ({
  apiClient: vi.fn().mockResolvedValue({ content: [], page: 0, size: 100, totalElements: 0, totalPages: 1 }),
}))

function renderPage(queryClient?: QueryClient) {
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
      <AccountOverviewPage />
    </QueryClientProvider>
  )
}

describe('AccountOverviewPage Monetary Operations Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockContextValue = {
      account: { ...mockAccount, status: AccountStatus.ACTIVE },
      refetchAccount: vi.fn(),
      balanceString: '1,000.00',
      isBalanceLoading: false,
      balanceError: null,
      refetchBalance: vi.fn(),
    }
  })

  it('renders Deposit, Withdraw, and Transfer buttons when account is ACTIVE', () => {
    renderPage()

    expect(screen.getByTestId('open-deposit-button')).toBeInTheDocument()
    expect(screen.getByTestId('open-withdrawal-button')).toBeInTheDocument()
    expect(screen.getByTestId('open-transfer-button')).toBeInTheDocument()
  })

  it('opens DepositModal when Deposit Funds button is clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByRole('heading', { name: 'Deposit Funds' })).not.toBeInTheDocument()

    await user.click(screen.getByTestId('open-deposit-button'))

    expect(screen.getByRole('heading', { name: 'Deposit Funds' })).toBeInTheDocument()
  })

  it('opens WithdrawalModal when Withdraw Funds button is clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByRole('heading', { name: 'Withdraw Funds' })).not.toBeInTheDocument()

    await user.click(screen.getByTestId('open-withdrawal-button'))

    expect(screen.getByRole('heading', { name: 'Withdraw Funds' })).toBeInTheDocument()
  })

  it('opens TransferModal when Transfer Funds button is clicked', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByRole('heading', { name: 'Transfer Funds' })).not.toBeInTheDocument()

    await user.click(screen.getByTestId('open-transfer-button'))

    expect(screen.getByRole('heading', { name: 'Transfer Funds' })).toBeInTheDocument()
  })

  it('does NOT render monetary buttons when account is FROZEN', () => {
    mockContextValue = {
      ...mockContextValue,
      account: { ...mockAccount, status: AccountStatus.FROZEN },
    }
    renderPage()

    expect(screen.queryByTestId('open-deposit-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('open-withdrawal-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('open-transfer-button')).not.toBeInTheDocument()
    expect(
      screen.getByText(/Monetary operations are suspended while the account is frozen/i)
    ).toBeInTheDocument()
  })

  it('does NOT render monetary buttons when account is CLOSED', () => {
    mockContextValue = {
      ...mockContextValue,
      account: { ...mockAccount, status: AccountStatus.CLOSED },
    }
    renderPage()

    expect(screen.queryByTestId('open-deposit-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('open-withdrawal-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('open-transfer-button')).not.toBeInTheDocument()
    expect(
      screen.getByText(/Monetary operations are unavailable for closed accounts/i)
    ).toBeInTheDocument()
  })
})
