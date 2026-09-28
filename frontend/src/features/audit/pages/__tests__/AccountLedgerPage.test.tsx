import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AccountLedgerPage } from '../AccountLedgerPage'
import { apiClient } from '@/api/client'
import { ApiError } from '@/api/errors'
import { EntryType } from '@/types/enums'
import type { AccountLedgerEntryResponse } from '../../types/audit'
import type { PagedResponse } from '@/types/common'

vi.mock('@/api/client', () => ({
  apiClient: vi.fn(),
}))

function renderLedgerPage(initialUrl = '/accounts/10/ledger') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <Routes>
          <Route path="/accounts/:accountId/ledger" element={<AccountLedgerPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AccountLedgerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page header and ledger table with Date, Reference #, Entry Type, Debit (₹), Credit (₹) columns', async () => {
    const mockData: PagedResponse<AccountLedgerEntryResponse> = {
      content: [
        {
          ledgerEntryId: 501,
          transactionId: 101,
          referenceNumber: 'TXN-REF-101',
          entryType: EntryType.CREDIT,
          amount: '1000.00',
          createdAt: '2026-09-20T10:00:00Z',
        },
        {
          ledgerEntryId: 502,
          transactionId: 102,
          referenceNumber: 'TXN-REF-102',
          entryType: EntryType.DEBIT,
          amount: '250.00',
          createdAt: '2026-09-21T11:00:00Z',
        },
      ],
      page: 0,
      size: 20,
      totalPages: 1,
      totalElements: 2,
    }

    vi.mocked(apiClient).mockResolvedValueOnce(mockData)

    renderLedgerPage()

    expect(screen.getByRole('heading', { level: 2, name: 'Ledger Entries' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('TXN-REF-101')).toBeInTheDocument()
      expect(screen.getByText('TXN-REF-102')).toBeInTheDocument()
    })

    // Column headers
    expect(screen.getByRole('columnheader', { name: 'Date' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Reference #' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Entry Type' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Debit (₹)' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Credit (₹)' })).toBeInTheDocument()

    // Formatted monetary values
    expect(screen.getByText('1,000.00')).toBeInTheDocument()
    expect(screen.getByText('250.00')).toBeInTheDocument()

    // Neutral typography invariant: no red or green semantic color classes on debit/credit amounts
    const amountElements = screen.getAllByText(/(1,000\.00|250\.00)/)
    for (const el of amountElements) {
      expect(el).not.toHaveClass('color-positive')
      expect(el).not.toHaveClass('color-negative')
      expect(el).not.toHaveClass('positive')
      expect(el).not.toHaveClass('negative')
    }
  })

  it('filters by entryType when selecting Credit Only from dropdown', async () => {
    const mockData: PagedResponse<AccountLedgerEntryResponse> = {
      content: [],
      page: 0,
      size: 20,
      totalPages: 0,
      totalElements: 0,
    }

    vi.mocked(apiClient).mockResolvedValue(mockData)

    const user = userEvent.setup()
    renderLedgerPage()

    const select = screen.getByLabelText('Filter by Entry Type')
    await user.selectOptions(select, EntryType.CREDIT)

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith('/accounts/10/audit/ledger', {
        params: expect.objectContaining({
          entryType: EntryType.CREDIT,
          page: 0,
        }),
      })
    })

    // Clear filter button appears
    expect(screen.getByRole('button', { name: 'Clear Filter' })).toBeInTheDocument()
  })

  it('toggles sort direction when clicking direction button', async () => {
    const mockData: PagedResponse<AccountLedgerEntryResponse> = {
      content: [],
      page: 0,
      size: 20,
      totalPages: 0,
      totalElements: 0,
    }

    vi.mocked(apiClient).mockResolvedValue(mockData)

    const user = userEvent.setup()
    renderLedgerPage()

    const toggleBtn = screen.getByRole('button', { name: /sort by date/i })
    await user.click(toggleBtn)

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith('/accounts/10/audit/ledger', {
        params: expect.objectContaining({
          direction: 'asc',
          sortBy: 'createdAt',
        }),
      })
    })
  })

  it('displays empty state when account has 0 ledger entries', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      content: [],
      page: 0,
      size: 20,
      totalPages: 0,
      totalElements: 0,
    })

    renderLedgerPage()

    await waitFor(() => {
      expect(screen.getByText('No Ledger Entries Found')).toBeInTheDocument()
    })
  })

  it('displays ErrorDisplay on error and allows retry', async () => {
    vi.mocked(apiClient).mockRejectedValueOnce(
      new ApiError(500, 'Server Error', 'Failed to retrieve ledger history', '/accounts/10/audit/ledger')
    )

    renderLedgerPage()

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Ledger Entries')).toBeInTheDocument()
    })
  })
})
