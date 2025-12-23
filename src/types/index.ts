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
// WORD ANALYSIS TYPES
// =============================================================================

// Root information for an Arabic word
export interface WordRoot {
  letters: string              // e.g., "ح-م-د"
  transliteration: string      // e.g., "ḥ-m-d"
  meaning: string              // Core meaning of the root
}

// Morphological pattern information
export interface WordMorphology {
  pattern: string              // Arabic pattern e.g., "فَعْل"
  patternTransliteration: string  // e.g., "faʿl"
  wordType: string             // e.g., "maṣdar (verbal noun)"
  note?: string                // Additional morphology notes
}

// Grammatical case and agreement
export interface WordGrammar {
  case: string                 // e.g., "nominative (marfūʿ)"
  caseMarker: string           // e.g., "ḍamma (ُ)"
  caseReason: string           // e.g., "mubtadaʾ (subject)"
  gender: 'masculine' | 'feminine'
  number: 'singular' | 'dual' | 'plural'
}

// Component parts for compound words (e.g., لِلَّهِ = لِ + اللَّهِ)
export interface WordComponent {
  element: string              // Arabic element
  transliteration: string
  type: string                 // e.g., "preposition (ḥarf jarr)"
  function?: string            // What it does
}

// Complete word-by-word analysis
export interface WordAnalysis {
  // Essential (always shown)
  wordNumber: number
  arabic: string
  transliteration: string
  meaning: string              // Literal meaning

  // Quick reference (shown in table)
  root?: WordRoot
  grammaticalCategory?: string // e.g., "definite noun (ism maʿrifa)"

  // Detailed (expandable)
  morphology?: WordMorphology
  grammar?: WordGrammar
  syntacticFunction?: string   // e.g., "mubtadaʾ (subject)"
  components?: WordComponent[] // For compound words
  semanticNote?: string        // Additional meaning context
  definiteness?: string        // e.g., "definite (by al- prefix)"
}

// Sentence-level grammar observations
export interface SentenceGrammar {
  sentenceType: {
    classification: string     // e.g., "jumla ismiyya (nominal sentence)"
    mubtada?: string           // Subject
    khabar?: string            // Predicate
  }
  idafaConstructions?: {
    description: string
    mudaf: string
    mudafIlayhi: string
  }[]
  notes?: string[]
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
    preservingSyntax?: string  // Keeping Arabic word order
  }
  rootSummary: {
    word: string
    transliteration: string
    root: string
    coreMeaning: string
    derivedMeaning: string
  }[]
  grammarObservations?: SentenceGrammar
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
