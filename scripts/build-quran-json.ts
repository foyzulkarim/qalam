/**
 * Build Script: Generate quran.json from Tanzil.net source files
 *
 * Consolidates source files into a single quran.json:
 *   - surahs.json (metadata)
 *   - quran-simple.txt (Arabic text)
 *   - en.sahih.txt (Sahih International translation)
 *   - en.transliteration.txt (Transliteration)
 *
 * Usage:
 *   npx tsx scripts/build-quran-json.ts
 *
 * Output:
 *   public/data/quran.json
 */

import * as fs from 'fs'
import * as path from 'path'

// Paths
const PROJECT_ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(PROJECT_ROOT, 'public/data')
const SURAHS_FILE = path.join(DATA_DIR, 'surahs.json')
const ARABIC_FILE = path.join(DATA_DIR, 'quran-simple.txt')
const OUTPUT_FILE = path.join(DATA_DIR, 'quran.json')

// Translation configuration - add new translations here
const TRANSLATIONS: { key: string; file: string; label: string }[] = [
  { key: 'en.sahih', file: 'en.sahih.txt', label: 'Sahih International' },
  { key: 'en.transliteration', file: 'en.transliteration.txt', label: 'Transliteration' },
]

// Types
interface SurahMeta {
  id: number
  name: string
  nameArabic: string
  meaning: string
  verseCount: number
  revelationType: 'Meccan' | 'Medinan'
}

interface QuranVerse {
  number: number
  arabic: string
  translations: Record<string, string>
}

interface QuranSurah extends SurahMeta {
  verses: QuranVerse[]
}

interface QuranData {
  meta: {
    source: string
    arabicEdition: string
    translations: string[]
    generatedAt: string
  }
  surahs: QuranSurah[]
}

/**
 * Parse pipe-delimited verse file (surah|verse|text)
 * Returns a Map keyed by "surah:verse"
 */
function parseVerseFile(filePath: string): Map<string, string> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter((line) => line.trim())
  const verses = new Map<string, string>()

  for (const line of lines) {
    const parts = line.split('|')
    if (parts.length >= 3) {
      const surahId = parts[0].trim()
      const verseNum = parts[1].trim()
      const text = parts.slice(2).join('|').trim() // Handle text with | in it
      verses.set(`${surahId}:${verseNum}`, text)
    }
  }

  return verses
}

/**
 * Main build function
 */
function build() {
  console.log('='.repeat(60))
  console.log('Building quran.json from Tanzil.net sources')
  console.log('='.repeat(60))
  console.log('')

  // Check required files exist
  if (!fs.existsSync(SURAHS_FILE)) {
    console.error(`ERROR: Source file not found: ${SURAHS_FILE}`)
    process.exit(1)
  }
  console.log(`Found: ${path.basename(SURAHS_FILE)}`)

  if (!fs.existsSync(ARABIC_FILE)) {
    console.error(`ERROR: Source file not found: ${ARABIC_FILE}`)
    process.exit(1)
  }
  console.log(`Found: ${path.basename(ARABIC_FILE)}`)

  // Check translation files
  const availableTranslations: typeof TRANSLATIONS = []
  for (const translation of TRANSLATIONS) {
    const filePath = path.join(DATA_DIR, translation.file)
    if (fs.existsSync(filePath)) {
      console.log(`Found: ${translation.file} (${translation.label})`)
      availableTranslations.push(translation)
    } else {
      console.warn(`WARNING: Translation file not found: ${translation.file} - skipping`)
    }
  }
  console.log('')

  // Load surah metadata
  console.log('Loading surah metadata...')
  const surahsMeta: SurahMeta[] = JSON.parse(fs.readFileSync(SURAHS_FILE, 'utf-8'))
  console.log(`  ${surahsMeta.length} surahs loaded`)

  // Parse Arabic text
  console.log('Parsing Arabic text...')
  const arabicVerses = parseVerseFile(ARABIC_FILE)
  console.log(`  ${arabicVerses.size} verses parsed`)

  // Parse all translation files
  const translationMaps: Map<string, Map<string, string>> = new Map()
  for (const translation of availableTranslations) {
    console.log(`Parsing ${translation.label}...`)
    const filePath = path.join(DATA_DIR, translation.file)
    const verses = parseVerseFile(filePath)
    translationMaps.set(translation.key, verses)
    console.log(`  ${verses.size} verses parsed`)
  }

  // Build the consolidated structure
  console.log('')
  console.log('Building consolidated structure...')

  const quranData: QuranData = {
    meta: {
      source: 'tanzil.net',
      arabicEdition: 'quran-simple',
      translations: availableTranslations.map((t) => t.key),
      generatedAt: new Date().toISOString(),
    },
    surahs: [],
  }

  let totalVerses = 0
  let missingArabic = 0
  const missingTranslations: Record<string, number> = {}
  for (const t of availableTranslations) {
    missingTranslations[t.key] = 0
  }

  for (const surah of surahsMeta) {
    const verses: QuranVerse[] = []

    for (let verseNum = 1; verseNum <= surah.verseCount; verseNum++) {
      const verseId = `${surah.id}:${verseNum}`
      const arabic = arabicVerses.get(verseId)

      if (!arabic) {
        console.warn(`  WARNING: Missing Arabic for ${verseId}`)
        missingArabic++
      }

      // Build translations object
      const translations: Record<string, string> = {}
      for (const translation of availableTranslations) {
        const translationMap = translationMaps.get(translation.key)
        const text = translationMap?.get(verseId)
        if (!text) {
          console.warn(`  WARNING: Missing ${translation.key} for ${verseId}`)
          missingTranslations[translation.key]++
        }
        translations[translation.key] = text || ''
      }

      verses.push({
        number: verseNum,
        arabic: arabic || '',
        translations,
      })
      totalVerses++
    }

    quranData.surahs.push({
      ...surah,
      verses,
    })
  }

  console.log(`  ${totalVerses} total verses`)
  if (missingArabic > 0) console.log(`  ${missingArabic} missing Arabic texts`)
  for (const [key, count] of Object.entries(missingTranslations)) {
    if (count > 0) console.log(`  ${count} missing ${key}`)
  }

  // Write output
  console.log('')
  console.log('Writing quran.json...')
  const jsonOutput = JSON.stringify(quranData, null, 2)
  fs.writeFileSync(OUTPUT_FILE, jsonOutput)

  const fileSizeKB = (Buffer.byteLength(jsonOutput) / 1024).toFixed(1)
  const fileSizeMB = (Buffer.byteLength(jsonOutput) / (1024 * 1024)).toFixed(2)
  console.log(`  Size: ${fileSizeKB} KB (${fileSizeMB} MB)`)
  console.log(`  Path: ${OUTPUT_FILE}`)

  console.log('')
  console.log('='.repeat(60))
  console.log('BUILD COMPLETE')
  console.log('='.repeat(60))

  // Verify sample
  console.log('')
  console.log('Sample verification (1:1):')
  const sample = quranData.surahs[0].verses[0]
  console.log(`  Arabic: ${sample.arabic}`)
  for (const translation of availableTranslations) {
    console.log(`  ${translation.label}: ${sample.translations[translation.key]}`)
  }
}

// Run
build()
