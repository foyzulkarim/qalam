import { test, expect } from '@playwright/test'

test.describe('Browse Surahs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse/')
  })

  test('should display the browse page', async ({ page }) => {
    // Page should load successfully
    await expect(page).toHaveURL(/\/browse/)
  })

  test('should display surah links', async ({ page }) => {
    // Wait for content to load, look for any surah link
    const surahLinks = page.locator('a[href*="/browse/surah/"]')
    await expect(surahLinks.first()).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to surah detail when clicking a surah', async ({ page }) => {
    // Click first surah link
    const firstSurah = page.locator('a[href*="/browse/surah/"]').first()
    await firstSurah.click()

    await expect(page).toHaveURL(/\/browse\/surah\/\d+/)
  })

  test('should display Al-Fatihah', async ({ page }) => {
    await expect(page.getByText('Al-Fatihah')).toBeVisible()
  })
})
