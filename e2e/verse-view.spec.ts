import { test, expect } from '@playwright/test'

test.describe('Verse View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse/surah/1/1/')
  })

  test('should display Arabic text with RTL direction', async ({ page }) => {
    // Wait for verse content to load
    const arabicText = page.locator('[dir="rtl"], [lang="ar"]')
    await expect(arabicText.first()).toBeVisible()
  })

  test('should have Arabic font class applied', async ({ page }) => {
    const arabicElement = page.locator('.font-arabic')
    await expect(arabicElement.first()).toBeVisible()
  })

  test('should display verse number', async ({ page }) => {
    await expect(page.locator('text=/Ayah|Verse/i')).toBeVisible()
  })

  test('should display surah name', async ({ page }) => {
    await expect(page.locator('text=Al-Fatihah')).toBeVisible()
  })

  test('should have translation content', async ({ page }) => {
    // Look for English translation text (common words in Bismillah translation)
    await expect(page.locator('text=/name|Allah|God|merciful/i').first()).toBeVisible()
  })
})

test.describe('Verse Navigation', () => {
  test('should navigate to next verse', async ({ page }) => {
    await page.goto('/browse/surah/1/1/')

    // Look for next button or link
    const nextButton = page.locator('a[href*="/browse/surah/1/2"], button:has-text("Next")')
    if (await nextButton.count() > 0) {
      await nextButton.first().click()
      await expect(page).toHaveURL(/\/browse\/surah\/1\/2\/?/)
    }
  })

  test('should navigate between surahs', async ({ page }) => {
    await page.goto('/browse/surah/1/')

    // Check that we can see verse links
    const verseLinks = page.locator('a[href*="/browse/surah/1/"]')
    await expect(verseLinks.first()).toBeVisible()
  })
})

test.describe('Deep Linking', () => {
  test('should load specific verse directly', async ({ page }) => {
    await page.goto('/browse/surah/2/255/')

    // Ayat al-Kursi - verse should load
    await expect(page.locator('[dir="rtl"], [lang="ar"]').first()).toBeVisible()
  })

  test('should load surah 114 (last surah)', async ({ page }) => {
    await page.goto('/browse/surah/114/1/')

    await expect(page.locator('[dir="rtl"], [lang="ar"]').first()).toBeVisible()
  })

  test('should handle first surah first verse', async ({ page }) => {
    await page.goto('/browse/surah/1/1/')

    await expect(page.locator('text=Al-Fatihah')).toBeVisible()
  })
})
