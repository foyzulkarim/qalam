# Architecture Migration Plan

## Overview

This document outlines the migration to a Cloudflare-native architecture that uses platform services as they're designed to be used. This approach eliminates adapter complexity, solves file limit issues permanently, and provides a solid foundation for CI/CD with Playwright testing.

## Target Architecture

```
┌─────────────────────────┐     ┌─────────────────────────┐
│   CLOUDFLARE PAGES      │     │   CLOUDFLARE WORKER     │
│   (Static App Only)     │     │   (qalam-api)           │
├─────────────────────────┤     ├─────────────────────────┤
│ Next.js static export   │     │ POST /assess            │
│ HTML/JS/CSS/fonts       │────▶│ GET /data/*             │
│ No data files           │     │ KV caching              │
│ < 500 files             │     │ Fetches from R2         │
└─────────────────────────┘     └─────────────────────────┘
          │                              │
          │                              ▼
          │                     ┌─────────────────────────┐
          │                     │   CLOUDFLARE R2         │
          │                     │   (Object Storage)      │
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

### 2. Cloudflare Worker (API + Data Server)

**Purpose:** Handle all server-side logic

**Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/assess` | POST | Translation assessment (with KV caching) |
| `/data/quran.json` | GET | Full Quran data |
| `/data/surahs.json` | GET | Surah metadata |
| `/data/analysis/:id.json` | GET | Verse analysis files |
| `/health` | GET | Health check for monitoring |

**Bindings:**
- `ASSESSMENT_CACHE` - KV namespace for caching
- `DATA_BUCKET` - R2 bucket for JSON files
- `TOGETHER_API_KEY` - Secret for LLM API

### 3. Cloudflare R2 (Object Storage)

**Purpose:** Store all JSON data files

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
- Free egress to Workers (same Cloudflare network)
- No file count limits
- Can add more translations/analysis without deployment

### 4. Cloudflare KV (Cache)

**Purpose:** Cache LLM assessment results

**Key Format:** `assessment:{verseId}:{translationHash}`
**TTL:** 30 days
**Existing namespace:** `221015cc0cd54b0b951396214433e4b8` (preserve existing cache)

---

## Implementation Plan

### Phase 1: Set Up R2 Storage

#### 1.1 Create R2 Bucket

```bash
# Create the bucket
npx wrangler r2 bucket create qalam-data

# Verify creation
npx wrangler r2 bucket list
```

#### 1.2 Upload Data Files

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

#### 1.3 Create Upload Script

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

### Phase 2: Update Worker

#### 2.1 Add R2 Binding

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

# R2 Bucket for data files
[[r2_buckets]]
binding = "DATA_BUCKET"
bucket_name = "qalam-data"
preview_bucket_name = "qalam-data-preview"

[vars]
ASSESSMENT_BACKEND = "together"
TOGETHER_MODEL = "meta-llama/Llama-3.3-70B-Instruct-Turbo"
ALLOWED_ORIGINS = "https://versemadeeasy.com,https://www.versemadeeasy.com,https://qalam.pages.dev,http://localhost:3000"
```

#### 2.2 Update Worker Types

**File:** `worker/src/types.ts`

```typescript
export interface Env {
  // KV for caching
  ASSESSMENT_CACHE: KVNamespace

  // R2 for data storage
  DATA_BUCKET: R2Bucket

  // Environment variables
  ASSESSMENT_BACKEND: string
  TOGETHER_API_KEY: string
  TOGETHER_MODEL: string
  ALLOWED_ORIGINS: string
}
```

#### 2.3 Add Data Handler

**File:** `worker/src/handlers/data.ts`

```typescript
import type { Env } from '../types'

/**
 * Serve data files from R2
 */
export async function handleData(
  request: Request,
  env: Env,
  path: string
): Promise<Response> {
  // Remove leading slash
  const key = path.startsWith('/') ? path.slice(1) : path

  try {
    const object = await env.DATA_BUCKET.get(key)

    if (!object) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Return with appropriate caching headers
    return new Response(object.body, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400', // 24 hours
        'ETag': object.etag,
      },
    })
  } catch (error) {
    console.error('R2 fetch error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
```

#### 2.4 Update Worker Router

**File:** `worker/src/index.ts`

```typescript
import { handleAssessment } from './handlers/assess'
import { handleData } from './handlers/data'
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

    // Route requests
    if (path === '/assess' && request.method === 'POST') {
      response = await handleAssessment(request, env)
    } else if (path.startsWith('/data/')) {
      const dataPath = path.replace('/data/', '')
      response = await handleData(request, env, dataPath)
    } else if (path === '/health') {
      response = new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      })
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

#### 2.5 Update Assessment Handler

Modify `worker/src/handlers/assess.ts` to fetch data from R2 instead of external URL:

```typescript
async function getVerseAnalysis(verseId: string, env: Env): Promise<VerseAnalysis | null> {
  const fileName = verseId.replace(':', '-')
  const key = `analysis/${fileName}.json`

  try {
    const object = await env.DATA_BUCKET.get(key)
    if (!object) return null
    return await object.json()
  } catch {
    return null
  }
}

async function getReferenceTranslation(verseId: string, env: Env): Promise<string | null> {
  const [surahId, verseNum] = verseId.split(':').map(Number)

  try {
    const object = await env.DATA_BUCKET.get('quran.json')
    if (!object) return null

    const quranData = await object.json()
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

Update to fetch from Worker API:

```typescript
// API base URL - Worker in production, can be configured for local dev
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://qalam-api.foyzul.workers.dev'

export async function getQuranData(): Promise<QuranData | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/data/quran.json`)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

export async function getVerseAnalysis(verseId: string): Promise<VerseAnalysis | null> {
  const fileName = verseId.replace(':', '-')
  try {
    const response = await fetch(`${API_BASE_URL}/data/analysis/${fileName}.json`)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

// ... similar updates for other functions
```

#### 3.5 Update Client Component

**File:** `src/app/browse/surah/[id]/[verse]/VersePracticeClient.tsx`

```typescript
// API URL for all requests
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

### Phase 1: R2 Setup
- [ ] Create R2 bucket `qalam-data`
- [ ] Create `scripts/upload-to-r2.ts`
- [ ] Upload all data files to R2
- [ ] Verify files are accessible via wrangler

### Phase 2: Worker Updates
- [ ] Add R2 binding to `worker/wrangler.toml`
- [ ] Update `worker/src/types.ts`
- [ ] Create `worker/src/handlers/data.ts`
- [ ] Update `worker/src/index.ts` router
- [ ] Update assessment handler to use R2
- [ ] Test Worker locally with `npm run worker:dev`
- [ ] Deploy Worker with `npm run worker:deploy`

### Phase 3: Next.js Static Export
- [ ] Update `next.config.js` with `output: 'export'`
- [ ] Delete `src/app/api/` directory
- [ ] Update `src/lib/data.ts` to fetch from Worker
- [ ] Update `VersePracticeClient.tsx` API calls
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
