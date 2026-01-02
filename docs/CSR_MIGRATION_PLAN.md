# Migration Plan: CSR-like Architecture for Verse Pages

## Problem Summary

**Current state:**
- Next.js static export generates HTML for every route at build time
- `generateStaticParams` reads from `public/data/analysis/` to determine verse pages
- 6,236 verses × ~11 files each = ~68,000 files (exceeds Cloudflare's 20k limit)
- `public/data/` gets copied to `out/` during build (unnecessary)

**User's goal:**
- CSR-like behavior: single page shell, data loaded at runtime based on URL
- Move data files out of `public/` (they're only needed for R2 uploads, not the app)
- Clean architecture without build hacks

---

## Key Insight

The `VersePracticeClient` is ALREADY a client component that fetches data at runtime:
```typescript
// src/app/browse/surah/[id]/[verse]/VersePracticeClient.tsx:116
const analysisData = await getVerseAnalysis(verseId)
```

The only problem is Next.js needs HTML files to exist for each route in static export.

**Solution:** Generate ONE verse page shell + use Cloudflare redirects to serve it for ALL verse URLs.

---

## Architecture After Migration

```
┌─────────────────────────────────────────────────────────────┐
│                    PROJECT STRUCTURE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  /data/                    ← NEW: Data files (not in build) │
│    ├── analysis/           ← LLM-generated verse analysis   │
│    ├── quran.json          ← Quran text                     │
│    ├── surahs.json         ← Surah metadata                 │
│    └── uploaded.json       ← R2 upload tracking             │
│                                                             │
│  /public/                  ← Only static assets (no data)   │
│    └── _redirects          ← NEW: Cloudflare SPA routing    │
│                                                             │
│  /out/ (build output)      ← ~200 files total               │
│    ├── index.html                                           │
│    ├── browse/                                              │
│    │   ├── surah/1/index.html      (114 surah pages)        │
│    │   └── surah/1/1/index.html    (1 verse shell page)     │
│    └── _redirects          ← Routes all verses to shell     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**How it works:**
1. User visits `/browse/surah/5/10`
2. Cloudflare sees `_redirects` rule: serve `/browse/surah/1/1/index.html`
3. Page loads, client JS reads URL: surah=5, verse=10
4. Fetches `cdn.versemadeeasy.com/analysis/5-10.json`
5. Renders verse practice UI

This is exactly how React Router SPA works.

---

## Implementation Steps

### Step 1: Move data directory out of public

**Move:** `public/data/` → `data/`

This prevents data files from being copied to build output.

**Files to update:**
| File | Change |
|------|--------|
| `scripts/seed-analysis.ts` | `public/data/` → `data/` |
| `scripts/upload-to-r2.ts` | `public/data/` → `data/` |
| `scripts/data-status.ts` | Check if it references the path |
| `scripts/build-quran-json.ts` | `public/data/` → `data/` |
| `src/app/browse/surah/[id]/page.tsx` | Check `generateStaticParams` |

### Step 2: Update verse page to generate single shell

**File:** `src/app/browse/surah/[id]/[verse]/page.tsx`

```typescript
// Generate only ONE static page (the shell)
// All other verse URLs are redirected here by Cloudflare
export function generateStaticParams() {
  return [{ id: '1', verse: '1' }]
}
```

The `VersePracticeClient` already:
- Reads `id` and `verse` from URL params
- Fetches data from R2 at runtime
- Handles loading/error states

No changes needed to the client component!

### Step 3: Surah page (no changes needed)

**File:** `src/app/browse/surah/[id]/page.tsx`

Already uses a simple `Array.from({ length: 114 })` - doesn't read from filesystem. No changes needed.

### Step 4: Add Cloudflare redirects

**Create:** `public/_redirects`

```
# SPA routing for verse pages
# All verse URLs serve the shell page (client handles routing)
/browse/surah/:id/:verse /browse/surah/1/1/index.html 200
```

The `200` status means it's a rewrite (not redirect), so URL stays as `/browse/surah/5/10`.

### Step 5: Clean up package.json

**File:** `package.json`

Remove the hack:
```diff
- "build": "next build && rm -rf out/data",
+ "build": "next build",
```

### Step 6: Update documentation

**File:** `CLAUDE.md`

Update the directory structure to reflect:
- `data/` - Local data files (source for R2 uploads)
- Remove references to `public/data/`

---

## Files to Modify

| File | Action |
|------|--------|
| `public/data/*` | Move to `data/` |
| `public/_redirects` | Create (Cloudflare SPA routing) |
| `src/app/browse/surah/[id]/[verse]/page.tsx` | Simplify `generateStaticParams` to return `[{id:'1', verse:'1'}]` |
| `scripts/seed-analysis.ts` | Update `public/data/` → `data/` (lines 51-53) |
| `scripts/upload-to-r2.ts` | Update `public/data` → `data` (lines 20-21) |
| `scripts/data-status.ts` | Update `public/data/analysis` → `data/analysis` (line 7) |
| `scripts/build-quran-json.ts` | Update `public/data` → `data` (lines 22-25) |
| `package.json` | Remove `&& rm -rf out/data` from build script |
| `CLAUDE.md` | Update directory structure documentation |

---

## Expected Build Output

Before: ~18,000+ files (with analysis) or ~1,269 files (with hack)
After: ~200 files

- `/` - 1 page
- `/browse` - 1 page
- `/history` - 1 page
- `/browse/surah/[1-114]` - 114 pages
- `/browse/surah/1/1` - 1 shell page (serves ALL verses)
- Static assets (JS, CSS) - ~20 files

---

## Testing Plan

1. Run `npm run build` - should complete with ~200 files
2. Run `npm run start` - test locally
3. Navigate to `/browse/surah/1/1` - should work (shell page)
4. Navigate to `/browse/surah/5/10` - should work (redirect to shell, client loads data)
5. Deploy to Cloudflare Pages
6. Test live URLs

---

## Rollback

If issues arise:
1. Move `data/` back to `public/data/`
2. Remove `public/_redirects`
3. Restore old `generateStaticParams` logic
