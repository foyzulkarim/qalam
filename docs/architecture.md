# Architecture

Technical overview of Qalam's Cloudflare-native architecture.

## Design Principles

- **Stateless**: No database, no user accounts, no server-side state
- **Static First**: Pre-built pages served from CDN
- **Data Integrity**: Quranic text from verified sources, never LLM-generated
- **Cloudflare-Native**: Uses platform services directly (Pages, Workers, R2, KV)

## Architecture Overview

```
┌─────────────────────────┐     ┌─────────────────────────┐
│   CLOUDFLARE PAGES      │     │   CLOUDFLARE WORKER     │
│   (Static App Only)     │     │   (qalam-api)           │
├─────────────────────────┤     ├─────────────────────────┤
│ Next.js static export   │     │ POST /assess            │
│ HTML/JS/CSS/fonts       │────▶│ GET /list-bucket        │
│ No data files           │     │ GET /health             │
│ < 500 files             │     │ KV caching (30 days)    │
└─────────────────────────┘     └─────────────────────────┘
          │                              │
          │                              ▼
          │                     ┌─────────────────────────┐
          │                     │   CLOUDFLARE R2         │
          │                     │   (Public Bucket)       │
          │                     ├─────────────────────────┤
          │                     │ quran.json              │
          │                     │ surahs.json             │
          └────────────────────▶│ analysis/*.json (1000+) │
                                └─────────────────────────┘
                                cdn.versemadeeasy.com
```

**Key insight:** Data is served directly from public R2 (no Worker proxy). The Worker only handles `/assess` requests that need LLM + KV caching.

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 16 (App Router) | Static site generation |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first CSS |
| Fonts | Amiri | Arabic text rendering |
| Hosting | Cloudflare Pages | Static app CDN |
| API | Cloudflare Worker | Assessment endpoint |
| Storage | Cloudflare R2 | Data files (public bucket) |
| Cache | Cloudflare KV | Assessment result caching |

## Project Structure

```
qalam/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout with fonts
│   │   ├── history/
│   │   │   └── page.tsx          # Attempt history page
│   │   └── browse/
│   │       ├── page.tsx          # Surah listing
│   │       └── surah/[id]/
│   │           ├── page.tsx      # Verse listing
│   │           └── [verse]/
│   │               └── page.tsx  # Practice page
│   │
│   ├── components/
│   │   ├── ui/                   # Button, Card, Input, Alert, Spinner, Modal
│   │   ├── Navbar.tsx
│   │   ├── VerseDisplay.tsx
│   │   ├── FeedbackCard.tsx
│   │   └── AttemptHistoryModal.tsx
│   │
│   ├── lib/
│   │   ├── data.ts               # Data fetching from R2
│   │   ├── attemptHistory.ts     # LocalStorage attempt tracking
│   │   └── formatters.ts         # Date/score formatting utilities
│   │
│   └── types/
│       └── index.ts              # TypeScript definitions
│
├── worker/                       # Cloudflare Worker
│   ├── src/
│   │   ├── index.ts              # Router
│   │   ├── handlers/assess.ts    # Assessment logic
│   │   └── lib/                  # LLM, cache, prompts
│   └── wrangler.toml             # Worker config
│
├── public/data/                  # Local data (source for R2)
│   ├── quran.json                # Complete Quran
│   ├── surahs.json               # Surah metadata
│   └── analysis/                 # Word-by-word analysis
│
├── worker/                       # Cloudflare Worker (Assessment API)
│   ├── src/index.ts              # Worker entry point
│   └── wrangler.toml             # Worker configuration
│
├── scripts/
│   ├── build-quran-json.ts       # Build quran.json
│   ├── seed-analysis.ts          # Generate analysis
│   ├── upload-to-r2.ts           # Sync data to R2
│   └── data-status.ts            # Progress report
│
└── docs/                         # Documentation
```

## Data Architecture

### Source Data (Human-Verified)

