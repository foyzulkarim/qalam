# API Routes

---

## Surah Routes

### GET /api/surahs

Returns list of all surahs from `index.json`.

```typescript
// Response
[
  { "id": 1, "name": "Al-Fatihah", "arabicName": "الفاتحة", "versesCount": 7 },
  { "id": 2, "name": "Al-Baqarah", "arabicName": "البقرة", "versesCount": 286 }
  // ... all 114 surahs
]
```

### GET /api/surahs/[id]

Returns single surah with all verses.

```typescript
// Response
{
  "id": 1,
  "name": {
    "arabic": "الفاتحة",
    "transliteration": "Al-Fatihah",
    "english": "The Opening"
  },
  "revelation": "meccan",
  "verseCount": 7,
  "verses": [
    {
      "id": "1:1",
      "number": 1,
      "arabic": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      "translation": "In the name of Allah..."
    }
    // ...
  ]
}
```

---

## Evaluation Route

### POST /api/evaluate

Evaluates user's translation attempt.

```typescript
// Request
{
  surahId: number,
  verseNum: number,
  userInput: string,
  skipped?: boolean  // true if user clicked "I Don't Know"
}

// Response
{
  score: number,              // 0-100
  summary: string,            // Brief feedback
  gotCorrect: string[],       // What user got right
  missed: string[],           // What user missed
  insight: string | null,     // Teaching moment
  correctTranslation: string,
  analysis: {
    words: WordAnalysis[],
    grammarNotes: string[]
  }
}
```

**"I Don't Know" behavior:**
- If `skipped: true`, LLM is NOT called
- Score is 0
- Returns correct translation + full analysis
- Summary: "That's okay! Learning takes time..."

---

## Progress Routes

### GET /api/progress

Returns user's learning statistics summary.

```typescript
// Response
{
  totalAttempts: number,
  uniqueVerses: number,
  averageScore: number,
  daysActive: number
}
```

### GET /api/progress/next-verse

Returns the next unattempted verse for "Continue Reading" feature.

```typescript
// Response
{
  surahId: number,
  verseNum: number,
  verseId: string,    // "1:3" format
  surahName: string,
  arabic: string,
  hasAttempted: false
}
```

**Algorithm:**
```
1. Get all 6,236 verse IDs in order (1:1 → 114:6)
2. Get user's attempted verse IDs from Attempt table
3. Find first verse ID NOT in attempted list
4. Return that verse with metadata

Edge cases:
- If all verses attempted: return verse 1:1 (start over)
- If no user logged in: return 1:1
```

### GET /api/progress/history

Returns recent attempts with pagination.

```typescript
// Query params: ?limit=10&offset=0

// Response
{
  attempts: [
    {
      id: string,
      verseId: string,
      surahName: string,
      verseNum: number,
      score: number,
      userInput: string,
      createdAt: string
    }
  ],
  total: number,
  hasMore: boolean
}
```

### GET /api/progress/surahs/[id]

Returns user's progress on a specific surah.

```typescript
// Response
{
  surahId: number,
  surahName: string,
  totalVerses: number,
  versesAttempted: number,
  averageScore: number,
  verses: [
    {
      verseNum: number,
      attempted: boolean,
      bestScore: number | null,
      attemptCount: number
    }
  ]
}
```

### GET /api/progress/verses/[verseId]

Returns all attempts for a specific verse.

```typescript
// Response
{
  verseId: string,
  surahId: number,
  verseNum: number,
  arabic: string,
  translation: string,
  totalAttempts: number,
  averageScore: number,
  bestScore: number,
  attempts: [
    {
      id: string,
      userInput: string,
      score: number,
      summary: string,
      gotCorrect: string[],
      missed: string[],
      insight: string | null,
      createdAt: string
    }
  ]
}
```

---

## Authentication

Authentication is handled by NextAuth.js at `/api/auth/[...nextauth]`.

All `/api/progress/*` and `/api/evaluate` routes require authentication. Return 401 if not authenticated.
