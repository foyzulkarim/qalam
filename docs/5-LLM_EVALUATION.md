# Qalam: LLM Integration & Evaluation

**Version:** 2.0  
**Purpose:** Guide for integrating LLM providers and designing the evaluation prompt

---

## Overview

Qalam uses Large Language Models to evaluate user understanding of Quranic verses. The system is designed to work with different LLM providers through a simple abstraction layer. During development, you'll use Ollama with local models. In production, you'll switch to Together AI for hosted inference.

The evaluation process is the heart of the learning experience. When a user attempts to translate a verse, the LLM compares their understanding to the correct translation, identifies what they got right and wrong, and provides a teaching moment focused on one memorable pattern or insight.

---

## Provider Abstraction Architecture

### Why We Need Abstraction

You want to develop locally using free models running on your machine through Ollama, but deploy to production using Together AI's hosted service. These providers have different APIs, authentication methods, and endpoints. The abstraction layer hides these differences behind a common interface.

### Provider Interface

Every LLM provider implements this interface:

```typescript
// server/src/llm/types.ts

export interface EvaluationInput {
  verseId: string;
  arabic: string;
  translation: string;
  userInput: string;
  skipped: boolean;
}

export interface EvaluationOutput {
  score: number;           // 0-100
  feedback: {
    summary: string;
    correct: string[];
    missed: string[];
    insight: string | null;
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
   * Evaluate a verse attempt and return structured feedback
   */
  evaluate(input: EvaluationInput): Promise<EvaluationOutput>;
  
  /**
   * Health check - returns true if provider is accessible
   */
  isAvailable(): Promise<boolean>;
}
```

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

## The Evaluation Prompt

The evaluation prompt is the most critical piece of the system. It determines the quality of feedback users receive. A good prompt produces consistent, accurate, encouraging feedback that teaches effectively.

### Prompt Design Principles

**Principle one: Be specific about scoring criteria.** Don't just say "evaluate understanding." Define exactly what constitutes a score of ninety versus seventy.

**Principle two: Encourage paraphrasing.** Users won't use the exact same words as the translation. The LLM needs to recognize synonyms and alternative phrasings as correct.

**Principle three: Prioritize core meaning over details.** Getting "Allah is merciful" matters more than getting the exact phrasing "Entirely Merciful" versus "Most Merciful."

**Principle four: Provide teachable moments.** The insight should be memorable and actionable. Teaching about a root that appears in many verses is more valuable than explaining obscure grammar.

**Principle five: Be kind but honest.** Don't inflate scores to make users feel good. Accurate feedback helps learning, but deliver it with encouragement.

### The Prompt Template

```typescript
// server/src/llm/prompt.ts

import type { EvaluationInput } from './types';

export function buildEvaluationPrompt(input: EvaluationInput): string {
  // Handle skipped verses
  if (input.skipped) {
    return buildSkippedPrompt(input);
  }
  
  return `You are evaluating a student's understanding of a Quranic verse.

VERSE INFORMATION:
Verse ID: ${input.verseId}
Arabic Text: ${input.arabic}
Correct Translation (Sahih International): ${input.translation}

STUDENT'S RESPONSE:
"${input.userInput}"

EVALUATION TASK:
Assess how well the student understood the verse meaning. Focus on:
1. Did they capture the core spiritual/theological message?
2. Did they identify the key concepts and actors?
3. Did they understand the general meaning, even if wording differs?

SCORING RUBRIC:
90-100: Captured core meaning and all key concepts accurately
75-89:  Understood main message, minor details missed
60-74:  Got the general idea but missed significant concepts
40-59:  Partial understanding with major gaps
0-39:   Minimal comprehension or major misunderstanding

IMPORTANT GUIDELINES:
- Accept paraphrasing: "God" = "Allah", "merciful" = "compassionate", etc.
- Prioritize meaning over exact wording
- Be encouraging but accurate with scoring
- If student clearly understands but uses different words, that's correct
- Focus on theological and spiritual accuracy

