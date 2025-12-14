# Qalam: Shared TypeScript Types

**Version:** 2.0  
**Location:** `shared/types/`  
**Purpose:** Type definitions used by both frontend and backend

---

## Overview

The `shared/` directory contains TypeScript type definitions that are imported by both the client and server. This ensures that the API contract is enforced at compile time, preventing type mismatches between frontend and backend.

Both client and server import from `@qalam/shared` thanks to TypeScript path mapping configured in their respective `tsconfig.json` files.

---

## Directory Structure

```
shared/
├── types/
│   ├── index.ts        # Re-exports all types
│   ├── verse.ts        # Verse and Surah types
│   ├── api.ts          # Request/Response types
│   ├── attempt.ts      # Attempt and Feedback types
│   └── user.ts         # User types
├── tsconfig.json
└── package.json
```

---

## shared/types/verse.ts

Types related to Quranic verses and surahs.

```typescript
/**
 * Represents a single verse from the Quran
 */
export interface Verse {
  /** Unique identifier in format "surahId:verseNumber" (e.g., "1:1", "2:255") */
  id: string;
  
  /** Verse number within the surah (1-indexed) */
  number: number;
  
  /** Arabic text with tashkeel (diacritical marks) */
  arabic: string;
  
  /** English translation (Sahih International) */
  translation: string;
}

/**
 * Metadata about a surah (for list views, without full verses)
 */
export interface SurahMeta {
  /** Surah number (1-114) */
  id: number;
  
  /** Surah names in different formats */
  name: {
    /** Arabic name (e.g., "الفاتحة") */
    arabic: string;
    
    /** Transliteration (e.g., "Al-Fatihah") */
    transliteration: string;
    
    /** English meaning (e.g., "The Opening") */
    english: string;
  };
  
  /** Where the surah was revealed */
  revelation: 'meccan' | 'medinan';
  
  /** Total number of verses in this surah */
  verseCount: number;
}

/**
 * Complete surah with all verses
 */
export interface Surah extends SurahMeta {
  /** All verses in this surah */
  verses: Verse[];
}
```

---

## shared/types/user.ts

Types related to user accounts and authentication.

```typescript
/**
 * User account information (returned after login/registration)
 */
export interface User {
  /** Unique user identifier */
  id: string;
  
  /** User's email address */
  email: string;
  
  /** User's display name */
  name: string;
  
  /** Preferred translation (for future use when multiple translations available) */
  preferredTranslation: string;
  
  /** When the account was created */
  createdAt: string;
  
  /** When the user last logged in */
  lastLoginAt: string | null;
}

/**
 * User profile update data (partial updates allowed)
 */
export interface UserUpdateData {
  name?: string;
  preferredTranslation?: string;
}

/**
 * Password change request
 */
export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}
```

---

## shared/types/attempt.ts

Types related to verse attempts and LLM feedback.

```typescript
/**
 * LLM-generated feedback on a verse attempt
 */
export interface Feedback {
  /** Brief summary of the evaluation (1-2 sentences) */
  summary: string;
  
  /** Parts of the verse meaning the user got correct */
  correct: string[];
  
  /** Important parts the user missed or got wrong */
  missed: string[];
  
  /** Optional teaching moment - a pattern, root, or grammatical insight */
  insight: string | null;
}

/**
 * A single verse attempt by a user
 */
export interface Attempt {
  /** Unique attempt identifier */
  id: string;
  
  /** Which verse was attempted (format: "surahId:verseNumber") */
  verseId: string;
  
  /** What the user typed as their understanding */
  userInput: string;
  
  /** Whether the user clicked "I don't know" */
  skipped: boolean;
  
  /** LLM evaluation score (0-100) */
  score: number;
  
  /** LLM-generated feedback */
  feedback: Feedback;
  
  /** When this attempt was made */
  createdAt: string;
}

/**
 * Verse attempt with full verse data (used in history views)
 */
export interface AttemptWithVerse extends Attempt {
  /** The verse that was attempted */
  verse: {
    arabic: string;
    translation: string;
  };
}
```

---

## shared/types/api.ts

Types for API requests and responses.

```typescript
import { User, UserUpdateData, PasswordChangeData } from './user';
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
```

---

## shared/types/index.ts

Central export file that re-exports all types.

```typescript
// Re-export all types from submodules
export * from './verse';
export * from './user';
export * from './attempt';
export * from './api';
```

This allows both client and server to import everything from a single location:

```typescript
import { Verse, User, EvaluateRequest } from '@qalam/shared';
```

---

## TypeScript Configuration

