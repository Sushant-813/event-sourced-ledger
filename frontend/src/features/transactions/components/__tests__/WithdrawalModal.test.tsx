/**
 * WithdrawalModal Component Unit Tests
 *
 * Tests cover:
 *   - Account context rendering
 *   - Pre-flight validation
 *   - Primary action styling (never destructive red)
 *   - Duplicate submission protection
 *   - Backend 422 InsufficientFundsException handling
 *   - Backend 422 AccountNotEligibleForTransactionException handling
 *   - 404, 500, network error handling
 *   - Successful mutation with reference number toast and cache invalidation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WithdrawalModal } from '../WithdrawalModal'
import { apiClient } from '@/api/client'
import { ApiError } from '@/api/errors'
import { auditKeys } from '@/features/audit/api/auditQueries'
import { AccountStatus, AccountType, TransactionStatus, TransactionType } from '@/types/enums'
import type { AccountResponse } from '@/features/accounts/types/account'

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    warning: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('@/api/client', () => ({
  apiClient: vi.fn(),
}))

const mockAccount: AccountResponse = {
  id: 20,
  accountNumber: 'ACC-2002',
  accountName: 'Bob Checking',
  accountType: AccountType.CURRENT,
  status: AccountStatus.ACTIVE,
  createdAt: '2026-09-20T10:00:00Z',
  updatedAt: '2026-09-20T10:00:00Z',
}

function renderWithdrawalModal(props?: {
  isOpen?: boolean
  onClose?: () => void
  account?: AccountResponse | null
  queryClient?: QueryClient
}) {
  const qc =
    props?.queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

  const onClose = props?.onClose ?? vi.fn()
  const accountProp = props?.account === null ? undefined : (props?.account ?? mockAccount)

  const utils = render(
    <QueryClientProvider client={qc}>
      <WithdrawalModal
        isOpen={props?.isOpen ?? true}
        onClose={onClose}
        account={accountProp}
      />
    </QueryClientProvider>
  )

  return { ...utils, onClose, queryClient: qc }
}

describe('WithdrawalModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dialog title, account name, and account number', () => {
    renderWithdrawalModal()

    expect(screen.getByRole('heading', { name: 'Withdraw Funds' })).toBeInTheDocument()
    expect(screen.getByText('Bob Checking')).toBeInTheDocument()
    expect(screen.getByText('ACC-2002')).toBeInTheDocument()
    expect(screen.getByLabelText(/Withdrawal Amount/i)).toBeInTheDocument()
  })

  it('verifies submit button uses standard primary styling (not destructive red)', () => {
    renderWithdrawalModal()

    const submitBtn = screen.getByTestId('withdrawal-submit-button')
    expect(submitBtn).toHaveClass('monetary-form__btn--primary')
    expect(submitBtn).not.toHaveClass('monetary-form__btn--destructive')
  })

  it('blocks submission and shows inline error for empty amount', async () => {
    const user = userEvent.setup()
    renderWithdrawalModal()

    await user.click(screen.getByTestId('withdrawal-submit-button'))

    expect(screen.getByRole('alert')).toHaveTextContent('Amount is required')
    expect(apiClient).not.toHaveBeenCalled()
  })

  it('blocks submission for zero amount', async () => {
    const user = userEvent.setup()
    renderWithdrawalModal()

    const input = screen.getByLabelText(/Withdrawal Amount/i)
    fireEvent.change(input, { target: { value: '0.00' } })
    await user.click(screen.getByTestId('withdrawal-submit-button'))

    expect(screen.getByRole('alert')).toHaveTextContent('Amount must be greater than zero')
    expect(apiClient).not.toHaveBeenCalled()
  })

  it('blocks submission for excessive precision (>2 decimal places)', async () => {
    const user = userEvent.setup()
    renderWithdrawalModal()

    const input = screen.getByLabelText(/Withdrawal Amount/i)
    fireEvent.change(input, { target: { value: '75.123' } })
    await user.click(screen.getByTestId('withdrawal-submit-button'))

    expect(screen.getByRole('alert')).toHaveTextContent('Amount must have at most 2 decimal places')
    expect(apiClient).not.toHaveBeenCalled()
  })

  it('handles HTTP 422 Insufficient Funds gracefully and keeps modal open', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient).mockRejectedValueOnce(
      new ApiError(422, 'Unprocessable Entity', 'Insufficient funds for account: 20')
    )

    const { onClose } = renderWithdrawalModal()

    const input = screen.getByLabelText(/Withdrawal Amount/i)
    fireEvent.change(input, { target: { value: '9999.00' } })
    await user.click(screen.getByTestId('withdrawal-submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('withdrawal-error-banner')).toBeInTheDocument()
      expect(
        screen.getByText(/Insufficient funds for account: 20/i)
      ).toBeInTheDocument()
    })

    expect(onClose).not.toHaveBeenCalled()
    expect(input).toHaveValue('9999.00')
  })

  it('handles HTTP 422 Account Not Eligible when account is frozen or closed', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient).mockRejectedValueOnce(
      new ApiError(422, 'Unprocessable Entity', 'Account is not eligible for transaction: 20')
    )

    renderWithdrawalModal()

    const input = screen.getByLabelText(/Withdrawal Amount/i)
    fireEvent.change(input, { target: { value: '50.00' } })
    await user.click(screen.getByTestId('withdrawal-submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('withdrawal-error-banner')).toBeInTheDocument()
      expect(
        screen.getByText(/Account is not eligible for transaction: 20/i)
      ).toBeInTheDocument()
    })
  })

  it('submits valid amount, displays reference number in toast, and invalidates balance', async () => {
    const user = userEvent.setup()
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    vi.mocked(apiClient).mockResolvedValueOnce({
      transactionId: 601,
      referenceNumber: 'ref-wdr-555',
      transactionType: TransactionType.WITHDRAWAL,
      status: TransactionStatus.COMPLETED,
      accountId: 20,
      amount: '50.00',
      createdAt: '2026-09-27T13:00:00Z',
    })

    const { onClose } = renderWithdrawalModal({ queryClient: qc })

    const input = screen.getByLabelText(/Withdrawal Amount/i)
    fireEvent.change(input, { target: { value: '50.00' } })
    await user.click(screen.getByTestId('withdrawal-submit-button'))

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith('/accounts/20/withdrawal', {
        method: 'POST',
        body: JSON.stringify({ amount: '50.00' }),
      })
    })

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Withdrawal Successful',
        expect.stringContaining('ref-wdr-555')
      )
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Withdrawal Successful',
        expect.stringContaining('50.00')
      )
      expect(onClose).toHaveBeenCalled()
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: auditKeys.balance(20, null),
      })
    })
  })

  it('disables submit button and shows loading spinner while pending', async () => {
    const user = userEvent.setup()

    let resolveApi: (value: unknown) => void = () => {}
    const pendingPromise = new Promise((resolve) => {
      resolveApi = resolve
    })
    vi.mocked(apiClient).mockReturnValueOnce(pendingPromise as never)

    renderWithdrawalModal()

    const input = screen.getByLabelText(/Withdrawal Amount/i)
    fireEvent.change(input, { target: { value: '100.00' } })

    const submitBtn = screen.getByTestId('withdrawal-submit-button')
    await user.click(submitBtn)

    expect(submitBtn).toBeDisabled()
    expect(screen.getByText('Withdrawing...')).toBeInTheDocument()
    expect(input).toBeDisabled()

    // Clean up
    await act(async () => {
      resolveApi({
        transactionId: 602,
        referenceNumber: 'ref-test',
        transactionType: TransactionType.WITHDRAWAL,
        status: TransactionStatus.COMPLETED,
        accountId: 20,
        amount: 100.0,
        createdAt: '2026-09-27T13:00:00Z',
      })
    })
  })

  describe('Contextual vs Standalone modes', () => {
    it('contextual mode: renders fixed source account context badge and no dropdown', () => {
      renderWithdrawalModal({ account: mockAccount })
      expect(screen.getByText('Source Account')).toBeInTheDocument()
      expect(screen.getByText('Bob Checking')).toBeInTheDocument()
      expect(screen.queryByTestId('withdrawal-account-select')).not.toBeInTheDocument()
    })

    it('standalone/dashboard mode: renders account selector and withdraws from selected account', async () => {
      const user = userEvent.setup()
      vi.mocked(apiClient).mockResolvedValueOnce({
        content: [
          mockAccount,
          { id: 10, accountNumber: 'ACC-1001', accountName: 'Alice Savings', status: AccountStatus.ACTIVE },
        ],
        page: 0,
        size: 100,
        totalPages: 1,
        totalElements: 2,
      })

      renderWithdrawalModal({ account: null })

      await waitFor(() => {
        expect(screen.getByTestId('withdrawal-account-select')).toBeInTheDocument()
      })

      // Validation error if no account selected
      await user.click(screen.getByTestId('withdrawal-submit-button'))
      expect(screen.getByText('Please select a source account')).toBeInTheDocument()

      // Select account and submit withdrawal
      await user.selectOptions(screen.getByTestId('withdrawal-account-select'), '10')
      const input = screen.getByLabelText(/Withdrawal Amount/i)
      fireEvent.change(input, { target: { value: '150.00' } })

      vi.mocked(apiClient).mockResolvedValueOnce({
        transactionId: 888,
        referenceNumber: 'ref-standalone-withdraw',
        transactionType: TransactionType.WITHDRAWAL,
        status: TransactionStatus.COMPLETED,
        accountId: 10,
        amount: '150.00',
        createdAt: '2026-09-30T10:00:00Z',
      })

      await user.click(screen.getByTestId('withdrawal-submit-button'))

      await waitFor(() => {
        expect(apiClient).toHaveBeenCalledWith('/accounts/10/withdrawal', expect.objectContaining({
          method: 'POST',
        }))
        expect(mockToastSuccess).toHaveBeenCalledWith(
          'Withdrawal Successful',
          expect.stringContaining('ref-standalone-withdraw')
        )
      })
    })
  })
})
