import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuditTrailTable } from '../AuditTrailTable'
import { EventType } from '@/types/enums'
import type { AuditTrailItemResponse } from '../../types/audit'

const mockItems: AuditTrailItemResponse[] = [
  {
    eventId: 10,
    eventType: EventType.ACCOUNT_CREATED,
    transactionId: null,
    referenceNumber: null,
    balanceChange: '0.00',
    runningBalance: '0.00',
    occurredAt: '2026-09-10T08:00:00Z',
  },
  {
    eventId: 20,
    eventType: EventType.DEPOSIT,
    transactionId: 100,
    referenceNumber: 'TXN-001',
    balanceChange: '1000.00',
    runningBalance: '1000.00',
    occurredAt: '2026-09-10T09:00:00Z',
  },
  {
    eventId: 30,
    eventType: EventType.WITHDRAWAL,
    transactionId: 200,
    referenceNumber: 'TXN-002',
    balanceChange: '-250.00',
    runningBalance: '750.00',
    occurredAt: '2026-09-10T10:00:00Z',
  },
]

describe('AuditTrailTable', () => {
  it('renders all 7 columns in exact approved order', () => {
    render(<AuditTrailTable items={mockItems} />)

    const headers = screen.getAllByRole('columnheader')
    expect(headers).toHaveLength(7)
    expect(headers[0]).toHaveTextContent('Occurred At')
    expect(headers[1]).toHaveTextContent('Event Type')
    expect(headers[2]).toHaveTextContent('Event ID')
    expect(headers[3]).toHaveTextContent('Reference #')
    expect(headers[4]).toHaveTextContent('Transaction ID')
    expect(headers[5]).toHaveTextContent('Balance Change (₹)')
    expect(headers[6]).toHaveTextContent('Running Balance (₹)')
  })

  it('renders event type badges and IDs correctly', () => {
    render(<AuditTrailTable items={mockItems} />)

    expect(screen.getByText('ACCOUNT_CREATED')).toBeInTheDocument()
    expect(screen.getByText('DEPOSIT')).toBeInTheDocument()
    expect(screen.getByText('WITHDRAWAL')).toBeInTheDocument()

    // Technical badges
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('TXN-001')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('renders "—" for null transactionId and referenceNumber', () => {
    render(<AuditTrailTable items={mockItems} />)

    // For ACCOUNT_CREATED, both referenceNumber and transactionId are null
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('renders explicit signed balance deltas (+1,000.00, -250.00, 0.00)', () => {
    render(<AuditTrailTable items={mockItems} />)

    expect(screen.getByText('+1,000.00')).toBeInTheDocument()
    expect(screen.getByText('-250.00')).toBeInTheDocument()
    // 0.00 appears for both balanceChange and runningBalance of ACCOUNT_CREATED
    const zeroes = screen.getAllByText('0.00')
    expect(zeroes.length).toBeGreaterThanOrEqual(2)
  })

  it('renders running balances without directional signs', () => {
    render(<AuditTrailTable items={mockItems} />)

    expect(screen.getByText('1,000.00')).toBeInTheDocument()
    expect(screen.getByText('750.00')).toBeInTheDocument()
  })

  it('preserves immutability with zero edit, delete, or mutation controls', () => {
    render(<AuditTrailTable items={mockItems} />)

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /rollback/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /modify/i })).not.toBeInTheDocument()
  })
})
