import { test, expect } from '@playwright/test'

test.describe('Verse View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse/surah/1/1/')
  })

  test('should display Arabic text with RTL direction', async ({ page }) => {
    const arabicText = page.locator('[dir="rtl"]')
    await expect(arabicText.first()).toBeVisible()
  })

  test('should have Arabic font class applied', async ({ page }) => {
    const arabicElement = page.locator('.font-arabic')
    await expect(arabicElement.first()).toBeVisible()
  })

  test('should display verse information', async ({ page }) => {
    // Look for Ayah text
    await expect(page.getByText(/Ayah/i)).toBeVisible()
  })

  test('should display surah name', async ({ page }) => {
    await expect(page.getByText('Al-Fatihah')).toBeVisible()
  })
})

test.describe('Deep Linking', () => {
  test('should load specific verse directly', async ({ page }) => {
    await page.goto('/browse/surah/2/255/')

    // Ayat al-Kursi - verse should load with Arabic text
    await expect(page.locator('[dir="rtl"]').first()).toBeVisible()
  })

  test('should load surah 114 (last surah)', async ({ page }) => {
    await page.goto('/browse/surah/114/1/')

    await expect(page.locator('[dir="rtl"]').first()).toBeVisible()
  })

  test('should handle first surah first verse', async ({ page }) => {
    await page.goto('/browse/surah/1/1/')

    await expect(page.getByText('Al-Fatihah')).toBeVisible()
  })
})
