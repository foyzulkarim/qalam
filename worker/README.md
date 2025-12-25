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
│  │ qalam.pages  │      │              │      │              │       │
│  └──────────────┘      └──────┬───────┘      └──────────────┘       │
│                               │                                      │
│                        ┌──────▼───────┐                             │
│                        │   CF KV      │                             │
│                        │   Cache      │                             │
│                        │  (30 days)   │                             │
│                        └──────────────┘                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Request Flow

```
1. User submits translation
   └─► Frontend sends POST /assess { verseId, userTranslation }

2. Worker receives request
   └─► Generate cache key: hash(verseId + normalize(userTranslation))

3. Check KV cache
   ├─► HIT:  Return cached feedback immediately (cached: true)
   └─► MISS: Continue to step 4

4. Fetch verse data (from static site)
   ├─► GET qalam.pages.dev/data/analysis/{surah}-{verse}.json
   └─► GET qalam.pages.dev/data/quran.json (for reference translation)

5. Build LLM prompt
   └─► Include: Arabic, reference translation, word meanings, user's attempt

6. Call LLM API
   └─► Together.ai / vLLM / Ollama (based on ASSESSMENT_BACKEND)

7. Cache result in KV
   └─► Store feedback with 30-day TTL

8. Return response
   └─► { success: true, cached: false, data: { feedback } }
```

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

## Development Scenarios

### Scenario 1: Full Local Development (No Cloud)

**Use case:** Offline development, testing Worker logic

```bash
# Terminal 1: Run Worker with local KV simulation
cd worker
npm run dev

# Terminal 2: Serve static site
npm run build
npx serve out -p 3000
```

**Configuration (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:8787
```

**Behavior:**
- Worker runs at `localhost:8787`
- KV is simulated locally (miniflare)
- Cache persists in `worker/.wrangler/state/`
- LLM calls go to Together.ai (or local vLLM if configured)

---

### Scenario 2: Local Worker + Remote KV (Recommended for Testing)

**Use case:** Test with real Cloudflare KV, verify caching works

```bash
# Terminal 1: Run Worker with REMOTE KV
cd worker
npm run dev:remote

# Terminal 2: Serve static site
npm run build
npx serve out -p 3000
```

**Configuration (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:8787
```

**Behavior:**
- Worker runs locally at `localhost:8787`
- KV reads/writes go to **real Cloudflare KV**
- You can verify cache in Cloudflare dashboard
- Secrets (TOGETHER_API_KEY) are read from Cloudflare

---

### Scenario 3: Local Worker + Local LLM (vLLM)

**Use case:** Test with local GPU, no cloud LLM costs

```bash
# Terminal 1: Start vLLM
vllm serve Qwen/Qwen3-4B-Instruct --dtype auto --max-model-len 4096

# Terminal 2: Run Worker with local vLLM backend
cd worker
npm run dev:local

# Terminal 3: Serve static site
npx serve out -p 3000
```

**Behavior:**
- Worker uses vLLM at `localhost:8000`
- No Together.ai API calls
- Local KV simulation

---

### Scenario 4: Next.js Dev Mode (Simple, No Worker)

**Use case:** Quick frontend iteration, mock-ish behavior

```bash
npm run dev
```

**Configuration (.env.local):**
```
NEXT_PUBLIC_API_URL=
```

**Behavior:**
- Uses `/api/assess-translation` route (Next.js API)
- No KV caching
- Still calls real LLM (Together.ai)
- **Not representative of production**

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd worker
npm install
```

### 2. Create KV Namespace

```bash
# Create production namespace
npm run kv:create
# Output: Created namespace with ID "xxxxx"

# Create preview namespace (for wrangler dev)
npm run kv:create:preview
# Output: Created namespace with ID "yyyyy"
```

### 3. Update wrangler.toml

```toml
[[kv_namespaces]]
binding = "ASSESSMENT_CACHE"
id = "xxxxx"           # From step 2
preview_id = "yyyyy"   # From step 2
```

### 4. Set Secrets

```bash
# Set Together.ai API key
wrangler secret put TOGETHER_API_KEY
# Enter your key when prompted
```

### 5. Deploy

```bash
npm run deploy
```

---

## API Reference

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

**Response (Cached):**
```json
{
  "success": true,
  "cached": true,
  "data": {
    "feedback": { ... }
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Verse analysis not available"
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

## Environment Variables

| Variable | Where | Description | Default |
|----------|-------|-------------|---------|
| `ASSESSMENT_BACKEND` | wrangler.toml | LLM backend: `together`, `vllm`, `ollama` | `together` |
| `TOGETHER_API_KEY` | Secret | Together.ai API key | - |
| `TOGETHER_MODEL` | wrangler.toml | Model name | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |
| `VLLM_BASE_URL` | wrangler.toml | vLLM server URL | `http://localhost:8000` |
| `VLLM_MODEL` | wrangler.toml | vLLM model | `Qwen/Qwen3-4B-Instruct` |
| `ALLOWED_ORIGINS` | wrangler.toml | CORS origins (comma-separated) | `https://qalam.pages.dev,http://localhost:3000` |

---

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run locally with local KV simulation |
| `npm run dev:remote` | Run locally with **remote** Cloudflare KV |
| `npm run dev:local` | Run locally with local vLLM backend |
| `npm run deploy` | Deploy to Cloudflare |
| `npm run tail` | View live logs |
| `npm run kv:create` | Create KV namespace |
| `npm run kv:create:preview` | Create preview KV namespace |

---

## Debugging

### View KV Cache Contents

```bash
# List all keys
wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID

# Get specific key
wrangler kv:key get "assessment:1:1:abc123" --namespace-id=YOUR_NAMESPACE_ID
```

### View Live Logs

```bash
cd worker
npm run tail
```

### Clear Cache for a Verse

```bash
wrangler kv:key delete "assessment:1:1:abc123" --namespace-id=YOUR_NAMESPACE_ID
```

---

## Troubleshooting

### "Cannot connect to vLLM"
- Ensure vLLM is running: `vllm serve ...`
- Check `VLLM_BASE_URL` is correct

### "TOGETHER_API_KEY is not configured"
- Run `wrangler secret put TOGETHER_API_KEY`
- For local dev with remote: secrets are fetched from Cloudflare

### "Verse analysis not available"
- The verse analysis JSON doesn't exist in `public/data/analysis/`
- Run `npm run seed:analysis` to generate it

### CORS errors
- Check `ALLOWED_ORIGINS` includes your frontend URL
- For local dev, `http://localhost:3000` is allowed by default
