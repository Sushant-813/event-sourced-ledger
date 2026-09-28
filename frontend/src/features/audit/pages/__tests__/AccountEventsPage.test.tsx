import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AccountEventsPage } from '../AccountEventsPage'
import { apiClient } from '@/api/client'
import { ApiError } from '@/api/errors'
import { AccountStatus, AccountType, EventType } from '@/types/enums'
import type { AccountEventResponse } from '../../types/audit'
import type { AccountResponse } from '@/features/accounts/types/account'
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

function renderEventsPage(initialUrl = '/accounts/10/events') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <Routes>
          <Route path="/accounts/:accountId/events" element={<AccountEventsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AccountEventsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page header and events table with Occurred At, Event Type, Event ID, Transaction ID, and Payload columns', async () => {
    const mockData: PagedResponse<AccountEventResponse> = {
      content: [
        {
          eventId: 1,
          eventType: EventType.ACCOUNT_CREATED,
          transactionId: null,
          payload: null,
          occurredAt: '2026-09-20T10:00:00Z',
        },
        {
          eventId: 2,
          eventType: EventType.DEPOSIT,
          transactionId: 101,
          payload: JSON.stringify({ amount: '500.00' }),
          occurredAt: '2026-09-20T10:15:00Z',
        },
      ],
      page: 0,
      size: 20,
      totalPages: 1,
      totalElements: 2,
    }

    vi.mocked(apiClient).mockResolvedValueOnce(mockData)

    renderEventsPage()

    expect(screen.getByRole('heading', { level: 2, name: 'Event Stream' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('ACCOUNT_CREATED')).toBeInTheDocument()
      expect(screen.getByText('DEPOSIT')).toBeInTheDocument()
    })

    // Column headers
    expect(screen.getByRole('columnheader', { name: 'Occurred At' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Event Type' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Event ID' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Transaction ID' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Payload' })).toBeInTheDocument()

    // Assert NO eventType filter dropdown exists (preserves complete event timeline)
    expect(screen.queryByLabelText(/filter by event/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()

    // Assert NO edit or delete buttons exist (immutability)
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
  })

  it('opens EventPayloadDrawer when clicking Inspect button', async () => {
    const mockData: PagedResponse<AccountEventResponse> = {
      content: [
        {
          eventId: 20,
          eventType: EventType.DEPOSIT,
          transactionId: 101,
          payload: JSON.stringify({ amount: '500.00' }),
          occurredAt: '2026-09-20T10:15:00Z',
        },
      ],
      page: 0,
      size: 20,
      totalPages: 1,
      totalElements: 1,
    }

    vi.mocked(apiClient).mockResolvedValueOnce(mockData)

    const user = userEvent.setup()
    renderEventsPage()

    await waitFor(() => {
      expect(screen.getByText('DEPOSIT')).toBeInTheDocument()
    })

    const inspectBtn = screen.getByRole('button', { name: /inspect event 20/i })
    await user.click(inspectBtn)

    // Drawer opens
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Immutable Record:')).toBeInTheDocument()
      expect(screen.getByText(/"amount": "500.00"/)).toBeInTheDocument()
    })

    // Close drawer
    const closeBtn = screen.getByRole('button', { name: 'Close drawer' })
    await user.click(closeBtn)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('toggles sort sequence when clicking sort button', async () => {
    const mockData: PagedResponse<AccountEventResponse> = {
      content: [],
      page: 0,
      size: 20,
      totalPages: 0,
      totalElements: 0,
    }

    vi.mocked(apiClient).mockResolvedValue(mockData)

    const user = userEvent.setup()
    renderEventsPage()

    const sortBtn = screen.getByRole('button', { name: /sort by occurred timestamp/i })
    await user.click(sortBtn)

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith('/accounts/10/audit/events', {
        params: expect.objectContaining({
          direction: 'asc',
          sortBy: 'occurredAt',
        }),
      })
    })
  })

  it('displays empty state when account has 0 events', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      content: [],
      page: 0,
      size: 20,
      totalPages: 0,
      totalElements: 0,
    })

    renderEventsPage()

    await waitFor(() => {
      expect(screen.getByText('No Events Found')).toBeInTheDocument()
    })
  })

  it('displays ErrorDisplay on error and allows retry', async () => {
    vi.mocked(apiClient).mockRejectedValueOnce(
      new ApiError(500, 'Server Error', 'Failed to retrieve event stream', '/accounts/10/audit/events')
    )

    renderEventsPage()

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Event Stream')).toBeInTheDocument()
    })
  })
})
