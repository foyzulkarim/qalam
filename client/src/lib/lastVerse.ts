const STORAGE_KEY = 'qalam_last_verse'
const DEFAULT_VERSE = { surahId: 1, verseNum: 1 }

export interface LastVerse {
  surahId: number
  verseNum: number
}

export function saveLastVerse(surahId: number, verseNum: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ surahId, verseNum }))
}

export function getLastVerse(): LastVerse {
  if (typeof window === 'undefined') return DEFAULT_VERSE

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_VERSE

    const parsed = JSON.parse(stored)
    if (typeof parsed.surahId === 'number' && typeof parsed.verseNum === 'number') {
      return parsed
    }
    return DEFAULT_VERSE
  } catch {
    return DEFAULT_VERSE
  }
}

export function getLastVersePath(): string {
  const { surahId, verseNum } = getLastVerse()
  return `/browse/surah/${surahId}/${verseNum}`
}