Quranic text comes from [Tanzil.net](https://tanzil.net):

| File | Content | Location |
|------|---------|----------|
| `quran.json` | Complete Quran with Arabic + translations | R2 bucket |
| `surahs.json` | Metadata for all 114 surahs | R2 bucket |
| `quran-simple.txt` | Arabic text source | Local only |
| `en.sahih.txt` | Sahih International translation | Local only |
| `en.transliteration.txt` | Transliteration | Local only |

**Key principle**: Arabic text and translations are NEVER LLM-generated.

### Analysis Data (LLM-Generated)

Word-by-word linguistic analysis in R2 bucket at `analysis/`:

- File format: `{surah}-{verse}.json` (e.g., `1-5.json`)
- Contains: roots, grammar, morphology, transliteration
- Generated using Ollama or LM Studio locally
- See [LLM Integration](./llm-integration.md) for details

## Data Flow

```
Build Time:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Tanzil.net      │────▶│ quran.json      │────▶│ R2 Bucket       │
│ source files    │     │ (verified text) │     │ (public)        │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Ollama / LMS    │────▶│ analysis/*.json │────▶│ R2 Bucket       │
│ (local LLM)     │     │ (linguistic)    │     │ (public)        │
└─────────────────┘     └─────────────────┘     └─────────────────┘

Runtime (Data):
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ User visits     │────▶│ R2 via CDN      │────▶│ React renders   │
│ verse page      │     │ (direct fetch)  │     │ Arabic + analysis│
└─────────────────┘     └─────────────────┘     └─────────────────┘

Runtime (Assessment):
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ User submits    │────▶│ Worker checks   │────▶│ Return cached   │
│ translation     │     │ KV cache        │     │ or call LLM     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Worker API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/assess` | POST | Translation assessment (LLM + KV cache) |
| `/list-bucket` | GET | List R2 files (for sync scripts) |
| `/health` | GET | Health check |

See [worker/README.md](../worker/README.md) for full API documentation.

## Key Types

```typescript
// Complete Quran structure
interface QuranData {
  meta: { totalVerses: number; totalSurahs: number }
  surahs: QuranSurah[]
}

// Surah with verses
interface QuranSurah {
  id: number
  name: string
  nameArabic: string
  meaning: string
  verseCount: number
  revelationType: 'meccan' | 'medinan'
  verses: QuranVerse[]
}

// Individual verse
interface QuranVerse {
  id: string           // "1:5" format
  number: number
  arabic: string
  translations: {
    'en.sahih': string
    'en.transliteration': string
  }
}

// Word analysis
interface WordAnalysis {
  wordNumber: number
  arabic: string
  transliteration: string
  meaning: string
  root?: { letters: string; meaning: string }
  grammar?: { case: string; gender: string; number: string }
  morphology?: { pattern: string; wordType: string }
}
```

## Client-Side State (LocalStorage)

User progress is stored in the browser with no server-side persistence:

```typescript
// Stored in localStorage under 'qalam_attempt_history'
interface AttemptHistoryStore {
  attempts: StoredAttempt[]
  lastUpdated: string  // ISO date
}

interface StoredAttempt {
  id: string              // timestamp-based unique id
  verseId: string         // e.g., "1:5"
  userTranslation: string
  feedback: AttemptFeedback
  timestamp: string       // ISO date
}
```

**Limits:**
- Max 50 attempts per verse
- Max 500 total attempts
- Older attempts pruned automatically

**Features:**
- View attempt history by timeline or grouped by verse
- Filter by surah
- See score progression over time

## Design System

| Element | Value |
|---------|-------|
| Primary | Teal (#14b8a6) |
| Secondary | Gold (#f59e0b) |
| Arabic Font | `font-arabic` class (Amiri) |
| RTL | `dir="rtl"` + `lang="ar"` |

## Deployment

### Pages (Static App)

```bash
npm run build  # Outputs to ./out
```

Deployed via GitHub Actions or manually:
```bash
npx wrangler pages deploy out --project-name=qalam
```

### Worker (API)

```bash
npm run worker:deploy
```

### R2 (Data)

```bash
npm run upload:r2  # Smart sync - only uploads missing files
```
