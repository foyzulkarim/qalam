# Setup Guide

How to set up Qalam for development and deployment.

## Prerequisites

- Node.js 20+
- npm
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (for deployment)

For analysis generation (optional):
- [Ollama](https://ollama.ai) or [LM Studio](https://lmstudio.ai)

## Quick Start (Frontend Only)

```bash
git clone https://github.com/foyzulkarim/qalam.git
cd qalam
npm install

# Create .env.local with required variables
cat > .env.local << EOF
NEXT_PUBLIC_R2_URL=https://cdn.versemadeeasy.com
NEXT_PUBLIC_API_URL=https://qalam-api.foyzul.workers.dev
EOF

npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

This connects to the production R2 bucket and Worker API.

## Full Local Development

For full local development (including Worker):

```bash
# Terminal 1: Run Worker locally
npm run worker:dev

# Terminal 2: Run Next.js with local Worker
cat > .env.local << EOF
NEXT_PUBLIC_R2_URL=https://cdn.versemadeeasy.com
NEXT_PUBLIC_API_URL=http://localhost:8787
EOF

npm run dev
```

See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for detailed setup instructions.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Build static export to `out/` |
| `npm run start` | Serve static build locally |
| `npm run lint` | Run ESLint |
| `npm run build:quran` | Rebuild quran.json from Tanzil sources |
| `npm run seed:analysis` | Generate verse analysis with local LLM |
| `npm run upload:r2` | Sync data files to R2 bucket |
| `npm run data:status` | Show analysis generation progress |
| `npm run worker:dev` | Run Worker locally |
| `npm run worker:deploy` | Deploy Worker to Cloudflare |

## Environment Variables

### Frontend (.env.local)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_R2_URL` | Yes | Public R2 URL for data |
| `NEXT_PUBLIC_API_URL` | Yes | Worker API URL |

### Worker (wrangler secret)

| Variable | Required | Description |
|----------|----------|-------------|
| `TOGETHER_API_KEY` | Yes | Together.ai API key for LLM |

Set via: `cd worker && npx wrangler secret put TOGETHER_API_KEY`

## Data Files

Data is stored in Cloudflare R2 at `cdn.versemadeeasy.com`:

| File | Content |
|------|---------|
| `quran.json` | Complete Quran (Arabic + translations) |
| `surahs.json` | Surah metadata |
| `analysis/*.json` | Word-by-word analysis |

Local copies are in `public/data/` for development and as source for R2 uploads.

## Generating Analysis

See [LLM Integration](./llm-integration.md) for details.

### Using Ollama

```bash
# Pull a capable model
ollama pull qwen3:4b

# Create .env
cat > .env << EOF
LLM_BACKEND=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:4b
EOF

# Run seed script
npm run seed:analysis

# Sync to R2
npm run upload:r2
```

### Using LM Studio

```bash
# 1. Download and install LM Studio from https://lmstudio.ai
# 2. Download a model (e.g., Gemma3-27B)
# 3. Start the local server in LM Studio

# Create .env
cat > .env << EOF
LLM_BACKEND=lms
LMS_BASE_URL=http://localhost:1234
LMS_MODEL=gemma3-27b
EOF

# Run seed script
npm run seed:analysis

# Sync to R2
npm run upload:r2
```

## Deployment

### 1. Deploy Worker

```bash
cd worker
npx wrangler secret put TOGETHER_API_KEY  # Set API key
npm run deploy
```

### 2. Deploy Pages

**Via GitHub Actions (recommended):**
Push to `main` branch - automatic deployment.

**Manual:**
```bash
npm run build
npx wrangler pages deploy out --project-name=qalam
```

### 3. Sync Data to R2

```bash
npm run upload:r2  # Smart sync - only uploads missing files
```

## Cloudflare Setup

### R2 Bucket

1. Create bucket: `npx wrangler r2 bucket create qalam-data`
2. Enable public access in Cloudflare dashboard
3. Add custom domain: `cdn.versemadeeasy.com`

### KV Namespace

Already configured in `worker/wrangler.toml`. If creating fresh:

```bash
cd worker
npx wrangler kv:namespace create ASSESSMENT_CACHE
npx wrangler kv:namespace create ASSESSMENT_CACHE --preview
```

### GitHub Actions Secrets

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | API token with Workers/Pages/R2 permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |

## Troubleshooting

**Build errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Missing env variables:**
Ensure `.env.local` has both `NEXT_PUBLIC_R2_URL` and `NEXT_PUBLIC_API_URL`.

**Arabic font not loading:**
Check browser console. Font is loaded via `next/font/google` in layout.tsx.

**Worker errors:**
```bash
cd worker
npm run tail  # View live logs
```

**LLM issues:**
```bash
# Ollama
curl http://localhost:11434/api/tags

# LM Studio
curl http://localhost:1234/v1/models
```
