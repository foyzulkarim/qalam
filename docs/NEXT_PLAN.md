# Qalam: Next.js Implementation Plan

**Version:** 1.0
**Last Updated:** December 2025
**Purpose:** Simple, practical plan for a solo developer learning project

---

## Overview

Qalam is a Quran comprehension learning app. Users practice translating Arabic verses, get AI feedback, and track their progress.

**Key Principle:** Keep it simple. This is a learning project, not a production system.

---

## Technology Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 14+ (App Router) | Single process, handles frontend + backend |
| Database | SQLite + Prisma | No server to manage, great TypeScript support |
| Auth | NextAuth.js v5 | Handles sessions, cookies, security |
| Styling | Tailwind CSS | No CSS files to manage |
| LLM | Ollama (local) / Together AI (hosted) | Simple API calls per request |

---

## Project Structure

```
qalam/
├── app/
│   ├── (public)/                 # No auth required
│   │   ├── page.tsx              # Landing page
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (protected)/              # Auth required
│   │   ├── layout.tsx            # Checks auth, redirects if not logged in
│   │   ├── practice/
│   │   │   └── page.tsx          # Main practice interface
│   │   ├── progress/
│   │   │   └── page.tsx          # View learning stats
│   │   ├── browse/
│   │   │   └── page.tsx          # Browse all surahs
│   │   └── settings/
│   │       └── page.tsx          # User settings
│   │
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   │   └── route.ts          # NextAuth handler
│   │   ├── surahs/
│   │   │   └── route.ts          # GET all surahs
│   │   ├── surahs/[id]/
│   │   │   └── route.ts          # GET single surah with verses
│   │   ├── evaluate/
│   │   │   └── route.ts          # POST - evaluate user's translation
│   │   └── progress/
│   │       └── route.ts          # GET - user's learning stats
│   │
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── Navbar.tsx
│   ├── VerseDisplay.tsx          # Shows Arabic + translation
│   ├── PracticeForm.tsx          # Input for user's attempt
│   ├── FeedbackCard.tsx          # Shows LLM feedback
│   └── ProgressStats.tsx         # Shows learning stats
│
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── auth.ts                   # NextAuth configuration
│   └── llm.ts                    # LLM API calls
│
├── data/
│   └── surahs/
│       ├── index.json            # List of all 114 surahs (metadata)
│       ├── 001.json              # Al-Fatihah verses
│       ├── 002.json              # Al-Baqarah verses
│       └── ...                   # Remaining surahs
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                   # Database seeding script
│
├── public/                       # Static assets
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── .env.local                    # Environment variables (gitignored)
```

---

## Database Schema

Two tables only:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./qalam.db"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // hashed
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  attempts  Attempt[]
}

model Attempt {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Verse identification
  surahId   Int      // 1-114
  verseNum  Int      // Verse number within surah
  verseId   String   // "1:2" format for easy querying

  // User's attempt
  userInput String
  skipped   Boolean  @default(false)

  // LLM feedback
  score     Int      // 0-100
  feedback  String   // LLM's feedback text

  createdAt DateTime @default(now())

  @@index([userId])
  @@index([verseId])
}
```

---

## Quran Data Format

Each surah JSON file:

```json
// data/surahs/001.json
{
  "id": 1,
  "name": "Al-Fatihah",
  "arabicName": "الفاتحة",
  "versesCount": 7,
  "verses": [
    {
      "number": 1,
      "arabic": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      "translation": "In the name of Allah, the Most Gracious, the Most Merciful."
    },
    {
      "number": 2,
      "arabic": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
      "translation": "All praise is due to Allah, Lord of the worlds."
    }
    // ... remaining verses
  ]
}
```

Surah index file:

```json
// data/surahs/index.json
[
  { "id": 1, "name": "Al-Fatihah", "arabicName": "الفاتحة", "versesCount": 7 },
  { "id": 2, "name": "Al-Baqarah", "arabicName": "البقرة", "versesCount": 286 },
  // ... all 114 surahs
]
```

---

## Core User Flow

```
1. User visits app
   └── Not logged in → Show landing page with login/register

2. User logs in (NextAuth handles this)
   └── Redirected to /practice

3. Practice page
   ├── Shows a verse (Arabic text)
   ├── User types their translation attempt
   ├── Clicks "Submit"
   │
   └── POST /api/evaluate
       ├── Send user input + correct translation to LLM
       ├── LLM returns score (0-100) + feedback
       ├── Save attempt to database
       └── Return feedback to user

