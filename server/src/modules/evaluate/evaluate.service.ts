import { prisma } from '../../db/client.js';
import { getLLMProvider } from '../../llm/index.js';
import { withRetry } from '../../llm/retry.js';
import { getVerseById } from '../verses/verses.service.js';
import { llmUnavailable, badRequest } from '../../middleware/errorHandler.js';
import { logger } from '../../utils/logger.js';
import type { EvaluateResponse, Feedback } from '@qalam/shared';

interface EvaluateInput {
  userId: number;
  verseId: string;
  userInput: string;
  skipped: boolean;
}

export async function evaluateVerse(input: EvaluateInput): Promise<EvaluateResponse> {
  // Parse verse ID
  const [surahIdStr, verseNumStr] = input.verseId.split(':');
  const surahId = parseInt(surahIdStr, 10);
  const verseNumber = parseInt(verseNumStr, 10);

  if (isNaN(surahId) || isNaN(verseNumber)) {
    badRequest('Invalid verse ID format');
  }

  // Load verse from JSON
  const verse = await getVerseById(input.verseId);

  // Get LLM provider
  const llm = getLLMProvider();

  try {
    // Call LLM with retry logic
    const evaluation = await withRetry(() =>
      llm.evaluate({
        verseId: input.verseId,
        arabic: verse.arabic,
        translation: verse.translation,
        userInput: input.userInput,
        skipped: input.skipped,
      })
    );

    // Store attempt in database
    const attempt = await prisma.attempt.create({
      data: {
        userId: input.userId,
        verseId: input.verseId,
        surahId,
        verseNumber,
        arabicText: verse.arabic,
        correctTranslation: verse.translation,
        userInput: input.userInput,
        skipped: input.skipped,
        score: evaluation.score,
        feedbackSummary: evaluation.feedback.summary,
        feedbackCorrect: JSON.stringify(evaluation.feedback.correct),
        feedbackMissed: JSON.stringify(evaluation.feedback.missed),
        feedbackInsight: evaluation.feedback.insight,
        llmModel: evaluation.metadata.model,
        llmProvider: evaluation.metadata.provider,
        llmPromptTokens: evaluation.metadata.promptTokens ?? null,
        llmCompletionTokens: evaluation.metadata.completionTokens ?? null,
        llmLatencyMs: evaluation.metadata.latencyMs,
      },
    });

    logger.info('Verse evaluation completed', {
      userId: input.userId,
      verseId: input.verseId,
      score: evaluation.score,
      latencyMs: evaluation.metadata.latencyMs,
    });

    return {
      attemptId: attempt.id.toString(),
      verseId: input.verseId,
      score: evaluation.score,
      feedback: evaluation.feedback as Feedback,
      verse: {
        arabic: verse.arabic,
        translation: verse.translation,
      },
      createdAt: attempt.createdAt.toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('LLM evaluation failed', { error: message, verseId: input.verseId });
    llmUnavailable('Unable to evaluate verse at this time. Please try again.');
  }
}
