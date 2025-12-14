import { User } from './user';
import { Verse, Surah, SurahMeta } from './verse';
import { Attempt, Feedback } from './attempt';

// ============================================================================
// Authentication
// ============================================================================

/**
 * User registration request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

/**
 * User login request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Authentication response (registration or login)
 */
export interface AuthResponse {
  /** JWT access token (7 day expiry) */
  token: string;

  /** User account information */
  user: User;
}

// ============================================================================
// Verses
// ============================================================================

/**
 * Response from GET /api/surahs
 */
export interface SurahsListResponse {
  surahs: SurahMeta[];
}

/**
 * Response from GET /api/surahs/:id
 */
export interface SurahResponse {
  surah: Surah;
}

/**
 * Response from GET /api/surahs/:surahId/verses/:verseNumber
 */
export interface VerseResponse {
  verse: Verse;
}

// ============================================================================
// Evaluation
// ============================================================================

/**
 * Request to evaluate a verse attempt
 */
export interface EvaluateRequest {
  /** Verse being attempted (format: "surahId:verseNumber") */
  verseId: string;

  /** User's understanding of the verse */
  userInput: string;

  /** Whether user clicked "I don't know" */
  skipped: boolean;
}

/**
 * Response from POST /api/evaluate
 */
export interface EvaluateResponse {
  /** Unique identifier for this attempt */
  attemptId: string;

  /** Which verse was attempted */
  verseId: string;

  /** Score from 0-100 */
  score: number;

  /** LLM-generated feedback */
  feedback: Feedback;

  /** The verse data (for display in feedback) */
  verse: {
    arabic: string;
    translation: string;
  };

  /** When this attempt was created */
  createdAt: string;
}

// ============================================================================
// Progress
// ============================================================================

/**
 * Overall user statistics
 */
export interface ProgressStats {
  /** Total number of verse attempts */
  totalAttempts: number;

  /** Number of unique verses attempted */
  uniqueVerses: number;

  /** Average score across all attempts */
  averageScore: number;

  /** When the user last practiced (ISO datetime) */
  lastAttemptAt: string | null;

  /** Number of distinct days user has practiced */
  daysActive: number;
}

/**
 * Response from GET /api/progress
 */
export interface ProgressResponse {
  stats: ProgressStats;
}

/**
 * Response from GET /api/progress/next-verse
 */
export interface NextVerseResponse {
  verse: Verse;
}

/**
 * Attempt summary for history list
 */
export interface AttemptSummary {
  id: string;
  verseId: string;
  score: number;
  createdAt: string;
}

/**
 * Response from GET /api/progress/history
 */
export interface HistoryResponse {
  attempts: AttemptSummary[];
}

/**
 * Verse-specific statistics
 */
export interface VerseStats {
  /** Total attempts for this verse */
  totalAttempts: number;

  /** Average score for this verse */
  averageScore: number;

  /** When user first attempted this verse */
  firstAttemptAt: string;

  /** When user last attempted this verse */
  lastAttemptAt: string;
}

/**
 * Response from GET /api/progress/verses/:verseId
 */
export interface VerseHistoryResponse {
  verseId: string;
  attempts: Attempt[];
  stats: VerseStats;
}

/**
 * Summary of user's progress on a single verse (for surah overview)
 */
export interface VerseProgressSummary {
  verseId: string;
  attemptCount: number;
  lastScore: number;
  lastAttemptAt: string;
}

/**
 * Response from GET /api/progress/surahs/:surahId
 */
export interface SurahProgressResponse {
  surahId: number;
  totalVerses: number;
  versesAttempted: number;
  completionPercentage: number;
  averageScore: number;
  attempts: VerseProgressSummary[];
}

// ============================================================================
// User Settings
// ============================================================================

/**
 * Response from PATCH /api/users/me
 */
export interface UserUpdateResponse {
  user: User;
}

/**
 * Response from PATCH /api/users/me/password
 */
export interface PasswordChangeResponse {
  message: string;
}

// ============================================================================
// Errors
// ============================================================================

/**
 * Standard error response structure
 */
export interface ApiError {
  error: {
    /** Machine-readable error code */
    code: string;

    /** Human-readable error message */
    message: string;

    /** Optional additional context */
    details?: Record<string, unknown>;
  };
}

/**
 * Error codes that can be returned by the API
 */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'LLM_UNAVAILABLE';
