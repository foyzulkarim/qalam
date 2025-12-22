# Qalam: API Specification

**Version:** 2.0  
**Base URL:** `/api`  
**Purpose:** Complete HTTP API contract between frontend and backend

---

## Overview

All API endpoints are prefixed with `/api`. Authentication is via JWT tokens sent in the `Authorization` header as `Bearer <token>`. All request and response bodies use `application/json`.

---

## Authentication Endpoints

### POST /api/auth/register

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "Ahmed Khan"
}
```

**Validation:**
- `email`: Valid email format, unique
- `password`: Minimum 8 characters
- `name`: 1-100 characters

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "Ahmed Khan",
    "createdAt": "2024-12-14T10:30:00Z"
  }
}
```

**Errors:**
- `400` - Validation error (invalid email format, password too short, etc.)
- `409` - Email already exists

---

### POST /api/auth/login

Authenticate existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "Ahmed Khan",
    "lastLoginAt": "2024-12-14T10:30:00Z"
  }
}
```

**Errors:**
- `400` - Validation error
- `401` - Invalid credentials (wrong email or password)

---

### GET /api/auth/me

Get current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "123",
  "email": "user@example.com",
  "name": "Ahmed Khan",
  "preferredTranslation": "sahih-international",
  "createdAt": "2024-12-01T08:00:00Z",
  "lastLoginAt": "2024-12-14T10:30:00Z"
}
```

**Errors:**
- `401` - Token missing, invalid, or expired

---

## Verse Endpoints

### GET /api/surahs

