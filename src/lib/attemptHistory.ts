import type { AttemptFeedback } from '@/types'

const STORAGE_KEY = 'qalam_attempt_history'

export interface StoredAttempt {
  id: string              // unique id (timestamp-based)
  verseId: string         // e.g., "1:5"
  userTranslation: string
  feedback: AttemptFeedback
  timestamp: string       // ISO date
}

export interface AttemptHistoryStore {
  attempts: StoredAttempt[]
  lastUpdated: string
}

const DEFAULT_STORE: AttemptHistoryStore = {
  attempts: [],
  lastUpdated: new Date().toISOString()
}

/**
 * Get the full attempt history store from localStorage
 */
export function getAttemptHistoryStore(): AttemptHistoryStore {
  if (typeof window === 'undefined') return DEFAULT_STORE

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_STORE

    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed.attempts)) {
      return parsed
    }
    return DEFAULT_STORE
  } catch {
    return DEFAULT_STORE
  }
}

/**
 * Save the attempt history store to localStorage
 */
function saveAttemptHistoryStore(store: AttemptHistoryStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

/**
 * Generate a unique ID for an attempt
 */
function generateAttemptId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Save a new attempt to history
 */
export function saveAttempt(
  verseId: string,
  userTranslation: string,
  feedback: AttemptFeedback
): StoredAttempt {
  const store = getAttemptHistoryStore()

  const attempt: StoredAttempt = {
    id: generateAttemptId(),
    verseId,
    userTranslation,
    feedback,
    timestamp: new Date().toISOString()
  }

  store.attempts.push(attempt)
  store.lastUpdated = new Date().toISOString()
  saveAttemptHistoryStore(store)

  return attempt
}

/**
 * Get all attempts for a specific verse (newest first)
 */
export function getVerseAttempts(verseId: string): StoredAttempt[] {
  const store = getAttemptHistoryStore()
  return store.attempts
    .filter(a => a.verseId === verseId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

/**
 * Get all attempts across all verses (newest first)
 */
export function getAllAttempts(): StoredAttempt[] {
  const store = getAttemptHistoryStore()
  return store.attempts
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

/**
 * Get attempts grouped by verse
 */
export function getAttemptsByVerse(): Record<string, StoredAttempt[]> {
  const store = getAttemptHistoryStore()
  const grouped: Record<string, StoredAttempt[]> = {}

  for (const attempt of store.attempts) {
    if (!grouped[attempt.verseId]) {
      grouped[attempt.verseId] = []
    }
    grouped[attempt.verseId].push(attempt)
  }

  // Sort each group by timestamp (newest first)
  for (const verseId in grouped) {
    grouped[verseId].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  return grouped
}

/**
 * Get attempt count for a specific verse
 */
export function getVerseAttemptCount(verseId: string): number {
  return getVerseAttempts(verseId).length
}

/**
 * Get total attempt count
 */
export function getTotalAttemptCount(): number {
  const store = getAttemptHistoryStore()
  return store.attempts.length
}

/**
 * Clear history for a specific verse
 */
export function clearVerseHistory(verseId: string): boolean {
  const store = getAttemptHistoryStore()
  const initialLength = store.attempts.length
  store.attempts = store.attempts.filter(a => a.verseId !== verseId)

  if (store.attempts.length < initialLength) {
    store.lastUpdated = new Date().toISOString()
    saveAttemptHistoryStore(store)
    return true
  }
  return false
}

/**
 * Clear all attempt history
 */
export function clearAllHistory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Get history stats
 */
export function getHistoryStats(): {
  totalAttempts: number
  versesAttempted: number
  averageScore: number
} {
  const store = getAttemptHistoryStore()
  const verseIds = new Set(store.attempts.map(a => a.verseId))

  const totalScore = store.attempts.reduce(
    (sum, a) => sum + a.feedback.overallScore,
    0
  )
  const averageScore = store.attempts.length > 0
    ? totalScore / store.attempts.length
    : 0

  return {
    totalAttempts: store.attempts.length,
    versesAttempted: verseIds.size,
    averageScore
  }
}
