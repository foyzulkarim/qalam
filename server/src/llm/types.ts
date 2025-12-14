export interface EvaluationInput {
  verseId: string;
  arabic: string;
  translation: string;
  userInput: string;
  skipped: boolean;
}

export interface EvaluationOutput {
  score: number; // 0-100
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
