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
│   │   └── browse/
│   │       ├── page.tsx          # Surah listing
│   │       └── surah/[id]/
│   │           ├── page.tsx      # Verse listing
│   │           └── [verse]/
│   │               └── page.tsx  # Practice page
│   │
│   ├── components/
│   │   ├── ui/                   # Button, Card, Input, Alert, Spinner
│   │   ├── Navbar.tsx
│   │   ├── VerseDisplay.tsx
│   │   └── FeedbackCard.tsx
│   │
│   ├── lib/
│   │   └── data.ts               # Data fetching with caching
│   │
│   └── types/
│       └── index.ts              # TypeScript definitions
│
├── public/data/                  # Static JSON data
│   ├── quran.json                # Complete Quran
│   ├── surahs.json               # Surah metadata
│   └── analysis/                 # Word-by-word analysis
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

Currently includes:
- Surah Al-Fatihah (1:1-7)
- Juz Amma (Surahs 78-114)

## Data Flow

```
Build Time:
┌─────────────────┐     ┌─────────────────┐
│ Tanzil.net      │────▶│ quran.json      │
│ source files    │     │ (verified text) │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│ LM Studio or    │────▶│ analysis/*.json │
│ Ollama (local)  │     │ (linguistic)    │
└─────────────────┘     └─────────────────┘

Runtime:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ User visits     │────▶│ Static JSON     │────▶│ React renders   │
│ verse page      │     │ loaded          │     │ Arabic + analysis│
└─────────────────┘     └─────────────────┘     └─────────────────┘
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
