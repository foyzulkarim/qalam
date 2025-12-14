/**
 * Represents a single verse from the Quran
 */
export interface Verse {
  /** Unique identifier in format "surahId:verseNumber" (e.g., "1:1", "2:255") */
  id: string;

  /** Verse number within the surah (1-indexed) */
  number: number;

  /** Arabic text with tashkeel (diacritical marks) */
  arabic: string;

  /** English translation (Sahih International) */
  translation: string;
}

/**
 * Metadata about a surah (for list views, without full verses)
 */
export interface SurahMeta {
  /** Surah number (1-114) */
  id: number;

  /** Surah names in different formats */
  name: {
    /** Arabic name (e.g., "الفاتحة") */
    arabic: string;

    /** Transliteration (e.g., "Al-Fatihah") */
    transliteration: string;

    /** English meaning (e.g., "The Opening") */
    english: string;
  };

  /** Where the surah was revealed */
  revelation: 'meccan' | 'medinan';

  /** Total number of verses in this surah */
  verseCount: number;
}

/**
 * Complete surah with all verses
 */
export interface Surah extends SurahMeta {
  /** All verses in this surah */
  verses: Verse[];
}
