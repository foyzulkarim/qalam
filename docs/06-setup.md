# Setup Guide

---

## Prerequisites

- Node.js 18+
- npm or yarn
- Ollama (for LLM)

---

## Environment Variables

Create `.env.local` in project root:

```bash
# Database
DATABASE_URL="file:./prisma/qalam.db"

# NextAuth
NEXTAUTH_SECRET="generate-random-32-char-string"
NEXTAUTH_URL="http://localhost:3000"

# LLM Configuration
LLM_PROVIDER="ollama"
LLM_API_URL="http://localhost:11434/api/generate"
LLM_MODEL="llama2"

# Optional: For production with OpenAI
# OPENAI_API_KEY="sk-..."
```

Generate a secret:
```bash
openssl rand -base64 32
```

---

## NPM Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",

    "fetch-quran": "tsx scripts/fetch-quran-data.ts",
    "seed": "tsx scripts/seed.ts",

    "db:migrate": "npx prisma migrate dev",
    "db:push": "npx prisma db push",
    "db:studio": "npx prisma studio",
    "db:generate": "npx prisma generate"
  }
}
```

| Command | Purpose |
|---------|---------|
| `npm run fetch-quran` | Download Quran data from quran-json |
| `npm run seed` | Generate verse analysis via local LLM |
| `npm run db:migrate` | Apply Prisma schema changes |
| `npm run db:push` | Push schema to DB without migration files |
| `npm run db:studio` | Open Prisma GUI to browse data |

---

## First Time Setup

```bash
# 1. Clone repo and install dependencies
git clone <repo>
cd qalam
npm install

# 2. Create .env.local file (see above)

# 3. Set up database
npm run db:migrate

# 4. Download Quran data
npm run fetch-quran

# 5. Start Ollama and pull a model
ollama run llama2

# 6. Generate verse analysis (takes ~2 hours for all verses)
npm run seed

# 7. Start development server
npm run dev
```

---

## After Pulling Updates

```bash
npm install           # Get new dependencies
npm run db:migrate    # Apply any schema changes
npm run dev           # Start development
```

---

## Data Acquisition

### Fetch Script

The `fetch-quran` script downloads Quran data from [quran-json](https://github.com/risan/quran-json) and transforms it to the required format.

```bash
npm run fetch-quran

# Creates:
# - data/surahs/index.json
# - data/surahs/001.json through 114.json
```

### Seed Script

The `seed` script generates word-by-word analysis for each verse using the local LLM.

```bash
# Ensure Ollama is running
ollama run llama2

# Run seed (resumable if stopped)
npm run seed

# Creates:
# - data/analysis/001.json through 114.json
```

The seed script has resume support - if it stops halfway, run it again and it will skip already-completed surahs.

---

## Production Deployment

### Option 1: Vercel (Simplest)

1. Push to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

Note: Analysis JSON files are committed to the repo, so they deploy automatically.

### Option 2: VPS

```bash
# 1. Build
npm run build

# 2. Copy to server
scp -r .next node_modules data prisma user@server:/app/qalam

# 3. Run with PM2
pm2 start npm --name qalam -- start

# 4. Set up Nginx reverse proxy
# 5. SSL with Let's Encrypt
```

### Production LLM

**Option A: Self-hosted Ollama on VPS**

```bash
# On VPS with Docker
docker run -d -v ollama:/root/.ollama -p 11434:11434 ollama/ollama
docker exec -it <container> ollama pull llama2
```

Set `LLM_API_URL` to your VPS address.

**Option B: OpenAI API**

```bash
LLM_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
```

---

## Troubleshooting

### Database Issues

```bash
# Reset database
rm prisma/qalam.db
npm run db:push
```

### Seed Script Failing

- Check Ollama is running: `ollama list`
- Check model is available: `ollama run llama2`
- Check LLM_API_URL is correct

### LLM Returns Invalid JSON

The seed script has retry logic. If a verse fails 3 times, it will throw an error. You can:
1. Check the console for which verse failed
2. Try a different model (e.g., `mistral`)
3. Manually add the missing analysis