### shared/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "outDir": "./dist"
  },
  "include": ["types/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### shared/package.json

```json
{
  "name": "@qalam/shared",
  "version": "1.0.0",
  "private": true,
  "main": "types/index.ts",
  "types": "types/index.ts",
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

---

## Usage in Client

### client/tsconfig.json

```json
{
  "compilerOptions": {
    "paths": {
      "@qalam/shared": ["../shared/types"]
    }
  },
  "references": [
    { "path": "../shared" }
  ]
}
```

### client/src/services/api.ts

```typescript
import type {
  EvaluateRequest,
  EvaluateResponse,
  ProgressResponse,
  AuthResponse
} from '@qalam/shared';

class ApiClient {
  async evaluate(request: EvaluateRequest): Promise<EvaluateResponse> {
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error('Evaluation failed');
    }
    
    return response.json();
  }
  
  async getProgress(): Promise<ProgressResponse> {
    const response = await fetch('/api/progress', {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    
    return response.json();
  }
}
```

---

## Usage in Server

### server/tsconfig.json

```json
{
  "compilerOptions": {
    "paths": {
      "@qalam/shared": ["../shared/types"]
    }
  },
  "references": [
    { "path": "../shared" }
  ]
}
```

### server/src/modules/evaluate/evaluate.controller.ts

```typescript
import type { EvaluateRequest, EvaluateResponse } from '@qalam/shared';
import { Request, Response } from 'express';

export async function evaluateVerse(
  req: Request<{}, {}, EvaluateRequest>,
  res: Response<EvaluateResponse>
) {
  const { verseId, userInput, skipped } = req.body;
  
  // Type-safe! TypeScript knows the shape of the request and response
  const result = await evaluationService.evaluate({
    userId: req.user!.id,
    verseId,
    userInput,
    skipped
  });
  
  res.json(result);
}
```

---

## Type Safety Benefits

### Compile-Time Validation

When the API contract changes, both frontend and backend will fail to compile if they don't match:

```typescript
// If backend changes EvaluateResponse to add a new field
export interface EvaluateResponse {
  attemptId: string;
  score: number;
  feedback: Feedback;
  // New field added
  recommendedNextVerse: string;  
}

// Frontend code that accesses this field gets autocomplete
const response = await api.evaluate(request);
console.log(response.recommendedNextVerse);  // TypeScript knows this exists!
```

### Autocomplete in IDEs

When importing from `@qalam/shared`, IDEs provide autocomplete for all available types, reducing errors and improving developer experience.

### Refactoring Safety

If you rename a field in a shared type, TypeScript will show errors everywhere that field is used, making refactoring safe and easy.

---

## Validation vs Types

**Important distinction:**

TypeScript types provide compile-time type checking, but they don't validate data at runtime. For runtime validation (especially for API requests), you still need validation libraries.

**Backend validation (using zod or joi):**

```typescript
import { z } from 'zod';
import type { EvaluateRequest } from '@qalam/shared';

// Runtime validation schema
const evaluateRequestSchema = z.object({
  verseId: z.string().regex(/^\d+:\d+$/),
  userInput: z.string(),
  skipped: z.boolean()
});

// In controller
const validatedData = evaluateRequestSchema.parse(req.body);
// Now validatedData is type EvaluateRequest and runtime-validated
```

Types ensure the code is correct. Validation ensures the data is correct.

---

## Adding New Types

When adding new types, follow this workflow to keep frontend and backend in sync.

**Step one: Define the type in shared/types/**

```typescript
// shared/types/review.ts
export interface ReviewSession {
  id: string;
  userId: string;
  versesToReview: string[];
  createdAt: string;
}
```

**Step two: Export from index.ts**

```typescript
// shared/types/index.ts
export * from './review';
```

**Step three: Use in API specification**

```typescript
// shared/types/api.ts
import { ReviewSession } from './review';

export interface CreateReviewSessionRequest {
  versesToReview: string[];
}

export interface CreateReviewSessionResponse {
  session: ReviewSession;
}
```

**Step four: Implement in backend**

```typescript
// server/src/modules/review/review.controller.ts
import type { CreateReviewSessionResponse } from '@qalam/shared';
```

**Step five: Use in frontend**

```typescript
// client/src/services/api.ts
import type { CreateReviewSessionResponse } from '@qalam/shared';
```

Both sides are now in sync automatically.

---

## Version Control

Types should be versioned along with the API. When making breaking changes to types, coordinate frontend and backend updates, or use API versioning with separate type files for each version.

---

*These shared types are the contract between frontend and backend. They should be updated together, and both sides should always build against the same version of the types.*
