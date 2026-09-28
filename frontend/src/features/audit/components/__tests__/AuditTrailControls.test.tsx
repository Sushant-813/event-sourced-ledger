import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuditTrailControls } from '../AuditTrailControls'

describe('AuditTrailControls', () => {
  it('renders input with accessible label and inclusive boundary notice', () => {
    render(
      <AuditTrailControls
        currentAsOf={null}
        onApplyAsOf={vi.fn()}
        onReset={vi.fn()}
      />
    )

    const label = screen.getByLabelText('Reconstruct Balance As Of')
    expect(label).toBeInTheDocument()
    expect(label).toHaveAttribute('type', 'datetime-local')

    expect(
      screen.getByText(/Includes all events where occurredAt/i)
    ).toBeInTheDocument()

    // Reset button should not be present when currentAsOf is null
    expect(screen.queryByRole('button', { name: 'Reset to Current Balance' })).not.toBeInTheDocument()
  })

  it('disables Reconstruct button when input is empty', () => {
    render(
      <AuditTrailControls
        currentAsOf={null}
        onApplyAsOf={vi.fn()}
        onReset={vi.fn()}
      />
    )

    const submitBtn = screen.getByRole('button', { name: 'Reconstruct' })
    expect(submitBtn).toBeDisabled()
  })

  it('normalizes local input to UTC ISO string on submit', async () => {
    const user = userEvent.setup()
    const handleApply = vi.fn()

    render(
      <AuditTrailControls
        currentAsOf={null}
        onApplyAsOf={handleApply}
        onReset={vi.fn()}
      />
    )

    const input = screen.getByLabelText('Reconstruct Balance As Of')
    // Type local datetime
    await user.type(input, '2026-09-10T12:00')

    const submitBtn = screen.getByRole('button', { name: 'Reconstruct' })
    expect(submitBtn).not.toBeDisabled()

    await user.click(submitBtn)

    expect(handleApply).toHaveBeenCalledTimes(1)
    const appliedUtc = handleApply.mock.calls[0]![0] as string
    expect(typeof appliedUtc).toBe('string')
    expect(appliedUtc.endsWith('Z')).toBe(true)
    expect(isNaN(new Date(appliedUtc).getTime())).toBe(false)
  })

  it('renders Reset button and calls onReset when currentAsOf is active', async () => {
    const user = userEvent.setup()
    const handleReset = vi.fn()

    render(
      <AuditTrailControls
        currentAsOf="2026-09-10T12:00:00.000Z"
        onApplyAsOf={vi.fn()}
        onReset={handleReset}
      />
    )

    const resetBtn = screen.getByRole('button', { name: 'Reset to Current Balance' })
    expect(resetBtn).toBeInTheDocument()

    await user.click(resetBtn)
    expect(handleReset).toHaveBeenCalledTimes(1)
  })

  it('hydrates input value from currentAsOf', () => {
    render(
      <AuditTrailControls
        currentAsOf="2026-09-10T12:00:00.000Z"
        onApplyAsOf={vi.fn()}
        onReset={vi.fn()}
      />
    )

    const input = screen.getByLabelText('Reconstruct Balance As Of') as HTMLInputElement
    expect(input.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })
})
