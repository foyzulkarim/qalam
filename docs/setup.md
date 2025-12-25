# Setup Guide

How to set up Qalam for development and deployment.

## Prerequisites

- Node.js 18+
- npm

For analysis generation (optional):
- [Ollama](https://ollama.ai)

## Quick Start

```bash
git clone https://github.com/foyzulkarim/qalam.git
cd qalam
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

No database or environment variables required.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run build:quran` | Rebuild quran.json |
| `npm run seed:analysis` | Generate verse analysis |

## Data Files

All data is in `public/data/`:

| File | Content |
|------|---------|
| `quran.json` | Complete Quran (Arabic + translations) |
| `surahs.json` | Surah metadata |
| `analysis/*.json` | Word-by-word analysis |

## Generating Analysis

See [LLM Integration](./llm-integration.md) for details.

The script supports **LM Studio** or **Ollama**:

### Using LM Studio (Recommended)

```bash
# 1. Install LM Studio from https://lmstudio.ai
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
```

### Using Ollama

```bash
ollama pull qwen2.5:72b

cat > .env << EOF
LLM_BACKEND=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:72b
EOF

npm run seed:analysis
```

## Production Build

```bash
npm run build
# Output in ./out directory
```

### Cloudflare Pages

1. Connect GitHub repo to Cloudflare Pages
2. Build command: `npm run build`
3. Output directory: `out`

### Other Platforms

Works with any static host:
- Vercel (auto-detects Next.js)
- Netlify (build: `npm run build`, publish: `out`)
- GitHub Pages (push `out` contents)

## Troubleshooting

**Build errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Arabic font not loading:**
Check browser console. Font is loaded via `next/font/google` in layout.tsx.

**LM Studio issues:**
```bash
# Check if server is running
curl http://localhost:1234/v1/models
# If not, start server in LM Studio: Developer → Start Server
```

**Ollama issues:**
```bash
curl http://localhost:11434/api/tags
# If error, start Ollama:
ollama serve
```
