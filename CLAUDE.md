# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Qalam is a stateless Quran translation learning application. Users practice translating Quranic verses and receive AI-powered feedback. The app has no user authentication or database—all data is served from static JSON files.

## Common Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run seed:analysis # Generate verse analysis via Ollama (requires Ollama running)
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom Islamic-themed colors (teal primary, gold accents)
- **Fonts**: Amiri for Arabic text (RTL), system fonts for UI

### Key Directories
- `src/app/` - Next.js App Router pages
- `src/components/ui/` - Reusable UI components (Button, Card, Input, Alert, Spinner)
- `src/components/` - Feature components (Navbar, VerseDisplay, FeedbackCard)
- `src/lib/data.ts` - Data fetching utilities for static JSON
- `src/types/` - TypeScript definitions for linguistic analysis, verses, feedback
- `public/data/` - Static JSON data (surahs, verses, pre-computed analysis)
- `scripts/` - Utility scripts including Ollama-based analysis seeder

### Data Flow
1. Static JSON files in `public/data/` contain all Quran data
2. `src/lib/data.ts` provides fetch utilities with client-side caching
3. Verse analysis is pre-computed via Ollama and stored as `public/data/analysis/{surah}-{verse}.json`
4. Verse IDs use "surah:verse" format (e.g., "1:5" for Surah 1, Verse 5)

### Important Types (src/types/index.ts)
- `Surah` - Surah metadata (id, name, nameArabic, meaning, verseCount, revelationType)
- `Verse` - Individual verse with Arabic text, English translation, transliteration
- `VerseAnalysis` - Complete word-by-word linguistic analysis (roots, grammar, morphology)
- `WordAnalysis` - Detailed breakdown of each word
- `AttemptFeedback` - LLM evaluation results (score, correct/missed elements, suggestions)

### LLM Integration
- Uses Ollama locally for verse analysis generation
- Environment variables: `OLLAMA_BASE_URL` (default: http://localhost:11434), `OLLAMA_MODEL` (default: llama3.2, recommended: qwen2.5:72b)
- Seed script at `scripts/seed-analysis.ts` generates analysis files with resume capability

### Design System
- Primary color: Teal (#14b8a6) - Islamic aesthetic
- Secondary color: Gold (#f59e0b) - accents
- Arabic text uses `font-arabic` class with custom `text-arabic-*` sizes
- RTL support via `dir="rtl"` and `lang="ar"` attributes

## Development Notes

- Path alias: `@/*` maps to `./src/*`
- Arabic text must include proper tashkil (diacritical marks)
- Available surahs with full data: 1, 103, 112, 113, 114 (see `getRandomVerse()` in data.ts)
- Surah files use zero-padded IDs: `001.json`, `103.json`, etc.
