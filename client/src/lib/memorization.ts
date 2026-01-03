const STORAGE_KEY = 'qalam_memorized_verses'
const MEMORIZATION_THRESHOLD = 0.9

export interface MemorizedVerseData {
  verseId: string
  memorizedAt: string
  highScore: number
}

export interface MemorizationStore {
  verses: MemorizedVerseData[]
  lastUpdated: string
}

const DEFAULT_STORE: MemorizationStore = {
  verses: [],
  lastUpdated: new Date().toISOString()
}

/**
 * Get the full memorization store from localStorage
 */
export function getMemorizationStore(): MemorizationStore {
  if (typeof window === 'undefined') return DEFAULT_STORE

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_STORE

    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed.verses)) {
      return parsed
    }
    return DEFAULT_STORE
  } catch {
    return DEFAULT_STORE
  }
}

/**
 * Save the memorization store to localStorage
 */
function saveMemorizationStore(store: MemorizationStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

/**
 * Check if a specific verse is memorized
 */
export function isVerseMemorized(verseId: string): boolean {
  const store = getMemorizationStore()
  return store.verses.some(v => v.verseId === verseId)
}

/**
 * Get memorized verse data (or null if not memorized)
 */
export function getMemorizedVerse(verseId: string): MemorizedVerseData | null {
  const store = getMemorizationStore()
  return store.verses.find(v => v.verseId === verseId) || null
}

/**
 * Mark a verse as memorized (or update high score if already memorized)
 * Only saves if score >= 90%
 * Returns true if verse was newly memorized or score updated
 */
export function markVerseMemorized(verseId: string, score: number): boolean {
  if (score < MEMORIZATION_THRESHOLD) return false

  const store = getMemorizationStore()
  const existingIndex = store.verses.findIndex(v => v.verseId === verseId)

  if (existingIndex >= 0) {
    // Update high score if new score is better
    if (score > store.verses[existingIndex].highScore) {
      store.verses[existingIndex].highScore = score
      store.lastUpdated = new Date().toISOString()
      saveMemorizationStore(store)
      return true
    }
    return false
  }

  // Add new memorized verse
  store.verses.push({
    verseId,
    memorizedAt: new Date().toISOString(),
    highScore: score
  })
  store.lastUpdated = new Date().toISOString()
  saveMemorizationStore(store)
  return true
}

/**
 * Remove memorization status from a verse
 */
export function unmemorizeVerse(verseId: string): boolean {
  const store = getMemorizationStore()
  const initialLength = store.verses.length
  store.verses = store.verses.filter(v => v.verseId !== verseId)

  if (store.verses.length < initialLength) {
    store.lastUpdated = new Date().toISOString()
    saveMemorizationStore(store)
    return true
  }
  return false
}

/**
 * Get all memorized verses for a specific surah
 */
export function getMemorizedVersesForSurah(surahId: number): MemorizedVerseData[] {
  const store = getMemorizationStore()
  const prefix = `${surahId}:`
  return store.verses.filter(v => v.verseId.startsWith(prefix))
}

/**
 * Get count of memorized verses for a surah
 */
export function getMemorizedCountForSurah(surahId: number): number {
  return getMemorizedVersesForSurah(surahId).length
}

/**
 * Get all memorized verse IDs as a Set (for efficient lookup)
 */
export function getMemorizedVerseIds(): Set<string> {
  const store = getMemorizationStore()
  return new Set(store.verses.map(v => v.verseId))
}

/**
 * Clear all memorization data
 */
export function clearAllMemorization(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Get total memorization stats
 */
export function getMemorizationStats(): {
  totalMemorized: number
  surahsWithMemorized: number
} {
  const store = getMemorizationStore()
  const surahIds = new Set(
    store.verses.map(v => parseInt(v.verseId.split(':')[0], 10))
  )
  return {
    totalMemorized: store.verses.length,
    surahsWithMemorized: surahIds.size
  }
}
