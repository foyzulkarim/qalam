# Setup Guide

**Version:** 3.0
**Last Updated:** December 2025

---

## Prerequisites

- Node.js 18+
- npm

For analysis generation (optional):
- [Ollama](https://ollama.ai) installed locally

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/foyzulkarim/qalam.git
cd qalam
npm install

# 2. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

That's it! No database setup, no environment variables required for development.

---

## NPM Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "build:quran": "tsx scripts/build-quran-json.ts",
    "seed:analysis": "tsx --env-file=.env scripts/seed-analysis.ts"
  }
}
```

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server at localhost:3000 |
| `npm run build` | Build static export to `./out` directory |
| `npm run lint` | Run ESLint |
| `npm run build:quran` | Rebuild quran.json from Tanzil.net source files |
| `npm run seed:analysis` | Generate verse analysis via Ollama |

---

## Environment Variables (Optional)

Only needed for analysis generation. Create `.env` in project root:

```bash
# LLM Configuration for analysis generation
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:72b
```

No environment variables are required for running the app itself.

---

## Data Files

The app uses static JSON files in `public/data/`:

### Source Files (Included)
These files are included in the repository:
- `quran.json` - Complete Quran with Arabic + translations
- `surahs.json` - Surah metadata (114 surahs)
- `quran-simple.txt` - Arabic text from Tanzil.net
- `en.sahih.txt` - Sahih International translation
- `en.transliteration.txt` - Transliteration

### Analysis Files (Partially Included)
- `analysis/*.json` - Word-by-word analysis for each verse
- Currently includes Surah Al-Fatihah and Juz Amma (Surahs 78-114)
- Generate more with `npm run seed:analysis`

---

## Rebuilding quran.json

If you need to modify translations or add new ones:

1. Edit `scripts/build-quran-json.ts`
2. Add new translation files to `public/data/`
3. Update the `TRANSLATIONS` array in the script
4. Run:
   ```bash
   npm run build:quran
   ```

---

## Generating Verse Analysis

To generate word-by-word analysis for verses:

### 1. Install Ollama
```bash
# macOS
brew install ollama

# Or download from https://ollama.ai
```

### 2. Pull a Model
```bash
# Recommended for best quality
ollama pull qwen2.5:72b

# Alternative (smaller, faster)
ollama pull llama3.2
```

### 3. Configure Environment
Create `.env` file:
```bash
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:72b
```

### 4. Run Seed Script
```bash
npm run seed:analysis
```

The script:
- Processes verses sequentially
- Has resume support (skips already-generated files)
- Creates files in `public/data/analysis/`
- Uses format: `{surah}-{verse}.json` (e.g., `1-5.json`)

---

## Production Build

### Static Export

The app builds as a static site:

```bash
npm run build
```

Output is in `./out` directory with all HTML, CSS, JS, and data files.

### Cloudflare Pages Deployment

The app is configured for Cloudflare Pages:

1. Connect your GitHub repository to Cloudflare Pages
2. Build settings:
   - Build command: `npm run build`
   - Build output directory: `out`
3. Deploy

Configuration is in `wrangler.toml`:
```toml
name = "qalam"
compatibility_date = "2024-12-24"

[assets]
directory = "./out"
```

### Alternative Deployments

Since this is a static site, it can be deployed anywhere:

- **Vercel**: Connect repo, auto-detects Next.js
- **Netlify**: Build command `npm run build`, publish `out`
- **GitHub Pages**: Push `./out` contents to gh-pages branch
- **Any static host**: Upload `./out` directory contents

---

## Troubleshooting

### Analysis Generation Issues

**Ollama not responding:**
```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# If not running, start it
ollama serve
```

**Model not found:**
```bash
# List available models
ollama list

# Pull the model
ollama pull qwen2.5:72b
```

**Script stops mid-way:**
Just run it again - it will resume from where it stopped.

### Build Issues

**TypeScript errors:**
```bash
npm run lint
```

**Missing dependencies:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Arabic Text Display Issues

Ensure the Amiri font is loading. Check browser console for font errors.
The font is loaded in `src/app/layout.tsx` via `next/font/google`.

---

## Development Notes

- Path alias: `@/*` maps to `./src/*`
- Arabic text uses `font-arabic` class
- RTL text uses `dir="rtl"` attribute
- All 114 surahs with 6,236 verses in quran.json
- Analysis files are generated incrementally
