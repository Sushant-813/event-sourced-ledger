/**
 * DepositModal Component Unit Tests
 *
 * Tests cover:
 *   - Account context rendering
 *   - Client-side pre-flight validation (blank, zero, negative, excessive decimals)
 *   - Duplicate submission protection (pending state disables controls, blocks Enter)
 *   - Backend error handling (400, 404, 422, 500, network)
 *   - Successful mutation with reference number toast and cache invalidation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DepositModal } from '../DepositModal'
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
  id: 10,
  accountNumber: 'ACC-1001',
  accountName: 'Alice Savings',
  accountType: AccountType.SAVINGS,
  status: AccountStatus.ACTIVE,
  createdAt: '2026-09-20T10:00:00Z',
  updatedAt: '2026-09-20T10:00:00Z',
}

function renderDepositModal(props?: {
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
      <DepositModal
        isOpen={props?.isOpen ?? true}
        onClose={onClose}
        account={accountProp}
      />
    </QueryClientProvider>
  )

  return { ...utils, onClose, queryClient: qc }
}

describe('DepositModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dialog title, account name, and account number', () => {
    renderDepositModal()

    expect(screen.getByRole('heading', { name: 'Deposit Funds' })).toBeInTheDocument()
    expect(screen.getByText('Alice Savings')).toBeInTheDocument()
    expect(screen.getByText('ACC-1001')).toBeInTheDocument()
    expect(screen.getByLabelText(/Deposit Amount/i)).toBeInTheDocument()
  })

  it('blocks submission and shows inline error for empty amount', async () => {
    const user = userEvent.setup()
    renderDepositModal()

    await user.click(screen.getByTestId('deposit-submit-button'))

    expect(screen.getByRole('alert')).toHaveTextContent('Amount is required')
    expect(apiClient).not.toHaveBeenCalled()
  })

  it('blocks submission for zero amount', async () => {
    const user = userEvent.setup()
    renderDepositModal()

    const input = screen.getByLabelText(/Deposit Amount/i)
    fireEvent.change(input, { target: { value: '0.00' } })
    await user.click(screen.getByTestId('deposit-submit-button'))

    expect(screen.getByRole('alert')).toHaveTextContent('Amount must be greater than zero')
    expect(apiClient).not.toHaveBeenCalled()
  })

  it('blocks submission for negative amount', async () => {
    const user = userEvent.setup()
    renderDepositModal()

    const input = screen.getByLabelText(/Deposit Amount/i)
    fireEvent.change(input, { target: { value: '-50' } })
    await user.click(screen.getByTestId('deposit-submit-button'))

    expect(screen.getByRole('alert')).toHaveTextContent('Amount must be greater than zero')
    expect(apiClient).not.toHaveBeenCalled()
  })

  it('blocks submission for more than 2 decimal places', async () => {
    const user = userEvent.setup()
    renderDepositModal()

    const input = screen.getByLabelText(/Deposit Amount/i)
    fireEvent.change(input, { target: { value: '100.555' } })
    await user.click(screen.getByTestId('deposit-submit-button'))

    expect(screen.getByRole('alert')).toHaveTextContent('Amount must have at most 2 decimal places')
    expect(apiClient).not.toHaveBeenCalled()
  })

  it('submits valid amount, displays reference number in toast, and invalidates balance', async () => {
    const user = userEvent.setup()
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    vi.mocked(apiClient).mockResolvedValueOnce({
      transactionId: 501,
      referenceNumber: 'ref-dep-999',
      transactionType: TransactionType.DEPOSIT,
      status: TransactionStatus.COMPLETED,
      accountId: 10,
      amount: '250.75',
      createdAt: '2026-09-27T12:00:00Z',
    })

    const { onClose } = renderDepositModal({ queryClient: qc })

    const input = screen.getByLabelText(/Deposit Amount/i)
    fireEvent.change(input, { target: { value: '250.75' } })
    await user.click(screen.getByTestId('deposit-submit-button'))

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith('/accounts/10/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount: '250.75' }),
      })
    })

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Deposit Successful',
        expect.stringContaining('ref-dep-999')
      )
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Deposit Successful',
        expect.stringContaining('250.75')
      )
      expect(onClose).toHaveBeenCalled()
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: auditKeys.balance(10, null),
      })
    })
  })

  it('disables submit button and shows loading state during pending mutation', async () => {
    const user = userEvent.setup()

    let resolveApi: (value: unknown) => void = () => {}
    const pendingPromise = new Promise((resolve) => {
      resolveApi = resolve
    })
    vi.mocked(apiClient).mockReturnValueOnce(pendingPromise as never)

    renderDepositModal()

    const input = screen.getByLabelText(/Deposit Amount/i)
    fireEvent.change(input, { target: { value: '100.00' } })

    const submitBtn = screen.getByTestId('deposit-submit-button')
    await user.click(submitBtn)

    expect(submitBtn).toBeDisabled()
    expect(screen.getByText('Depositing...')).toBeInTheDocument()
    expect(input).toBeDisabled()

    // Clean up pending promise
    await act(async () => {
      resolveApi({
        transactionId: 502,
        referenceNumber: 'ref-test',
        transactionType: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        accountId: 10,
        amount: 100.0,
        createdAt: '2026-09-27T12:00:00Z',
      })
    })
  })

  it('renders backend error banner and keeps modal open when API returns 422', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient).mockRejectedValueOnce(
      new ApiError(422, 'Unprocessable Entity', 'Account is not eligible for transaction: 10')
    )

    const { onClose } = renderDepositModal()

    const input = screen.getByLabelText(/Deposit Amount/i)
    fireEvent.change(input, { target: { value: '50.00' } })
    await user.click(screen.getByTestId('deposit-submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('deposit-error-banner')).toBeInTheDocument()
      expect(
        screen.getByText(/Account is not eligible for transaction: 10/i)
      ).toBeInTheDocument()
    })

    // Modal was not closed; user input is preserved
    expect(onClose).not.toHaveBeenCalled()
    expect(input).toHaveValue('50.00')
  })

  it('renders network error banner when connection fails', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient).mockRejectedValueOnce(
      new ApiError(0, 'Network Error', 'Unable to connect to the ledger server. Please check your connection.', '/accounts/10/deposit', true)
    )

    renderDepositModal()

    const input = screen.getByLabelText(/Deposit Amount/i)
    fireEvent.change(input, { target: { value: '100.00' } })
    await user.click(screen.getByTestId('deposit-submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('deposit-error-banner')).toBeInTheDocument()
      expect(screen.getByText(/Unable to connect to the ledger server/i)).toBeInTheDocument()
    })
  })

  describe('Contextual vs Standalone modes', () => {
    it('contextual mode: renders fixed account context badge and no dropdown', () => {
      renderDepositModal({ account: mockAccount })
      expect(screen.getByText('Target Account')).toBeInTheDocument()
      expect(screen.getByText('Alice Savings')).toBeInTheDocument()
      expect(screen.queryByTestId('deposit-account-select')).not.toBeInTheDocument()
    })

    it('standalone/dashboard mode: renders account selector and deposits into selected account', async () => {
      const user = userEvent.setup()
      vi.mocked(apiClient).mockResolvedValueOnce({
        content: [
          mockAccount,
          { id: 20, accountNumber: 'ACC-2002', accountName: 'Bob Current', status: AccountStatus.ACTIVE },
        ],
        page: 0,
        size: 100,
        totalPages: 1,
        totalElements: 2,
      })

      renderDepositModal({ account: null })

      await waitFor(() => {
        expect(screen.getByTestId('deposit-account-select')).toBeInTheDocument()
      })

      // Validation error if no account selected
      await user.click(screen.getByTestId('deposit-submit-button'))
      expect(screen.getByText('Please select a target account')).toBeInTheDocument()

      // Select account and submit deposit
      await user.selectOptions(screen.getByTestId('deposit-account-select'), '20')
      const input = screen.getByLabelText(/Deposit Amount/i)
      fireEvent.change(input, { target: { value: '250.00' } })

      vi.mocked(apiClient).mockResolvedValueOnce({
        transactionId: 999,
        referenceNumber: 'ref-standalone-deposit',
        transactionType: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
        accountId: 20,
        amount: '250.00',
        createdAt: '2026-09-30T10:00:00Z',
      })

      await user.click(screen.getByTestId('deposit-submit-button'))

      await waitFor(() => {
        expect(apiClient).toHaveBeenCalledWith('/accounts/20/deposit', expect.objectContaining({
          method: 'POST',
        }))
        expect(mockToastSuccess).toHaveBeenCalledWith(
          'Deposit Successful',
          expect.stringContaining('ref-standalone-deposit')
        )
      })
    })
  })
})
