import { OllamaProvider } from './ollama.provider.js';
import { TogetherProvider } from './together.provider.js';
import type { LLMProvider } from './types.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export type { LLMProvider, EvaluationInput, EvaluationOutput } from './types.js';

export function createLLMProvider(): LLMProvider {
  const provider = config.llmProvider;

  switch (provider) {
    case 'ollama':
      logger.info('Using Ollama LLM provider', {
        baseUrl: config.ollama.baseUrl,
        model: config.ollama.model,
      });
      return new OllamaProvider({
        baseUrl: config.ollama.baseUrl,
        model: config.ollama.model,
      });

    case 'together':
      if (!config.together.apiKey) {
        throw new Error('TOGETHER_API_KEY is required when using Together AI');
      }

      logger.info('Using Together AI LLM provider', {
        model: config.together.model,
      });
      return new TogetherProvider({
        apiKey: config.together.apiKey,
        model: config.together.model,
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
