import type { LLMProvider, EvaluationInput, EvaluationOutput } from './types.js';
import { buildEvaluationPrompt } from './prompt.js';
import { logger } from '../utils/logger.js';

interface TogetherConfig {
  apiKey: string;
  model: string;
}

interface TogetherResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
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
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a Quran comprehension tutor. Respond only with valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Together AI error: ${(errorData as { error?: { message?: string } }).error?.message || response.statusText}`
        );
      }

      const data = (await response.json()) as TogetherResponse;
      const latencyMs = Date.now() - startTime;

      // Parse the JSON response
      const content = data.choices[0].message.content;
      const evaluation = JSON.parse(content);

      logger.debug('Together AI evaluation completed', {
        verseId: input.verseId,
        score: evaluation.score,
        latencyMs,
        tokens: data.usage,
      });

      return {
        score: evaluation.score,
        feedback: {
          summary: evaluation.feedback.summary,
          correct: evaluation.feedback.correct || [],
          missed: evaluation.feedback.missed || [],
          insight: evaluation.feedback.insight || null,
        },
        metadata: {
          model: this.model,
          provider: 'together',
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          latencyMs,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Together AI evaluation failed', { error: message, verseId: input.verseId });
      throw new Error(`Together AI evaluation failed: ${message}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