List all surahs with metadata.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "surahs": [
    {
      "id": 1,
      "name": {
        "arabic": "الفاتحة",
        "transliteration": "Al-Fatihah",
        "english": "The Opening"
      },
      "revelation": "meccan",
      "verseCount": 7
    },
    {
      "id": 2,
      "name": {
        "arabic": "البقرة",
        "transliteration": "Al-Baqarah",
        "english": "The Cow"
      },
      "revelation": "medinan",
      "verseCount": 286
    }
    // ... all 114 surahs
  ]
}
```

**Note:** This reads from `data/surahs/index.json`

---

### GET /api/surahs/:id

Get a specific surah with all its verses.

**Authentication:** Required

**Parameters:**
- `:id` - Surah number (1-114)

**Response (200 OK):**
```json
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
      "arabic": "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ",
      "translation": "In the name of Allah, the Entirely Merciful, the Especially Merciful."
    },
    {
      "id": "1:2",
      "number": 2,
      "arabic": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      "translation": "[All] praise is [due] to Allah, Lord of the worlds -"
    }
    // ... all verses in surah
  ]
}
```

**Errors:**
- `404` - Surah not found (id < 1 or > 114)

**Note:** This reads from `data/surahs/{id}.json`

---

### GET /api/surahs/:surahId/verses/:verseNumber

Get a single verse.

**Authentication:** Required

**Parameters:**
- `:surahId` - Surah number (1-114)
- `:verseNumber` - Verse number within surah

**Response (200 OK):**
```json
{
  "id": "1:2",
  "number": 2,
  "arabic": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
  "translation": "[All] praise is [due] to Allah, Lord of the worlds -"
}
```

**Errors:**
- `404` - Verse not found

---

## Practice/Evaluation Endpoints

### POST /api/evaluate

Evaluate user's understanding of a verse using LLM.

**Authentication:** Required

**Request:**
```json
{
  "verseId": "1:2",
  "userInput": "All praise belongs to Allah, the Lord of all worlds",
  "skipped": false
}
```

**Validation:**
- `verseId`: Must match format "surahId:verseNumber" and exist
- `userInput`: String (can be empty if skipped)
- `skipped`: Boolean

**Response (200 OK):**
```json
{
  "attemptId": "456",
  "verseId": "1:2",
  "score": 85,
  "feedback": {
    "summary": "Excellent - you captured the core meaning accurately",
    "correct": [
      "praise to Allah",
      "Lord of the worlds"
    ],
    "missed": [
      "The word 'due' - all praise is *due* to Allah"
    ],
    "insight": null
  },
  "analysis": {
    "words": [
      { "index": 0, "arabic": "الْحَمْدُ", "category": "noun", "root": "ح-م-د", "coreRootMeaning": "praise", "literalMeaning": "the praise" },
      { "index": 1, "arabic": "لِلَّهِ", "category": "noun", "literalMeaning": "to Allah" },
      { "index": 2, "arabic": "رَبِّ", "category": "noun", "root": "ر-ب-ب", "coreRootMeaning": "nurture, sustain", "literalMeaning": "Lord" },
      { "index": 3, "arabic": "الْعَالَمِينَ", "category": "noun", "root": "ع-ل-م", "coreRootMeaning": "know", "literalMeaning": "the worlds" }
    ],
    "literalAligned": ["The-praise", "to-Allah", "Lord", "the-worlds"],
    "roots": [
      { "word": "الحمد", "root": "ح-م-د", "coreRootMeaning": "praise", "derivedMeaning": "the praise" },
      { "word": "رب", "root": "ر-ب-ب", "coreRootMeaning": "nurture, sustain", "derivedMeaning": "lord, master" }
    ],
    "grammarNotes": ["Nominal sentence", "Definite article indicates totality of praise"]
  },
  "verse": {
    "arabic": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    "translation": "[All] praise is [due] to Allah, Lord of the worlds -"
  },
  "createdAt": "2024-12-14T10:35:00Z"
}
```

**Process:**
1. Validate request
2. Load verse from JSON files (`data/surahs/`)
3. Load pre-computed analysis from `data/analysis/` (if available)
4. Call LLM with simple comparison prompt (compares user input to correct translation)
5. Parse LLM response
6. Store attempt in database
7. Return combined response: runtime feedback + pre-computed analysis

**Note:** The `analysis` field is optional. If pre-computed analysis is not yet available for a verse, the response will omit this field but still include the runtime `feedback`.

**Errors:**
- `400` - Validation error (invalid verseId format)
- `404` - Verse not found
- `503` - LLM service unavailable

**Performance Notes:**
- LLM latency is typically 0.5-1 second (simple comparison, not full analysis)
- Client should show loading state
- Consider timeout of 5 seconds

---

## Progress Endpoints

### GET /api/progress

Get user's overall learning statistics.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "totalAttempts": 47,
  "uniqueVerses": 15,
  "averageScore": 73.5,
  "lastAttemptAt": "2024-12-14T10:35:00Z",
  "daysActive": 8
}
```

**Implementation:**
```sql
SELECT 
  COUNT(*) as totalAttempts,
  COUNT(DISTINCT verseId) as uniqueVerses,
  AVG(score) as averageScore,
  MAX(createdAt) as lastAttemptAt,
  COUNT(DISTINCT DATE(createdAt)) as daysActive
FROM attempts
WHERE userId = ?;
```

---

### GET /api/progress/next-verse

Get the next verse to practice (sequential order).

**Authentication:** Required

**Response (200 OK):**
```json
{
  "verseId": "1:3",
  "surahId": 1,
  "verseNumber": 3,
  "arabic": "الرَّحْمَـٰنِ الرَّحِيمِ",
  "translation": "The Entirely Merciful, the Especially Merciful,"
}
```

**Logic:**
1. Get all verseIds user has attempted
2. Loop through verses in order (1:1, 1:2, ... 1:7, 2:1, ...)
3. Return first verse not yet attempted
4. If all available verses attempted, return next verse in next available surah

**Note:** This only considers verses in JSON files that exist. If only Al-Fatihah is available, it will loop back to 1:1 after 1:7.

---

### GET /api/progress/history

Get user's recent attempts across all verses.

