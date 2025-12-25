# Qalam - Verse Made Easy

**Live at: [versemadeeasy.com](https://versemadeeasy.com)**

Qalam is a Quran translation learning app that helps users understand the meaning of Quranic verses through active practice and AI-powered feedback.

## Features

- **Practice Translation**: Read Arabic verses and write your English translation
- **AI-Powered Feedback**: Get instant scoring, suggestions, and insights on your translation
- **Word-by-Word Analysis**: Explore each Arabic word with transliteration, meaning, root letters, and grammar
- **Complete Quran**: All 114 Surahs with 6,236 verses available
- **No Sign-Up Required**: Start learning immediately with no accounts or barriers
- **Stateless Design**: No database, no user data stored - just learn and practice

## Tech Stack

- **Framework**: Next.js 16 with App Router (static export)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with Islamic-themed design (teal primary, gold accents)
- **Fonts**: Amiri for Arabic text (RTL)
- **Deployment**: Cloudflare Pages
- **LLM**: Ollama for analysis generation (development only)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/foyzulkarim/qalam.git
cd qalam

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (static export) |
| `npm run lint` | Run ESLint |
| `npm run build:quran` | Build quran.json from Tanzil.net source files |
| `npm run seed:analysis` | Generate verse analysis via Ollama |

## Project Structure

```
qalam/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing page
│   │   └── browse/             # Surah browsing and verse practice
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI (Button, Card, Input, Alert)
│   │   ├── VerseDisplay.tsx    # Arabic verse display
│   │   ├── FeedbackCard.tsx    # AI feedback display
│   │   └── Navbar.tsx          # Navigation
│   ├── lib/
│   │   └── data.ts             # Data fetching utilities
│   └── types/                  # TypeScript definitions
│
├── public/data/                # Static JSON data
│   ├── quran.json              # Complete Quran (Arabic + translations)
│   ├── surahs.json             # Surah metadata
│   └── analysis/               # Pre-computed verse analysis (LLM-generated)
│
├── scripts/                    # Build and seed scripts
│   ├── build-quran-json.ts     # Builds quran.json from source files
│   └── seed-analysis.ts        # Generates verse analysis via Ollama
│
└── docs/                       # Project documentation
```

## Data Architecture

### Source Data (Human-Verified)

The Quranic text comes from [Tanzil.net](https://tanzil.net), a trusted source for Quran data:

- **quran.json** - Complete Quran with Arabic text + translations
- Built from source files: `quran-simple.txt`, `en.sahih.txt`, `en.transliteration.txt`
- Run `npm run build:quran` to regenerate

### Analysis Data (LLM-Generated)

Word-by-word linguistic analysis is generated using local LLMs:

- Located in `public/data/analysis/{surah}-{verse}.json`
- Contains roots, grammar, morphology for each word
- Generated via `npm run seed:analysis` using Ollama

**Key Principle**: Arabic text and translations are NEVER LLM-generated. Only linguistic analysis is AI-generated. This ensures Quranic text accuracy.

## Generating Verse Analysis

To generate word-by-word analysis for verses:

1. Install [Ollama](https://ollama.ai)
2. Pull a model: `ollama pull qwen2.5:72b` (recommended) or `ollama pull llama3.2`
3. Create `.env` file with:
   ```bash
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=qwen2.5:72b
   ```
4. Run: `npm run seed:analysis`

The script has resume support - if interrupted, it will skip already-completed verses.

## Deployment

The app is deployed to Cloudflare Pages as a static export:

```bash
# Build static export
npm run build

# Output is in ./out directory
```

Configuration is in `wrangler.toml` for Cloudflare deployment.

## Design Philosophy

Qalam is built on these learning principles:

- **Active Recall**: Users write translations rather than passively reading
- **Immediate Feedback**: AI evaluation helps identify gaps and reinforce learning
- **Pattern Recognition**: Learn Arabic roots and grammar that transfer across verses
- **No Shame in Not Knowing**: Every gap is a teaching opportunity

## Contributing

Contributions are welcome! Please read the documentation in the `docs/` folder for detailed information about the architecture and guidelines.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Quranic text from [Tanzil.net](https://tanzil.net)
- Sahih International translation
- Built for the Ummah

---

*"Read, in the name of your Lord who created." — Al-Alaq (96:1)*
