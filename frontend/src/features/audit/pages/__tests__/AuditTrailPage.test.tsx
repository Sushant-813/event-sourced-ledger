import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuditTrailPage } from '../AuditTrailPage'
import { apiClient } from '@/api/client'
import { ApiError } from '@/api/errors'
import { EventType } from '@/types/enums'
import type { AuditTrailResponse } from '../../types/audit'

vi.mock('@/api/client', () => ({
  apiClient: vi.fn(),
}))

function renderAuditPage(initialUrl = '/accounts/10/audit') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <Routes>
          <Route path="/accounts/:accountId/audit" element={<AuditTrailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AuditTrailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page header, balance card, controls, and audit table for initial load', async () => {
    const mockData: AuditTrailResponse = {
      accountId: 10,
      finalBalance: '1500.00',
      asOf: null,
      items: [
        {
          eventId: 1,
          eventType: EventType.ACCOUNT_CREATED,
          transactionId: null,
          referenceNumber: null,
          balanceChange: '0.00',
          runningBalance: '0.00',
          occurredAt: '2026-09-20T10:00:00Z',
        },
        {
          eventId: 2,
          eventType: EventType.DEPOSIT,
          transactionId: 101,
          referenceNumber: 'TX-REF-001',
          balanceChange: '1500.00',
          runningBalance: '1500.00',
          occurredAt: '2026-09-20T10:30:00Z',
        },
      ],
      page: 0,
      size: 20,
      totalPages: 1,
      totalElements: 2,
    }

    vi.mocked(apiClient).mockResolvedValueOnce(mockData)

    renderAuditPage()

    expect(screen.getByRole('heading', { level: 2, name: 'Audit Trail' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('CURRENT RECONSTRUCTED BALANCE')).toBeInTheDocument()
      expect(screen.getAllByText('1,500.00').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('ACCOUNT_CREATED')).toBeInTheDocument()
      expect(screen.getByText('DEPOSIT')).toBeInTheDocument()
    })

    // Column headers
    expect(screen.getByRole('columnheader', { name: 'Occurred At' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Event Type' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Event ID' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Reference #' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Transaction ID' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Balance Change (₹)' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Running Balance (₹)' })).toBeInTheDocument()
  })

  it('preserves finalBalance stability across pagination page navigation', async () => {
    const user = userEvent.setup()

    const page0Data: AuditTrailResponse = {
      accountId: 10,
      finalBalance: '2500.00',
      asOf: null,
      items: [
        {
          eventId: 1,
          eventType: EventType.ACCOUNT_CREATED,
          transactionId: null,
          referenceNumber: null,
          balanceChange: '0.00',
          runningBalance: '0.00',
          occurredAt: '2026-09-20T10:00:00Z',
        },
      ],
      page: 0,
      size: 1,
      totalPages: 2,
      totalElements: 2,
    }

    const page1Data: AuditTrailResponse = {
      accountId: 10,
      finalBalance: '2500.00', // authoritative final balance stays identical
      asOf: null,
      items: [
        {
          eventId: 2,
          eventType: EventType.DEPOSIT,
          transactionId: 102,
          referenceNumber: 'TX-002',
          balanceChange: '2500.00',
          runningBalance: '2500.00',
          occurredAt: '2026-09-20T11:00:00Z',
        },
      ],
      page: 1,
      size: 1,
      totalPages: 2,
      totalElements: 2,
    }

    vi.mocked(apiClient)
      .mockResolvedValueOnce(page0Data)
      .mockResolvedValueOnce(page1Data)

    renderAuditPage('/accounts/10/audit?page=0&size=1')

    await waitFor(() => {
      expect(screen.getAllByText('2,500.00').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('ACCOUNT_CREATED')).toBeInTheDocument()
    })

    const nextPageBtn = screen.getByRole('button', { name: 'Go to next page' })
    await user.click(nextPageBtn)

    await waitFor(() => {
      expect(apiClient).toHaveBeenCalledWith('/accounts/10/audit/trail', {
        params: {
          page: 1,
          size: 1,
          asOf: undefined,
        },
      })
      // Final balance remains stable
      expect(screen.getAllByText('2,500.00').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('DEPOSIT')).toBeInTheDocument()
    })
  })


  it('triggers historical reconstruction when applying asOf cutoff', async () => {
    const user = userEvent.setup()

    const initialData: AuditTrailResponse = {
      accountId: 10,
      finalBalance: '2000.00',
      asOf: null,
      items: [
        {
          eventId: 1,
          eventType: EventType.ACCOUNT_CREATED,
          transactionId: null,
          referenceNumber: null,
          balanceChange: '0.00',
          runningBalance: '0.00',
          occurredAt: '2026-09-20T10:00:00Z',
        },
        {
          eventId: 2,
          eventType: EventType.DEPOSIT,
          transactionId: 101,
          referenceNumber: 'TX-001',
          balanceChange: '2000.00',
          runningBalance: '2000.00',
          occurredAt: '2026-09-20T12:00:00Z',
        },
      ],
      page: 0,
      size: 20,
      totalPages: 1,
      totalElements: 2,
    }

    const historicalData: AuditTrailResponse = {
      accountId: 10,
      finalBalance: '0.00',
      asOf: '2026-09-20T11:00:00.000Z',
      items: [
        {
          eventId: 1,
          eventType: EventType.ACCOUNT_CREATED,
          transactionId: null,
          referenceNumber: null,
          balanceChange: '0.00',
          runningBalance: '0.00',
          occurredAt: '2026-09-20T10:00:00Z',
        },
      ],
      page: 0,
      size: 20,
      totalPages: 1,
      totalElements: 1,
    }

    vi.mocked(apiClient)
      .mockResolvedValueOnce(initialData)
      .mockResolvedValueOnce(historicalData)

    renderAuditPage()

    await waitFor(() => {
      expect(screen.getByText('CURRENT RECONSTRUCTED BALANCE')).toBeInTheDocument()
    })

    const input = screen.getByLabelText('Reconstruct Balance As Of')
    await user.type(input, '2026-09-20T11:00')

    const reconstructBtn = screen.getByRole('button', { name: 'Reconstruct' })
    await user.click(reconstructBtn)

    await waitFor(() => {
      expect(screen.getByText('HISTORICAL RECONSTRUCTED BALANCE')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Reset to Current Balance' })).toBeInTheDocument()
    })
  })

  it('resets to current balance when clicking Reset to Current Balance', async () => {
    const user = userEvent.setup()

    const historicalData: AuditTrailResponse = {
      accountId: 10,
      finalBalance: '500.00',
      asOf: '2026-09-20T11:00:00.000Z',
      items: [],
      page: 0,
      size: 20,
      totalPages: 0,
      totalElements: 0,
    }

    const currentData: AuditTrailResponse = {
      accountId: 10,
      finalBalance: '1500.00',
      asOf: null,
      items: [
        {
          eventId: 1,
          eventType: EventType.ACCOUNT_CREATED,
          transactionId: null,
          referenceNumber: null,
          balanceChange: '0.00',
          runningBalance: '0.00',
          occurredAt: '2026-09-20T10:00:00Z',
        },
      ],
      page: 0,
      size: 20,
      totalPages: 1,
      totalElements: 1,
    }

    vi.mocked(apiClient)
      .mockResolvedValueOnce(historicalData)
      .mockResolvedValueOnce(currentData)

    renderAuditPage('/accounts/10/audit?asOf=2026-09-20T11:00:00.000Z')

    await waitFor(() => {
      expect(screen.getByText('HISTORICAL RECONSTRUCTED BALANCE')).toBeInTheDocument()
    })

    const resetButtons = screen.getAllByRole('button', { name: 'Reset to Current Balance' })
    await user.click(resetButtons[0]!)

    await waitFor(() => {
      expect(screen.getByText('CURRENT RECONSTRUCTED BALANCE')).toBeInTheDocument()
      expect(screen.getByText('1,500.00')).toBeInTheDocument()
    })
  })

  it('handles out-of-range pagination as valid HTTP 200 empty page state with stable balance', async () => {
    const outOfRangeData: AuditTrailResponse = {
      accountId: 10,
      finalBalance: '3000.00',
      asOf: null,
      items: [],
      page: 5,
      size: 20,
      totalPages: 2,
      totalElements: 25,
    }

    vi.mocked(apiClient).mockResolvedValueOnce(outOfRangeData)

    renderAuditPage('/accounts/10/audit?page=5&size=20')

    await waitFor(() => {
      expect(screen.getByText('3,000.00')).toBeInTheDocument()
      expect(screen.getByText(/No events found on page 6 of 2/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Return to Page 1' })).toBeInTheDocument()
    })
  })

  it('handles pre-account-creation cutoff with authoritative 0.00 balance and empty state', async () => {
    const preCreationData: AuditTrailResponse = {
      accountId: 10,
      finalBalance: '0.00',
      asOf: '2020-01-01T00:00:00Z',
      items: [],
      page: 0,
      size: 20,
      totalPages: 0,
      totalElements: 0,
    }

    vi.mocked(apiClient).mockResolvedValueOnce(preCreationData)

    renderAuditPage('/accounts/10/audit?asOf=2020-01-01T00:00:00Z')

    await waitFor(() => {
      // 0.00 is rendered as a valid financial value
      expect(screen.getByText('0.00')).toBeInTheDocument()
      expect(screen.getByText('No Events Prior to Selected Cutoff')).toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: 'Reset to Current Balance' }).length).toBeGreaterThanOrEqual(1)
    })
  })


  it('renders ErrorDisplay and supports retry on API failure', async () => {
    const user = userEvent.setup()

    const apiError = new ApiError(500, 'Server Error', 'Network Error')
    const successData: AuditTrailResponse = {
      accountId: 10,
      finalBalance: '1000.00',
      asOf: null,
      items: [],
      page: 0,
      size: 20,
      totalPages: 0,
      totalElements: 0,
    }

    vi.mocked(apiClient)
      .mockRejectedValueOnce(apiError)
      .mockResolvedValueOnce(successData)

    renderAuditPage()

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Audit Trail')).toBeInTheDocument()
    })

    const retryBtn = screen.getByRole('button', { name: /retry/i })
    await user.click(retryBtn)

    await waitFor(() => {
      expect(screen.getByText('CURRENT RECONSTRUCTED BALANCE')).toBeInTheDocument()
    })
  })
})
