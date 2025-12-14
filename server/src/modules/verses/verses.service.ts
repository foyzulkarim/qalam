import fs from 'fs/promises';
import path from 'path';
import { config } from '../../config/index.js';
import { notFound } from '../../middleware/errorHandler.js';
import type { Surah, SurahMeta, Verse } from '@qalam/shared';

// Cache for loaded surah data
const surahCache = new Map<number, Surah>();
let surahIndexCache: SurahMeta[] | null = null;

async function loadSurahIndex(): Promise<SurahMeta[]> {
  if (surahIndexCache) {
    return surahIndexCache;
  }

  const indexPath = path.join(config.dataPath, 'surahs', 'index.json');
  const content = await fs.readFile(indexPath, 'utf-8');
  surahIndexCache = JSON.parse(content) as SurahMeta[];
  return surahIndexCache;
}

async function loadSurah(surahId: number): Promise<Surah> {
  if (surahCache.has(surahId)) {
    return surahCache.get(surahId)!;
  }

  const fileName = surahId.toString().padStart(3, '0') + '.json';
  const filePath = path.join(config.dataPath, 'surahs', fileName);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const surah = JSON.parse(content) as Surah;
    surahCache.set(surahId, surah);
    return surah;
  } catch {
    notFound(`Surah ${surahId} not found`);
  }
}

export async function getAllSurahs(): Promise<SurahMeta[]> {
  return loadSurahIndex();
}

export async function getSurah(surahId: number): Promise<Surah> {
  const index = await loadSurahIndex();
  const meta = index.find(s => s.id === surahId);

  if (!meta) {
    notFound(`Surah ${surahId} not found`);
  }

  return loadSurah(surahId);
}

export async function getVerse(surahId: number, verseNumber: number): Promise<Verse> {
  const surah = await getSurah(surahId);
  const verse = surah.verses.find(v => v.number === verseNumber);

  if (!verse) {
    notFound(`Verse ${surahId}:${verseNumber} not found`);
  }

  return verse;
}

export async function getVerseById(verseId: string): Promise<Verse & { surahName: string }> {
  const [surahIdStr, verseNumStr] = verseId.split(':');
  const surahId = parseInt(surahIdStr, 10);
  const verseNumber = parseInt(verseNumStr, 10);

  const surah = await getSurah(surahId);
  const verse = surah.verses.find(v => v.number === verseNumber);

  if (!verse) {
    notFound(`Verse ${verseId} not found`);
  }

  return {
    ...verse,
    surahName: surah.name.transliteration,
  };
}

// Clear cache (useful for development/testing)
export function clearCache(): void {
  surahCache.clear();
  surahIndexCache = null;
}
