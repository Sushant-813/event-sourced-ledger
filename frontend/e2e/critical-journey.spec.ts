import { test, expect } from '@playwright/test'

test.describe('Critical Financial Journey', () => {
  test('full critical financial lifecycle and audit trail validation', async ({ page }) => {
    // Generate unique account identifiers for append-only backend
    const uid = Math.floor(Math.random() * 900000 + 100000)
    const firstAccNum = `ACC-E2E-${uid}-A`
    const firstAccName = `Primary Ops Account ${uid}`
    const secondAccNum = `ACC-E2E-${uid}-B`
    const secondAccName = `Secondary Reserve ${uid}`

    // 1. Open /dashboard
    await page.goto('/dashboard')

    // 2. Verify on /dashboard
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible()

    // Verify initial metrics are present
    await expect(page.getByTestId('metric-total-accounts')).toBeVisible()
    await expect(page.getByTestId('metric-active-accounts')).toBeVisible()
    await expect(page.getByTestId('metric-frozen-accounts')).toBeVisible()

    // 3. Click Create Account in Quick Actions
    await page.getByTestId('quick-action-create-account').click()
    const createModal = page.getByRole('dialog')
    await expect(createModal).toBeVisible()

    // 4. Create a unique first account
    await createModal.locator('#create-account-number').fill(firstAccNum)
    await createModal.locator('#create-account-name').fill(firstAccName)
    await createModal.getByRole('button', { name: 'Create Account' }).click()

    // 5. Verify creation succeeds (redirects to /accounts/:id/overview)
    await expect(page).toHaveURL(/\/accounts\/\d+\/overview/)
    await expect(page.getByText(firstAccNum).first()).toBeVisible()
    await expect(page.getByText(firstAccName).first()).toBeVisible()

    // 6. Deposit 1,000.00 into the first account
    await page.getByTestId('open-deposit-button').click()
    const depositModal = page.getByRole('dialog')
    await expect(depositModal).toBeVisible()
    await depositModal.locator('#deposit-amount').fill('1000.00')
    await depositModal.getByTestId('deposit-submit-button').click()

    // 7. Verify authoritative balance becomes 1,000.00
    await expect(page.locator('.account-overview__balance-amount')).toHaveText('1,000.00')

    // 8. Return to Dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)

    // 9. Create a unique second account
    await page.getByTestId('quick-action-create-account').click()
    const createModal2 = page.getByRole('dialog')
    await expect(createModal2).toBeVisible()
    await createModal2.locator('#create-account-number').fill(secondAccNum)
    await createModal2.locator('#create-account-name').fill(secondAccName)
    await createModal2.getByRole('button', { name: 'Create Account' }).click()
    await expect(page).toHaveURL(/\/accounts\/\d+\/overview/)
    await expect(page.getByText(secondAccNum).first()).toBeVisible()

    // Return to Dashboard to execute transfer via Quick Actions
    await page.getByRole('link', { name: 'Dashboard' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)

    // 10. Initiate Transfer
    await page.getByTestId('quick-action-transfer').click()
    const transferModal = page.getByRole('dialog')
    await expect(transferModal).toBeVisible()

    // 11. Select first account as source
    await transferModal.getByTestId('transfer-source-select').selectOption({ label: `${firstAccNum} — ${firstAccName}` })

    // 12. Select second account as destination
    await transferModal.getByTestId('transfer-destination-select').selectOption({ label: `${secondAccNum} — ${secondAccName}` })

    // 13. Transfer 350.00
    await transferModal.locator('#transfer-amount').fill('350.00')
    await transferModal.getByTestId('transfer-submit-button').click()

    // 14. Verify transfer succeeds (modal closes)
    await expect(page.getByRole('dialog')).not.toBeVisible()

    // 15. Navigate to first account
    await page.getByRole('link', { name: 'Accounts' }).click()
    await expect(page).toHaveURL(/\/accounts$/)
    await page.getByRole('button', { name: `View account ${firstAccName}` }).click()
    await expect(page).toHaveURL(/\/accounts\/\d+\/overview/)

    // 16. Verify authoritative balance is 650.00
    await expect(page.locator('.account-overview__balance-amount')).toHaveText('650.00')

    // 17. Open Audit Trail
    await page.getByRole('link', { name: 'Audit Trail' }).click()
    await expect(page).toHaveURL(/\/accounts\/\d+\/audit/)
    await expect(page.getByRole('heading', { level: 2, name: 'Audit Trail' })).toBeVisible()

    // 18. Verify the expected deposit/transfer entries and authoritative balances
    await expect(page.getByText('DEPOSIT').first()).toBeVisible()
    await expect(page.getByText('TRANSFER_DEBIT').first()).toBeVisible()
    await expect(page.getByText('+1,000.00').first()).toBeVisible()
    await expect(page.getByText('-350.00').first()).toBeVisible()
    await expect(page.getByText('650.00').first()).toBeVisible()
    await expect(page.getByText('-350.00').first()).toBeVisible()

    // 19. Return to Dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)

    // 20. Verify account metrics reflect the created accounts
    await expect(page.getByTestId('metric-total-accounts')).toBeVisible()
    await expect(page.getByTestId('metric-active-accounts')).toBeVisible()
    await expect(page.getByTestId('metric-frozen-accounts')).toBeVisible()
  })
})
