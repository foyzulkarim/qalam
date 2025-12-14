import { prisma } from '../../db/client.js';
import { getAllSurahs, getSurah, getVerse } from '../verses/verses.service.js';
import { notFound } from '../../middleware/errorHandler.js';
import type {
  ProgressStats,
  AttemptSummary,
  VerseStats,
  Attempt,
  Feedback,
  VerseProgressSummary,
  Verse,
} from '@qalam/shared';

export async function getProgressStats(userId: number): Promise<ProgressStats> {
  const [totalAttempts, uniqueVersesResult, avgScoreResult, lastAttempt, daysActiveResult] =
    await Promise.all([
      prisma.attempt.count({ where: { userId } }),
      prisma.attempt.groupBy({
        by: ['verseId'],
        where: { userId },
      }),
      prisma.attempt.aggregate({
        where: { userId },
        _avg: { score: true },
      }),
      prisma.attempt.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      // Count distinct days
      prisma.$queryRaw<Array<{ days: bigint }>>`
        SELECT COUNT(DISTINCT date(createdAt)) as days
        FROM attempts
        WHERE userId = ${userId}
      `,
    ]);

  return {
    totalAttempts,
    uniqueVerses: uniqueVersesResult.length,
    averageScore: Math.round(avgScoreResult._avg.score ?? 0),
    lastAttemptAt: lastAttempt?.createdAt.toISOString() ?? null,
    daysActive: Number(daysActiveResult[0]?.days ?? 0),
  };
}

export async function getHistory(userId: number, limit = 20): Promise<AttemptSummary[]> {
  const attempts = await prisma.attempt.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      verseId: true,
      score: true,
      createdAt: true,
    },
  });

  return attempts.map((a) => ({
    id: a.id.toString(),
    verseId: a.verseId,
    score: a.score,
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function getVerseHistory(
  userId: number,
  verseId: string
): Promise<{ attempts: Attempt[]; stats: VerseStats }> {
  const attempts = await prisma.attempt.findMany({
    where: { userId, verseId },
    orderBy: { createdAt: 'asc' },
  });

  if (attempts.length === 0) {
    notFound(`No attempts found for verse ${verseId}`);
  }

  const parsedAttempts: Attempt[] = attempts.map((a) => ({
    id: a.id.toString(),
    verseId: a.verseId,
    userInput: a.userInput,
    skipped: a.skipped,
    score: a.score,
    feedback: {
      summary: a.feedbackSummary,
      correct: JSON.parse(a.feedbackCorrect) as string[],
      missed: JSON.parse(a.feedbackMissed) as string[],
      insight: a.feedbackInsight,
    } as Feedback,
    createdAt: a.createdAt.toISOString(),
  }));

  const scores = attempts.map((a) => a.score);
  const stats: VerseStats = {
    totalAttempts: attempts.length,
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    firstAttemptAt: attempts[0].createdAt.toISOString(),
    lastAttemptAt: attempts[attempts.length - 1].createdAt.toISOString(),
  };

  return { attempts: parsedAttempts, stats };
}

export async function getSurahProgress(
  userId: number,
  surahId: number
): Promise<{
  surahId: number;
  totalVerses: number;
  versesAttempted: number;
  completionPercentage: number;
  averageScore: number;
  attempts: VerseProgressSummary[];
}> {
  // Get surah to check it exists and get verse count
  const surah = await getSurah(surahId);

  // Get all attempts for this surah
  const attempts = await prisma.attempt.findMany({
    where: { userId, surahId },
    orderBy: { createdAt: 'desc' },
  });

  // Group by verseId to get latest attempt for each verse
  const latestByVerse = new Map<
    string,
    { verseId: string; attemptCount: number; lastScore: number; lastAttemptAt: string }
  >();

  for (const attempt of attempts) {
    const existing = latestByVerse.get(attempt.verseId);
    if (!existing) {
      latestByVerse.set(attempt.verseId, {
        verseId: attempt.verseId,
        attemptCount: 1,
        lastScore: attempt.score,
        lastAttemptAt: attempt.createdAt.toISOString(),
      });
    } else {
      existing.attemptCount++;
    }
  }

  const versesAttempted = latestByVerse.size;
  const allScores = attempts.map((a) => a.score);
  const averageScore =
    allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

  return {
    surahId,
    totalVerses: surah.verseCount,
    versesAttempted,
    completionPercentage: Math.round((versesAttempted / surah.verseCount) * 100),
    averageScore,
    attempts: Array.from(latestByVerse.values()),
  };
}

export async function getNextVerse(userId: number): Promise<Verse> {
  // Get all surahs
  const surahs = await getAllSurahs();

  // Get all attempted verse IDs for this user
  const attemptedVerses = await prisma.attempt.findMany({
    where: { userId },
    select: { verseId: true },
    distinct: ['verseId'],
  });

  const attemptedSet = new Set(attemptedVerses.map((a) => a.verseId));

  // Find first unattempted verse
  for (const surahMeta of surahs) {
    const surah = await getSurah(surahMeta.id);
    for (const verse of surah.verses) {
      if (!attemptedSet.has(verse.id)) {
        return verse;
      }
    }
  }

  // All verses attempted - return first verse of first surah
  const firstSurah = await getSurah(1);
  return firstSurah.verses[0];
}
