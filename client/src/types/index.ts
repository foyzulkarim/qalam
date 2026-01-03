/**
 * Core type definitions for Qalam
 * Stateless knowledge application - no user accounts
 */

// Surah metadata
export interface Surah {
  id: number
  name: string           // English name
  nameArabic: string     // Arabic name
  meaning: string        // English meaning
  verseCount: number
  revelationType: 'Meccan' | 'Medinan'
}

// Individual verse
export interface Verse {
  id: string             // e.g., "1:1" (surah:ayah)
  surahId: number
  verseNumber: number
  textArabic: string
  textEnglish: string    // Reference translation
  transliteration?: string
}

// =============================================================================
// QURAN SOURCE DATA TYPES (from Tanzil.net)
// =============================================================================

// Verse in quran.json (source of truth)
export interface QuranVerse {
  number: number
  arabic: string
  translations: {
    'en.sahih': string
    'en.transliteration': string
    [key: string]: string  // Future translations
  }
}

// Surah with verses in quran.json
export interface QuranSurah extends Surah {
  verses: QuranVerse[]
}

// Complete quran.json structure
export interface QuranData {
  meta: {
    source: string           // "tanzil.net"
    arabicEdition: string    // "quran-simple"
    translations: string[]   // ["en.sahih"]
    generatedAt: string      // ISO timestamp
  }
  surahs: QuranSurah[]
}

// =============================================================================
// WORD ANALYSIS TYPES (simplified for learners)
// =============================================================================

// Root information for an Arabic word
export interface WordRoot {
  letters: string              // e.g., "ح-م-د"
  meaning: string              // Core meaning of the root
}

// Component parts for compound words (e.g., لِلَّهِ = لِ + الله)
export interface WordComponent {
  arabic: string               // Arabic element
  meaning: string              // What it means
}

// Word-by-word analysis (focused on meaning, not grammar)
export interface WordAnalysis {
  wordNumber: number
  arabic: string
  transliteration: string
  meaning: string              // Literal meaning
  root?: WordRoot              // Triliteral root (if applicable)
  components?: WordComponent[] // For compound words only
}

// Complete verse analysis
export interface VerseAnalysis {
  verseId: string
  verse: {
    arabic: string
    transliteration: string
    surah: string
    verseNumber: number
  }
  words: WordAnalysis[]
  literalTranslation: {
    wordAligned: string        // e.g., "The-praise [belongs] to-Allāh"
  }
  metadata?: {
    analysisType: string
    linguisticFramework: string
    scope: string
  }
}

// =============================================================================
// PRACTICE & FEEDBACK TYPES
// =============================================================================

// Feedback from LLM evaluation
export interface AttemptFeedback {
  overallScore: number
  correctElements: string[]
  missedElements: string[]
  suggestions: string[]
  encouragement: string
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Evaluation request
export interface EvaluateRequest {
  verseId: string
  userTranslation: string
}

// Evaluation response
export interface EvaluateResponse {
  feedback: AttemptFeedback
  referenceTranslation: string
  analysis: VerseAnalysis
}

// =============================================================================
// UI TYPES
// =============================================================================

// Form states
export type FormStatus = 'idle' | 'loading' | 'success' | 'error'

// Navigation item
export interface NavItem {
  label: string
  href: string
}

// Session preferences (localStorage)
export interface UserPreferences {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge'
  showHints: boolean
  lastVerseId?: string
}
