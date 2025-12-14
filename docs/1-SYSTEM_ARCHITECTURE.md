# Qalam: System Architecture

**Version:** 2.0 (Consolidated)  
**Last Updated:** December 2024  
**Purpose:** Single source of truth for all technical architecture decisions

---

## Overview

Qalam is a Quran comprehension learning application that helps users understand Arabic verses through active practice and AI-powered feedback. The system is built as a monorepo containing a React frontend, Node.js backend, and shared TypeScript types.

### Core Principle

The learning model is **verse-centric**: users build a relationship with individual verses through repeated attempts and feedback. There are no sessions, skill levels, or adaptive algorithms. The system simply tracks each user's history with each verse they've attempted.

---

## Technology Stack

### Frontend
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6
- **State Management:** React Context + hooks (no external library)
- **Styling:** Plain CSS with CSS Modules
- **API Client:** Fetch API with custom hooks

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js with TypeScript
- **Database:** SQLite 3 (via better-sqlite3)
- **Authentication:** JWT (access tokens only, no refresh tokens for simplicity)
- **LLM Integration:** Custom provider abstraction (Ollama for dev, Together AI for prod)

### Shared
- **Language:** TypeScript (strict mode)
- **Types:** Shared package imported by both frontend and backend
- **Data:** Quran JSON files accessible to both sides

### Infrastructure
- **Development:** Local (Node + Vite dev servers)
- **Production:** Single Digital Ocean VPS
- **Web Server:** Nginx (reverse proxy + static files)
- **Process Manager:** systemd
- **SSL:** Let's Encrypt via Certbot

---

## Repository Structure

```
qalam/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Buttons, cards, inputs
│   │   │   ├── arabic/          # Arabic text display
│   │   │   ├── practice/        # Practice flow components
│   │   │   └── navigation/      # Header, nav
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Practice.tsx
│   │   │   ├── SurahBrowser.tsx
│   │   │   ├── Progress.tsx
│   │   │   └── Settings.tsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   └── ProgressContext.tsx
│   │   ├── hooks/
│   │   │   ├── useApi.ts
│   │   │   ├── useAuth.ts
│   │   │   └── useProgress.ts
│   │   ├── services/
│   │   │   └── api.ts           # Backend API client
│   │   ├── styles/
│   │   │   ├── index.css
│   │   │   ├── arabic.css
│   │   │   └── variables.css
│   │   ├── utils/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── router.tsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── server/                      # Node.js backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── index.ts         # Environment config
│   │   │   └── database.ts      # SQLite setup
│   │   ├── db/
│   │   │   ├── schema.sql       # Database schema
│   │   │   └── migrations/      # Future migrations
│   │   ├── middleware/
│   │   │   ├── auth.ts          # JWT verification
│   │   │   ├── errorHandler.ts
│   │   │   └── validation.ts
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.routes.ts
│   │   │   ├── verses/
│   │   │   │   ├── verses.controller.ts
│   │   │   │   ├── verses.service.ts
│   │   │   │   └── verses.routes.ts
│   │   │   ├── evaluate/
│   │   │   │   ├── evaluate.controller.ts
│   │   │   │   ├── evaluate.service.ts
│   │   │   │   └── evaluate.routes.ts
│   │   │   └── progress/
│   │   │       ├── progress.controller.ts
│   │   │       ├── progress.service.ts
│   │   │       └── progress.routes.ts
│   │   ├── llm/
│   │   │   ├── index.ts         # Provider factory
│   │   │   ├── types.ts
│   │   │   ├── ollama.provider.ts
│   │   │   └── together.provider.ts
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   └── logger.ts
│   │   ├── app.ts               # Express app setup
│   │   └── server.ts            # Entry point
│   ├── tsconfig.json
│   └── package.json
│
├── shared/                      # Shared TypeScript types
│   ├── types/
│   │   ├── index.ts
│   │   ├── verse.ts
│   │   ├── api.ts
│   │   ├── attempt.ts
│   │   └── user.ts
│   ├── tsconfig.json
│   └── package.json
│
├── data/                        # Quran data (read by both)
│   ├── surahs/
│   │   ├── index.json           # Surah metadata
│   │   ├── 001.json             # Al-Fatihah
│   │   └── ...                  # Through 114.json
│   └── qalam.db                 # SQLite database (gitignored)
│
├── scripts/
│   ├── convert_tanzil.py        # Data conversion
│   └── setup.sh                 # Initial setup
│
├── docs/                        # Documentation (reference only)
│   ├── qalam-user-journey.md    # UX philosophy (reference)
│   └── qalam-ux-pages.md        # Page designs (reference)
│
├── .env.example
├── .gitignore
├── package.json                 # Root workspace config
└── README.md
```

