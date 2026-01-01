/**
 * Shared utilities for manifest generation
 * Used by both seed-analysis.ts and upload-to-r2.ts
 */

/** Pattern to match analysis files: "1-1.json", "114-6.json" */
export const ANALYSIS_FILE_PATTERN = /^\d+-\d+\.json$/

/** Pattern to match R2 analysis paths: "analysis/1-1.json" */
export const R2_ANALYSIS_PATH_PATTERN = /^analysis\/\d+-\d+\.json$/

/** Manifest structure - same for manifest.json and uploaded.json */
export interface ManifestData {
  verses: string[]
  generatedAt: string
}

/**
 * Sort analysis filenames numerically by surah then verse
 * @param files - Array of filenames like ["1-1.json", "2-10.json"] or ["analysis/1-1.json"]
 */
export function sortAnalysisFiles(files: string[]): string[] {
  return [...files].sort((a, b) => {
    const [surahA, verseA] = a.replace('.json', '').replace('analysis/', '').split('-').map(Number)
    const [surahB, verseB] = b.replace('.json', '').replace('analysis/', '').split('-').map(Number)
    return surahA - surahB || verseA - verseB
  })
}

/**
 * Convert filename to verse ID
 * "1-1.json" → "1:1"
 * "analysis/1-1.json" → "1:1"
 */
export function fileToVerseId(filename: string): string {
  return filename
    .replace('analysis/', '')
    .replace('.json', '')
    .replace('-', ':')
}

/**
 * Build manifest data from a list of files
 * @param files - Array of filenames (local or R2 paths) or a Set
 * @param pattern - Pattern to filter files (default: local pattern)
 */
export function buildManifest(
  files: string[] | Set<string>,
  pattern: RegExp = ANALYSIS_FILE_PATTERN
): ManifestData {
  const fileArray = Array.isArray(files) ? files : Array.from(files)

  const analysisFiles = fileArray.filter(f => pattern.test(f))
  const sorted = sortAnalysisFiles(analysisFiles)
  const verses = sorted.map(fileToVerseId)

  return {
    verses,
    generatedAt: new Date().toISOString(),
  }
}
