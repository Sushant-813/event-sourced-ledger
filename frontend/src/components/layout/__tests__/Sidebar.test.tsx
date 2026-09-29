import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '../Sidebar'

describe('Sidebar Component', () => {
  it('renders navigation links in expanded state', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar isOpen={false} onClose={vi.fn()} isCollapsed={false} />
      </MemoryRouter>
    )

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    expect(nav).toBeInTheDocument()
    expect(nav).not.toHaveClass('sidebar--collapsed')

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toBeInTheDocument()
    expect(dashboardLink).toHaveClass('sidebar__link--active')

    const accountsLink = screen.getByRole('link', { name: /accounts/i })
    expect(accountsLink).toBeInTheDocument()
    expect(accountsLink).not.toHaveClass('sidebar__link--active')
  })

  it('renders in collapsed state with compact class and tooltips', () => {
    render(
      <MemoryRouter initialEntries={['/accounts']}>
        <Sidebar isOpen={false} onClose={vi.fn()} isCollapsed={true} />
      </MemoryRouter>
    )

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    expect(nav).toHaveClass('sidebar--collapsed')

    const accountsLink = screen.getByRole('link', { name: /accounts/i })
    expect(accountsLink).toHaveClass('sidebar__link--active')

    // Tooltip elements should be present in the DOM
    const tooltips = document.querySelectorAll('.sidebar__tooltip')
    expect(tooltips.length).toBeGreaterThanOrEqual(2)
  })

  it('renders collapse toggle button and fires onToggleCollapse', async () => {
    const handleToggle = vi.fn()
    const user = userEvent.setup()

    const { rerender } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar
          isOpen={false}
          onClose={vi.fn()}
          isCollapsed={false}
          onToggleCollapse={handleToggle}
        />
      </MemoryRouter>
    )

    const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i })
    expect(toggleBtn).toBeInTheDocument()
    expect(toggleBtn).toHaveAttribute('aria-expanded', 'true')

    await user.click(toggleBtn)
    expect(handleToggle).toHaveBeenCalledTimes(1)

    // Re-render as collapsed
    rerender(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar
          isOpen={false}
          onClose={vi.fn()}
          isCollapsed={true}
          onToggleCollapse={handleToggle}
        />
      </MemoryRouter>
    )

    const expandBtn = screen.getByRole('button', { name: /expand sidebar/i })
    expect(expandBtn).toBeInTheDocument()
    expect(expandBtn).toHaveAttribute('aria-expanded', 'false')
  })

  it('supports keyboard activation of collapse toggle via Enter and Space', async () => {
    const handleToggle = vi.fn()
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar
          isOpen={false}
          onClose={vi.fn()}
          isCollapsed={false}
          onToggleCollapse={handleToggle}
        />
      </MemoryRouter>
    )

    const toggleBtn = screen.getByRole('button', { name: /collapse sidebar/i })
    toggleBtn.focus()
    expect(toggleBtn).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(handleToggle).toHaveBeenCalledTimes(1)

    await user.keyboard(' ')
    expect(handleToggle).toHaveBeenCalledTimes(2)
  })

  it('renders mobile backdrop when open and invokes onClose when backdrop clicked', async () => {
    const handleClose = vi.fn()
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar isOpen={true} onClose={handleClose} isCollapsed={false} />
      </MemoryRouter>
    )

    const nav = screen.getByRole('navigation', { name: /main navigation/i })
    expect(nav).toHaveClass('sidebar--open')

    const backdrop = document.querySelector('.sidebar__backdrop')
    expect(backdrop).toBeInTheDocument()

    if (backdrop) {
      await user.click(backdrop)
      expect(handleClose).toHaveBeenCalledTimes(1)
    }
  })
})
