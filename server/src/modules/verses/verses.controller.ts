import { Request, Response, NextFunction } from 'express';
import * as versesService from './verses.service.js';
import { validatePositiveInt } from '../../middleware/validation.js';
import type { SurahsListResponse, SurahResponse, VerseResponse } from '@qalam/shared';

export async function getAllSurahs(
  _req: Request,
  res: Response<SurahsListResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const surahs = await versesService.getAllSurahs();
    res.json({ surahs });
  } catch (error) {
    next(error);
  }
}

export async function getSurah(
  req: Request<{ id: string }>,
  res: Response<SurahResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const surahId = validatePositiveInt(req.params.id, 'Surah ID');
    const surah = await versesService.getSurah(surahId);
    res.json({ surah });
  } catch (error) {
    next(error);
  }
}

export async function getVerse(
  req: Request<{ surahId: string; verseNumber: string }>,
  res: Response<VerseResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const surahId = validatePositiveInt(req.params.surahId, 'Surah ID');
    const verseNumber = validatePositiveInt(req.params.verseNumber, 'Verse number');
    const verse = await versesService.getVerse(surahId, verseNumber);
    res.json({ verse });
  } catch (error) {
    next(error);
  }
}