4. User sees feedback
   ├── Score and explanation
   ├── Correct translation revealed
   └── "Next Verse" button

5. Progress page
   └── Shows stats: verses attempted, average score, history
```

---

## API Routes

### GET /api/surahs
Returns list of all surahs (from index.json)

### GET /api/surahs/[id]
Returns single surah with all verses

### POST /api/evaluate
```typescript
// Request
{
  surahId: number,
  verseNum: number,
  userInput: string
}

// Response
{
  score: number,        // 0-100
  feedback: string,     // LLM explanation
  correctTranslation: string
}
```

### GET /api/progress
Returns user's learning statistics

---

## LLM Integration

Simple function that calls LLM:

```typescript
// lib/llm.ts

export async function evaluateTranslation(
  userInput: string,
  correctTranslation: string,
  arabicText: string
): Promise<{ score: number; feedback: string }> {

  const prompt = `
    Compare the user's translation attempt to the correct translation.

    Arabic verse: ${arabicText}
    Correct translation: ${correctTranslation}
    User's attempt: ${userInput}

    Rate accuracy 0-100 and give brief, encouraging feedback.

    Respond in JSON: { "score": number, "feedback": "string" }
  `;

  // Call Ollama (local) or Together AI (hosted)
  const response = await fetch(process.env.LLM_API_URL, {
    method: 'POST',
    body: JSON.stringify({ prompt })
  });

  return response.json();
}
```

---

## Environment Variables

```bash
# .env.local

# Database
DATABASE_URL="file:./prisma/qalam.db"

# NextAuth
NEXTAUTH_SECRET="generate-a-random-string"
NEXTAUTH_URL="http://localhost:3000"

# LLM (choose one)
LLM_PROVIDER="ollama"  # or "together"
LLM_API_URL="http://localhost:11434/api/generate"  # Ollama
# LLM_API_KEY="your-together-api-key"  # Together AI
```

---

## NPM Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "seed": "npx prisma migrate deploy",
    "db:studio": "npx prisma studio",
    "db:push": "npx prisma db push"
  }
}
```

---

## Implementation Phases

### Phase 1: Setup (Foundation)
- [ ] Create Next.js project with Tailwind
- [ ] Set up Prisma with SQLite
- [ ] Configure NextAuth.js (email/password)
- [ ] Create basic layout with Navbar
- [ ] Add login/register pages

### Phase 2: Data
- [ ] Add Quran JSON files to /data/surahs
- [ ] Create API route: GET /api/surahs
- [ ] Create API route: GET /api/surahs/[id]
- [ ] Create browse page (list all surahs)

### Phase 3: Practice (Core Feature)
- [ ] Create practice page UI
- [ ] Set up LLM integration (start with Ollama)
- [ ] Create API route: POST /api/evaluate
- [ ] Save attempts to database
- [ ] Show feedback to user

### Phase 4: Progress
- [ ] Create API route: GET /api/progress
- [ ] Build progress dashboard page
- [ ] Show attempt history
- [ ] Display stats (verses practiced, average score)

### Phase 5: Polish
- [ ] Settings page (update name, password)
- [ ] Better error handling
- [ ] Loading states
- [ ] Mobile responsiveness

---

## Data Source

For Quran data, you can use open datasets:
- [quran-json](https://github.com/risan/quran-json) - Simple JSON format
- [Tanzil.net](http://tanzil.net/download) - Multiple translations
- [Al Quran Cloud API](https://alquran.cloud/api) - REST API

Pick one translation you trust and convert to the format above.

---

## Deployment (When Ready)

Simple deployment to a VPS:

1. Build: `npm run build`
2. Copy files to server
3. Run with PM2 or systemd
4. Nginx reverse proxy
5. SSL with Let's Encrypt

Or even simpler: Deploy to Vercel (free tier works)

---

## What's NOT in This Plan

Keeping it simple means skipping:
- ❌ Pre-computed analysis (just call LLM each time)
- ❌ Complex caching
- ❌ OAuth providers (just email/password for now)
- ❌ Admin dashboard
- ❌ Multiple translations
- ❌ Offline support

These can be added later if needed.

---

## Summary

| Aspect | Decision |
|--------|----------|
| Single or separate apps? | Single (Next.js) |
| Database | SQLite + Prisma |
| Auth | NextAuth.js |
| Styling | Tailwind CSS |
| LLM calls | Per-request (no caching) |
| Complexity | Minimal |

**Start simple. Learn. Iterate.**
