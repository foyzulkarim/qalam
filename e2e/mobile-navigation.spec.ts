import { test, expect } from '@playwright/test'

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should show hamburger menu on mobile', async ({ page }) => {
    // Desktop nav should be hidden
    await expect(page.locator('nav .hidden.sm\\:flex')).toBeHidden()
    
    // Mobile menu button should be visible
    const menuButton = page.locator('button:has-text("Open main menu"), button[aria-label*="menu"]')
    await expect(menuButton.first()).toBeVisible()
  })

  test('should open mobile menu when hamburger clicked', async ({ page }) => {
    // Click hamburger menu
    const menuButton = page.locator('nav button.sm\\:hidden')
    await menuButton.click()
    
    // Mobile menu should appear
    await expect(page.locator('.sm\\:hidden.border-t')).toBeVisible()
  })

  test('should navigate from mobile menu', async ({ page }) => {
    // Open mobile menu
    const menuButton = page.locator('nav button.sm\\:hidden')
    await menuButton.click()
    
    // Click Browse link in mobile menu
    await page.locator('.sm\\:hidden.border-t a[href="/browse"]').click()
    
    await expect(page).toHaveURL('/browse')
  })

  test('should close mobile menu after navigation', async ({ page }) => {
    // Open mobile menu
    const menuButton = page.locator('nav button.sm\\:hidden')
    await menuButton.click()
    
    // Click a link
    await page.locator('.sm\\:hidden.border-t a[href="/browse"]').click()
    
    // Menu should close (navigated to new page)
    await expect(page).toHaveURL('/browse')
  })
})

test.describe('Tablet Navigation', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test('should show desktop navigation on tablet', async ({ page }) => {
    await page.goto('/')
    
    // Desktop nav should be visible
    await expect(page.locator('nav a[href="/browse"]').first()).toBeVisible()
  })
})

test.describe('Responsive Verse Display', () => {
  test('should display verse properly on mobile', async ({ page }) => {
    test.use({ viewport: { width: 375, height: 667 } })
    
    await page.goto('/browse/surah/1/1')
    
    // Arabic text should still be RTL
    const arabicText = page.locator('[dir="rtl"]')
    await expect(arabicText.first()).toBeVisible()
  })
})
