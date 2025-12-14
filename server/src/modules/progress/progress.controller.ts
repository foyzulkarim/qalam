import { Request, Response, NextFunction } from 'express';
import * as progressService from './progress.service.js';
import { validatePositiveInt, validateVerseId } from '../../middleware/validation.js';
import type {
  ProgressResponse,
  HistoryResponse,
  VerseHistoryResponse,
  SurahProgressResponse,
  NextVerseResponse,
} from '@qalam/shared';

export async function getProgress(
  req: Request,
  res: Response<ProgressResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const stats = await progressService.getProgressStats(req.user!.id);
    res.json({ stats });
  } catch (error) {
    next(error);
  }
}

export async function getHistory(
  req: Request,
  res: Response<HistoryResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const limit = req.query.limit ? validatePositiveInt(req.query.limit, 'limit') : 20;
    const attempts = await progressService.getHistory(req.user!.id, limit);
    res.json({ attempts });
  } catch (error) {
    next(error);
  }
}

export async function getVerseHistory(
  req: Request<{ verseId: string }>,
  res: Response<VerseHistoryResponse>,
  next: NextFunction
): Promise<void> {
  try {
    // URL decode the verse ID (e.g., "1%3A2" -> "1:2")
    const verseId = validateVerseId(decodeURIComponent(req.params.verseId));
    const { attempts, stats } = await progressService.getVerseHistory(req.user!.id, verseId);
    res.json({ verseId, attempts, stats });
  } catch (error) {
    next(error);
  }
}

export async function getSurahProgress(
  req: Request<{ surahId: string }>,
  res: Response<SurahProgressResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const surahId = validatePositiveInt(req.params.surahId, 'Surah ID');
    const progress = await progressService.getSurahProgress(req.user!.id, surahId);
    res.json(progress);
  } catch (error) {
    next(error);
  }
}

export async function getNextVerse(
  req: Request,
  res: Response<NextVerseResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const verse = await progressService.getNextVerse(req.user!.id);
    res.json({ verse });
  } catch (error) {
    next(error);
  }
}
