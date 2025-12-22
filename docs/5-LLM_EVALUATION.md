# Qalam: LLM Integration & Evaluation

**Version:** 2.0  
**Purpose:** Guide for integrating LLM providers and designing the evaluation prompt

---

## Overview

Qalam uses a **two-tier approach** to provide rich educational feedback:

1. **Pre-computed Analysis** - Lexical and morphological breakdown computed once per verse and stored in `data/analysis/`. See `6-VERSE_ANALYSIS_PIPELINE.md` for details.

2. **Runtime Comparison** - Simple LLM call to compare user input against correct translation. This is what this document covers.

The LLM's role at runtime is **comparison only**, not analysis. When a user attempts a verse:
- The LLM compares their input to the correct translation
- It returns a score and brief feedback (correct/missed concepts)
- The rich word-by-word breakdown comes from pre-computed data

This approach dramatically reduces latency (0.5-1s vs 2-4s) and cost (~4x cheaper).

The system works with different LLM providers through a simple abstraction layer. During development, you'll use Ollama with local models. In production, you'll switch to Together AI for hosted inference.

---

## Provider Abstraction Architecture

### Why We Need Abstraction

You want to develop locally using free models running on your machine through Ollama, but deploy to production using Together AI's hosted service. These providers have different APIs, authentication methods, and endpoints. The abstraction layer hides these differences behind a common interface.

### Provider Interface

Every LLM provider implements this interface:

```typescript
// server/src/llm/types.ts

export interface ComparisonInput {
  verseId: string;
  translation: string;     // Correct translation to compare against
  userInput: string;       // User's attempt
  skipped: boolean;
}

export interface ComparisonOutput {
  score: number;           // 0-100
  feedback: {
    summary: string;       // 1-2 sentence assessment
    correct: string[];     // Concepts user got right
    missed: string[];      // Concepts user missed
  };
  metadata: {
    model: string;
    provider: string;
    promptTokens?: number;
    completionTokens?: number;
    latencyMs: number;
  };
}

export interface LLMProvider {
  /**
   * Compare user input to correct translation and return feedback
   * Note: This is comparison only, not full analysis
   */
  compare(input: ComparisonInput): Promise<ComparisonOutput>;

  /**
   * Health check - returns true if provider is accessible
   */
  isAvailable(): Promise<boolean>;
}
```

**Note:** The `insight` field from the original design is now provided by pre-computed analysis data, not generated at runtime.

### Provider Factory

```typescript
// server/src/llm/index.ts

import { OllamaProvider } from './ollama.provider';
import { TogetherProvider } from './together.provider';
import type { LLMProvider } from './types';

export function createLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER || 'ollama';
  
  switch (provider) {
    case 'ollama':
      return new OllamaProvider({
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'llama3.2'
      });
    
    case 'together':
      if (!process.env.TOGETHER_API_KEY) {
        throw new Error('TOGETHER_API_KEY is required when using Together AI');
      }
      
      return new TogetherProvider({
        apiKey: process.env.TOGETHER_API_KEY,
        model: process.env.TOGETHER_MODEL || 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo'
      });
    
    default:
      throw new Error(`Unknown LLM provider: ${provider}`);
  }
}

// Singleton instance
let providerInstance: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (!providerInstance) {
    providerInstance = createLLMProvider();
  }
  return providerInstance;
}
```

---

## Ollama Provider (Local Development)

### Installation and Setup

Before implementing the provider, ensure Ollama is installed and running:

```bash
# Install Ollama (macOS/Linux)
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model (Llama 3.2 recommended)
ollama pull llama3.2

# Verify it's running
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Why is the sky blue?"
}'
```

### Implementation

