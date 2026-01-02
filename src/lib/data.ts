import { Surah, Verse, VerseAnalysis, QuranData, QuranSurah, QuranVerse } from '@/types'

/**
 * Data fetching utilities for Quran data
 * Data is served directly from public R2 bucket
 * Assessment requests go to the Worker API
 */

// Public R2 URL for data (required - no fallback to ensure env is configured)
const DATA_BASE_URL = process.env.NEXT_PUBLIC_R2_URL
if (!DATA_BASE_URL) {
  throw new Error('NEXT_PUBLIC_R2_URL environment variable is required')
}

// Analysis manifest type
export interface AnalysisManifest {
  verses: string[]
  generatedAt: string
}

// Cache for client-side data
let surahsCache: Surah[] | null = null
let quranDataCache: QuranData | null = null
let manifestCache: AnalysisManifest | null = null
const analysisCache = new Map<string, VerseAnalysis | null>()
const analysisPending = new Map<string, Promise<VerseAnalysis | null>>()

// =============================================================================
// QURAN.JSON - Source of Truth (Tanzil.net data)
// =============================================================================

/**
 * Fetch the complete Quran data (cached)
 * This is the authoritative source for Arabic text and translations
 */
export async function getQuranData(): Promise<QuranData> {
  if (typeof window !== 'undefined' && quranDataCache) {
    return quranDataCache
  }

  const response = await fetch(`${DATA_BASE_URL}/quran.json`)
  if (!response.ok) {
    throw new Error('Failed to fetch quran.json')
  }

  const data = await response.json()

  if (typeof window !== 'undefined') {
    quranDataCache = data
  }

  return data
}

/**
 * Get a surah with all verses from quran.json
 */
export async function getQuranSurah(surahId: number): Promise<QuranSurah | null> {
  const quran = await getQuranData()
  return quran.surahs.find(s => s.id === surahId) || null
}

/**
 * Get a specific verse from quran.json
 */
export async function getQuranVerse(surahId: number, verseNum: number): Promise<QuranVerse | null> {
  const surah = await getQuranSurah(surahId)
  if (!surah) return null
  return surah.verses.find(v => v.number === verseNum) || null
}

/**
 * Get verse by ID string (e.g., "1:5") from quran.json
 */
export async function getQuranVerseById(verseId: string): Promise<{ surah: QuranSurah; verse: QuranVerse } | null> {
  const [surahId, verseNum] = verseId.split(':').map(Number)
  const surah = await getQuranSurah(surahId)
  if (!surah) return null

  const verse = surah.verses.find(v => v.number === verseNum)
  if (!verse) return null

  return { surah, verse }
}

// =============================================================================
// LEGACY FUNCTIONS (surahs.json - metadata only)
// =============================================================================

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
 * Get surah metadata by ID (from surahs.json)
 */
export async function getSurahMetadata(id: number): Promise<Surah | null> {
  const surahs = await getAllSurahs()
  return surahs.find(s => s.id === id) || null
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
 * Fetch the uploaded manifest (list of verses with analysis available in R2)
 * This is used by the surah page to know which verses are clickable
 */
export async function getAnalysisManifest(): Promise<AnalysisManifest> {
  if (typeof window !== 'undefined' && manifestCache) {
    return manifestCache
  }

  try {
    const response = await fetch(`${DATA_BASE_URL}/uploaded.json`)
    if (!response.ok) {
      return { verses: [], generatedAt: '' }
    }

    const data = await response.json()

    if (typeof window !== 'undefined') {
      manifestCache = data
    }

    return data
  } catch {
    return { verses: [], generatedAt: '' }
  }
}

/**
 * Get verse analysis by verse ID (e.g., "1:2")
 * Returns null if analysis not available
 * Deduplicates concurrent requests for the same verse
 */
export async function getVerseAnalysis(verseId: string): Promise<VerseAnalysis | null> {
  // Check cache first
  if (typeof window !== 'undefined' && analysisCache.has(verseId)) {
    return analysisCache.get(verseId)!
  }

  // Check if request is already in-flight (deduplication)
  if (typeof window !== 'undefined' && analysisPending.has(verseId)) {
    return analysisPending.get(verseId)!
  }

  // Convert "1:2" to "1-2" for file naming
  const fileName = verseId.replace(':', '-')

  const fetchPromise = (async () => {
    try {
      const response = await fetch(`${DATA_BASE_URL}/analysis/${fileName}.json`)
      if (!response.ok) {
        if (typeof window !== 'undefined') {
          analysisCache.set(verseId, null)
        }
        return null
      }
      const data = await response.json()
      if (typeof window !== 'undefined') {
        analysisCache.set(verseId, data)
      }
      return data
    } catch {
      if (typeof window !== 'undefined') {
        analysisCache.set(verseId, null)
      }
      return null
    } finally {
      // Remove from pending once complete
      if (typeof window !== 'undefined') {
        analysisPending.delete(verseId)
      }
    }
  })()

  // Track the in-flight request
  if (typeof window !== 'undefined') {
    analysisPending.set(verseId, fetchPromise)
  }

  return fetchPromise
}

/**
 * Check if verse analysis is available
 */
export async function hasVerseAnalysis(verseId: string): Promise<boolean> {
  const analysis = await getVerseAnalysis(verseId)
  return analysis !== null
}
