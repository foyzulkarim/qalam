# Qalam Assessment API Worker

Cloudflare Worker for translation assessment with KV caching.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐       │
│  │ Static Site  │ ──── │   Worker     │ ──── │  Together.ai │       │
│  │ (CF Pages)   │      │   /assess    │      │  LLM API     │       │
│  │              │      │              │      │              │       │
│  └──────────────┘      └──────┬───────┘      └──────────────┘       │
│         │                     │                                      │
│         │              ┌──────▼───────┐                             │
│         │              │   CF KV      │                             │
│         │              │   Cache      │                             │
│         │              │  (30 days)   │                             │
│         │              └──────────────┘                             │
│         │                     │                                      │
│         │              ┌──────▼───────┐                             │
│         └─────────────▶│   CF R2      │◀─── Data fetched            │
│                        │  (Public)    │     by Worker for           │
│                        │  cdn.verse.. │     assessment context      │
│                        └──────────────┘                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Key points:**
- Static site fetches data directly from public R2 (`cdn.versemadeeasy.com`)
- Worker only handles `/assess` requests (not data serving)
- Worker fetches verse context from R2 when evaluating translations

## Request Flow

```
1. User submits translation
   └─► Frontend sends POST /assess { verseId, userTranslation }

2. Worker receives request
   └─► Generate cache key: hash(verseId + normalize(userTranslation))

3. Check KV cache
   ├─► HIT:  Return cached feedback immediately (cached: true)
   └─► MISS: Continue to step 4

4. Fetch verse data from R2 (public bucket)
   ├─► GET cdn.versemadeeasy.com/analysis/{surah}-{verse}.json
   └─► GET cdn.versemadeeasy.com/quran.json (for reference translation)

5. Build LLM prompt
   └─► Include: Arabic, reference translation, word meanings, user's attempt

6. Call LLM API
   └─► Together.ai (production)

7. Cache result in KV
   └─► Store feedback with 30-day TTL

8. Return response
   └─► { success: true, cached: false, data: { feedback } }
```

## API Endpoints

### POST /assess

Assess a user's Quran translation.

**Request:**
```json
{
  "verseId": "1:1",
  "userTranslation": "In the name of God, the most gracious, the most merciful"
}
```

**Response (Success):**
```json
{
  "success": true,
  "cached": false,
  "data": {
    "feedback": {
      "overallScore": 0.85,
      "correctElements": [
        "Captured the core meaning of Bismillah",
        "Included both divine attributes"
      ],
      "missedElements": [
        "Consider 'Allah' instead of 'God' for accuracy"
      ],
      "suggestions": [
        "The phrase 'Ar-Rahman Ar-Raheem' emphasizes different aspects of mercy"
      ],
      "encouragement": "Great effort! You understood the verse well."
    }
  }
}
```

### GET /list-bucket

List files in R2 bucket. Used by sync scripts.

**Query params:**
- `prefix` - Filter by prefix (e.g., `analysis/`)
- `cursor` - Pagination cursor

**Response:**
```json
{
  "success": true,
  "data": {
    "objects": ["quran.json", "surahs.json", "analysis/1-1.json", ...],
    "truncated": false,
    "cursor": null
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-25T10:30:00.000Z",
  "backend": "together"
}
```

---

## Cache Key Strategy

The cache key is generated from:
- `verseId` (e.g., "1:1")
- Normalized user translation (lowercase, trimmed, collapsed whitespace)

```
Key format: assessment:{verseId}:{hash}
Example:    assessment:1:1:a3f2b1c9
```

**Same meaning, same cache hit:**
- "In the name of God" → cached
- "in the name of god" → same cache hit (normalized)
- "In  the   name of God" → same cache hit (whitespace collapsed)

**Different wording, different cache:**
- "In the name of Allah" → different cache entry

---

## Development

### Local Development

```bash
cd worker
npm install
npm run dev
```

Worker runs at `http://localhost:8787`.

For local development with remote KV (to test with real cache):

```bash
npm run dev:remote
```

### Set Secrets

```bash
# For production
npx wrangler secret put TOGETHER_API_KEY

# For local development, create .dev.vars:
echo "TOGETHER_API_KEY=your-key-here" > .dev.vars
```

### Deploy

```bash
npm run deploy
```

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `ASSESSMENT_BACKEND` | wrangler.toml | LLM backend: `together` |
| `TOGETHER_API_KEY` | Secret | Together.ai API key |
| `TOGETHER_MODEL` | wrangler.toml | Model name |
| `R2_PUBLIC_URL` | wrangler.toml | Public R2 URL for data |
| `ALLOWED_ORIGINS` | wrangler.toml | CORS origins (comma-separated) |

---

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run locally with local KV simulation |
| `npm run dev:remote` | Run locally with remote Cloudflare KV |
| `npm run deploy` | Deploy to Cloudflare |
| `npm run tail` | View live logs |

---

## Debugging

### View KV Cache Contents

```bash
# List all keys
npx wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID

# Get specific key
npx wrangler kv:key get "assessment:1:1:abc123" --namespace-id=YOUR_NAMESPACE_ID
```

### View Live Logs

```bash
npm run tail
```

### Clear Cache for a Verse

```bash
npx wrangler kv:key delete "assessment:1:1:abc123" --namespace-id=YOUR_NAMESPACE_ID
```

---

## Troubleshooting

### "TOGETHER_API_KEY is not configured"
- Run `npx wrangler secret put TOGETHER_API_KEY`
- For local dev: create `.dev.vars` file

### "Verse analysis not available"
- The verse analysis JSON doesn't exist in R2
- Run `npm run seed:analysis` then `npm run upload:r2`

### CORS errors
- Check `ALLOWED_ORIGINS` in `wrangler.toml`
- For local dev, `http://localhost:3000` is allowed by default

### R2 fetch errors
- Verify R2 bucket is public
- Check `R2_PUBLIC_URL` in `wrangler.toml`
