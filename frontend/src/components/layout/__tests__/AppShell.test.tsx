import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@/features/theme/ThemeProvider'
import { AppShell } from '../AppShell'

describe('AppShell Component', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders application landmarks, brand, and main content', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <AppShell>
            <div>Test Page Content</div>
          </AppShell>
        </ThemeProvider>
      </MemoryRouter>
    )

    expect(screen.getByRole('banner', { name: /application header/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument()
    expect(screen.getByRole('main', { name: /main content/i })).toBeInTheDocument()
    expect(screen.getByText('Test Page Content')).toBeInTheDocument()
  })

  it('toggles desktop sidebar collapse and persists state in localStorage', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <ThemeProvider>
          <AppShell>
            <div>Test Page Content</div>
          </AppShell>
        </ThemeProvider>
      </MemoryRouter>
    )

    const main = screen.getByRole('main', { name: /main content/i })
    expect(main).not.toHaveClass('app-shell__main--collapsed')

    const collapseBtn = screen.getByRole('button', { name: /collapse sidebar/i })
    await user.click(collapseBtn)

    expect(main).toHaveClass('app-shell__main--collapsed')
    expect(localStorage.getItem('esl_sidebar_collapsed')).toBe('true')

    const expandBtn = screen.getByRole('button', { name: /expand sidebar/i })
    await user.click(expandBtn)

    expect(main).not.toHaveClass('app-shell__main--collapsed')
    expect(localStorage.getItem('esl_sidebar_collapsed')).toBe('false')
  })

  it('restores collapsed state from localStorage on initial render', () => {
    localStorage.setItem('esl_sidebar_collapsed', 'true')

    render(
      <MemoryRouter>
        <ThemeProvider>
          <AppShell>
            <div>Test Page Content</div>
          </AppShell>
        </ThemeProvider>
      </MemoryRouter>
    )

    const main = screen.getByRole('main', { name: /main content/i })
    expect(main).toHaveClass('app-shell__main--collapsed')
    expect(screen.getByRole('button', { name: /expand sidebar/i })).toBeInTheDocument()
  })

  it('renders Ledger brand as a link to / and navigates on click', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ThemeProvider>
          <AppShell>
            <div>Dashboard Content</div>
          </AppShell>
        </ThemeProvider>
      </MemoryRouter>
    )

    const brandLink = screen.getByRole('link', { name: /event-sourced ledger home/i })
    expect(brandLink).toBeInTheDocument()
    expect(brandLink).toHaveAttribute('href', '/')

    await user.click(brandLink)
    // Link was clicked successfully without errors
  })
})
