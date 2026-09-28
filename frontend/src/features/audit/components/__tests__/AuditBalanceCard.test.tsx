import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuditBalanceCard } from '../AuditBalanceCard'

describe('AuditBalanceCard', () => {
  it('renders current reconstructed balance when asOf is null', () => {
    render(
      <AuditBalanceCard
        finalBalance="1250.50"
        asOf={null}
        totalElements={5}
      />
    )

    expect(screen.getByText('CURRENT RECONSTRUCTED BALANCE')).toBeInTheDocument()
    expect(screen.getByText('1,250.50')).toBeInTheDocument()
    expect(screen.getByText(/complete chronological event history \(5 event\(s\)\)/)).toBeInTheDocument()
    expect(screen.queryByText(/Cutoff:/)).not.toBeInTheDocument()
    expect(
      screen.getByText(/Server-authoritative balance derived from full event replay prior to pagination\./)
    ).toBeInTheDocument()
  })

  it('renders historical reconstructed balance with cutoff context when asOf is present', () => {
    render(
      <AuditBalanceCard
        finalBalance="750.00"
        asOf="2026-09-10T12:00:00.000Z"
        totalElements={3}
      />
    )

    expect(screen.getByText('HISTORICAL RECONSTRUCTED BALANCE')).toBeInTheDocument()
    expect(screen.getByText('750.00')).toBeInTheDocument()
    expect(screen.getByText(/Derived from 3 historical event\(s\) up to selected cutoff point/)).toBeInTheDocument()
    expect(screen.getByText(/Cutoff:/)).toBeInTheDocument()
  })

  it('explicitly renders 0.00 when the authoritative balance is zero', () => {
    render(
      <AuditBalanceCard
        finalBalance="0.00"
        asOf="2020-01-01T00:00:00Z"
        totalElements={0}
      />
    )

    expect(screen.getByText('0.00')).toBeInTheDocument()
    expect(screen.getByText(/Derived from 0 historical event\(s\)/)).toBeInTheDocument()
  })

  it('handles number input defensively for finalBalance', () => {
    render(
      <AuditBalanceCard
        finalBalance={500.25}
        asOf={null}
        totalElements={2}
      />
    )

    expect(screen.getByText('500.25')).toBeInTheDocument()
  })
})
