/**
 * Assessment Handler
 * Fetches verse data, checks cache, calls LLM, and returns feedback
 */

import type {
  Env,
  AssessmentRequest,
  VerseAnalysis,
  AttemptFeedback,
  ApiResponse,
} from '../types';
import { buildAssessmentPrompt } from '../lib/prompts';
import { callLLM } from '../lib/llm';
import { getCachedAssessment, cacheAssessment } from '../lib/cache';

/**
 * Fetch verse analysis from R2 bucket
 */
async function getVerseAnalysis(
  verseId: string,
  env: Env
): Promise<VerseAnalysis | null> {
  const fileName = verseId.replace(':', '-');
  const key = `analysis/${fileName}.json`;

  try {
    const object = await env.DATA_BUCKET.get(key);
    if (!object) return null;
    return (await object.json()) as VerseAnalysis;
  } catch {
    return null;
  }
}

// Cache for quran.json to avoid repeated R2 fetches
let quranDataCache: {
  surahs: Array<{
    id: number;
    verses: Array<{
      number: number;
      translations: { 'en.sahih': string };
    }>;
  }>;
} | null = null;

/**
 * Fetch reference translation from R2 bucket
 */
async function getReferenceTranslation(
  verseId: string,
  env: Env
): Promise<string | null> {
  const [surahId, verseNum] = verseId.split(':').map(Number);

  try {
    // Use cached data if available
    if (!quranDataCache) {
      const object = await env.DATA_BUCKET.get('quran.json');
      if (!object) return null;
      quranDataCache = await object.json();
    }

    const surah = quranDataCache?.surahs.find((s) => s.id === surahId);
    if (!surah) return null;

    const verse = surah.verses.find((v) => v.number === verseNum);
    if (!verse) return null;

    return verse.translations['en.sahih'] || null;
  } catch {
    return null;
  }
}

/**
 * Convert LLM result to AttemptFeedback format
 */
function toAttemptFeedback(
  score: number,
  feedback: string,
  correctElements: string[],
  missedElements: string[]
): AttemptFeedback {
  const normalizedScore = score / 100;

  let encouragement: string;
  if (normalizedScore >= 0.9) {
    encouragement =
      'Excellent work! Your translation beautifully captures the meaning of this verse.';
  } else if (normalizedScore >= 0.7) {
    encouragement =
      'Great effort! You understood the verse well. Keep practicing to refine your skills.';
  } else if (normalizedScore >= 0.5) {
    encouragement =
      'Good start! Review the word meanings and try again to improve your understanding.';
  } else {
    encouragement =
      'Keep learning! Use the word analysis to understand each part of the verse.';
  }

  return {
    overallScore: normalizedScore,
    correctElements,
    missedElements,
    suggestions: [feedback],
    encouragement,
  };
}

/**
 * Main assessment handler
 */
export async function handleAssessment(
  request: Request,
  env: Env
): Promise<Response> {
  // Parse request
  let body: AssessmentRequest;
  try {
    body = (await request.json()) as AssessmentRequest;
  } catch {
    return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const { verseId, userTranslation } = body;

  // Validate input
  if (!verseId || !userTranslation?.trim()) {
    return jsonResponse(
      { success: false, error: 'Missing verseId or userTranslation' },
      400
    );
  }

  const trimmedTranslation = userTranslation.trim();

  // Fetch verse data first (needed for both cached and non-cached responses)
  const [analysis, referenceTranslation] = await Promise.all([
    getVerseAnalysis(verseId, env),
    getReferenceTranslation(verseId, env),
  ]);

  if (!analysis) {
    return jsonResponse(
      { success: false, error: 'Verse analysis not available' },
      404
    );
  }

  if (!referenceTranslation) {
    return jsonResponse(
      { success: false, error: 'Reference translation not available' },
      404
    );
  }

  // Check cache
  const cached = await getCachedAssessment(env, verseId, trimmedTranslation);
  if (cached) {
    return jsonResponse({
      success: true,
      data: { feedback: cached, referenceTranslation },
      cached: true,
    });
  }

  // Build prompt
  const wordMeanings = analysis.words
    .map((w) => `${w.arabic} = "${w.meaning}"`)
    .join(', ');

  const prompt = buildAssessmentPrompt(
    analysis.verse.arabic,
    referenceTranslation,
    wordMeanings,
    trimmedTranslation
  );

  console.log('Assessment prompt built for verse', { verseId, prompt });

  // Call LLM
  try {
    const result = await callLLM(prompt, env);
    const feedback = toAttemptFeedback(
      result.score,
      result.feedback,
      result.correctElements,
      result.missedElements
    );

    console.log('LLM assessment completed for verse', { verseId, feedback });

    // Cache the result (async, don't await)
    cacheAssessment(env, verseId, trimmedTranslation, feedback);

    return jsonResponse({
      success: true,
      data: { feedback, referenceTranslation },
      cached: false,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'LLM request failed';
    return jsonResponse({ success: false, error: message }, 500);
  }
}

/**
 * Helper to create JSON response
 */
function jsonResponse(data: ApiResponse, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
