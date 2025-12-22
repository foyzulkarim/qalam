# Qalam: Verse Analysis Data Pipeline

**Version:** 1.0
**Purpose:** Architecture for pre-computing lexical and morphological analysis for all Quran verses

---

## Overview

Qalam uses a two-tier approach to provide rich educational feedback:

1. **Pre-computed Analysis** - Lexical and morphological breakdown of each verse, computed once and stored
2. **Runtime Evaluation** - Simple LLM comparison of user input against correct translation

This document describes the architecture for populating the pre-computed analysis data.

---

## Why Pre-Compute?

| Aspect | Without Pre-Computation | With Pre-Computation |
|--------|------------------------|---------------------|
| LLM prompt size | Large (full analysis task) | Small (comparison only) |
| LLM latency | 2-4 seconds | 0.5-1 second |
| Cost per attempt | ~$0.001 | ~$0.0002 |
| Analysis consistency | Varies per call | Always identical |
| Educational depth | Limited by response time | Rich, comprehensive |

---

## Pipeline Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Source     │    │   Analysis   │    │   Output     │
│   Verses     │───▶│   Script     │───▶│   Files      │
│              │    │              │    │              │
│ data/surahs/ │    │ scripts/     │    │ data/        │
│ *.json       │    │ analyze-     │    │ analysis/    │
│              │    │ verses.ts    │    │ *.json       │
└──────────────┘    └──────┬───────┘    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   LLM API    │
                    │ (Together/   │
                    │  Claude)     │
                    └──────────────┘
```

---

## Directory Structure

```
qalam/
├── data/
│   ├── surahs/                    # Source verse data (existing)
│   │   ├── index.json
│   │   ├── 001.json ... 114.json
│   │
│   └── analysis/                  # Pre-computed analysis (new)
│       ├── index.json             # Progress tracking
│       ├── 001.json ... 114.json  # Per-surah analysis
│
├── scripts/
│   ├── analyze-verses.ts          # Main pipeline script
│   ├── validate-analysis.ts       # Validation utility
│   └── prompts/
│       └── analysis-prompt.md     # Prompt template
│
└── shared/types/
    └── analysis.ts                # Type definitions