**Authentication:** Required

**Query Parameters:**
- `limit` (optional): Number of attempts to return (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "attempts": [
    {
      "id": "789",
      "verseId": "1:2",
      "score": 85,
      "createdAt": "2024-12-14T10:35:00Z"
    },
    {
      "id": "788",
      "verseId": "1:1",
      "score": 90,
      "createdAt": "2024-12-14T10:30:00Z"
    }
    // ... up to `limit` attempts
  ]
}
```

---

### GET /api/progress/verses/:verseId

Get user's learning history with a specific verse.

**Authentication:** Required

**Parameters:**
- `:verseId` - Format "surahId:verseNumber" (e.g., "1:2")

**Response (200 OK):**
```json
{
  "verseId": "1:2",
  "attempts": [
    {
      "id": "456",
      "userInput": "All praise belongs to Allah, the Lord of all worlds",
      "score": 85,
      "feedback": {
        "summary": "Excellent - you captured the core meaning accurately",
        "correct": ["praise to Allah", "Lord of the worlds"],
        "missed": ["The word 'due'"],
        "insight": null
      },
      "createdAt": "2024-12-14T10:35:00Z"
    },
    {
      "id": "123",
      "userInput": "Praise Allah",
      "score": 50,
      "feedback": {
        "summary": "Partial understanding - you got the basic idea",
        "correct": ["praise to Allah"],
        "missed": ["Lord of the worlds", "completeness of praise"],
        "insight": null
      },
      "createdAt": "2024-12-10T09:00:00Z"
    }
  ],
  "stats": {
    "totalAttempts": 2,
    "averageScore": 67.5,
    "firstAttemptAt": "2024-12-10T09:00:00Z",
    "lastAttemptAt": "2024-12-14T10:35:00Z"
  }
}
```

**Use Case:** User wants to see their learning journey with this verse over time.

---

### GET /api/progress/surahs/:surahId

Get user's progress on a specific surah.

**Authentication:** Required

**Parameters:**
- `:surahId` - Surah number (1-114)

**Response (200 OK):**
```json
{
  "surahId": 1,
  "totalVerses": 7,
  "versesAttempted": 3,
  "completionPercentage": 42.9,
  "averageScore": 75.0,
  "attempts": [
    {
      "verseId": "1:1",
      "attemptCount": 2,
      "lastScore": 90,
      "lastAttemptAt": "2024-12-14T10:30:00Z"
    },
    {
      "verseId": "1:2",
      "attemptCount": 2,
      "lastScore": 85,
      "lastAttemptAt": "2024-12-14T10:35:00Z"
    },
    {
      "verseId": "1:3",
      "attemptCount": 1,
      "lastScore": 50,
      "lastAttemptAt": "2024-12-13T14:00:00Z"
    }
  ]
}
```

**Use Case:** User views their progress on Al-Fatihah to see which verses need more work.

---

## User Settings Endpoints

### PATCH /api/users/me

Update current user's profile or settings.

**Authentication:** Required

**Request (partial update):**
```json
{
  "name": "Ahmed Khan (Updated)",
  "preferredTranslation": "sahih-international"
}
```

**Response (200 OK):**
```json
{
  "id": "123",
  "email": "user@example.com",
  "name": "Ahmed Khan (Updated)",
  "preferredTranslation": "sahih-international",
  "updatedAt": "2024-12-14T10:40:00Z"
}
```

**Allowed Fields:**
- `name`: 1-100 characters
- `preferredTranslation`: String (for future use)

**Note:** Email cannot be changed. Password change is separate endpoint.

**Errors:**
- `400` - Validation error

---

### PATCH /api/users/me/password

Change user's password.

**Authentication:** Required

**Request:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newsecurepassword456"
}
```

**Validation:**
- `currentPassword`: Must match current password
- `newPassword`: Minimum 8 characters

**Response (200 OK):**
```json
{
  "message": "Password updated successfully"
}
```