---

## Data Flow

### User Attempts a Verse

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ POST /api/evaluate
       │ { verseId, userInput }
       │
       ▼
┌─────────────┐
│   Nginx     │  Reverse proxy
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Express   │
│   Server    │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│   SQLite    │   │  LLM (Ollama│
│  (Attempts) │   │  /Together) │
└─────────────┘   └──────┬──────┘
                         │
                         │ Evaluation feedback
                         │
                         ▼
                  ┌─────────────┐
                  │   Store     │
                  │   Attempt   │
                  └─────────────┘
```

### User Loads Dashboard

```
Client → GET /api/progress → Server → SQLite (aggregate attempts) → Response
```

### User Browses Surahs

```
Client → GET /api/surahs → Server → Reads data/surahs/index.json → Response
Client → GET /api/surahs/1 → Server → Reads data/surahs/001.json → Response
```

---

## Authentication Flow

### Registration
1. User submits email, password, name
2. Server hashes password with bcrypt (10 rounds)
3. Server creates user record in SQLite
4. Server generates JWT access token (7 day expiry)
5. Server returns token + user object
6. Client stores token in localStorage
7. Client includes token in Authorization header for all subsequent requests

### Login
1. User submits email, password
2. Server finds user by email
3. Server verifies password with bcrypt
4. Server generates new JWT token
5. Server updates lastLoginAt timestamp
6. Server returns token + user object

### Protected Requests
1. Client sends: `Authorization: Bearer <token>`
2. Server middleware verifies JWT signature
3. Server middleware decodes userId from token
4. Server attaches `req.user` for controllers to use
5. If token invalid/expired: 401 Unauthorized

**Note:** We're using access tokens only (no refresh tokens). Token expiry is 7 days. When it expires, user must log in again. This is simpler than refresh token flow and acceptable for this application.

---

## Verse Practice Flow

### 1. User Selects Practice Mode

**Option A: Continue Reading**
- Client calls `GET /api/progress/next-verse`
- Server returns the next verse in sequential order that user hasn't attempted
- If user has attempted all available verses, returns first verse of next surah

**Option B: Choose Specific Verse/Surah**
- Client shows surah browser
- User clicks on a surah → Client navigates to `/practice?surahId=1`
- Client calls `GET /api/surahs/1` to load all verses
- User clicks on a verse → Client navigates to `/practice?verseId=1:5`

### 2. Practice Interface

Client displays:
- Arabic text (large, centered, proper RTL)
- Verse reference (e.g., "Al-Fatihah • Verse 2")
- Text input for user's understanding
- "Submit" button
- "I don't know" button (sets `skipped: true`)

### 3. User Submits Attempt

**Client sends:**
```json
POST /api/evaluate
{
  "verseId": "1:2",
  "userInput": "All praise belongs to Allah, Lord of the worlds",
  "skipped": false
}
```

**Server:**
1. Validates request (authenticated, verse exists)
2. Loads verse from JSON files
3. Calls LLM provider with evaluation prompt
4. Parses LLM response as structured JSON
5. Stores attempt in database
6. Returns evaluation to client

**Client receives:**
```json
{
  "attemptId": "abc123",
  "score": 85,
  "feedback": {
    "summary": "Excellent - you captured the core meaning accurately",
    "correct": ["praise to Allah", "Lord of the worlds"],
    "missed": ["specific word 'due' - all praise is due to Allah"],
    "insight": "The root ح-م-د (h-m-d) means praise. It appears throughout the Quran in words like Muhammad (the praised one)."
  },
  "verse": {
    "arabic": "...",
    "translation": "..."
  }
}
```

### 4. Feedback Display

Client shows:
- User's input (what they wrote)
- Score as percentage or visual indicator
- Feedback summary
- What they got correct (green highlights)
- What they missed (amber highlights)
- Insight box (if present) - the teaching moment
- Correct translation for comparison
- "Next Verse" button

---

## Progress Tracking

The system tracks learning at the verse level. Each attempt is stored permanently with:
- Which user
- Which verse
- What they wrote
- What score they got
- What feedback they received
- When it happened

### Progress Queries

**Dashboard Stats:**
```sql
SELECT 
  COUNT(*) as totalAttempts,
  COUNT(DISTINCT verseId) as uniqueVerses,
  AVG(score) as averageScore,
  COUNT(DISTINCT DATE(createdAt)) as daysActive
