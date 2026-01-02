/**
 * Show analysis generation progress
 * Run with: npx tsx scripts/data-status.ts
 */
import { readdirSync, existsSync, readFileSync } from 'fs'

const ANALYSIS_DIR = 'data/analysis'
const MANIFEST_FILE = `${ANALYSIS_DIR}/.r2-manifest.json`
const TOTAL_VERSES = 6236

// Verse counts by surah
const SURAH_VERSES: Record<number, number> = {
  1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
  11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
  21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
  31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
  41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
  51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
  61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
  71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
  81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
  91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
  101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
  111: 5, 112: 4, 113: 5, 114: 6,
}

function main() {
  console.log()
  console.log('='.repeat(60))
  console.log('Qalam Analysis Generation Status')
  console.log('='.repeat(60))
  console.log()

  if (!existsSync(ANALYSIS_DIR)) {
    console.error('Error: Analysis directory not found')
    process.exit(1)
  }

  const localFiles = readdirSync(ANALYSIS_DIR).filter(
    (f) => f.endsWith('.json') && !f.startsWith('.')
  )

  // Count by surah
  const bySurah: Record<number, number> = {}
  for (const file of localFiles) {
    const match = file.match(/^(\d+)-/)
    if (match) {
      const surahId = parseInt(match[1], 10)
      bySurah[surahId] = (bySurah[surahId] || 0) + 1
    }
  }

  const percent = ((localFiles.length / TOTAL_VERSES) * 100).toFixed(1)
  console.log(`Total: ${localFiles.length} / ${TOTAL_VERSES} (${percent}%)`)
  console.log()

  // Show surah breakdown
  console.log('By Surah:')
  console.log('-'.repeat(40))

  const surahs = Object.keys(bySurah)
    .map(Number)
    .sort((a, b) => a - b)

  // Group by completion status
  const complete: number[] = []
  const partial: Array<{ surah: number; done: number; total: number }> = []

  for (const surah of surahs) {
    const done = bySurah[surah]
    const total = SURAH_VERSES[surah] || 0
    if (done >= total) {
      complete.push(surah)
    } else {
      partial.push({ surah, done, total })
    }
  }

  if (complete.length > 0) {
    console.log(`Complete surahs (${complete.length}): ${complete.join(', ')}`)
  }

  if (partial.length > 0) {
    console.log()
    console.log('Partial surahs:')
    for (const { surah, done, total } of partial) {
      const pct = ((done / total) * 100).toFixed(0)
      console.log(`  Surah ${surah}: ${done}/${total} (${pct}%)`)
    }
  }

  // Check R2 sync status
  if (existsSync(MANIFEST_FILE)) {
    try {
      const manifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf-8'))
      const inR2 = Object.keys(manifest.files).length
      const pendingSync = localFiles.length - inR2

      console.log()
      console.log('R2 Sync Status:')
      console.log('-'.repeat(40))
      console.log(`  In R2: ${inR2}`)
      console.log(`  Pending sync: ${pendingSync}`)
    } catch {
      console.log()
      console.log('R2 manifest not found or invalid')
    }
  } else {
    console.log()
    console.log('R2: Not synced yet (no manifest found)')
  }

  console.log()
  console.log('='.repeat(60))
}

main()
