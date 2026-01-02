# LLM Integration

How Qalam uses LLMs to generate word-by-word verse analysis.

## Overview

LLMs are used **only at build time** to generate linguistic analysis. They are NOT used for:
- Generating Quranic text (sourced from Tanzil.net)
- Generating translations (sourced from Sahih International)
- Runtime evaluation (planned for future)

## Supported Backends

The seed script supports two LLM backends:

| Backend | Tool | API Style |
|---------|------|-----------|
| `ollama` | [Ollama](https://ollama.ai) | Ollama native API |
| `lms` | [LM Studio](https://lmstudio.ai) | OpenAI-compatible API |

The current analysis was generated using **LM Studio with Gemma3-27B**.

## Seed Script

The seed script (`npm run seed:analysis`) generates word-by-word analysis for verses.

### Configuration

Create `.env` file:

```bash
# Backend selection: 'ollama' or 'lms'
LLM_BACKEND="lms"

# LM Studio (recommended)
LMS_BASE_URL="http://localhost:1234"
LMS_MODEL="gemma3-27b"

# Ollama (alternative)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:72b"
```

### Running with LM Studio

```bash
# 1. Download and install LM Studio from https://lmstudio.ai
# 2. Download a model (e.g., Gemma3-27B, Qwen2.5)
# 3. Start the local server in LM Studio
# 4. Run seed script
LLM_BACKEND=lms npm run seed:analysis
```

### Running with Ollama

```bash
# Start Ollama
ollama serve

# Pull a model
ollama pull qwen2.5:72b

# Run seed script
LLM_BACKEND=ollama npm run seed:analysis
```

### Features

- **Resume support**: Skips already-generated files if interrupted
- **Two-phase generation**: Base analysis first, then detailed word analysis
- **Validation**: Validates JSON structure before saving

## Model Recommendations

### LM Studio Models

| Model | Size | Arabic Quality | Notes |
|-------|------|----------------|-------|
| Gemma3-27B | ~16GB | Excellent | Used for current analysis |
| Qwen2.5-32B | ~18GB | Excellent | Great Arabic support |
| Llama3-70B | ~40GB | Very Good | Requires significant RAM |

### Ollama Models

| Model | Size | Arabic Quality | Speed |
|-------|------|----------------|-------|
| qwen2.5:72b | 40GB | Excellent | Slow |
| qwen2.5:32b | 18GB | Very Good | Medium |
| llama3.2 | 4GB | Basic | Fast |

For Quranic Arabic analysis, larger models (27B+) produce significantly better results.

## Two-Phase Generation

To improve reliability and avoid timeouts, analysis is split into two phases:

### Phase 1: Base Analysis

Generates verse info and simplified word list (~1-2 minutes):
- Verse metadata (Arabic, transliteration)
- Basic word list with meanings
- Root summary
- Literal translation

See: [analysis-prompt-base.md](./analysis-prompt-base.md)

### Phase 2: Word Details

Generates detailed analysis for each word (~30-60 seconds each):
- Grammar (case, gender, number)
- Morphology (pattern, word type)
- Components (for compound words)
- Syntactic function

See: [analysis-prompt-word.md](./analysis-prompt-word.md)

## Output Format

Analysis files are saved to `public/data/analysis/{surah}-{verse}.json`:

```json
{
  "verseId": "1:2",
  "verse": {
    "arabic": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    "transliteration": "al-ḥamdu lillāhi rabbi al-ʿālamīn",
    "surah": "Al-Fatihah",
    "verseNumber": 2
  },
  "words": [
    {
      "wordNumber": 1,
      "arabic": "الْحَمْدُ",
      "transliteration": "al-ḥamdu",
      "meaning": "the praise",
      "root": {
        "letters": "ح-م-د",
        "transliteration": "ḥ-m-d",
        "meaning": "to praise"
      },
      "grammar": {
        "case": "nominative (marfūʿ)",
        "gender": "masculine",
        "number": "singular"
      }
    }
  ],
  "literalTranslation": {
    "wordAligned": "The-praise [is] for-Allah, Lord [of] the-worlds"
  },
  "rootSummary": [
    {
      "word": "الْحَمْدُ",
      "root": "ح-م-د (ḥ-m-d)",
      "coreMeaning": "praise, gratitude"
    }
  ]
}
```

## Current Coverage

Analysis files are stored in `public/data/analysis/`. To see current coverage:

```bash
ls public/data/analysis/ | wc -l
```

## Adding More Verses

1. Ensure Ollama is running with a capable model
2. Run `npm run seed:analysis`
3. Script will generate analysis for remaining verses
4. Commit the new analysis files

## Troubleshooting

**LM Studio not responding:**
```bash
curl http://localhost:1234/v1/models
# If error, ensure LM Studio server is running
# In LM Studio: Developer tab → Start Server
```

**Ollama not responding:**
```bash
curl http://localhost:11434/api/tags
# If error, start Ollama:
ollama serve
```

**Invalid JSON responses:**
- Try a larger model (27B+) for better Arabic handling
- Script has retry logic with JSON repair

**Script stops mid-way:**
Just run again - it resumes from where it stopped.

## Runtime Evaluation (Implemented)

Users can submit translation attempts and receive AI feedback via the Worker API.

### How It Works

1. User submits their translation attempt on a verse practice page
2. Frontend sends `POST /assess` to the Worker with `{ verseId, userTranslation }`
3. Worker checks KV cache for existing assessment
4. If cache miss:
   - Fetches verse analysis and reference translation from R2
   - Builds evaluation prompt with context
   - Calls Together.ai LLM API
   - Caches result in KV (30-day TTL)
5. Returns structured feedback (score, correct/missed elements, suggestions)

### Architecture

```
User → Frontend → Worker → KV Cache
                    ↓ (cache miss)
              Together.ai LLM
                    ↓
              R2 (verse data)
```

### Configuration

The Worker uses Together.ai in production. Set the API key:

```bash
cd worker
npx wrangler secret put TOGETHER_API_KEY
```

See [worker/README.md](../worker/README.md) for full API documentation.
