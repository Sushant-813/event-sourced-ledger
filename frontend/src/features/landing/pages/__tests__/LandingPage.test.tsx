import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/features/theme/ThemeProvider'
import { LandingPage } from '../LandingPage'

function renderLandingPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <ThemeProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard View</div>} />
        </Routes>
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('LandingPage Component', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('renders primary hero heading and technical description', () => {
    renderLandingPage()

    const heroHeading = screen.getByRole('heading', { level: 1, name: 'Event-Sourced Ledger' })
    expect(heroHeading).toBeInTheDocument()

    expect(
      screen.getByText(/high-integrity double-entry financial ledger/i)
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/server-authoritative balance reconstruction/i).length
    ).toBeGreaterThanOrEqual(1)
  })

  it('contains primary Open Dashboard CTA buttons linking to /dashboard', async () => {
    const user = userEvent.setup()
    renderLandingPage()

    const dashboardLinks = screen.getAllByRole('link', { name: /open dashboard/i })
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(2) // Header, hero, and final CTA

    // Click the hero CTA
    const heroLink = dashboardLinks[1]
    expect(heroLink).toBeDefined()
    if (heroLink) {
      await user.click(heroLink)
    }
    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument()
  })

  it('contains GitHub link pointing to the authoritative repository URL', () => {
    renderLandingPage()

    const githubLinks = screen.getAllByRole('link', { name: /github/i })
    expect(githubLinks.length).toBeGreaterThanOrEqual(1)

    const mainGithubLink = githubLinks.find((link) =>
      link.getAttribute('href') === 'https://github.com/Sushant-813/event-sourced-ledger'
    )
    expect(mainGithubLink).toBeDefined()
    expect(mainGithubLink!).toHaveAttribute('target', '_blank')
    expect(mainGithubLink!).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders all key sections with proper headings and semantic structure', () => {
    renderLandingPage()

    expect(screen.getByRole('heading', { level: 2, name: /core capabilities/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /how the system works/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /technology stack/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /explore the ledger/i })).toBeInTheDocument()

    // Capabilities cards
    expect(screen.getByRole('heading', { level: 3, name: /append-only event sourcing/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /double-entry equilibrium/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /authoritative balances/i })).toBeInTheDocument()

    // Technology stack
    expect(screen.getByRole('heading', { level: 3, name: /backend & persistence/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /frontend architecture/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /quality & verification/i })).toBeInTheDocument()
    expect(screen.getAllByText(/react 19/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/spring boot 3.5/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/playwright/i)).toBeInTheDocument()
  })

  it('supports theme toggle from the public landing header', async () => {
    const user = userEvent.setup()
    renderLandingPage()

    const toggleBtn = screen.getByRole('button', { name: /switch to dark theme/i })
    expect(toggleBtn).toBeInTheDocument()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    await user.click(toggleBtn)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('esl_theme')).toBe('dark')
  })
})