```

---

## Schema Design Principles

### Hybrid Approach: Structured + Optional Render

Store **structured fields as the source of truth**, plus an optional **pre-rendered markdown** section for quick UI rendering. This gives flexibility for:

- "Tap a word" interactive UI (needs structured `words[]`)
- Tables, filters, search (needs structured data)
- Quick rendering without client-side processing (use pre-rendered markdown)
- Future corrections without re-running LLM (edit structured data, regenerate markdown)

### Schema Versioning

Include a `schemaVersion` field in each document. This allows:

- Migrating old documents when schema evolves
- Identifying which documents need re-processing
- Backward compatibility during transitions

---

## Data Model

### Document Structure

Each verse analysis document contains four main sections:

| Section | Purpose |
|---------|---------|
| **Identification** | Verse ID, surah ID, verse number, schema version |
| **Arabic** | Uthmani script (with diacritics), optionally plain script |
| **Reference** | Translation ID, text, and source attribution |
| **Analysis** | Structured word breakdown, roots, grammar notes |
| **Render** (optional) | Pre-rendered markdown for quick UI display |
| **Provenance** | Generation metadata for tracking and reproducibility |

### Per-Word Analysis

Each word captures basic info plus detailed grammatical features:

**Basic Fields:**

| Field | Description | Example |
|-------|-------------|---------|
| Index | Word position in verse | 0 |
| Arabic | Original word | نِعۡمَةِ |
| Transliteration | Romanized form | niʿmati |
| Category | noun, verb, particle, pronoun, other | noun |
| POS Detail | Specific grammatical role | ḥarf jarr (preposition) |
| Root | Arabic trilateral root | ن-ع-م |
| Core Root Meaning | Semantic meaning of root | softness, ease |
| Pattern | Morphological pattern | فِعْلَة |
| Literal Meaning | Meaning of this word form | a favor, a blessing |
| Notes | Grammatical observations | Array of strings |

**Grammatical Features** (optional, where applicable):

| Feature | Values | Example |
|---------|--------|---------|
| Case | nom, acc, gen | gen |
| Definiteness | def, indef | indef |
| Number | sg, du, pl | sg |
| Gender | m, f | f |
| Person | 1, 2, 3 | 2 |
| Voice | active, passive | passive |
| Mood | indicative, subjunctive, jussive, imperative | — |
| State | construct, free | construct |
| Attached Pronoun | person, gender, number of suffix | { person: 2, gender: m, number: sg } |

### Root Summary

A table of roots appearing in the verse:

| Field | Description |
|-------|-------------|
| Word | The Arabic word |
| Root | Trilateral root |
| Core Root Meaning | Basic semantic meaning |
| Derived Meaning | Meaning in this context |

### Literal Aligned Translation

An array of English words/phrases aligned by index to the `words[]` array. This enables word-by-word display where user can tap Arabic and see corresponding English.

### Render Section (Optional)

Pre-rendered content for quick UI display:

| Field | Purpose |
|-------|---------|
| Markdown | Full analysis as markdown string |
| Sections | Array of { id, title, markdown } for granular rendering |

**Section IDs:** `verse`, `word_breakdown`, `literal`, `roots`, `grammar`

**Important:** Markdown is a render convenience, not the source of truth. Always keep structured `analysis` data as primary. If rendering user-controlled or remote markdown, sanitize it and ensure proper RTL styling for Arabic.

### Provenance

Track how and when the analysis was generated:

| Field | Purpose |
|-------|---------|
| Generated At | ISO timestamp |
| Generator | `llm`, `human`, or `pipeline` |
| Model | Model identifier (e.g., `together:meta-llama/...`) |
| Prompt ID | Identifier for prompt template version |
| Prompt Hash | SHA256 hash of exact prompt used |
| Temperature | LLM temperature setting |

This enables:
- Identifying which analyses need re-generation when prompts improve
- Reproducibility for debugging
- Quality tracking across different models

---

## Example Output

A condensed example for verse 68:2 (see `example.md` for full markdown version):

```json
{
  "schemaVersion": 1,
  "verseId": "68:2",
  "surahId": 68,
  "verseNumber": 2,
  "arabic": {
    "uthmani": "مَآ أَنتَ بِنِعۡمَةِ رَبِّكَ بِمَجۡنُونࣲ"
  },
  "reference": {
    "translationId": "sahih-international",
    "translationText": "You are not, [O Muḥammad], by the favor of your Lord, a madman."
  },
  "analysis": {
    "words": [
      { "index": 0, "arabic": "مَآ", "category": "particle", "literalMeaning": "not" },
      { "index": 1, "arabic": "أَنتَ", "category": "pronoun", "literalMeaning": "you", "features": { "person": 2, "gender": "m" } },
      { "index": 3, "arabic": "نِعۡمَةِ", "category": "noun", "root": "ن-ع-م", "coreRootMeaning": "softness, ease", "features": { "case": "gen" } }
    ],
    "literalAligned": ["Not", "you", "by", "favor-of", "your-Lord", "by", "one-whose-mind-is-covered"],
    "roots": [
      { "word": "نِعۡمَة", "root": "ن-ع-م", "coreRootMeaning": "softness, ease", "derivedMeaning": "favor, blessing" }
    ],
    "grammarNotes": ["Nominal sentence.", "Double بِ strengthens negation."]
  },
  "provenance": {
    "generatedAt": "2025-12-22T00:00:00Z",
    "generator": "llm",
    "model": "together:meta-llama/...",
    "promptId": "lex-morph-v1"
  }
}
```

---

## Progress Index

A separate index file tracks pipeline progress:

- Total verses in Quran (6,236)
- Verses analyzed so far
- Per-surah status (pending, in_progress, completed, failed)
- Last update timestamp
- Prompt version (for tracking when re-analysis needed)

---

## Analysis Prompt Design

The prompt should instruct the LLM to:

**Do:**
- Provide strict lexical and morphological analysis
- Break down each word individually
- Identify Arabic roots and their core meanings
- Explain grammatical categories and cases
- Note morphological patterns
- Provide literal, word-aligned translation

**Do Not:**
- Provide tafsīr or theological commentary
- Include thematic explanations
- Paraphrase or smooth the translation
- Add interpretive content

**Output Format:**
- Structured JSON for easy parsing
- Consistent field names across all verses
- Arrays for words and root summaries

See `example.md` in the repository root for a reference output.

---

## Script Behavior

### Main Pipeline Script

**Inputs:**
- Source verse files from `data/surahs/`
- LLM configuration (provider, API key, model)
- Optional filters (specific surahs, resume point)

**Process:**
1. Load progress index
2. Identify verses needing analysis
3. For each verse:
   - Build analysis prompt
   - Call LLM API
   - Parse and validate JSON response
   - Store in surah analysis file
   - Update progress index
4. Apply rate limiting between calls
5. Handle errors with retry logic

**Outputs:**
- Per-surah analysis files in `data/analysis/`
- Updated progress index

### Key Behaviors

| Behavior | Description |
|----------|-------------|
| **Resumable** | Reads index on startup, skips completed verses |
| **Crash-safe** | Saves progress after each verse |
| **Rate-limited** | Configurable delay between API calls |
| **Retryable** | Automatic retry with backoff on failures |
| **Validating** | Checks JSON structure before saving |

### Validation Script

Separate utility to verify analysis completeness:

- Check all 114 surahs have analysis files
- Verify verse counts match source
- Validate required fields present
- Check Arabic text matches source
- Report any discrepancies

---

## Running the Pipeline

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `ANALYSIS_LLM_PROVIDER` | Provider name (together, anthropic, openai) |
| `ANALYSIS_LLM_API_KEY` | API key for the provider |
| `ANALYSIS_LLM_MODEL` | Model identifier |

### Command Options

| Command | Purpose |
|---------|---------|
| `npm run analyze:all` | Process all verses (resumable) |
| `npm run analyze:surah 1` | Process specific surah |
| `npm run analyze:status` | Show current progress |
| `npm run analyze:validate` | Validate all analysis files |
| `--dry-run` | Test without writing files |

---

## Cost & Time Estimation

### One-Time Analysis Cost

| Provider | Model | Estimated Cost |
|----------|-------|----------------|
| Together AI | Llama 3.1 70B | ~$14 |
| Anthropic | Claude 3.5 Sonnet | ~$234 |
| OpenAI | GPT-4o | ~$234 |

### Time Estimation

With 1-second delay between API calls:
- Al-Fatihah (7 verses): ~10 seconds
- Full Quran (6,236 verses): ~2 hours

---

## Phased Rollout

| Phase | Scope | Purpose |
|-------|-------|---------|
| 1 | Al-Fatihah (7 verses) | Validate prompt, test JSON parsing |
| 2 | Short surahs 100-114 (~350 verses) | Larger batch, commonly memorized |
| 3 | Famous verses (Ayat al-Kursi, etc.) | High-value individual verses |
| 4 | Complete Quran | Remaining ~5,500 verses |

---

## Error Handling

### Retry Strategy

- Maximum 3 retries per verse
- Exponential backoff between retries
- Continue to next verse if all retries fail

### Common Errors

| Error | Resolution |
|-------|------------|
| JSON parse failure | Retry with explicit JSON instruction |
| Rate limit | Increase delay between calls |
| Timeout | Increase timeout, retry |
| Missing fields | Retry, or flag for manual review |

### Graceful Degradation

Failed verses are:
1. Logged with error details
2. Marked as `failed` in index
3. Skipped (pipeline continues)
4. Reported at end for manual review

---

## Integration with Main Application

### Loading Analysis

The server loads pre-computed analysis from JSON files:
- Cache in memory for fast access
- Load entire surah on first verse request
- Return analysis alongside evaluation response

### Updated Evaluation Response

The evaluation endpoint returns:
1. **Runtime feedback** (from simple LLM comparison)
   - Score, correct concepts, missed concepts, summary
2. **Pre-computed analysis** (from stored JSON)
   - Word breakdown, roots, grammatical observations

### Fallback Behavior

If analysis not available for a verse:
- Runtime evaluation still works (comparison only)
- Pre-computed section omitted from response
- User still gets feedback, just without word-by-word breakdown

---

## Future Considerations

### Re-Analysis Triggers

May need to regenerate analysis when:
- Prompt template significantly improved
- Better LLM model available
- Errors discovered in existing analysis
- Additional fields needed

Track prompt version in metadata to identify outdated analysis.

### Quality Review

Consider manual review process for:
- Failed verses
- Short verses (may need less analysis)
- Complex verses (may need verification)

---

*This pipeline enables rich, consistent educational content while keeping runtime costs minimal. The one-time investment in pre-computing analysis pays dividends in faster, cheaper, and more consistent user experiences.*
