# Architecture

Technical overview of Qalam's architecture and data flow.

## Design Principles

- **Stateless**: No database, no user accounts, no server-side state
- **Static First**: Pre-built pages served from CDN
- **Data Integrity**: Quranic text from verified sources, never LLM-generated

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 16 (App Router) | Static site generation |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first CSS |
| Fonts | Amiri | Arabic text rendering |
| Hosting | Cloudflare Pages | Global CDN |

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
│   │   ├── data.ts               # Data fetching with caching
│   │   ├── attemptHistory.ts     # LocalStorage attempt tracking
│   │   └── formatters.ts         # Date/score formatting utilities
│   │
│   └── types/
│       └── index.ts              # TypeScript definitions
│
├── public/data/                  # Static JSON data
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
│   └── seed-analysis.ts          # Generate analysis
│
└── docs/                         # Documentation
```

## Data Architecture

### Source Data (Human-Verified)

Quranic text comes from [Tanzil.net](https://tanzil.net):

| File | Content |
|------|---------|
| `quran.json` | Complete Quran with Arabic + translations |
| `surahs.json` | Metadata for all 114 surahs |
| `quran-simple.txt` | Arabic text source |
| `en.sahih.txt` | Sahih International translation |
| `en.transliteration.txt` | Transliteration |

**Key principle**: Arabic text and translations are NEVER LLM-generated.

### Analysis Data (LLM-Generated)

Word-by-word linguistic analysis in `public/data/analysis/`:

- File format: `{surah}-{verse}.json` (e.g., `1-5.json`)
- Contains: roots, grammar, morphology, transliteration
- Generated using LM Studio (Gemma3-27B) or Ollama
- See [LLM Integration](./llm-integration.md) for details

## End-to-End Flow

### Build Time (Data Preparation)

```
┌─────────────────────────────────────────────────────────────────┐
│                        BUILD TIME                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Quran Text (Human-Verified)                                 │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │ Tanzil.net      │────▶│ quran.json      │                    │
│  │ • quran-simple  │     │ • Arabic text   │                    │
│  │ • en.sahih      │     │ • Translations  │                    │
│  │ • transliteration│    │ • 6,236 verses  │                    │
│  └─────────────────┘     └─────────────────┘                    │
│         ▲                                                        │
│         │ npm run build:quran                                   │
│                                                                  │
│  2. Verse Analysis (LLM-Generated)                              │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │ Local LLM       │────▶│ analysis/*.json │                    │
│  │ • LM Studio     │     │ • Word meanings │                    │
│  │ • Ollama        │     │ • Arabic roots  │                    │
│  │                 │     │ • Grammar       │                    │
│  └─────────────────┘     └─────────────────┘                    │
│         ▲                                                        │
│         │ npm run seed:analysis                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Runtime (User Flow)

```
┌─────────────────────────────────────────────────────────────────┐
│                         RUNTIME                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Browse & Select                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                   │
│  │ Landing  │───▶│ Surah    │───▶│ Verse    │                   │
│  │ Page     │    │ List     │    │ Page     │                   │
│  └──────────┘    └──────────┘    └──────────┘                   │
│                                        │                         │
│                                        ▼                         │
│  2. Practice                    ┌──────────────┐                │
│                                 │ See Arabic   │                │
│                                 │ (no translation)│             │
│                                 └──────┬───────┘                │
│                                        │                         │
│                                        ▼                         │
│  3. Submit Translation          ┌──────────────┐                │
│                                 │ User writes  │                │
│                                 │ their attempt │               │
│                                 └──────┬───────┘                │
│                                        │                         │
│                                        ▼                         │
│  4. Assessment                  ┌──────────────┐                │
│                                 │ Worker API   │◀── KV Cache    │
│                                 │ (Cloudflare) │                │
│                                 └──────┬───────┘                │
│                                        │                         │
│                                        ▼                         │
│                                 ┌──────────────┐                │
│                                 │ LLM Evaluates│                │
│                                 │ (Together.ai)│                │
│                                 └──────┬───────┘                │
│                                        │                         │
│                                        ▼                         │
│  5. Feedback                    ┌──────────────┐                │
│                                 │ Score +      │                │
│                                 │ Feedback     │                │
│                                 │ displayed    │                │
│                                 └──────┬───────┘                │
│                                        │                         │
│                                        ▼                         │
│  6. View Analysis               ┌──────────────┐                │
│                                 │ Word-by-word │                │
│                                 │ breakdown    │                │
│                                 └──────┬───────┘                │
│                                        │                         │
│                                        ▼                         │
│  7. Progress Saved              ┌──────────────┐                │
│                                 │ LocalStorage │                │
│                                 │ • Attempts   │                │
│                                 │ • Scores     │                │
│                                 │ • History    │                │
│                                 └──────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRODUCTION                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐   │
│  │ Static Site  │      │ Worker API   │      │ Together.ai  │   │
│  │ (CF Pages)   │─────▶│ /assess      │─────▶│ LLM API      │   │
│  │              │      │              │      │              │   │
│  └──────────────┘      └──────┬───────┘      └──────────────┘   │
│         │                     │                                  │
│         │               ┌─────▼──────┐                          │
│         │               │ CF KV      │                          │
│         │               │ (cache)    │                          │
│         │               └────────────┘                          │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │ Browser      │                                               │
│  │ LocalStorage │                                               │
│  │ (progress)   │                                               │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

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

Static export to Cloudflare Pages:

```bash
npm run build  # Outputs to ./out
```

Configuration in `wrangler.toml`:
```toml
name = "qalam"
[assets]
directory = "./out"
```

Alternative platforms: Vercel, Netlify, GitHub Pages, any static host.