```typescript
// server/src/llm/ollama.provider.ts

import type { LLMProvider, EvaluationInput, EvaluationOutput } from './types';
import { buildEvaluationPrompt } from './prompt';

interface OllamaConfig {
  baseUrl: string;
  model: string;
}

export class OllamaProvider implements LLMProvider {
  private baseUrl: string;
  private model: string;

  constructor(config: OllamaConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.model = config.model;
  }

  async evaluate(input: EvaluationInput): Promise<EvaluationOutput> {
    const startTime = Date.now();
    
    try {
      const prompt = buildEvaluationPrompt(input);
      
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.3,  // Lower temperature for more consistent evaluation
            num_predict: 500,  // Limit response length
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;
      
      // Parse the JSON response from Ollama
      const evaluation = JSON.parse(data.response);
      
      return {
        score: evaluation.score,
        feedback: {
          summary: evaluation.feedback.summary,
          correct: evaluation.feedback.correct,
          missed: evaluation.feedback.missed,
          insight: evaluation.feedback.insight || null,
        },
        metadata: {
          model: this.model,
          provider: 'ollama',
          latencyMs,
        }
      };
      
    } catch (error) {
      throw new Error(`Ollama evaluation failed: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

---

## Together AI Provider (Production)

### Setup

Sign up at together.ai and get an API key. Set it in your production environment:

```bash
TOGETHER_API_KEY=your_api_key_here
TOGETHER_MODEL=meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo
```

### Implementation

