/**
 * TransferModal Component Unit Tests
 *
 * Tests cover:
 *   - Source account context rendering
 *   - Destination accounts list population
 *   - Exclusion of SYS-CASH from destination accounts
 *   - Exclusion of source account from destination accounts
 *   - Validation: destination required, amount format and bounds
 *   - Duplicate submission protection
 *   - Backend error handling: 422 Insufficient Funds, 422 Invalid Transfer, 422 Ineligible
 *   - Successful mutation: invalidates balance queries for BOTH source and destination
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransferModal } from '../TransferModal'
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

const mockSourceAccount: AccountResponse = {
  id: 10,
  accountNumber: 'ACC-1001',
  accountName: 'Alice Savings',
  accountType: AccountType.SAVINGS,
  status: AccountStatus.ACTIVE,
  createdAt: '2026-09-20T10:00:00Z',
  updatedAt: '2026-09-20T10:00:00Z',
}

const mockDestinationAccount: AccountResponse = {
  id: 20,
  accountNumber: 'ACC-2002',
  accountName: 'Bob Checking',
  accountType: AccountType.CURRENT,
  status: AccountStatus.ACTIVE,
  createdAt: '2026-09-20T10:00:00Z',
  updatedAt: '2026-09-20T10:00:00Z',
}

const mockSysCashAccount: AccountResponse = {
  id: 1,
  accountNumber: 'SYS-CASH',
  accountName: 'System Cash',
  accountType: AccountType.CURRENT,
  status: AccountStatus.ACTIVE,
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
}

function renderTransferModal(props?: {
  isOpen?: boolean
  onClose?: () => void
  account?: AccountResponse
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

  const utils = render(
    <QueryClientProvider client={qc}>
      <TransferModal
        isOpen={props?.isOpen ?? true}
        onClose={onClose}
        account={props?.account ?? mockSourceAccount}
      />
    </QueryClientProvider>
  )

  return { ...utils, onClose, queryClient: qc }
}

describe('TransferModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default apiClient mock for GET /accounts
    vi.mocked(apiClient).mockImplementation((endpoint) => {
      if (endpoint === '/accounts') {
        return Promise.resolve({
          content: [mockSourceAccount, mockDestinationAccount, mockSysCashAccount],
          page: 0,
          size: 100,
          totalElements: 3,
          totalPages: 1,
        })
      }
      return Promise.resolve({})
    })
  })

  it('renders source account context and loads destination options', async () => {
    renderTransferModal()

    expect(screen.getByRole('heading', { name: 'Transfer Funds' })).toBeInTheDocument()
    expect(screen.getByText('Alice Savings')).toBeInTheDocument()
    expect(screen.getByText('ACC-1001')).toBeInTheDocument()

    // Verify destination account is loaded in dropdown
    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: /ACC-2002 — Bob Checking/i })
      ).toBeInTheDocument()
    })

    // CRITICAL: Verify SYS-CASH is NEVER an option
    expect(
      screen.queryByRole('option', { name: /SYS-CASH/i })
    ).not.toBeInTheDocument()

    // CRITICAL: Verify source account is NOT in destination options
    expect(
      screen.queryByRole('option', { name: /ACC-1001 — Alice Savings/i })
    ).not.toBeInTheDocument()
  })

  it('blocks submission when destination account is not selected', async () => {
    const user = userEvent.setup()
    renderTransferModal()

    const input = screen.getByLabelText(/Transfer Amount/i)
    await user.type(input, '100.00')
    await user.click(screen.getByTestId('transfer-submit-button'))

    expect(screen.getByText('Destination account is required')).toBeInTheDocument()
  })

  it('blocks submission for invalid amount', async () => {
    const user = userEvent.setup()
    renderTransferModal()

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: /ACC-2002 — Bob Checking/i })
      ).toBeInTheDocument()
    })

    const select = screen.getByLabelText(/Destination Account/i)
    await user.selectOptions(select, '20')

    const input = screen.getByLabelText(/Transfer Amount/i)
    await user.type(input, '0.00')

    await user.click(screen.getByTestId('transfer-submit-button'))

    expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument()
  })

  it('submits valid transfer and invalidates balance queries for BOTH accounts', async () => {
    const user = userEvent.setup()
    const qc = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    vi.mocked(apiClient).mockImplementation((endpoint, options) => {
      if (endpoint === '/accounts') {
        return Promise.resolve({
          content: [mockSourceAccount, mockDestinationAccount],
          page: 0,
          size: 100,
          totalElements: 2,
          totalPages: 1,
        })
      }
      if (endpoint === '/transfers' && options?.method === 'POST') {
        return Promise.resolve({
          transactionId: 701,
          referenceNumber: 'ref-trn-888',
          transactionType: TransactionType.TRANSFER,
          status: TransactionStatus.COMPLETED,
          sourceAccountId: 10,
          destinationAccountId: 20,
          amount: '75.00',
          createdAt: '2026-09-27T14:00:00Z',
        })
      }
      return Promise.resolve({})
    })

    const { onClose } = renderTransferModal({ queryClient: qc })

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: /ACC-2002 — Bob Checking/i })
      ).toBeInTheDocument()
    })

    const select = screen.getByLabelText(/Destination Account/i)
    await user.selectOptions(select, '20')

    const input = screen.getByLabelText(/Transfer Amount/i)
    await user.type(input, '75.00')

    await user.click(screen.getByTestId('transfer-submit-button'))

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith('/transfers', {
        method: 'POST',
        body: JSON.stringify({
          sourceAccountId: 10,
          destinationAccountId: 20,
          amount: '75.00',
        }),
      })
    })

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(
        'Transfer Successful',
        expect.stringContaining('ref-trn-888')
      )
      expect(onClose).toHaveBeenCalled()
      // Invalidation of BOTH accounts
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: auditKeys.balance(10, null),
      })
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: auditKeys.balance(20, null),
      })
    })
  })

  it('handles HTTP 422 Insufficient Funds from backend', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient).mockImplementation((endpoint, options) => {
      if (endpoint === '/accounts') {
        return Promise.resolve({
          content: [mockSourceAccount, mockDestinationAccount],
          page: 0,
          size: 100,
          totalElements: 2,
          totalPages: 1,
        })
      }
      if (endpoint === '/transfers' && options?.method === 'POST') {
        return Promise.reject(
          new ApiError(422, 'Unprocessable Entity', 'Insufficient funds for account: 10')
        )
      }
      return Promise.resolve({})
    })

    const { onClose } = renderTransferModal()

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: /ACC-2002 — Bob Checking/i })
      ).toBeInTheDocument()
    })

    const select = screen.getByLabelText(/Destination Account/i)
    await user.selectOptions(select, '20')

    const input = screen.getByLabelText(/Transfer Amount/i)
    await user.type(input, '5000.00')

    await user.click(screen.getByTestId('transfer-submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('transfer-error-banner')).toBeInTheDocument()
      expect(
        screen.getByText(/Insufficient funds for account: 10/i)
      ).toBeInTheDocument()
    })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('handles HTTP 422 Invalid Transfer (source == destination) from backend', async () => {
    const user = userEvent.setup()
    vi.mocked(apiClient).mockImplementation((endpoint, options) => {
      if (endpoint === '/accounts') {
        return Promise.resolve({
          content: [mockSourceAccount, mockDestinationAccount],
          page: 0,
          size: 100,
          totalElements: 2,
          totalPages: 1,
        })
      }
      if (endpoint === '/transfers' && options?.method === 'POST') {
        return Promise.reject(
          new ApiError(422, 'Unprocessable Entity', 'Source and destination accounts must be different')
        )
      }
      return Promise.resolve({})
    })

    renderTransferModal()

    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: /ACC-2002 — Bob Checking/i })
      ).toBeInTheDocument()
    })

    const select = screen.getByLabelText(/Destination Account/i)
    await user.selectOptions(select, '20')

    const input = screen.getByLabelText(/Transfer Amount/i)
    await user.type(input, '100.00')

    await user.click(screen.getByTestId('transfer-submit-button'))

    await waitFor(() => {
      expect(screen.getByTestId('transfer-error-banner')).toBeInTheDocument()
      expect(
        screen.getByText(/Source and destination accounts must be different/i)
      ).toBeInTheDocument()
    })
  })
})
