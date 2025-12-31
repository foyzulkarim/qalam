# Architecture Migration Plan

## Overview

This document outlines the migration to a Cloudflare-native architecture that uses platform services as they're designed to be used. This approach eliminates adapter complexity, solves file limit issues permanently, and provides a solid foundation for CI/CD with Playwright testing.

## Target Architecture

```
┌─────────────────────────┐     ┌─────────────────────────┐
│   CLOUDFLARE PAGES      │     │   CLOUDFLARE WORKER     │
│   (Static App Only)     │     │   (qalam-api)           │
├─────────────────────────┤     ├─────────────────────────┤
│ Next.js static export   │     │ POST /assess only       │
│ HTML/JS/CSS/fonts       │────▶│ KV caching              │
│ No data files           │     │ LLM API calls           │
│ < 500 files             │     │ (minimal footprint)     │
└─────────────────────────┘     └─────────────────────────┘
          │                              │
          │                              ▼
          │                     ┌─────────────────────────┐
          │                     │   CLOUDFLARE R2         │
          │                     │   (Public Bucket)       │
          │                     ├─────────────────────────┤
          │                     │ quran.json              │
          │                     │ surahs.json             │
          │                     │ analysis/*.json (1000+) │
          │                     └─────────────────────────┘
          │                              │
          │                              ▼
          │                     ┌─────────────────────────┐
          │                     │   CLOUDFLARE KV         │
          │                     │   (Key-Value Cache)     │
          │                     ├─────────────────────────┤
          │                     │ Assessment results      │
          └────────────────────▶│ 30-day TTL              │
                                └─────────────────────────┘
```

**Key insight:** Data is served directly from public R2 (no Worker hop). The Worker only handles `/assess` requests that need LLM + KV caching.

## Why This Architecture

### Problems with Current Setup
1. `@cloudflare/next-on-pages` adapter adds complexity and fragility
2. Mixing GitHub integration with wrangler deploy commands
3. 20k file limit concerns with static export
4. Duplicate API code in Next.js and Worker

### Benefits of Target Architecture
1. **Cloudflare-native** - No adapters, uses platform services directly
2. **File limit solved** - App bundle is small, data lives in R2
3. **Clear separation** - Pages = UI, Worker = API + Data, R2 = Storage
4. **Single Worker** - All server logic in one place
5. **CI/CD ready** - Clean deployment targets for GitHub Actions + Playwright

---

## Architecture Components

### 1. Cloudflare Pages (Static Site)

**Purpose:** Serve the static Next.js application

**Contents:**
- Pre-rendered HTML pages
- JavaScript bundles
- CSS stylesheets
- Fonts and images
- NO JSON data files

**Configuration:**
```js
// next.config.js
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}
```

**Build Output:** `out/` directory with ~200-500 files

### 2. Cloudflare Worker (Assessment Only)

**Purpose:** Handle LLM-based translation assessment

**Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/assess` | POST | Translation assessment (with KV caching) |
| `/health` | GET | Health check for monitoring |

**Bindings:**
- `ASSESSMENT_CACHE` - KV namespace for caching
- `TOGETHER_API_KEY` - Secret for LLM API

**Note:** The Worker no longer serves data files - they come directly from public R2.

### 3. Cloudflare R2 (Public Bucket)

**Purpose:** Serve all JSON data files directly to clients

**Access:** Public (no authentication required)

**Why Public?**
All data is non-sensitive (Quranic text and linguistic analysis). There's no security requirement - this knowledge should be openly accessible.

**Public URL:** `https://pub-{bucket-id}.r2.dev/`

**Structure:**
```
qalam-data/
├── quran.json           (~3MB)
├── surahs.json          (~10KB)
└── analysis/
    ├── 1-1.json
    ├── 1-2.json
    ├── ...
    └── 114-6.json       (~1000+ files)
```

**Benefits:**
- 10GB free storage
- Free public egress
- No file count limits
- Direct access (no Worker hop)
- CDN caching built-in
- Data available even if Worker has issues

### 4. Cloudflare KV (Cache)

**Purpose:** Cache LLM assessment results

**Key Format:** `assessment:{verseId}:{translationHash}`
**TTL:** 30 days
**Existing namespace:** `221015cc0cd54b0b951396214433e4b8` (preserve existing cache)

---

## Implementation Plan

### Phase 0: Upgrade to Next.js 16

Since we're moving to static export and simplifying the architecture, this is an ideal time to upgrade Next.js.