```typescript
// server/src/llm/together.provider.ts

import type { LLMProvider, EvaluationInput, EvaluationOutput } from './types';
import { buildEvaluationPrompt } from './prompt';

interface TogetherConfig {
  apiKey: string;
  model: string;
}

export class TogetherProvider implements LLMProvider {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.together.xyz/v1';

  constructor(config: TogetherConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  async evaluate(input: EvaluationInput): Promise<EvaluationOutput> {
    const startTime = Date.now();
    
    try {
      const prompt = buildEvaluationPrompt(input);
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a Quran comprehension tutor. Respond only with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Together AI error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const latencyMs = Date.now() - startTime;
      
      // Parse the JSON response
      const content = data.choices[0].message.content;
      const evaluation = JSON.parse(content);
      
      return {
        score: evaluation.score,
        feedback: {
          summary: evaluation.feedback.summary,
          correct: evaluation.feedback.correct,
          missed: evaluation.feedback.missed,
          insight: evaluation.feedback.insight || null,
        },
        metadata: {
          model: this.model,
          provider: 'together',
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          latencyMs,
        }
      };
      
    } catch (error) {
      throw new Error(`Together AI evaluation failed: ${error.message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

---

## The Comparison Prompt

Since rich lexical analysis is pre-computed (see `6-VERSE_ANALYSIS_PIPELINE.md`), the runtime prompt is now much simpler. It only needs to compare the user's input to the correct translation and identify what they got right or missed.

### Prompt Design Principles

**Principle one: Be specific about scoring criteria.** Define exactly what constitutes a score of ninety versus seventy.

**Principle two: Encourage paraphrasing.** Users won't use the exact same words as the translation. The LLM needs to recognize synonyms and alternative phrasings as correct.

**Principle three: Prioritize core meaning over details.** Getting "Allah is merciful" matters more than getting the exact phrasing "Entirely Merciful" versus "Most Merciful."

**Principle four: Be kind but honest.** Don't inflate scores to make users feel good. Accurate feedback helps learning, but deliver it with encouragement.

**Note:** Teaching moments (root patterns, grammar insights) are now provided by pre-computed analysis, not generated at runtime.

### The Comparison Prompt Template

```typescript
// server/src/llm/prompt.ts

import type { ComparisonInput } from './types';

export function buildComparisonPrompt(input: ComparisonInput): string {
  if (input.skipped) {
    return buildSkippedPrompt(input);
  }

  return `Compare these translations and assess understanding.

CORRECT TRANSLATION:
"${input.translation}"

USER'S RESPONSE:
"${input.userInput}"

SCORING RUBRIC:
90-100: Captured core meaning and all key concepts
75-89:  Understood main message, minor details missed
60-74:  Got the general idea but missed significant concepts
40-59:  Partial understanding with major gaps
0-39:   Minimal comprehension or major misunderstanding

GUIDELINES:
- Accept paraphrasing: "God" = "Allah", "merciful" = "compassionate"
- Prioritize meaning over exact wording
- Be encouraging but accurate

Respond with ONLY valid JSON:
{
  "score": <0-100>,
  "feedback": {
    "summary": "<1-2 sentence assessment>",
    "correct": ["<concept 1>", ...],
    "missed": ["<concept 1>", ...]
  }
}`;
}

function buildSkippedPrompt(input: ComparisonInput): string {
  return `The user skipped this verse.

CORRECT TRANSLATION: "${input.translation}"

Respond with JSON:
{
  "score": 0,
  "feedback": {
    "summary": "No problem! Review the translation and try again.",
    "correct": [],
    "missed": ["<key concepts from the translation>"]
  }
}`;
}
```

### Prompt Comparison: Before vs After

| Aspect | Old Prompt | New Prompt |
|--------|-----------|------------|
| **Purpose** | Full analysis + comparison | Comparison only |
| **Input** | Arabic + translation + user input | Translation + user input |
| **Output** | Score + feedback + insight | Score + feedback |
| **Tokens** | ~400 input + ~150 output | ~100 input + ~80 output |
| **Latency** | 1-3 seconds | 0.5-1 second |

### Prompt Iteration Strategy

**Phase one: Test with known cases.** Try verses with different user inputs. See if the LLM scores them appropriately.

**Phase two: Collect edge cases.** Watch for cases where the evaluation is clearly wrong (scoring "Allah" as incorrect because user wrote "God").

**Phase three: Refine the rubric.** Add specific examples of what constitutes different score ranges.

**Phase four: Version your prompts.** Store the prompt version in the attempt metadata for tracking.

---

## Error Handling and Retries

LLM calls can fail for many reasons: network issues, rate limits, timeouts, malformed responses. Your error handling strategy determines user experience during these failures.

### Retry Logic

```typescript
// server/src/llm/retry.ts

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on validation errors (4xx)
      if (error.message.includes('400') || error.message.includes('404')) {
        throw error;
      }
      
      // If not last attempt, wait and retry
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        continue;
      }
    }
  }
  
  throw lastError;
}
```

### Usage in Evaluation Service

```typescript
// server/src/modules/evaluate/evaluate.service.ts

import { getLLMProvider } from '../../llm';
import { withRetry } from '../../llm/retry';

export async function evaluateAttempt(input: EvaluateRequest): Promise<EvaluateResponse> {
  const llm = getLLMProvider();
  
  // Load verse from JSON
  const verse = await getVerse(input.verseId);
  if (!verse) {
    throw new Error('Verse not found');
  }
  
  try {
    // Call LLM with retry logic
    const evaluation = await withRetry(() => 
      llm.evaluate({
        verseId: input.verseId,
        arabic: verse.arabic,
        translation: verse.translation,
        userInput: input.userInput,
        skipped: input.skipped
      })
    );
    
    // Store attempt in database
    const attempt = await storeAttempt({
      userId: input.userId,
      verseId: input.verseId,
      arabic: verse.arabic,
      translation: verse.translation,
      userInput: input.userInput,
      skipped: input.skipped,
      score: evaluation.score,
      feedback: evaluation.feedback,
      llmMetadata: evaluation.metadata
    });
    
    return {
      attemptId: attempt.id,
      verseId: input.verseId,
      score: evaluation.score,
      feedback: evaluation.feedback,
      verse: {
        arabic: verse.arabic,
        translation: verse.translation
      },
      createdAt: attempt.createdAt
    };
    
  } catch (error) {
    // Log the error for debugging
    console.error('LLM evaluation failed:', error);
    
    // Return a 503 error to the client
    throw new ServiceUnavailableError('Unable to evaluate verse at this time. Please try again.');
  }
}
```

---

## Cost and Performance Optimization

### Together AI Pricing

With the simplified comparison prompt, costs are significantly lower than full analysis:

**Typical comparison:**
- Prompt: ~100 tokens (translation + user input + rubric)
- Completion: ~80 tokens (JSON response)
- Total: ~180 tokens per comparison
- Cost: ~$0.0000018 per comparison

**Comparison to full analysis approach:**

| Approach | Tokens/Request | Cost/Request | Latency |
|----------|---------------|--------------|---------|
| Full Analysis (old) | ~550 | ~$0.0000055 | 1-3s |
| Comparison Only (new) | ~180 | ~$0.0000018 | 0.5-1s |
| **Savings** | 67% fewer | 67% cheaper | 50-75% faster |

**Monthly estimates (with comparison-only approach):**
- One hundred users, five verses per day: 15,000 comparisons/month = $0.03
- One thousand users, five verses per day: 150,000 comparisons/month = $0.27
- Ten thousand users, five verses per day: 1.5M comparisons/month = $2.70

**Plus one-time pre-computation cost:**
- All 6,236 verses analyzed once: ~$6-14 (Together AI) or ~$234 (Claude)

### Why This Approach is Better

1. **Faster feedback** - Users don't wait 2-4 seconds for full analysis
2. **Consistent analysis** - Same verse = same word breakdown every time
3. **Richer content** - Pre-computed analysis can be more detailed than real-time generation
4. **Cheaper at scale** - 67% cost reduction per user request

---

## Testing the LLM Integration

### Unit Tests

Test your providers with mocked responses:

```typescript
// server/src/llm/__tests__/ollama.provider.test.ts

import { OllamaProvider } from '../ollama.provider';

describe('OllamaProvider', () => {
  it('should parse valid JSON response', async () => {
    const provider = new OllamaProvider({
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2'
    });
    
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        response: JSON.stringify({
          score: 85,
          feedback: {
            summary: 'Good understanding',
            correct: ['key concept'],
            missed: ['minor detail'],
            insight: 'Teaching moment'
          }
        })
      })
    });
    
    const result = await provider.evaluate({
      verseId: '1:1',
      arabic: 'test',
      translation: 'test',
      userInput: 'test',
      skipped: false
    });
    
    expect(result.score).toBe(85);
    expect(result.feedback.summary).toBe('Good understanding');
  });
});
```

### Integration Tests

Test with real LLM (during development only):

```typescript
// server/src/llm/__tests__/integration.test.ts

describe('LLM Integration', () => {
  it('should evaluate verse correctly', async () => {
    const provider = createLLMProvider();
    
    const result = await provider.evaluate({
      verseId: '1:1',
      arabic: 'بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ',
      translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
      userInput: 'In the name of God, the merciful and compassionate',
      skipped: false
    });
    
    expect(result.score).toBeGreaterThan(70); // Should recognize this as correct
    expect(result.feedback.correct.length).toBeGreaterThan(0);
  });
});
```

---

## Monitoring and Debugging

### What to Log

Log every LLM call with:
- Verse ID
- User input
- Score received
- Latency
- Token usage
- Any errors

This data helps you:
- Debug evaluation quality issues
- Track costs
- Optimize prompts
- Identify failure patterns

### Log Format

```typescript
logger.info('LLM evaluation', {
  userId: attempt.userId,
  verseId: attempt.verseId,
  provider: metadata.provider,
  model: metadata.model,
  score: result.score,
  latencyMs: metadata.latencyMs,
  tokens: {
    prompt: metadata.promptTokens,
    completion: metadata.completionTokens
  }
});
```

---

## Fallback Behavior

When pre-computed analysis is not available for a verse (e.g., during phased rollout):

1. **Runtime comparison still works** - The LLM comparison is independent of pre-computed data
2. **Response omits analysis field** - The `analysis` field in the response will be undefined
3. **User still gets feedback** - Score, summary, correct/missed concepts are all returned
4. **Graceful degradation** - UI should handle missing analysis gracefully

This allows incremental rollout of pre-computed analysis without blocking the core learning experience.

---

## Related Documentation

- **Pre-computed Analysis**: See `6-VERSE_ANALYSIS_PIPELINE.md` for how lexical/morphological analysis is generated and stored
- **API Contract**: See `4-API_SPECIFICATION.md` for the `POST /api/evaluate` response format
- **Type Definitions**: See `2-SHARED_TYPES.md` for `ComparisonOutput` and `VerseAnalysisResponse` types

---

*The LLM integration provides personalized feedback on user attempts. With the two-tier approach, the LLM handles comparison while pre-computed data provides rich educational content. The provider abstraction ensures you can easily switch between local development and production hosting.*