FROM attempts 
WHERE userId = ?
```

**Verse History:**
```sql
SELECT * FROM attempts 
WHERE userId = ? AND verseId = ? 
ORDER BY createdAt DESC
```

**Recent Activity:**
```sql
SELECT * FROM attempts 
WHERE userId = ? 
ORDER BY createdAt DESC 
LIMIT 10
```

No denormalized caching, no complex aggregations. We query attempts table directly. SQLite is fast enough for this.

---

## LLM Integration

### Provider Abstraction

```typescript
interface LLMProvider {
  evaluate(request: EvaluateRequest): Promise<EvaluateResponse>;
}

interface EvaluateRequest {
  verseId: string;
  arabic: string;
  translation: string;
  userInput: string;
  skipped: boolean;
}

interface EvaluateResponse {
  score: number;
  feedback: {
    summary: string;
    correct: string[];
    missed: string[];
    insight: string | null;
  };
}
```

### Switching Providers

Environment variable `LLM_PROVIDER` determines which provider to use:

- `LLM_PROVIDER=ollama` → Uses OllamaProvider (local development)
- `LLM_PROVIDER=together` → Uses TogetherProvider (production)

### Provider Initialization

```typescript
// server/src/llm/index.ts
export function createLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER || 'ollama';
  
  switch (provider) {
    case 'ollama':
      return new OllamaProvider({
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'llama3.2'
      });
    
    case 'together':
      return new TogetherProvider({
        apiKey: process.env.TOGETHER_API_KEY!,
        model: process.env.TOGETHER_MODEL || 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'
      });
    
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}
```

---

## Environment Configuration

### Development (.env.local)

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_PATH=./data/qalam.db

# JWT
JWT_SECRET=dev-secret-change-in-production
JWT_EXPIRES_IN=7d

# LLM - Local Development
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Client (Vite)
VITE_API_URL=http://localhost:3000/api
```

### Production (.env)

```bash
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_PATH=/var/www/qalam/data/qalam.db

# JWT (use strong random string!)
JWT_SECRET=<GENERATE_SECURE_RANDOM_STRING>
JWT_EXPIRES_IN=7d

# LLM - Production
LLM_PROVIDER=together
TOGETHER_API_KEY=<YOUR_API_KEY>
TOGETHER_MODEL=DiscoResearch/DiscoLM-German-7b-v1

# Client (set during build)
VITE_API_URL=https://qalam.yourdomain.com/api
```

---

## Development Workflow

### Initial Setup

```bash
# Clone repository
git clone <your-repo>
cd qalam

# Install dependencies (uses npm workspaces)
npm install

# Copy environment template
cp .env.example .env

# Initialize database
npm run db:init

# Start both client and server
npm run dev
```

This runs:
- Client on `http://localhost:5173` (Vite)
- Server on `http://localhost:3000` (Express)

### Available Commands

```bash
# Development
npm run dev              # Run both client and server
npm run dev:client       # Run only frontend
npm run dev:server       # Run only backend

# Building
npm run build            # Build both
npm run build:client     # Build frontend only
npm run build:server     # Build backend only

# Database
npm run db:init          # Create tables from schema
npm run db:reset         # Drop and recreate database (destructive!)

# Utilities
npm run lint             # Lint all TypeScript
npm run type-check       # Check types without building
```

