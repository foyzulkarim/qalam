import { test, expect } from '@playwright/test'

test.describe('Browse Surahs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse')
  })

  test('should display the browse page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/browse|surah/i)
  })

  test('should display surah cards', async ({ page }) => {
    // Wait for surah cards to load
    await page.waitForSelector('[data-testid="surah-card"], .card, a[href*="/browse/surah/"]', {
      timeout: 10000,
    })
    
    // Should have multiple surahs
    const surahLinks = page.locator('a[href*="/browse/surah/"]')
    await expect(surahLinks.first()).toBeVisible()
  })

  test('should navigate to surah detail when clicking a surah', async ({ page }) => {
    // Click first surah link
    const firstSurah = page.locator('a[href*="/browse/surah/"]').first()
    await firstSurah.click()
    
    await expect(page).toHaveURL(/\/browse\/surah\/\d+/)
  })

  test('should display Al-Fatihah as first surah', async ({ page }) => {
    await expect(page.locator('text=Al-Fatihah')).toBeVisible()
  })
})
