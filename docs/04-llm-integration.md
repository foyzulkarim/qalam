# LLM Integration

Two uses of LLM in Qalam:
1. **Seed Script** - One-time generation of verse analysis
2. **Runtime Evaluation** - Per-request feedback on user attempts

---

## 1. Seed Script

The seed script (`npm run seed`) generates word-by-word analysis for all 6,236 Quranic verses.

### Prerequisites

1. Quran source data exists in `/data/surahs/*.json`
2. Ollama is installed and running locally
3. A suitable model is available (e.g., `llama2`, `mistral`)

### Script Flow

```
npm run seed
    │
    ├── 1. Load surah index
    │
    ├── 2. For each surah (001 → 114):
    │      │
    │      ├── Check if analysis already exists (resume support)
    │      │
    │      ├── For each verse:
    │      │   ├── Send to LLM
    │      │   ├── Parse JSON response
    │      │   ├── Validate structure
    │      │   └── Retry up to 3 times if invalid
    │      │
    │      └── Save to /data/analysis/001.json
    │
    └── 3. Log summary
```

### LLM Prompt for Analysis

```typescript
const prompt = `
Analyze this Quranic verse word by word.

Arabic: ${verse.arabic}
Translation: ${verse.translation}

For each Arabic word, provide:
1. arabic: The Arabic word as it appears
2. transliteration: English transliteration
3. meaning: What this word means
4. root: The 3-letter Arabic root (space-separated)
5. grammar: Brief grammatical description

Also provide 1-3 grammar notes about the verse structure.

Respond ONLY with valid JSON in this exact format:
{
  "words": [
    {
      "arabic": "بِسْمِ",
      "transliteration": "bismi",
      "meaning": "In the name of",
      "root": "س م و",
      "grammar": "preposition + noun (genitive)"
    }
  ],
  "grammarNotes": [
    "Note about verse structure"
  ]
}
`;
```

### Response Validation

```typescript
interface WordAnalysis {
  arabic: string;
  transliteration: string;
  meaning: string;
  root: string;
  grammar: string;
}

interface VerseAnalysis {
  words: WordAnalysis[];
  grammarNotes: string[];
}

function validateAnalysis(data: unknown): data is VerseAnalysis {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.words) || data.words.length === 0) return false;
  if (!Array.isArray(data.grammarNotes)) return false;

  return data.words.every(word =>
    typeof word.arabic === 'string' &&
    typeof word.transliteration === 'string' &&
    typeof word.meaning === 'string' &&
    typeof word.root === 'string' &&
    typeof word.grammar === 'string'
  );
}
```

### Retry Logic

```typescript
async function analyzeVerseWithRetry(verse: Verse, maxRetries = 3): Promise<VerseAnalysis> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await callLLM(verse);
      const parsed = JSON.parse(response);

      if (validateAnalysis(parsed)) {
        return parsed;
      }

      console.warn(`Invalid response format, attempt ${attempt}/${maxRetries}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Error on attempt ${attempt}/${maxRetries}:`, message);
    }

    // Exponential backoff
    if (attempt < maxRetries) {
      await sleep(1000 * attempt);
    }
  }

  throw new Error(`Failed to analyze verse after ${maxRetries} attempts`);
}
```

---

## 2. Runtime Evaluation

### Prompt for Evaluation

```typescript
interface EvaluationResult {
  score: number;         // 0-100
  summary: string;       // Brief feedback
  gotCorrect: string[];  // What user got right
  missed: string[];      // What user missed
  insight: string | null; // Teaching moment
}

export async function evaluateTranslation(
  userInput: string,
  correctTranslation: string,
  arabicText: string,
  analysis: VerseAnalysis
): Promise<EvaluationResult> {

  const prompt = `
Compare the user's translation attempt to the correct translation of this Quranic verse.

Arabic verse: ${arabicText}
Correct translation: ${correctTranslation}
User's attempt: ${userInput}

Word-by-word analysis for context:
${JSON.stringify(analysis.words, null, 2)}

Your task:
1. Rate accuracy from 0-100 based on how well they captured the meaning
2. List what concepts/words they got correct
3. List what they missed or got wrong
4. Optionally provide ONE teaching insight about an Arabic root or pattern

Guidelines:
- Be encouraging but honest
- Focus on meaning, not exact wording
- Partial credit for partial understanding
- Keep lists concise (2-4 items max)

Respond ONLY with valid JSON:
{
  "score": 85,
  "summary": "Great understanding! You captured the core meaning well.",
  "gotCorrect": ["Praise to Allah", "Lord of the worlds"],
  "missed": ["The word 'due' - all praise is DUE to Allah"],
  "insight": "The root ح-م-د (h-m-d) means praise. Muhammad (محمد) comes from the same root."
}

If no insight is relevant, set insight to null.
  `;

  const response = await fetch(process.env.LLM_API_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.LLM_MODEL || 'llama2',
      prompt,
      stream: false
    })
  });

  const data = await response.json();

  // Parse and validate LLM response
  try {
    const result = JSON.parse(data.response);

    // Basic validation
    if (typeof result.score !== 'number' || typeof result.summary !== 'string') {
      throw new Error('Invalid response structure');
    }

    return {
      score: Math.min(100, Math.max(0, result.score)),  // Clamp to 0-100
      summary: result.summary,
      gotCorrect: Array.isArray(result.gotCorrect) ? result.gotCorrect : [],
      missed: Array.isArray(result.missed) ? result.missed : [],
      insight: result.insight || null
    };
  } catch (error) {
    throw new Error('Failed to parse LLM response as valid JSON');
  }
}
```

---

## Model Selection

The LLM model is configurable via `LLM_MODEL` environment variable.

| Model | Size | Arabic Quality | Speed |
|-------|------|----------------|-------|
| llama2 (7B) | 4GB | Basic | Fast |
| mistral (7B) | 4GB | Better | Fast |
| llama2:13b | 8GB | Good | Slower |
| mixtral (8x7B) | 26GB | Best | Slowest |

For Arabic/Quranic text, larger models generally produce better analysis.

---

## Error Handling

Handle LLM unavailability gracefully:

```typescript
try {
  const feedback = await evaluateWithLLM(userInput, verse);
  return feedback;
} catch (error) {
  // Fallback: basic score based on keyword matching
  return {
    score: calculateBasicScore(userInput, verse.translation),
    summary: "We couldn't generate detailed feedback. Here's a basic evaluation.",
    gotCorrect: [],
    missed: [],
    insight: null
  };
}
```

---

## Provider Switching

Support multiple LLM providers:

```typescript
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'ollama';

export async function callLLM(prompt: string) {
  if (LLM_PROVIDER === 'openai') {
    return callOpenAI(prompt);
  }
  return callOllama(prompt);
}
```
