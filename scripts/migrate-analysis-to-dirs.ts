/**
 * Migration Script: Move analysis files into surah directories
 *
 * Reorganizes the flat analysis file structure into directory-per-surah:
 *   Before: analysis/67-15.json
 *   After:  analysis/67/67-15.json
 *
 * Usage:
 *   npx tsx scripts/migrate-analysis-to-dirs.ts --dry-run   # Preview changes
 *   npx tsx scripts/migrate-analysis-to-dirs.ts             # Execute migration
 */

import * as fs from 'fs'
import * as path from 'path'

// Paths
const PROJECT_ROOT = path.resolve(__dirname, '..')
const ANALYSIS_DIR = path.join(PROJECT_ROOT, 'public/data/analysis')

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')

interface MigrationResult {
  moved: string[]
  skipped: string[]
  errors: string[]
  directoriesCreated: string[]
}

/**
 * Get list of analysis files to migrate
 */
function getFilesToMigrate(): string[] {
  const entries = fs.readdirSync(ANALYSIS_DIR)
  return entries.filter(f => {
    // Match pattern: {surah}-{verse}.json (e.g., 67-15.json)
    if (!/^\d+-\d+\.json$/.test(f)) return false
    // Ensure it's a file, not directory
    const fullPath = path.join(ANALYSIS_DIR, f)
    return fs.statSync(fullPath).isFile()
  })
}

/**
 * Parse surah ID from filename
 */
function parseSurahId(filename: string): number {
  const match = filename.match(/^(\d+)-\d+\.json$/)
  if (!match) throw new Error(`Invalid filename format: ${filename}`)
  return parseInt(match[1], 10)
}

/**
 * Migrate files to surah directories
 */
function migrate(): MigrationResult {
  const result: MigrationResult = {
    moved: [],
    skipped: [],
    errors: [],
    directoriesCreated: [],
  }

  const files = getFilesToMigrate()

  if (files.length === 0) {
    console.log('No files to migrate.')
    return result
  }

  console.log(`Found ${files.length} files to migrate.`)
  console.log('')

  // Group files by surah
  const filesBySurah = new Map<number, string[]>()
  for (const file of files) {
    try {
      const surahId = parseSurahId(file)
      if (!filesBySurah.has(surahId)) {
        filesBySurah.set(surahId, [])
      }
      filesBySurah.get(surahId)!.push(file)
    } catch (err) {
      result.errors.push(`Failed to parse: ${file}`)
    }
  }

  // Process each surah
  const sortedSurahs = Array.from(filesBySurah.keys()).sort((a, b) => a - b)

  for (const surahId of sortedSurahs) {
    const surahFiles = filesBySurah.get(surahId)!
    const surahDir = path.join(ANALYSIS_DIR, surahId.toString())

    // Create surah directory if needed
    if (!fs.existsSync(surahDir)) {
      if (isDryRun) {
        console.log(`[DRY-RUN] Would create directory: ${surahId}/`)
      } else {
        fs.mkdirSync(surahDir, { recursive: true })
        console.log(`Created directory: ${surahId}/`)
      }
      result.directoriesCreated.push(surahDir)
    }

    // Move files
    for (const file of surahFiles) {
      const srcPath = path.join(ANALYSIS_DIR, file)
      const destPath = path.join(surahDir, file)

      // Check if destination already exists
      if (fs.existsSync(destPath)) {
        result.skipped.push(file)
        console.log(`  Skipped (already exists): ${file}`)
        continue
      }

      if (isDryRun) {
        console.log(`  [DRY-RUN] Would move: ${file} → ${surahId}/${file}`)
        result.moved.push(file)
      } else {
        try {
          // Read, write to new location, then delete original
          const content = fs.readFileSync(srcPath)
          fs.writeFileSync(destPath, content)
          fs.unlinkSync(srcPath)
          result.moved.push(file)
          console.log(`  Moved: ${file} → ${surahId}/${file}`)
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error'
          result.errors.push(`${file}: ${errorMsg}`)
          console.log(`  ERROR: ${file} - ${errorMsg}`)
        }
      }
    }
  }

  return result
}

/**
 * Update manifest.json to reflect new structure
 */
function updateManifest(): void {
  console.log('')
  console.log('Updating manifest.json...')

  const verses: string[] = []

  const entries = fs.readdirSync(ANALYSIS_DIR, { withFileTypes: true })
  for (const entry of entries) {
    // Skip non-directories and special folders
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue
    if (!/^\d+$/.test(entry.name)) continue

    const surahId = entry.name
    const surahDir = path.join(ANALYSIS_DIR, surahId)
    const files = fs.readdirSync(surahDir)
      .filter(f => /^\d+-\d+\.json$/.test(f))
      .map(f => f.replace('.json', '').replace('-', ':'))

    verses.push(...files)
  }

  // Sort by surah then verse numerically
  verses.sort((a, b) => {
    const [surahA, verseA] = a.split(':').map(Number)
    const [surahB, verseB] = b.split(':').map(Number)
    return surahA - surahB || verseA - verseB
  })

  const manifest = {
    verses,
    generatedAt: new Date().toISOString(),
  }

  if (isDryRun) {
    console.log(`[DRY-RUN] Would update manifest.json with ${verses.length} verses`)
  } else {
    fs.writeFileSync(
      path.join(ANALYSIS_DIR, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    )
    console.log(`Updated manifest.json with ${verses.length} verses`)
  }
}

/**
 * Main function
 */
function main() {
  console.log('='.repeat(60))
  console.log('Analysis Files Migration: Flat → Directory-per-Surah')
  console.log('='.repeat(60))
  console.log(`Mode:      ${isDryRun ? 'DRY RUN (no changes)' : 'EXECUTE'}`)
  console.log(`Source:    ${ANALYSIS_DIR}`)
  console.log('='.repeat(60))
  console.log('')

  const result = migrate()

  if (!isDryRun && result.moved.length > 0) {
    updateManifest()
  } else if (isDryRun) {
    updateManifest() // Show what would happen
  }

  // Summary
  console.log('')
  console.log('='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`Directories created: ${result.directoriesCreated.length}`)
  console.log(`Files moved:         ${result.moved.length}`)
  console.log(`Files skipped:       ${result.skipped.length}`)
  console.log(`Errors:              ${result.errors.length}`)

  if (result.errors.length > 0) {
    console.log('')
    console.log('Errors:')
    result.errors.forEach(e => console.log(`  - ${e}`))
  }

  if (isDryRun) {
    console.log('')
    console.log('This was a dry run. No files were modified.')
    console.log('Run without --dry-run to execute the migration.')
  }

  console.log('='.repeat(60))
}

// Run
main()
