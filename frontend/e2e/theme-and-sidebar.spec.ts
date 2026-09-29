import { test, expect } from '@playwright/test'

test.describe('Theme Toggle and Desktop Sidebar Collapse', () => {
  test('toggles theme between light and dark and persists across reload', async ({ page }) => {
    await page.goto('/dashboard')

    // Initial state: light theme
    const html = page.locator('html')
    await expect(html).toHaveAttribute('data-theme', 'light')

    const themeToggle = page.getByRole('button', { name: /switch to dark theme/i })
    await expect(themeToggle).toBeVisible()
    await expect(themeToggle).toHaveAttribute('aria-pressed', 'false')

    // Click toggle to activate dark mode
    await themeToggle.click()

    await expect(html).toHaveAttribute('data-theme', 'dark')
    await expect(page.getByRole('button', { name: /switch to light theme/i })).toBeVisible()

    // Reload page to verify persistence
    await page.reload()

    await expect(html).toHaveAttribute('data-theme', 'dark')
    const lightToggle = page.getByRole('button', { name: /switch to light theme/i })
    await expect(lightToggle).toBeVisible()
    await expect(lightToggle).toHaveAttribute('aria-pressed', 'true')

    // Switch back to light theme
    await lightToggle.click()
    await expect(html).toHaveAttribute('data-theme', 'light')
  })

  test('toggles desktop sidebar collapse and persists across reload', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/dashboard')

    const sidebar = page.locator('#app-sidebar')
    const main = page.locator('#main-content')
    await expect(sidebar).toBeVisible()
    await expect(sidebar).not.toHaveClass(/sidebar--collapsed/)
    await expect(main).not.toHaveClass(/app-shell__main--collapsed/)

    // Find collapse button
    const collapseBtn = page.getByRole('button', { name: /collapse sidebar/i })
    await expect(collapseBtn).toBeVisible()
    await expect(collapseBtn).toHaveAttribute('aria-expanded', 'true')

    // Click collapse
    await collapseBtn.click()

    await expect(sidebar).toHaveClass(/sidebar--collapsed/)
    await expect(main).toHaveClass(/app-shell__main--collapsed/)

    // Expand button should now be available
    const expandBtn = page.getByRole('button', { name: /expand sidebar/i })
    await expect(expandBtn).toBeVisible()
    await expect(expandBtn).toHaveAttribute('aria-expanded', 'false')

    // Reload to verify persistence
    await page.reload()

    await expect(page.locator('#app-sidebar')).toHaveClass(/sidebar--collapsed/)
    await expect(page.locator('#main-content')).toHaveClass(/app-shell__main--collapsed/)

    // Expand back
    await page.getByRole('button', { name: /expand sidebar/i }).click()
    await expect(page.locator('#app-sidebar')).not.toHaveClass(/sidebar--collapsed/)
    await expect(page.locator('#main-content')).not.toHaveClass(/app-shell__main--collapsed/)
  })
})
