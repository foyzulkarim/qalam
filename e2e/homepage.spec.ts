import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display the Qalam logo', async ({ page }) => {
    // Target nav specifically since footer also has Qalam text
    await expect(page.locator('nav').getByText('Qalam')).toBeVisible()
  })

  test('should have navigation links', async ({ page }) => {
    // Homepage has custom navigation with Browse Surahs and Start Practice buttons
    await expect(page.locator('nav').getByRole('link', { name: 'Browse Surahs' })).toBeVisible()
    await expect(page.locator('nav').getByRole('link', { name: 'Start Practice' })).toBeVisible()
  })

  test('should have GitHub link', async ({ page }) => {
    const githubLink = page.locator('a[href*="github.com"]')
    await expect(githubLink.first()).toBeVisible()
  })

  test('should navigate to browse page', async ({ page }) => {
    await page.locator('nav').getByRole('link', { name: 'Browse Surahs' }).click()
    await expect(page).toHaveURL(/\/browse/)
  })
})
