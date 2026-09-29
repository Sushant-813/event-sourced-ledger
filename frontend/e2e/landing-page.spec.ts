import { test, expect } from '@playwright/test'

test.describe('Landing Page & Public Entry Journey', () => {
  test('navigates from landing page / into /dashboard via CTA', async ({ page }) => {
    // 1. Visit root URL /
    await page.goto('/')

    // 2. Verify landing page renders
    await expect(page).toHaveURL(/\/$/)
    const heroHeading = page.getByRole('heading', { level: 1, name: 'Event-Sourced Ledger' })
    await expect(heroHeading).toBeVisible()

    // Verify key sections exist
    await expect(page.getByRole('heading', { level: 2, name: 'Core Capabilities' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'How the System Works' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Technology Stack' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Explore the Ledger' })).toBeVisible()

    // 3. Click primary "Open Dashboard" button
    const heroCta = page.locator('.landing-hero__actions').getByRole('link', { name: 'Open Dashboard' })
    await expect(heroCta).toBeVisible()
    await heroCta.click()

    // 4. Verify user lands on /dashboard
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()
    await expect(page.getByTestId('metric-total-accounts')).toBeVisible()
  })

  test('toggles theme on the landing page and verifies persistence', async ({ page }) => {
    await page.goto('/')

    const html = page.locator('html')
    await expect(html).toHaveAttribute('data-theme', 'light')

    // Find and click theme toggle in landing header
    const toggleBtn = page.getByRole('button', { name: /switch to dark theme/i })
    await expect(toggleBtn).toBeVisible()
    await toggleBtn.click()

    await expect(html).toHaveAttribute('data-theme', 'dark')

    // Reload page to verify persistence
    await page.reload()
    await expect(html).toHaveAttribute('data-theme', 'dark')
    await expect(page.getByRole('button', { name: /switch to light theme/i })).toBeVisible()
  })

  test('verifies GitHub repository link target', async ({ page }) => {
    await page.goto('/')

    const githubLink = page.getByRole('link', { name: /view on github/i })
    await expect(githubLink).toBeVisible()
    await expect(githubLink).toHaveAttribute('href', 'https://github.com/Sushant-813/event-sourced-ledger')
    await expect(githubLink).toHaveAttribute('target', '_blank')
  })

  test('navigates from /dashboard back to / by clicking the Ledger brand logo in header', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard$/)

    const brandLink = page.getByRole('link', { name: /event-sourced ledger home/i })
    await expect(brandLink).toBeVisible()
    await brandLink.click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Event-Sourced Ledger' })).toBeVisible()
  })
})