**Errors:**
- `400` - Validation error (new password too short)
- `401` - Current password incorrect

---

## Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {
      "field": "email",
      "constraint": "required"
    }
  }
}
```

### Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | VALIDATION_ERROR | Request validation failed |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 401 | INVALID_CREDENTIALS | Wrong email/password |
| 403 | FORBIDDEN | Valid token but insufficient permissions |
| 404 | NOT_FOUND | Resource doesn't exist |
| 409 | CONFLICT | Resource already exists (e.g., email) |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Unexpected server error |
| 503 | LLM_UNAVAILABLE | LLM service error |

---

## Authentication

### JWT Token Structure

Tokens are signed with HS256 algorithm using `JWT_SECRET` from environment.

**Payload:**
```json
{
  "userId": "123",
  "email": "user@example.com",
  "iat": 1702554600,
  "exp": 1703159400
}
```

**Header Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expiry:** 7 days (configurable via `JWT_EXPIRES_IN`)

**When token expires:**
- Server returns 401 with code `TOKEN_EXPIRED`
- Client should redirect to login page

---

## Rate Limiting

**Per-IP limits:**
- Auth endpoints: 5 requests per minute
- Evaluation endpoint: 10 requests per minute (LLM is expensive)
- All other endpoints: 100 requests per minute

**Implementation:**
- Use `express-rate-limit` middleware
- Store in memory (simple, stateless)
- For production with multiple servers, use Redis

**Response when rate limited (429):**
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests, please try again later",
    "retryAfter": 60
  }
}
```

---

## CORS Configuration

**Development:**
```typescript
cors({
  origin: 'http://localhost:5173',
  credentials: true
})
```

**Production:**
```typescript
cors({
  origin: process.env.CLIENT_URL || 'https://qalam.yourdomain.com',
  credentials: true
})
```

---

## Request/Response Headers

### Standard Headers

**All Requests:**
```
Content-Type: application/json
```

**Authenticated Requests:**
```
Authorization: Bearer <token>
```

**All Responses:**
```
Content-Type: application/json
X-Request-ID: <unique-request-id>
```

**Successful Mutations:**
```
Location: /api/attempts/456  (for POST /evaluate)
```

---

## Pagination (Future)

Not needed for MVP (small data sets), but here's the pattern for future use:

**Request:**
```
GET /api/progress/history?page=2&limit=20
```

**Response:**
```json
{
  "attempts": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

## API Versioning

Not needed for MVP. When needed later, use URL versioning:

```
/api/v1/evaluate  (current)
/api/v2/evaluate  (new version)
```

Maintain both versions during transition period, then deprecate v1.

---

## Endpoint Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Create account | No |
| POST | /api/auth/login | Login | No |
| GET | /api/auth/me | Get current user | Yes |
| GET | /api/surahs | List all surahs | Yes |
| GET | /api/surahs/:id | Get surah with verses | Yes |
| GET | /api/surahs/:surahId/verses/:verseNumber | Get single verse | Yes |
| POST | /api/evaluate | Evaluate verse attempt (returns feedback + analysis) | Yes |
| GET | /api/progress | Get overall stats | Yes |
| GET | /api/progress/next-verse | Get next verse to practice | Yes |
| GET | /api/progress/history | Get recent attempts | Yes |
| GET | /api/progress/verses/:verseId | Get verse learning history | Yes |
| GET | /api/progress/surahs/:surahId | Get surah progress | Yes |
| PATCH | /api/users/me | Update profile | Yes |
| PATCH | /api/users/me/password | Change password | Yes |

**Total: 14 endpoints**

---

*This API specification is the contract between frontend and backend. Both sides must implement it exactly as specified. Any changes should be discussed and documented here first.*

**Related Documentation:**
- See `6-VERSE_ANALYSIS_PIPELINE.md` for how pre-computed analysis data is generated and stored.
