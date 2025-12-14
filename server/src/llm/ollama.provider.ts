import type { LLMProvider, EvaluationInput, EvaluationOutput } from './types.js';
import { buildEvaluationPrompt } from './prompt.js';
import { logger } from '../utils/logger.js';

interface OllamaConfig {
  baseUrl: string;
  model: string;
}

interface OllamaResponse {
  response: string;
  done: boolean;
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
            temperature: 0.3, // Lower temperature for more consistent evaluation
            num_predict: 500, // Limit response length
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as OllamaResponse;
      const latencyMs = Date.now() - startTime;

      // Parse the JSON response from Ollama
      const evaluation = JSON.parse(data.response);

      logger.debug('Ollama evaluation completed', {
        verseId: input.verseId,
        score: evaluation.score,
        latencyMs,
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
          provider: 'ollama',
          latencyMs,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Ollama evaluation failed', { error: message, verseId: input.verseId });
      throw new Error(`Ollama evaluation failed: ${message}`);
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
