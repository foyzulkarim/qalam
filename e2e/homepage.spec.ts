import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display the Qalam logo', async ({ page }) => {
    await expect(page.locator('text=Qalam')).toBeVisible()
  })

  test('should have navigation links', async ({ page }) => {
    await expect(page.locator('nav a[href="/"]')).toBeVisible()
    await expect(page.locator('nav a[href="/browse"]')).toBeVisible()
  })

  test('should have a Quick Practice button in navbar', async ({ page }) => {
    await expect(page.locator('nav a:has-text("Quick Practice")')).toBeVisible()
  })

  test('should have GitHub link', async ({ page }) => {
    const githubLink = page.locator('a[href*="github.com/foyzulkarim/qalam"]')
    await expect(githubLink).toBeVisible()
  })

  test('should navigate to browse page', async ({ page }) => {
    await page.click('nav a[href="/browse"]')
    await expect(page).toHaveURL('/browse')
  })
})