TEACHING MOMENT:
Provide ONE brief insight that will help future learning:
- Arabic root patterns (if relevant)
- Grammatical structure (if it unlocks meaning)
- Connection to other verses (if it reinforces understanding)
- Theological context (if it deepens comprehension)

Keep the insight brief (2-3 sentences max) and memorable.

RESPONSE FORMAT:
Respond with ONLY valid JSON in this exact structure:
{
  "score": <number 0-100>,
  "feedback": {
    "summary": "<1-2 sentence assessment>",
    "correct": ["<concept 1>", "<concept 2>", ...],
    "missed": ["<concept 1>", "<concept 2>", ...],
    "insight": "<optional teaching moment or null>"
  }
}

Example for verse 1:1 "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ":

Student says: "In God's name, the merciful and compassionate"
Response:
{
  "score": 95,
  "feedback": {
    "summary": "Excellent - you captured the core meaning accurately",
    "correct": ["invoking Allah's name", "recognizing divine mercy", "general meaning"],
    "missed": ["The specific distinction between Rahman (Entirely Merciful) and Raheem (Especially Merciful)"],
    "insight": "The root ر-ح-م (r-h-m) means mercy. Rahman emphasizes Allah's mercy to all creation, while Raheem emphasizes specific mercy to believers. This root appears throughout the Quran."
  }
}

Now evaluate the student's response.`;
}

function buildSkippedPrompt(input: EvaluationInput): string {
  return `The student clicked "I don't know" for this verse.

Verse ID: ${input.verseId}
Arabic: ${input.arabic}
Translation: ${input.translation}

Provide encouraging feedback that teaches them the verse meaning.

Respond with valid JSON:
{
  "score": 0,
  "feedback": {
    "summary": "That's okay! Let's learn this verse together.",
    "correct": [],
    "missed": ["<all key concepts>"],
    "insight": "<a helpful teaching moment about this verse>"
  }
}`;
}
```

### Prompt Iteration Strategy

Your first prompt won't be perfect. Here's how to improve it:

**Phase one: Test with known cases.** Try verses you know well with different user inputs. See if the LLM scores them appropriately.

**Phase two: Collect edge cases.** As users practice, watch for cases where the evaluation is clearly wrong (scoring "Allah" as incorrect because user wrote "God", or giving full marks for a completely wrong answer).

**Phase three: Refine the rubric.** Add specific examples to the prompt of what constitutes different score ranges. The more concrete the examples, the more consistent the evaluation.

**Phase four: Add few-shot examples.** Include two or three complete examples in the prompt showing perfect evaluation. This dramatically improves consistency.

**Phase five: Version your prompts.** When you make significant changes, save the old version so you can compare results. Store the prompt version in the attempt metadata.

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

With DiscoResearch/DiscoLM-German-7b-v1 (your chosen model) at approximately one cent per million tokens:

**Typical evaluation:**
- Prompt: ~400 tokens (verse info + rubric + user input)
- Completion: ~150 tokens (JSON response)
- Total: ~550 tokens per evaluation
- Cost: ~$0.0000055 per evaluation (half a cent per thousand evaluations)

**Monthly estimates:**
- One hundred users, five verses per day: 15,000 evaluations/month = $0.08
- One thousand users, five verses per day: 150,000 evaluations/month = $0.83
- Ten thousand users, five verses per day: 1.5M evaluations/month = $8.30

This is incredibly cheap. You can serve thousands of users for under ten dollars per month.

### Caching Strategy (Future Optimization)

If you see the exact same user input for the same verse multiple times across users, you could cache the evaluation. However, this is probably not worth implementing initially because:

**Why caching is low priority:**
- LLM costs are already negligible
- User inputs vary significantly even for the same verse
- Cache hit rate would be low (probably under five percent)
- Adds complexity to the codebase

**When to add caching:**
- If you see costs exceeding one hundred dollars per month
- If you notice many identical inputs (unlikely)
- If LLM latency becomes a UX problem (caching makes responses instant)

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

*The LLM integration is the intelligence behind Qalam's feedback system. Start with the basic prompt, test thoroughly with real verses, and iterate based on user feedback. The provider abstraction ensures you can easily switch between local development and production hosting.*
