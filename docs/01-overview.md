# Qalam: Project Overview

**Version:** 2.0
**Last Updated:** December 2025

---

## What is Qalam?

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
| LLM | Ollama (local) | Used for seeding (analysis) and runtime (feedback) |

---

## Project Structure

```
qalam/
├── app/
│   ├── (public)/                 # No auth required
│   │   ├── page.tsx              # Landing page
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (protected)/              # Auth required
│   │   ├── layout.tsx            # Checks auth, redirects if not logged in
│   │   ├── practice/page.tsx     # Main practice interface
│   │   ├── progress/page.tsx     # View learning stats
│   │   ├── browse/page.tsx       # Browse all surahs
│   │   └── settings/page.tsx     # User settings
│   │
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── surahs/route.ts
│   │   ├── surahs/[id]/route.ts
│   │   ├── evaluate/route.ts
│   │   └── progress/route.ts
│   │
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── Navbar.tsx
│   ├── VerseDisplay.tsx
│   ├── PracticeForm.tsx
│   ├── FeedbackCard.tsx
│   ├── AnalysisView.tsx
│   └── ProgressStats.tsx
│
├── lib/
│   ├── db.ts                     # Prisma client singleton
│   ├── auth.ts                   # NextAuth configuration
│   └── llm.ts                    # LLM API calls
│
├── data/
│   ├── surahs/                   # Quran verse data (114 files + index)
│   └── analysis/                 # Pre-computed verse analysis
│
├── prisma/schema.prisma
├── scripts/
│   ├── fetch-quran-data.ts       # Downloads Quran data
│   └── seed.ts                   # Generates verse analysis via LLM
│
└── .env.local
```

---

## Data Flow

### Before App Runs (One-Time)

```
npm run fetch-quran  →  Downloads Quran data to /data/surahs/
npm run seed         →  Generates analysis via LLM to /data/analysis/
```

### At Runtime

```
User submits translation attempt
    │
    ├── Load pre-computed analysis from /data/analysis/
    ├── Send to LLM: user input + analysis + correct translation
    ├── LLM returns feedback (score + explanation)
    ├── Save attempt to SQLite database
    └── Display feedback + analysis to user
```

---

## Core User Flow

1. **Visit app** → Landing page with login/register
2. **Log in** → Redirected to dashboard
3. **Practice** → See verse, type translation, submit
4. **Feedback** → Score, what you got right/wrong, teaching insight
5. **Progress** → Track stats and history over time

---

## Implementation Phases

### Phase 1: Setup
- Create Next.js project with Tailwind
- Set up Prisma with SQLite
- Configure NextAuth.js
- Create basic layout and auth pages

### Phase 2: Data
- Fetch Quran JSON files
- Create seed script for verse analysis
- Create surah API routes
- Create browse page

### Phase 3: Practice (Core)
- Create practice page UI
- Set up runtime LLM integration
- Create evaluation API route
- Show feedback + analysis

### Phase 4: Progress
- Create progress API routes
- Build progress dashboard
- Show attempt history and stats

### Phase 5: Polish
- Settings page
- Error handling
- Loading states
- Mobile responsiveness

---

## Related Docs

- [Database Schema](./02-database.md)
- [API Routes](./03-api-routes.md)
- [LLM Integration](./04-llm-integration.md)
- [Security](./05-security.md)
- [Setup Guide](./06-setup.md)
- [User Journey](./qalam-user-journey.md)
- [UX Pages](./qalam-ux-pages.md)
