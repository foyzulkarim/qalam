/**
 * Cloudflare Worker Types
 */

// Environment bindings
export interface Env {
  // KV namespace for caching assessments
  ASSESSMENT_CACHE: KVNamespace

  // R2 bucket for data storage (used for listing files)
  DATA_BUCKET: R2Bucket

  // Public R2 URL for fetching data (Worker needs this for assessment context)
  R2_PUBLIC_URL: string

  // LLM Configuration
  ASSESSMENT_BACKEND: string // 'together' | 'vllm' | 'ollama'
  TOGETHER_API_KEY: string
  TOGETHER_MODEL: string
  VLLM_BASE_URL: string
  VLLM_MODEL: string
  OLLAMA_BASE_URL: string
  OLLAMA_MODEL: string

  // CORS
  ALLOWED_ORIGINS: string // comma-separated list
}

// Assessment request from client
export interface AssessmentRequest {
  verseId: string
  userTranslation: string
}

// LLM assessment result
export interface AssessmentResult {
  score: number
  feedback: string
  correctElements: string[]
  missedElements: string[]
}

// Full feedback response to client
export interface AttemptFeedback {
  overallScore: number
  correctElements: string[]
  missedElements: string[]
  suggestions: string[]
  encouragement: string
}

// API response structure
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  cached?: boolean
}

// Verse analysis structure (from static JSON)
export interface VerseAnalysis {
  verseId: string
  verse: {
    arabic: string
    transliteration: string
    surah: string
    verseNumber: number
  }
  words: Array<{
    wordNumber: number
    arabic: string
    transliteration: string
    meaning: string
    root?: { letters: string; meaning: string }
    components?: Array<{ arabic: string; meaning: string }>
  }>
  literalTranslation: {
    wordAligned: string
  }
}
