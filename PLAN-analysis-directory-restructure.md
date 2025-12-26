# Plan: Restructure Analysis Files into Surah Directories

## Overview

Reorganize the `public/data/analysis/` directory from a flat structure to a directory-per-surah structure for better organization and manageability as the project scales to 6,236+ verse analysis files.

## Current State

```
public/data/analysis/
├── manifest.json
├── _temp/
├── 1-1.json
├── 1-2.json
├── ...
├── 67-1.json
├── 67-2.json
├── ...
└── 114-6.json
```

**Problem:** All 1,002 analysis files (growing to 6,236) are in a single flat directory.

## Target State

```
public/data/analysis/
├── manifest.json
├── _temp/
├── 1/
│   ├── 1-1.json
│   ├── 1-2.json
│   └── 1-7.json
├── 67/
│   ├── 67-1.json
│   ├── 67-2.json
│   └── 67-30.json
├── ...
└── 114/
    ├── 114-1.json
    └── 114-6.json
```

**Key decision:** Keep original filenames (`{surah}-{verse}.json`) for:
- Self-documentation (filename shows surah:verse)
- Safety if files accidentally moved
- Easy grep/search across codebase
- No overwrites if directories are flattened

---

## Implementation Steps

### Step 1: Create Migration Script

**File:** `scripts/migrate-analysis-to-dirs.ts`

**Purpose:** Move existing analysis files into surah directories.

**Logic:**
```
1. Read all files in public/data/analysis/
2. Filter for pattern: /^\d+-\d+\.json$/
3. For each file:
   a. Parse surah ID from filename (e.g., "67-15.json" → 67)
   b. Create directory if not exists: analysis/{surahId}/
   c. Move file: analysis/67-15.json → analysis/67/67-15.json
4. Regenerate manifest.json
5. Report summary
```

**Features:**
- Dry-run mode (preview without changes)
- Skip manifest.json, _temp/, _errors.log
- Verify file moved successfully before deleting original

---

### Step 2: Update Data Fetching

**File:** `src/lib/data.ts`

**Function:** `getVerseAnalysis()` (lines 214-261)

**Change:**
```typescript
// BEFORE (line 226-230)
const fileName = verseId.replace(':', '-')
const response = await fetch(`${DATA_BASE_URL}/analysis/${fileName}.json`)

// AFTER
const [surah, verse] = verseId.split(':')
const fileName = `${surah}-${verse}`
const response = await fetch(`${DATA_BASE_URL}/analysis/${surah}/${fileName}.json`)
```

---

### Step 3: Update Seed Script

**File:** `scripts/seed-analysis.ts`

#### 3a. Update `getTempPaths()` (lines 369-376)

```typescript
// BEFORE
function getTempPaths(surahId: number, verseNum: number) {
  const prefix = `${surahId}-${verseNum}`
  return {
    base: path.join(TEMP_DIR, `${prefix}.base.json`),
    word: (wordNum: number) => path.join(TEMP_DIR, `${prefix}.w${wordNum}.json`),
    final: path.join(ANALYSIS_DIR, `${prefix}.json`),
  }
}

// AFTER
function getTempPaths(surahId: number, verseNum: number) {
  const prefix = `${surahId}-${verseNum}`
  const surahDir = path.join(ANALYSIS_DIR, surahId.toString())
  return {
    base: path.join(TEMP_DIR, `${prefix}.base.json`),
    word: (wordNum: number) => path.join(TEMP_DIR, `${prefix}.w${wordNum}.json`),
    final: path.join(surahDir, `${prefix}.json`),
    surahDir,
  }
}
```

#### 3b. Update `processVerse()` (around line 508)

Add directory creation before writing final file:

```typescript
// Add after line 552 (before writing final file)
if (!fs.existsSync(paths.surahDir)) {
  fs.mkdirSync(paths.surahDir, { recursive: true })
}
```

#### 3c. Update `updateManifest()` (lines 474-493)

```typescript
// BEFORE: Scans flat files
const files = fs.readdirSync(ANALYSIS_DIR)
  .filter(f => /^\d+-\d+\.json$/.test(f))

// AFTER: Scans surah directories
function updateManifest(): void {
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

  fs.writeFileSync(path.join(ANALYSIS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`Updated manifest.json with ${verses.length} verses`)
}
```

---

### Step 4: Update Static Params Generation

**File:** `src/app/browse/surah/[id]/[verse]/page.tsx`

**Function:** `generateStaticParams()` (lines 5-18)

```typescript
// BEFORE
export async function generateStaticParams() {
  const analysisDir = path.join(process.cwd(), 'public', 'data', 'analysis')
  try {
    const files = await readdir(analysisDir)
    return files
      .filter(f => f.endsWith('.json') && f !== 'manifest.json')
      .map(f => {
        const [surah, verse] = f.replace('.json', '').split('-')
        return { id: surah, verse }
      })
  } catch {
    return []
  }
}

// AFTER
export async function generateStaticParams() {
  const analysisDir = path.join(process.cwd(), 'public', 'data', 'analysis')
  try {
    const entries = await readdir(analysisDir, { withFileTypes: true })
    const params: { id: string; verse: string }[] = []

    for (const entry of entries) {
      // Only process numbered directories (surah folders)
      if (!entry.isDirectory() || !/^\d+$/.test(entry.name)) continue

      const surahDir = path.join(analysisDir, entry.name)
      const files = await readdir(surahDir)

      for (const file of files) {
        if (!file.endsWith('.json')) continue
        const [surah, verse] = file.replace('.json', '').split('-')
        params.push({ id: surah, verse })
      }
    }

    return params
  } catch {
    return []
  }
}
```

---

## Execution Checklist

- [x] **Step 1:** Create migration script `scripts/migrate-analysis-to-dirs.ts`
- [x] **Step 1b:** Run migration with `--dry-run` to verify
- [x] **Step 1c:** Run migration for real
- [x] **Step 2:** Update `src/lib/data.ts` - `getVerseAnalysis()`
- [x] **Step 3a:** Update `scripts/seed-analysis.ts` - `getTempPaths()`
- [x] **Step 3b:** Update `scripts/seed-analysis.ts` - `processVerse()`
- [x] **Step 3c:** Update `scripts/seed-analysis.ts` - `updateManifest()`
- [x] **Step 4:** Update `src/app/browse/surah/[id]/[verse]/page.tsx`
- [x] **Test:** Run `npm run dev` and verify verse loading works
- [x] **Test:** Run `npm run build` and verify static generation works
- [x] **Commit:** Commit all changes
- [x] **Push:** Push to branch

---

## Rollback Plan

If issues arise:
1. Git revert the code changes
2. Move files back to flat structure:
   ```bash
   cd public/data/analysis
   for dir in */; do
     if [[ "$dir" =~ ^[0-9]+/$ ]]; then
       mv "$dir"*.json . 2>/dev/null
       rmdir "$dir"
     fi
   done
   ```
3. Regenerate manifest with original `updateManifest()` logic

---

## Files Modified

| File | Change Type |
|------|-------------|
| `scripts/migrate-analysis-to-dirs.ts` | New file |
| `src/lib/data.ts` | Edit |
| `scripts/seed-analysis.ts` | Edit |
| `src/app/browse/surah/[id]/[verse]/page.tsx` | Edit |
| `public/data/analysis/` | Directory restructure |

---

## Notes

- manifest.json format stays the same (array of "surah:verse" strings)
- _temp/ directory stays in root analysis/ folder (used during seed process)
- No changes needed to quran.json or surahs.json
- Client-side caching in data.ts continues to work unchanged
