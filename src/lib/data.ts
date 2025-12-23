import { Surah, Verse, VerseAnalysis } from '@/types'

/**
 * Data fetching utilities for Quran data
 * All data is served from static JSON files in /public/data
 */

const DATA_BASE_URL = '/data'

// Cache for client-side data
let surahsCache: Surah[] | null = null

/**
 * Fetch all surahs (metadata only, no verses)
 */
export async function getAllSurahs(): Promise<Surah[]> {
  if (typeof window !== 'undefined' && surahsCache) {
    return surahsCache
  }

  const response = await fetch(`${DATA_BASE_URL}/surahs.json`)
  if (!response.ok) {
    throw new Error('Failed to fetch surahs')
  }

  const surahs = await response.json()

  if (typeof window !== 'undefined') {
    surahsCache = surahs
  }

  return surahs
}

/**
 * Fetch a single surah with all its verses
 */
export async function getSurahById(id: number): Promise<(Surah & { verses: Verse[] }) | null> {
  const paddedId = id.toString().padStart(3, '0')

  try {
    const response = await fetch(`${DATA_BASE_URL}/surahs/${paddedId}.json`)
    if (!response.ok) {
      return null
    }
    return await response.json()
  } catch {
    return null
  }
}

/**
 * Get a specific verse by its ID (e.g., "1:5")
 */
export async function getVerseById(verseId: string): Promise<Verse | null> {
  const [surahId] = verseId.split(':').map(Number)

  const surah = await getSurahById(surahId)
  if (!surah) return null

  return surah.verses.find(v => v.id === verseId) || null
}

/**
 * Get a random verse from available surahs
 * Used for "Quick Practice" feature
 */
export async function getRandomVerse(): Promise<Verse | null> {
  // Available surah files (we have data for these)
  const availableSurahs = [1, 103, 112, 113, 114]

  const randomSurahId = availableSurahs[Math.floor(Math.random() * availableSurahs.length)]
  const surah = await getSurahById(randomSurahId)

  if (!surah || surah.verses.length === 0) return null

  const randomVerse = surah.verses[Math.floor(Math.random() * surah.verses.length)]
  return randomVerse
}

/**
 * Check if a surah has verse data available
 */
export async function hasSurahData(id: number): Promise<boolean> {
  const surah = await getSurahById(id)
  return surah !== null
}

/**
 * Get featured verses for the home page
 */
export function getFeaturedVerses(): { id: string; surahName: string }[] {
  return [
    { id: '1:1', surahName: 'Al-Fatihah' },
    { id: '112:1', surahName: 'Al-Ikhlas' },
    { id: '103:1', surahName: 'Al-Asr' },
    { id: '113:1', surahName: 'Al-Falaq' },
    { id: '114:1', surahName: 'An-Nas' },
  ]
}

/**
 * Get verse analysis by verse ID (e.g., "1:2")
 * Returns null if analysis not available
 */
export async function getVerseAnalysis(verseId: string): Promise<VerseAnalysis | null> {
  // Convert "1:2" to "1-2" for file naming
  const fileName = verseId.replace(':', '-')

  try {
    const response = await fetch(`${DATA_BASE_URL}/analysis/${fileName}.json`)
    if (!response.ok) {
      return null
    }
    return await response.json()
  } catch {
    return null
  }
}

/**
 * Check if verse analysis is available
 */
export async function hasVerseAnalysis(verseId: string): Promise<boolean> {
  const analysis = await getVerseAnalysis(verseId)
  return analysis !== null
}
