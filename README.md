# Qalam

Quran comprehension learning application that helps users understand Arabic verses through active practice and AI-powered feedback.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate Prisma client and run migrations
npm run db:migrate

# Start development servers
npm run dev
```

This runs:
- Frontend at `http://localhost:5173`
- Backend at `http://localhost:3000`

## Project Structure

```
qalam/
├── client/          # React frontend (Vite)
├── server/          # Express backend (Prisma + SQLite)
├── shared/          # Shared TypeScript types
├── data/            # Quran JSON data files
└── docs/            # Documentation
```

## Available Scripts

```bash
npm run dev              # Run both client and server
npm run build            # Build all packages
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio
```

## Environment Variables

See `.env.example` for all available options. Key variables:

- `JWT_SECRET` - Secret for JWT tokens (change in production!)
- `LLM_PROVIDER` - `ollama` for local dev, `together` for production
- `OLLAMA_MODEL` - Model name for Ollama (default: llama3.2)

## LLM Setup

### Development (Ollama)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2
```

### Production (Together AI)

Set `TOGETHER_API_KEY` in your environment.

## Documentation

See the `docs/` folder for detailed documentation:
- System Architecture
- API Specification
- Database Schema
- LLM Integration
- UX Specifications
