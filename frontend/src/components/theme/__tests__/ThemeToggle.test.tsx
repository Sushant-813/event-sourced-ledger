import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@/features/theme/ThemeProvider'
import { ThemeToggle } from '../ThemeToggle'

describe('ThemeToggle & ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('renders theme toggle with accessible initial attributes in light mode', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const toggleBtn = screen.getByRole('button', { name: /switch to dark theme/i })
    expect(toggleBtn).toBeInTheDocument()
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('toggles to dark mode on click and updates aria-pressed and localStorage', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const toggleBtn = screen.getByRole('button', { name: /switch to dark theme/i })
    await user.click(toggleBtn)

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('esl_theme')).toBe('dark')
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /switch to light theme/i })).toBeInTheDocument()
  })

  it('toggles back to light mode on second click', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const toggleBtn = screen.getByRole('button', { name: /switch to dark theme/i })
    await user.click(toggleBtn)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    const darkToggleBtn = screen.getByRole('button', { name: /switch to light theme/i })
    await user.click(darkToggleBtn)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('esl_theme')).toBe('light')
    expect(darkToggleBtn).toHaveAttribute('aria-pressed', 'false')
  })

  it('initializes with dark theme if stored in localStorage', () => {
    localStorage.setItem('esl_theme', 'dark')

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const toggleBtn = screen.getByRole('button', { name: /switch to light theme/i })
    expect(toggleBtn).toBeInTheDocument()
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('supports keyboard navigation via Space and Enter', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const toggleBtn = screen.getByRole('button', { name: /switch to dark theme/i })
    toggleBtn.focus()
    expect(toggleBtn).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    await user.keyboard(' ')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})