#### Current State
- **Next.js**: 15.5.2
- **Node.js**: 25.2.1 (exceeds minimum 20.9.0 requirement)

#### Target
- **Next.js**: 16.x (latest stable - currently 16.1.1)

#### Why Upgrade Now

| Feature | Benefit |
|---------|---------|
| **Turbopack stable & default** | ~10x faster cached builds |
| **React Compiler stable** | Auto-memoization, fewer re-renders |
| **Explicit caching** | `"use cache"` directive - more predictable |
| **Smaller install** | ~20MB lighter package |
| **File system caching** | Eliminates cold start delays |

#### Breaking Changes to Handle

1. **Node.js minimum 20.9.0** - ✅ Already on 25.2.1
2. **`middleware.ts` → `proxy.ts`** - ✅ N/A (we don't use middleware)
3. **Async `params`/`searchParams` required** - ✅ Already using `Promise<>` in dynamic routes

#### Dependencies to Remove

Since we're moving to static export, these are no longer needed:

```diff
  "devDependencies": {
-   "@cloudflare/next-on-pages": "^1.13.16",
-   "vercel": "^47.0.4",
  }
```

#### Upgrade Steps

```bash
# 1. Upgrade Next.js using the automated codemod
npx @next/codemod@canary upgrade latest

# 2. Remove unnecessary dependencies
npm uninstall @cloudflare/next-on-pages vercel

# 3. Clean up scripts in package.json
# Remove: pages:build, pages:dev, pages:deploy

# 4. Verify build works
npm run build
```

#### Updated package.json (After Upgrade)

```json
{
  "dependencies": {
    "next": "^16.1.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^16.1.1",
    "typescript": "^5.7.0",
    "wrangler": "^4.54.0"
  }
}
```

#### Verification

After upgrade, verify:
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes successfully
- [ ] `npm run lint` passes
- [ ] Dynamic routes (`/browse/surah/[id]/[verse]`) work correctly

---

### Phase 1: Set Up R2 Storage (Public)

#### 1.1 Create R2 Bucket with Public Access

```bash
# Create the bucket
npx wrangler r2 bucket create qalam-data

# Verify creation
npx wrangler r2 bucket list
```

#### 1.2 Enable Public Access

In Cloudflare Dashboard → R2 → qalam-data → Settings:

1. Click "Public Access" → "Allow Access"
2. Choose "R2.dev subdomain" (free, no custom domain needed)
3. Copy the public URL: `https://pub-{bucket-id}.r2.dev`

**Important:** Save this URL - you'll need it for the client configuration.

Alternatively, via wrangler (if available):
```bash
# Enable public access
npx wrangler r2 bucket update qalam-data --public
```

#### 1.3 Upload Data Files

```bash
# Upload quran.json
npx wrangler r2 object put qalam-data/quran.json --file=public/data/quran.json

# Upload surahs.json
npx wrangler r2 object put qalam-data/surahs.json --file=public/data/surahs.json

# Upload all analysis files (script)
for file in public/data/analysis/*.json; do
  filename=$(basename "$file")
  npx wrangler r2 object put "qalam-data/analysis/$filename" --file="$file"
done
```

#### 1.4 Create Upload Script

**File:** `scripts/upload-to-r2.ts`

```typescript
/**
 * Upload data files to R2
 * Run with: npx tsx scripts/upload-to-r2.ts
 */
import { execSync } from 'child_process'
import { readdirSync } from 'fs'
import { join } from 'path'

const BUCKET = 'qalam-data'
const DATA_DIR = 'public/data'

function upload(localPath: string, remotePath: string) {
  console.log(`Uploading ${remotePath}...`)
  execSync(`npx wrangler r2 object put "${BUCKET}/${remotePath}" --file="${localPath}"`, {
    stdio: 'inherit',
  })
}

// Upload main files
upload(join(DATA_DIR, 'quran.json'), 'quran.json')
upload(join(DATA_DIR, 'surahs.json'), 'surahs.json')

// Upload analysis files
const analysisDir = join(DATA_DIR, 'analysis')
const analysisFiles = readdirSync(analysisDir).filter(f => f.endsWith('.json'))

console.log(`\nUploading ${analysisFiles.length} analysis files...`)
for (const file of analysisFiles) {
  upload(join(analysisDir, file), `analysis/${file}`)
}

console.log('\nDone!')
```

---

### Phase 2: Simplify Worker (Assessment Only)

With public R2, the Worker becomes much simpler - it only handles assessment.

#### 2.1 Simplify wrangler.toml

**File:** `worker/wrangler.toml`

```toml
name = "qalam-api"
main = "src/index.ts"
compatibility_date = "2024-12-24"

# KV Namespace for caching assessments
[[kv_namespaces]]
binding = "ASSESSMENT_CACHE"
id = "221015cc0cd54b0b951396214433e4b8"
preview_id = "051d05919a3240c2b23006ece503dcdb"

# No R2 binding needed - data is served directly from public R2

[vars]
ASSESSMENT_BACKEND = "together"
TOGETHER_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo"
ALLOWED_ORIGINS = "https://versemadeeasy.com,https://www.versemadeeasy.com,https://qalam.pages.dev,http://localhost:3000"
# Public R2 URL for fetching data (Worker still needs this for assessment context)
R2_PUBLIC_URL = "https://pub-{your-bucket-id}.r2.dev"
```

#### 2.2 Simplify Worker Types

**File:** `worker/src/types.ts`

```typescript
export interface Env {
  // KV for caching
  ASSESSMENT_CACHE: KVNamespace

  // Environment variables
  ASSESSMENT_BACKEND: string
  TOGETHER_API_KEY: string
  TOGETHER_MODEL: string
  ALLOWED_ORIGINS: string
  R2_PUBLIC_URL: string  // Public R2 URL for fetching data
}
```

#### 2.3 Simplify Worker Router

**File:** `worker/src/index.ts`

```typescript
import { handleAssessment } from './handlers/assess'
import type { Env } from './types'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    // CORS headers
    const corsHeaders = getCorsHeaders(request, env)

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    let response: Response

    // Only two routes now
    if (path === '/assess' && request.method === 'POST') {
      response = await handleAssessment(request, env)
    } else if (path === '/health') {
      response = new Response(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
      }), { headers: { 'Content-Type': 'application/json' } })
    } else {
      response = new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  },
}

function getCorsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin') || ''
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || []

  const isAllowed = allowedOrigins.some(allowed =>
    origin === allowed.trim() || allowed.trim() === '*'
  )

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}
```

#### 2.4 Update Assessment Handler

Modify `worker/src/handlers/assess.ts` to fetch data from public R2:

```typescript
async function getVerseAnalysis(verseId: string, env: Env): Promise<VerseAnalysis | null> {
  const fileName = verseId.replace(':', '-')
  const url = `${env.R2_PUBLIC_URL}/analysis/${fileName}.json`

  try {
    const response = await fetch(url)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

async function getReferenceTranslation(verseId: string, env: Env): Promise<string | null> {
  const [surahId, verseNum] = verseId.split(':').map(Number)

  try {
    const response = await fetch(`${env.R2_PUBLIC_URL}/quran.json`)
    if (!response.ok) return null

    const quranData = await response.json()
    const surah = quranData.surahs.find((s: any) => s.id === surahId)
    if (!surah) return null

    const verse = surah.verses.find((v: any) => v.number === verseNum)
    if (!verse) return null

    return verse.translations['en.sahih'] || null
  } catch {
    return null
  }
}
```

#### 2.5 Remove Data Handler

```bash
# Delete the data handler - no longer needed
rm worker/src/handlers/data.ts
```

---

### Phase 3: Convert Next.js to Static Export

#### 3.1 Update Next.js Config

**File:** `next.config.js`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
```

#### 3.2 Remove SSR Dependencies

Check each page and ensure they work with static export:
- Remove `runtime = 'edge'` declarations
- Ensure data fetching happens client-side
- Remove API routes (will use Worker instead)

#### 3.3 Delete Next.js API Route

```bash
rm -rf src/app/api/
```

#### 3.4 Update Data Fetching Library

**File:** `src/lib/data.ts`

Update to fetch data from public R2, assessment from Worker:

```typescript
// Public R2 URL for data (no authentication needed)
const R2_URL = process.env.NEXT_PUBLIC_R2_URL || 'https://pub-{bucket-id}.r2.dev'

// Worker URL for assessment only
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://qalam-api.foyzul.workers.dev'

export async function getQuranData(): Promise<QuranData | null> {
  try {
    const response = await fetch(`${R2_URL}/quran.json`)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export async function getVerseAnalysis(verseId: string): Promise<VerseAnalysis | null> {
  const fileName = verseId.replace(':', '-')
  try {
    const response = await fetch(`${R2_URL}/analysis/${fileName}.json`)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export async function getSurahs(): Promise<Surah[] | null> {
  try {
    const response = await fetch(`${R2_URL}/surahs.json`)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

// Assessment still goes to Worker (needs LLM + KV cache)
export async function assessTranslation(verseId: string, userTranslation: string) {
  const response = await fetch(`${API_URL}/assess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verseId, userTranslation }),
  })
  return response.json()
}
```

#### 3.5 Update Client Component

**File:** `src/app/browse/surah/[id]/[verse]/VersePracticeClient.tsx`

```typescript
// Worker URL for assessment only
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://qalam-api.foyzul.workers.dev'

// In handleSubmit:
const response = await fetch(`${API_URL}/assess`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    verseId,
    userTranslation: userTranslation.trim(),
  }),
})
```

#### 3.6 Update Environment Variables

**File:** `.env.local` (for local development)

```env
# Public R2 URL (data)
NEXT_PUBLIC_R2_URL=https://pub-{bucket-id}.r2.dev

# Worker URL (assessment only)
NEXT_PUBLIC_API_URL=https://qalam-api.foyzul.workers.dev
```

**File:** `.env.production`

```env
NEXT_PUBLIC_R2_URL=https://pub-{bucket-id}.r2.dev
NEXT_PUBLIC_API_URL=https://qalam-api.foyzul.workers.dev
```

---

### Phase 4: Update Deployment Configuration

#### 4.1 Simplify Pages Build

**File:** `wrangler.toml` (root - for Pages)

```toml
# No longer needed - Pages will use simple static deployment
# Delete this file or keep minimal config
name = "qalam"
compatibility_date = "2024-12-24"
```

#### 4.2 Update Cloudflare Pages Settings

In Cloudflare Dashboard → Pages → qalam → Settings:

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Build output directory | `out` |
| Root directory | `/` |

**Remove** the deploy command - Pages will automatically deploy the `out` directory.

#### 4.3 Update package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "npx serve out -p 3000",
    "lint": "next lint",
    "build:quran": "tsx scripts/build-quran-json.ts",
    "seed:analysis": "tsx --env-file=.env scripts/seed-analysis.ts",
    "upload:data": "tsx scripts/upload-to-r2.ts",
    "worker:dev": "cd worker && npm run dev",
    "worker:deploy": "cd worker && npm run deploy",
    "test:e2e": "playwright test"
  }
}
```

---

### Phase 5: CI/CD Pipeline

#### 5.1 GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

jobs:
  # Run tests first
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run build

      # Playwright tests
      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npm run test:e2e

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  # Deploy Worker
  deploy-worker:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: cd worker && npm ci
      - run: cd worker && npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

  # Deploy Pages (static site)
  deploy-pages:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: qalam
          directory: out
```

#### 5.2 Environment Secrets Required

Add these to GitHub repository secrets:
- `CLOUDFLARE_API_TOKEN` - API token with Workers and Pages permissions
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

---

## Migration Checklist

### Preparation
- [ ] Read and understand this plan
- [ ] Ensure Cloudflare CLI (`wrangler`) is authenticated locally

### Phase 0: Next.js 16 Upgrade
- [ ] Run `npx @next/codemod@canary upgrade latest`
- [ ] Remove `@cloudflare/next-on-pages` and `vercel` dependencies
- [ ] Remove `pages:build`, `pages:dev`, `pages:deploy` scripts
- [ ] Verify `npm run dev` works
- [ ] Verify `npm run build` works
- [ ] Verify `npm run lint` passes

### Phase 1: R2 Setup (Public)
- [ ] Create R2 bucket `qalam-data`
- [ ] Enable public access in Cloudflare Dashboard
- [ ] Copy public URL (`https://pub-{id}.r2.dev`)
- [ ] Create `scripts/upload-to-r2.ts`
- [ ] Upload all data files to R2
- [ ] Verify files are accessible via public URL

### Phase 2: Simplify Worker (Assessment Only)
- [ ] Remove R2 binding from `worker/wrangler.toml`
- [ ] Add `R2_PUBLIC_URL` to wrangler.toml vars
- [ ] Simplify `worker/src/types.ts`
- [ ] Remove `worker/src/handlers/data.ts`
- [ ] Simplify `worker/src/index.ts` router
- [ ] Update assessment handler to fetch from public R2
- [ ] Test Worker locally with `npm run worker:dev`
- [ ] Deploy Worker with `npm run worker:deploy`

### Phase 3: Next.js Static Export
- [ ] Update `next.config.js` with `output: 'export'`
- [ ] Delete `src/app/api/` directory
- [ ] Update `src/lib/data.ts` to fetch from public R2
- [ ] Update `VersePracticeClient.tsx` for assessment API
- [ ] Add `.env.production` with R2 and API URLs
- [ ] Test locally with `npm run build && npm run start`

### Phase 4: Deployment Config
- [ ] Update Cloudflare Pages build settings
- [ ] Remove `pages:build` and `pages:deploy` scripts
- [ ] Update `package.json` scripts
- [ ] Remove root `wrangler.toml` (or simplify)

### Phase 5: CI/CD
- [ ] Create `.github/workflows/deploy.yml`
- [ ] Add secrets to GitHub repository
- [ ] Test deployment pipeline

### Cleanup
- [ ] Remove old files
- [ ] Update CLAUDE.md documentation
- [ ] Update README if needed

---

## Rollback Plan

If issues arise:

1. **Worker issues** - Previous Worker version available in Cloudflare dashboard
2. **Pages issues** - Revert to previous deployment in Pages dashboard
3. **Data issues** - R2 data is independent, can re-upload from `public/data/`
4. **Full rollback** - Git revert and redeploy

---

## Ongoing Data Generation

### Current State
- **6236 verses** total in the Quran
- **~1000 analysis files** generated (~16%)
- **~5236 remaining** to generate

### Generation Workflow

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  1. GENERATE (Local)              2. SYNC (To R2)                    │
│  ┌─────────────────────┐         ┌─────────────────────┐            │
│  │ npm run seed:analysis│   ──▶   │ npm run sync:r2     │            │
│  │                     │         │                     │            │
│  │ - Uses Ollama (free)│         │ - Uploads new files │            │
│  │ - Resume capable    │         │ - Delta sync only   │            │
│  │ - Surah by surah    │         │ - Shows progress    │            │
│  └─────────────────────┘         └─────────────────────┘            │
│           │                               │                          │
│           ▼                               ▼                          │
│  public/data/analysis/           qalam-data/analysis/                │
│  (local files)                   (R2 bucket)                         │
│                                                                      │
│  ✅ NO APP REDEPLOYMENT NEEDED - Data is live immediately!          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Smart Sync Script

**File:** `scripts/sync-to-r2.ts`

```typescript
/**
 * Sync local analysis files to R2
 * Only uploads new or changed files (delta sync)
 *
 * Usage: npm run sync:r2
 */
import { execSync } from 'child_process'
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'

const BUCKET = 'qalam-data'
const LOCAL_DIR = 'public/data/analysis'
const MANIFEST_FILE = 'public/data/analysis/.r2-manifest.json'

interface Manifest {
  files: Record<string, { hash: string; uploadedAt: string }>
}

function getFileHash(filepath: string): string {
  const content = readFileSync(filepath)
  return createHash('md5').update(content).digest('hex')
}

function loadManifest(): Manifest {
  if (existsSync(MANIFEST_FILE)) {
    return JSON.parse(readFileSync(MANIFEST_FILE, 'utf-8'))
  }
  return { files: {} }
}

function saveManifest(manifest: Manifest): void {
  writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2))
}

async function sync() {
  const manifest = loadManifest()
  const localFiles = readdirSync(LOCAL_DIR).filter(f => f.endsWith('.json') && !f.startsWith('.'))

  let uploaded = 0
  let skipped = 0

  console.log(`Found ${localFiles.length} local analysis files`)
  console.log(`Manifest has ${Object.keys(manifest.files).length} tracked files\n`)

  for (const file of localFiles) {
    const filepath = join(LOCAL_DIR, file)
    const hash = getFileHash(filepath)

    // Skip if file unchanged
    if (manifest.files[file]?.hash === hash) {
      skipped++
      continue
    }

    // Upload to R2
    console.log(`Uploading ${file}...`)
    try {
      execSync(`npx wrangler r2 object put "${BUCKET}/analysis/${file}" --file="${filepath}"`, {
        stdio: 'pipe',
      })

      manifest.files[file] = {
        hash,
        uploadedAt: new Date().toISOString(),
      }
      uploaded++
    } catch (error) {
      console.error(`Failed to upload ${file}:`, error)
    }
  }

  saveManifest(manifest)

  console.log(`\n✅ Sync complete!`)
  console.log(`   Uploaded: ${uploaded} files`)
  console.log(`   Skipped:  ${skipped} files (unchanged)`)
  console.log(`   Total in R2: ${Object.keys(manifest.files).length} files`)

  // Progress report
  const total = 6236
  const done = Object.keys(manifest.files).length
  const percent = ((done / total) * 100).toFixed(1)
  console.log(`\n📊 Overall progress: ${done}/${total} verses (${percent}%)`)
}

sync().catch(console.error)
```

### Progress Tracking

Add a manifest file to track what's been uploaded:

```json
// public/data/analysis/.r2-manifest.json
{
  "files": {
    "1-1.json": { "hash": "abc123", "uploadedAt": "2024-01-15T10:00:00Z" },
    "1-2.json": { "hash": "def456", "uploadedAt": "2024-01-15T10:00:01Z" }
  }
}
```

### Recommended Generation Schedule

Generate in batches by surah (modify `START_SURAH`/`END_SURAH` in seed script):

| Priority | Surahs | Verses | Description |
|----------|--------|--------|-------------|
| ✅ Done | 1 | 7 | Al-Fatiha |
| ✅ Done | 78-114 | ~564 | Juz Amma (short surahs, commonly memorized) |
| High | 2 | 286 | Al-Baqarah (longest, most referenced) |
| High | 36 | 83 | Ya-Sin (commonly recited) |
| Medium | 18 | 110 | Al-Kahf (Friday recitation) |
| Medium | 67 | 30 | Al-Mulk (night recitation) |
| Ongoing | 3-77 | ~4500 | Remaining surahs |

### Updated package.json Scripts

```json
{
  "scripts": {
    "seed:analysis": "tsx --env-file=.env scripts/seed-analysis.ts",
    "sync:r2": "tsx scripts/sync-to-r2.ts",
    "data:status": "tsx scripts/data-status.ts"
  }
}
```

### Data Status Script

**File:** `scripts/data-status.ts`

```typescript
/**
 * Show analysis generation progress
 */
import { readdirSync, existsSync, readFileSync } from 'fs'

const ANALYSIS_DIR = 'public/data/analysis'
const MANIFEST_FILE = `${ANALYSIS_DIR}/.r2-manifest.json`
const TOTAL_VERSES = 6236

// Count by surah (approximate verse counts)
const SURAH_VERSES: Record<number, number> = {
  1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
  // ... (full list in actual implementation)
}

function main() {
  const localFiles = readdirSync(ANALYSIS_DIR).filter(f => f.endsWith('.json') && !f.startsWith('.'))

  // Count by surah
  const bySurah: Record<number, number> = {}
  for (const file of localFiles) {
    const surahId = parseInt(file.split('-')[0])
    bySurah[surahId] = (bySurah[surahId] || 0) + 1
  }

  console.log('📊 Analysis Generation Status\n')
  console.log(`Total: ${localFiles.length} / ${TOTAL_VERSES} (${((localFiles.length/TOTAL_VERSES)*100).toFixed(1)}%)\n`)

  // Show surah breakdown
  console.log('By Surah:')
  const surahs = Object.keys(bySurah).map(Number).sort((a, b) => a - b)
  for (const surah of surahs) {
    const done = bySurah[surah]
    console.log(`  Surah ${surah}: ${done} verses`)
  }

  // Check R2 sync status
  if (existsSync(MANIFEST_FILE)) {
    const manifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf-8'))
    const inR2 = Object.keys(manifest.files).length
    const pendingSync = localFiles.length - inR2
    console.log(`\n☁️  R2 Status:`)
    console.log(`   In R2: ${inR2}`)
    console.log(`   Pending sync: ${pendingSync}`)
  }
}

main()
```

## Performance Optimizations

### R2 Public Bucket Caching

R2 public buckets include automatic CDN caching. For additional control:

**Custom Cache Rules (Cloudflare Dashboard → R2 → Bucket → Settings → Cache):**

| File Pattern | Cache TTL | Rationale |
|--------------|-----------|-----------|
| `quran.json` | 1 year | Immutable source data |
| `surahs.json` | 1 year | Immutable metadata |
| `analysis/*.json` | 24 hours | May be updated/corrected |

**Browser-side caching** is handled automatically via Cache-Control headers from R2.

### Hybrid Approach (Optional)

Consider keeping `surahs.json` (~10KB) in the static bundle for the browse page:

| File | Size | Location | Rationale |
|------|------|----------|-----------|
| `surahs.json` | ~10KB | Static bundle | Tiny, needed on browse page load |
| `quran.json` | ~3MB | R2 | Large, loaded on-demand |
| `analysis/*.json` | ~2KB each | R2 | Many files, loaded per-verse |

This eliminates one network request for the browse page.

### Monitoring

**Worker `/health` endpoint:**
```typescript
if (path === '/health') {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }), { headers: { 'Content-Type': 'application/json' } })
}
```

**Cloudflare Dashboard monitoring:**
1. **R2 Analytics** - Request counts, bandwidth, cache hit rates
2. **Worker Analytics** - Invocations, errors, CPU time
3. **KV Analytics** - Read/write operations, cache effectiveness

---

## Local Development

### Option 1: Use Public R2 Directly (Simplest)

Since R2 is public, you can fetch data from it during local development:

```bash
# Just run Next.js - data comes from public R2
npm run dev
```

Configure `.env.local`:
```env
# Use production R2 (it's public, no auth needed)
NEXT_PUBLIC_R2_URL=https://pub-{bucket-id}.r2.dev

# Worker for assessment (run locally or use production)
NEXT_PUBLIC_API_URL=http://localhost:8787
```

### Option 2: Local Files Fallback (Offline Development)

For offline development or faster iteration:

```typescript
// src/lib/data.ts
const R2_URL = process.env.NEXT_PUBLIC_R2_URL

export async function getQuranData(): Promise<QuranData | null> {
  // If no R2 URL configured, use local files
  if (!R2_URL) {
    const response = await fetch('/data/quran.json')
    return response.ok ? response.json() : null
  }

  // Use public R2
  const response = await fetch(`${R2_URL}/quran.json`)
  return response.ok ? response.json() : null
}
```

### Option 3: Run Worker Locally (For Assessment Testing)

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: Worker (only needed for /assess testing)
npm run worker:dev
```

### Option 4: Mock Worker (For Tests)

Use MSW (Mock Service Worker) for testing without real API:

```typescript
// tests/mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.get('*/data/quran.json', (req, res, ctx) => {
    return res(ctx.json(mockQuranData))
  }),
  rest.post('*/assess', (req, res, ctx) => {
    return res(ctx.json({ success: true, data: mockFeedback }))
  }),
]
```

---

## Rollback Strategy

### Quick Rollback Scenarios

| Issue | Rollback Action |
|-------|-----------------|
| **Worker broken** | Cloudflare Dashboard → Workers → qalam-api → Rollbacks → Select previous version |
| **Pages broken** | Cloudflare Dashboard → Pages → qalam → Deployments → Rollback to previous |
| **R2 data corrupt** | Re-upload from `public/data/` using `npm run upload:data` |
| **Latency issues** | Switch to hybrid approach (see above) or revert to static bundle |

### Emergency: Full Architecture Rollback

If the new architecture causes significant issues:

```bash
# 1. Revert to pre-migration commit
git revert HEAD~N  # N = number of migration commits

# 2. Re-enable @cloudflare/next-on-pages
npm install @cloudflare/next-on-pages vercel

# 3. Restore old build scripts
# Restore pages:build, pages:deploy scripts

# 4. Deploy
git push origin main
```

### Canary Deployment

For safer rollout, consider:
1. Deploy to staging environment first (`qalam-staging.pages.dev`)
2. Test with subset of traffic
3. Monitor for 24-48 hours before full rollout

---

## Future Considerations

### Adding New Data
With R2, adding new analysis files doesn't require redeployment:
```bash
# Generate new files
npm run seed:analysis

# Sync to R2
npm run sync:r2

# Data is immediately available to users!
```

### Multiple Environments
Can create separate R2 buckets and KV namespaces for staging:
- `qalam-data-staging`
- `qalam-assessment-cache-staging`

### Playwright Tests
The architecture supports E2E testing well:
- Static site can be served locally
- Worker can be mocked or pointed to staging
- Tests run against real deployment in CI

---

## Questions?

This plan prioritizes:
1. **Reliability** - Native Cloudflare services
2. **Simplicity** - Clear separation of concerns
3. **Scalability** - R2 handles unlimited data growth
4. **Developer Experience** - Easy local development and deployment

Feel free to ask questions or request modifications before implementation.
