import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EventPayloadDrawer } from '../EventPayloadDrawer'
import { EventType } from '@/types/enums'
import type { AccountEventResponse } from '../../types/audit'
import type { AccountResponse } from '@/features/accounts/types/account'
import { AccountStatus, AccountType } from '@/types/enums'

const mockAccount: AccountResponse = {
  id: 10,
  accountNumber: 'ACC-1001',
  accountName: 'Alice Savings',
  accountType: AccountType.SAVINGS,
  status: AccountStatus.ACTIVE,
  createdAt: '2026-09-20T10:00:00Z',
  updatedAt: '2026-09-20T10:00:00Z',
}

const mockEventWithPayload: AccountEventResponse = {
  eventId: 1001,
  eventType: EventType.DEPOSIT,
  transactionId: 50,
  payload: JSON.stringify({ amount: '500.00', note: 'Initial deposit' }),
  occurredAt: '2026-09-20T10:15:00Z',
}

const mockEventWithoutPayload: AccountEventResponse = {
  eventId: 1000,
  eventType: EventType.ACCOUNT_CREATED,
  transactionId: null,
  payload: null,
  occurredAt: '2026-09-20T10:00:00Z',
}

describe('EventPayloadDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders drawer with event metadata and formatted JSON payload', () => {
    const onClose = vi.fn()
    render(
      <EventPayloadDrawer
        isOpen={true}
        onClose={onClose}
        event={mockEventWithPayload}
        accountContext={mockAccount}
      />
    )

    // Check titles & IDs
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByText('1001')).toHaveLength(2)
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('Alice Savings')).toBeInTheDocument()
    expect(screen.getByText('ACC-1001')).toBeInTheDocument()

    // Immutability notice
    expect(screen.getByText(/Immutable Record:/)).toBeInTheDocument()

    // Formatted payload content
    expect(screen.getByText(/"amount": "500.00"/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy event payload JSON' })).toBeInTheDocument()
  })

  it('renders fallback when event has null payload', () => {
    render(
      <EventPayloadDrawer
        isOpen={true}
        onClose={vi.fn()}
        event={mockEventWithoutPayload}
        accountContext={mockAccount}
      />
    )

    expect(
      screen.getByText('No additional payload recorded for this event.')
    ).toBeInTheDocument()
    expect(screen.getByText('None (Lifecycle Event)')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <EventPayloadDrawer
        isOpen={true}
        onClose={onClose}
        event={mockEventWithPayload}
      />
    )

    const closeBtn = screen.getByRole('button', { name: 'Close drawer' })
    await user.click(closeBtn)

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
