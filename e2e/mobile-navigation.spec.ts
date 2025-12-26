import { test, expect } from '@playwright/test'

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should show hamburger menu on mobile', async ({ page }) => {
    // Mobile menu button should be visible
    const menuButton = page.locator('nav button').filter({ has: page.locator('.sr-only') })
    await expect(menuButton).toBeVisible()
  })

  test('should open mobile menu when hamburger clicked', async ({ page }) => {
    // Click hamburger menu
    const menuButton = page.locator('nav button').filter({ has: page.locator('.sr-only') })
    await menuButton.click()

    // Mobile menu should appear with Browse link
    await expect(page.getByRole('link', { name: 'Browse' })).toBeVisible()
  })

  test('should navigate from mobile menu', async ({ page }) => {
    // Open mobile menu
    const menuButton = page.locator('nav button').filter({ has: page.locator('.sr-only') })
    await menuButton.click()

    // Click Browse link
    await page.getByRole('link', { name: 'Browse' }).click()

    await expect(page).toHaveURL(/\/browse/)
  })
})

test.describe('Tablet Navigation', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test('should show desktop navigation on tablet', async ({ page }) => {
    await page.goto('/')

    // Desktop nav should be visible
    await expect(page.locator('nav').getByRole('link', { name: 'Browse' })).toBeVisible()
  })
})

test.describe('Responsive Verse Display', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('should display verse properly on mobile', async ({ page }) => {
    await page.goto('/browse/surah/1/1/')

    // Arabic text should still be RTL
    const arabicText = page.locator('[dir="rtl"]')
    await expect(arabicText.first()).toBeVisible()
  })
})
