# Qalam: Project Overview

**Version:** 3.0
**Last Updated:** December 2025
**Live Site:** [versemadeeasy.com](https://versemadeeasy.com)

---

## What is Qalam?

Qalam is a Quran comprehension learning app. Users practice translating Arabic verses, get AI feedback, and explore word-by-word analysis. The app helps Muslims who can read Arabic script but don't understand the meaning develop transferable understanding of Arabic patterns, roots, and grammar.

**Key Principle:** Keep it simple. This is a stateless application with no user accounts or database—all data is served from static JSON files.

---

## Technology Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 16 (App Router, Static Export) | Fast, SEO-friendly, deploys anywhere |
| Database | None (Stateless) | No user data to store, static JSON serves all content |
| Auth | None | No accounts needed - start learning immediately |
| Styling | Tailwind CSS | Utility-first, no CSS files to manage |
| Fonts | Amiri (Arabic) | Beautiful Arabic text rendering |
| LLM | Ollama (local) | Used for seeding analysis data only |
| Deployment | Cloudflare Pages | Fast global CDN, free hosting |

---

## Project Structure

```
qalam/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout with fonts
│   │   └── browse/
│   │       ├── page.tsx          # Surah listing
│   │       └── surah/
│   │           ├── [id]/
│   │           │   ├── page.tsx  # Surah detail with verse list
│   │           │   └── [verse]/
│   │           │       └── page.tsx  # Verse practice page
│   │
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Alert.tsx
│   │   │   └── Spinner.tsx
│   │   ├── Navbar.tsx
│   │   ├── VerseDisplay.tsx      # Arabic verse display
│   │   └── FeedbackCard.tsx      # AI feedback display
│   │
│   ├── lib/
│   │   └── data.ts               # Data fetching utilities
│   │
│   └── types/
│       └── index.ts              # TypeScript definitions
│
├── public/data/
│   ├── quran.json                # Complete Quran (Arabic + translations)
│   ├── surahs.json               # Surah metadata (114 surahs)
│   ├── quran-simple.txt          # Source: Arabic text from Tanzil.net
│   ├── en.sahih.txt              # Source: Sahih International translation
│   ├── en.transliteration.txt    # Source: Transliteration
│   └── analysis/                 # Word-by-word analysis (LLM-generated)
│       ├── 1-1.json              # Analysis for Surah 1, Verse 1
│       ├── 1-2.json
│       └── ...
│
├── scripts/
│   ├── build-quran-json.ts       # Builds quran.json from source files
│   └── seed-analysis.ts          # Generates analysis via Ollama
│
├── docs/                         # Documentation
├── next.config.js                # Next.js config (static export)
├── wrangler.toml                 # Cloudflare Pages config
└── tailwind.config.ts            # Tailwind with custom Islamic colors
```

---

## Data Flow

### Build Time (One-Time)

```
npm run build:quran  →  Parses Tanzil.net source files → Creates quran.json
npm run seed:analysis →  Sends verses to Ollama → Creates analysis/*.json files
```

### At Runtime

```
User visits verse page
    │
    ├── Load verse from quran.json (Arabic + translations)
    ├── Load pre-computed analysis from analysis/{surah}-{verse}.json
    ├── Display Arabic text with word-by-word breakdown
    │
User submits translation attempt
    │
    ├── (Future: Send to LLM API for evaluation)
    └── Display feedback to user
```

Note: Currently the app displays pre-computed analysis. Runtime LLM evaluation for user translations is planned for future versions.

---

## Core User Flow

1. **Visit app** → Landing page with "Start Practice" or "Browse Surahs"
2. **Browse surahs** → See all 114 surahs with metadata
3. **Select surah** → View all verses in that surah
4. **Practice verse** → See Arabic, attempt translation, view analysis
5. **Explore words** → Word-by-word breakdown with roots and grammar

---

## Key Features

### Implemented
- Complete Quran text (Arabic + Sahih International translation)
- Surah browsing with metadata
- Verse display with proper RTL Arabic rendering
- Word-by-word analysis display (for seeded verses)
- Mobile-responsive design
- Static export for fast loading

### Planned
- Runtime LLM evaluation of user translation attempts
- Progress tracking (client-side, localStorage)
- Audio recitation support

---

## Design System

| Element | Value |
|---------|-------|
| Primary Color | Teal (#14b8a6) - Islamic aesthetic |
| Secondary Color | Gold (#f59e0b) - accents |
| Arabic Font | Amiri with `font-arabic` class |
| Arabic Sizing | Custom `text-arabic-*` classes |
| RTL Support | `dir="rtl"` and `lang="ar"` attributes |

---

## Related Docs

- [Database Schema](./02-database.md) - *Legacy, not used in current version*
- [API Routes](./03-api-routes.md) - *Legacy, not used in current version*
- [LLM Integration](./04-llm-integration.md)
- [Security](./05-security.md)
- [Setup Guide](./06-setup.md)
- [User Journey](./qalam-user-journey.md)
- [UX Pages](./qalam-ux-pages.md)