### File Watching

In development:
- Vite watches client files and hot-reloads
- ts-node-dev watches server files and restarts on changes
- Both provide instant feedback

---

## Production Deployment

### Build Process

```bash
# On your local machine
npm run build

# This creates:
# - client/dist/      (static HTML, CSS, JS)
# - server/dist/      (compiled Node.js)
```

### VPS Setup

```bash
# On Digital Ocean VPS (Ubuntu 22.04)
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx nodejs npm

# Create app directory
sudo mkdir -p /var/www/qalam
sudo chown $USER:$USER /var/www/qalam

# Copy files
rsync -avz client/dist/ user@vps:/var/www/qalam/client/dist/
rsync -avz server/dist/ user@vps:/var/www/qalam/server/dist/
rsync -avz server/package*.json user@vps:/var/www/qalam/server/
rsync -avz data/ user@vps:/var/www/qalam/data/

# Install production dependencies
cd /var/www/qalam/server
npm ci --production

# Create production .env file
nano /var/www/qalam/.env
# (paste production config)

# Set up systemd service (see DEPLOYMENT.md)
# Set up nginx config (see DEPLOYMENT.md)
# Set up SSL with certbot
```

### Process Management

The backend runs as a systemd service that:
- Starts automatically on boot
- Restarts on failure
- Logs to journald

```bash
# Control the service
sudo systemctl start qalam
sudo systemctl stop qalam
sudo systemctl restart qalam
sudo systemctl status qalam

# View logs
sudo journalctl -u qalam -f
```

---

## Scaling Considerations

### Current Architecture Limits

This architecture works well for:
- Up to ~1000 active users
- Moderate LLM usage (since using cheap Together AI model)
- Single VPS with 2GB RAM

### Future Scaling Options

If you grow beyond these limits:

1. **Database**: Migrate from SQLite to PostgreSQL (schema is easy to translate)
2. **LLM**: Add caching layer for common verse evaluations
3. **Static Files**: Move client to Cloudflare Pages for free CDN
4. **Multiple Servers**: Add load balancer, shared PostgreSQL database

But start simple. SQLite on a single VPS is perfect for launch and early growth.

---

## Security Considerations

### Current Security Measures

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 7-day expiry
- SQL injection prevented by parameterized queries (better-sqlite3)
- CORS configured for production domain only
- HTTPS enforced in production (Nginx + Let's Encrypt)

### Security Checklist Before Launch

- [ ] Change JWT_SECRET to strong random value
- [ ] Set up HTTPS with Let's Encrypt
- [ ] Configure Nginx rate limiting
- [ ] Set secure HTTP headers (helmet.js)
- [ ] Validate all user inputs
- [ ] Set up database backups
- [ ] Configure firewall (ufw) to allow only 80, 443, 22

---

## Testing Strategy

### Backend Tests

```bash
# Unit tests for core logic
server/src/modules/evaluate/__tests__/evaluate.service.test.ts
server/src/llm/__tests__/ollama.provider.test.ts

# Integration tests for API endpoints
server/src/__tests__/integration/auth.test.ts
server/src/__tests__/integration/evaluate.test.ts
```

### Frontend Tests

```bash
# Component tests
client/src/components/__tests__/PracticeCard.test.tsx

# Integration tests
client/src/__tests__/practice-flow.test.tsx
```

### E2E Tests (Optional, Phase 2)

Using Playwright to test critical flows:
- User registration → Login → Practice verse → View feedback
- User selects surah → Chooses verse → Submits attempt

---

## Next Steps

1. **Database Schema**: Define SQLite tables (see DATABASE_SCHEMA.md)
2. **API Specification**: Define all endpoints (see API_SPECIFICATION.md)
3. **Shared Types**: Define TypeScript interfaces (see SHARED_TYPES.md)
4. **LLM Evaluation**: Design the evaluation prompt (see LLM_EVALUATION.md)
5. **Implementation**: Start building!

---

*This document is the single source of truth for Qalam's technical architecture. All code should align with the decisions made here.*
