/**
 * Seed Script: Generate verse analysis using local LLM (Ollama or LM Studio)
 *
 * Two-Phase Generation Strategy:
 *   Phase 1: Generate base verse info + word list (fast, ~1-2 min)
 *   Phase 2: Generate detailed analysis for each word (~30-60 sec each)
 *   Final: Merge all into complete analysis JSON
 *
 * Usage:
 *   npm run seed:analysis
 *
 * Environment variables:
 *   LLM_BACKEND     - Backend to use: 'ollama' or 'lms' (default: ollama)
 *
 *   Ollama:
 *     OLLAMA_BASE_URL - Ollama API endpoint (default: http://localhost:11434)
 *     OLLAMA_MODEL    - Model to use (default: qwen2.5:72b)
 *
 *   LM Studio:
 *     LMS_BASE_URL    - LM Studio API endpoint (default: http://localhost:1234)
 *     LMS_MODEL       - Model to use (default: local-model)
 *
 * Examples:
 *   LLM_BACKEND=ollama npm run seed:analysis
 *   LLM_BACKEND=lms LMS_MODEL=qwen2.5-72b npm run seed:analysis
 *
 * Features:
 *   - Two-phase generation (faster, more reliable)
 *   - Resume capability at any phase
 *   - Detailed progress logging
 *   - Sequential processing
 */

import * as fs from 'fs'
import * as path from 'path'

// Backend selection: 'ollama' or 'lms'
const LLM_BACKEND = process.env.LLM_BACKEND || 'ollama'

// Ollama Configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:72b'

// LM Studio Configuration
const LMS_BASE_URL = process.env.LMS_BASE_URL || 'http://localhost:1234'
const LMS_MODEL = process.env.LMS_MODEL || 'local-model'

// Paths
const PROJECT_ROOT = path.resolve(__dirname, '..')
const QURAN_FILE = path.join(PROJECT_ROOT, 'public/data/quran.json')
const ANALYSIS_DIR = path.join(PROJECT_ROOT, 'public/data/analysis')
const TEMP_DIR = path.join(ANALYSIS_DIR, '_temp')

// Surah Range Filter (inclusive)
// First run: 1-1 (Al-Fatiha), Second run: 78-114 (Juz Amma)
const START_SURAH = 18
const END_SURAH = 18

// Types
interface QuranVerse {
  number: number
  arabic: string
  translations: {
    'en.sahih': string
    'en.transliteration': string
    [key: string]: string
  }
}

interface Surah {
  id: number
  name: string
  nameArabic: string
  verseCount: number
  verses: QuranVerse[]
}

interface QuranData {
  meta: {
    source: string
    arabicEdition: string
    translations: string[]
    generatedAt: string
  }
  surahs: Surah[]
}

interface BaseWord {
  wordNumber: number
  arabic: string
  transliteration: string
  meaning: string
}

// Simplified word detail (for learners - focus on meaning, not grammar)
interface WordDetail {
  wordNumber: number
  root?: {
    letters: string
    meaning: string
  }
  components?: Array<{
    arabic: string
    meaning: string
  }>
}

// What LLM returns in Phase 1 (simplified - no verse info, no root summary)
interface LLMBaseResponse {
  words: BaseWord[]
  literalTranslation: {
    wordAligned: string
    preservingSyntax?: string
  }
}

// Full analysis structure (verse info added from quran.json)
interface BaseAnalysis extends LLMBaseResponse {
  verseId: string
  verse: {
    arabic: string
    transliteration: string
    surah: string
    verseNumber: number
  }
  metadata: {
    analysisType: string
    linguisticFramework: string
    scope: string
  }
}

// Phase 1 Prompt: Word list + literal translation
// We already have: verseId, arabic, transliteration, english, surah, verseNumber from quran.json
// Root info is added in Phase 2 for each word
const BASE_PROMPT = `You are an expert in Classical Arabic grammar (naḥw and ṣarf). Analyze the following Quranic verse.

GUIDELINES:
- Focus ONLY on lexical analysis (no deep morphology yet)
- NO tafsīr, thematic, or theological interpretation
- Use academic transliteration (ḥ, ʿ, ā, ū, ī, etc.)

VERSE TO ANALYZE:
Surah: {SURAH_NAME} (Verse {VERSE_NUMBER})
Arabic: {VERSE_ARABIC}
Translation: {VERSE_ENGLISH}

Return ONLY a valid JSON object with these two fields:

{
  "words": [
    {
      "wordNumber": 1,
      "arabic": "[Word from verse]",
      "transliteration": "[transliteration]",
      "meaning": "[literal meaning]"
    }
  ],
  "literalTranslation": {
    "wordAligned": "[Word-for-word translation with hyphens for compound meanings and [brackets] for implied words]"
  }
}

Return ONLY the JSON object, no additional text or markdown.`

// Phase 2 Prompt: Word detail (simplified for learners)
const WORD_PROMPT = `Analyze this Arabic word from the Quran. Focus on meaning and root, not grammar.

WORD:
Arabic: {WORD_ARABIC}
Transliteration: {WORD_TRANSLITERATION}
Meaning: {WORD_MEANING}

Return ONLY a valid JSON object:

{
  "wordNumber": {WORD_NUMBER},
  "root": {
    "letters": "[3-letter root, e.g., ح-م-د]",
    "meaning": "[core root meaning]"
  },
  "components": [
    {
      "arabic": "[part]",
      "meaning": "[meaning of this part]"
    }
  ]
}

RULES:
- "root": Include ONLY if word has a triliteral root. Omit for particles (لِ, بِ, etc.) or proper nouns (الله)
- "components": Include ONLY if word is compound (e.g., لِلَّهِ = لِ + الله, بِسْمِ = بِ + اسْم). Omit for simple words.

Return ONLY the JSON object, no markdown.`

/**
 * Call Ollama API to generate analysis
 */
async function callOllama(prompt: string): Promise<string> {
  const url = `${OLLAMA_BASE_URL}/api/generate`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Could not read error body')
      throw new Error(`Ollama API error: ${response.status} - ${errorBody.slice(0, 200)}`)
    }

    const data = await response.json()
    if (!data.response) {
      throw new Error('Ollama returned empty response')
    }

    return data.response
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to Ollama at ${OLLAMA_BASE_URL}. Is it running?`)
    }
    throw error
  }
}

/**
 * Call LM Studio API (OpenAI-compatible) to generate analysis
 */
async function callLMS(prompt: string): Promise<string> {
  const url = `${LMS_BASE_URL}/v1/chat/completions`

  // 5 minute timeout for word analysis (shorter than before)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: LMS_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert in Classical Arabic grammar (naḥw and ṣarf). Return only valid JSON, no additional text or markdown.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: -1,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Could not read error body')
      throw new Error(`LM Studio API error: ${response.status} - ${errorBody.slice(0, 200)}`)
    }

    const data = await response.json()
    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('LM Studio returned empty response')
    }

    return data.choices[0].message.content
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('LM Studio request timed out after 5 minutes')
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to LM Studio at ${LMS_BASE_URL}. Is it running?`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Unified LLM caller
 */
async function callLLM(prompt: string): Promise<string> {
  switch (LLM_BACKEND.toLowerCase()) {
    case 'lms':
    case 'lmstudio':
      return callLMS(prompt)
    case 'ollama':
    default:
      return callOllama(prompt)
  }
}

/**
 * Attempt to repair common JSON issues from LLM output
 */
function repairJson(json: string): string {
  let repaired = json.trim()

  const openBraces = (repaired.match(/\{/g) || []).length
  const closeBraces = (repaired.match(/\}/g) || []).length
  const openBrackets = (repaired.match(/\[/g) || []).length
  const closeBrackets = (repaired.match(/\]/g) || []).length

  const missingBraces = openBraces - closeBraces
  const missingBrackets = openBrackets - closeBrackets

  if (missingBraces > 0 || missingBrackets > 0) {
    repaired = repaired.replace(/,\s*$/, '')
    for (let i = 0; i < missingBrackets; i++) repaired += ']'
    for (let i = 0; i < missingBraces; i++) repaired += '}'
  }

  repaired = repaired.replace(/,\s*\]/g, ']')
  repaired = repaired.replace(/,\s*\}/g, '}')

  return repaired
}

/**
 * Extract JSON from LLM response
 */
function extractJson(response: string): object {
  const tryParse = (json: string): object | null => {
    try {
      return JSON.parse(json)
    } catch {
      try {
        return JSON.parse(repairJson(json))
      } catch {
        return null
      }
    }
  }

  // Try direct parse
  const direct = tryParse(response.trim())
  if (direct) return direct

  // Try markdown code block
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    const codeBlock = tryParse(jsonMatch[1].trim())
    if (codeBlock) return codeBlock
  }

  // Try to find JSON object
  const objectMatch = response.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    const extracted = tryParse(objectMatch[0])
    if (extracted) return extracted
  }

  throw new Error('Could not extract valid JSON from response')
}

/**
 * Get temp file paths
 */
function getTempPaths(surahId: number, verseNum: number) {
  const prefix = `${surahId}-${verseNum}`
  return {
    base: path.join(TEMP_DIR, `${prefix}.base.json`),
    word: (wordNum: number) => path.join(TEMP_DIR, `${prefix}.w${wordNum}.json`),
    final: path.join(ANALYSIS_DIR, `${prefix}.json`),
  }
}

/**
 * Strip HTML tags from transliteration text
 */
function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '')
}

/**
 * Phase 1: Generate base analysis
 * LLM returns only words/literalTranslation/rootSummary
 * Verse info is added from quran.json (Tanzil.net)
 */
async function generateBaseAnalysis(surah: Surah, verseNum: number): Promise<BaseAnalysis> {
  const verse = surah.verses.find(v => v.number === verseNum)
  if (!verse) {
    throw new Error(`Verse ${surah.id}:${verseNum} not found in quran.json`)
  }

  const prompt = BASE_PROMPT
    .replace(/{SURAH_NAME}/g, surah.name)
    .replace(/{VERSE_NUMBER}/g, verseNum.toString())
    .replace(/{VERSE_ARABIC}/g, verse.arabic)
    .replace(/{VERSE_ENGLISH}/g, verse.translations['en.sahih'])

  const response = await callLLM(prompt)
  const llmResponse = extractJson(response) as LLMBaseResponse

  // Merge LLM response with verse info from quran.json
  return {
    verseId: `${surah.id}:${verseNum}`,
    verse: {
      arabic: verse.arabic,
      transliteration: stripHtmlTags(verse.translations['en.transliteration'] || ''),
      surah: surah.name,
      verseNumber: verseNum,
    },
    words: llmResponse.words,
    literalTranslation: llmResponse.literalTranslation,
    metadata: {
      analysisType: 'lexical and morphological',
      linguisticFramework: 'Classical Arabic grammar (naḥw, ṣarf)',
      scope: 'no tafsīr, thematic, or theological interpretation',
    },
  }
}

/**
 * Phase 2: Generate word detail
 */
async function generateWordDetail(
  surah: Surah,
  verseNum: number,
  verseArabic: string,
  word: BaseWord,
  totalWords: number
): Promise<WordDetail> {
  const prompt = WORD_PROMPT
    .replace(/{SURAH_NAME}/g, surah.name)
    .replace(/{VERSE_NUMBER}/g, verseNum.toString())
    .replace(/{VERSE_ARABIC}/g, verseArabic)
    .replace(/{WORD_NUMBER}/g, word.wordNumber.toString())
    .replace(/{TOTAL_WORDS}/g, totalWords.toString())
    .replace(/{WORD_ARABIC}/g, word.arabic)
    .replace(/{WORD_TRANSLITERATION}/g, word.transliteration)
    .replace(/{WORD_MEANING}/g, word.meaning)

  const response = await callLLM(prompt)
  return extractJson(response) as WordDetail
}

/**
 * Merge base analysis with word details
 */
function mergeAnalysis(base: BaseAnalysis, wordDetails: WordDetail[]): object {
  const mergedWords = base.words.map((baseWord) => {
    const detail = wordDetails.find((d) => d.wordNumber === baseWord.wordNumber)
    if (detail) {
      return {
        ...baseWord,
        root: detail.root,
        components: detail.components,
      }
    }
    return baseWord
  })

  return {
    ...base,
    words: mergedWords,
  }
}

/**
 * Update manifest.json with list of available analyses
 * Called at the end of seeding to track which verses have analysis
 */
function updateManifest(): void {
  const files = fs.readdirSync(ANALYSIS_DIR)
    .filter(f => /^\d+-\d+\.json$/.test(f))
    .sort((a, b) => {
      // Sort by surah then verse numerically
      const [surahA, verseA] = a.replace('.json', '').split('-').map(Number)
      const [surahB, verseB] = b.replace('.json', '').split('-').map(Number)
      return surahA - surahB || verseA - verseB
    })

  const verses = files.map(f => f.replace('.json', '').replace('-', ':'))
  const manifest = {
    verses,
    generatedAt: new Date().toISOString(),
  }

  const manifestPath = path.join(ANALYSIS_DIR, 'manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
  console.log(`Updated manifest.json with ${verses.length} verses`)
}

/**
 * Format duration
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

/**
 * Process a single verse
 */
async function processVerse(surah: Surah, verseNum: number): Promise<{ success: boolean; cached: boolean }> {
  const paths = getTempPaths(surah.id, verseNum)
  const verseStartTime = Date.now()

  // Check if final file exists
  if (fs.existsSync(paths.final)) {
    // Update manifest to ensure it's in sync (in case of previous interrupted run)
    updateManifest()
    return { success: true, cached: true }
  }

  // Phase 1: Get or generate base analysis
  let base: BaseAnalysis
  if (fs.existsSync(paths.base)) {
    console.log(`      Phase 1: Loading cached base...`)
    base = JSON.parse(fs.readFileSync(paths.base, 'utf-8'))
  } else {
    console.log(`      Phase 1: Generating base analysis...`)
    const startTime = Date.now()
    base = await generateBaseAnalysis(surah, verseNum)
    fs.writeFileSync(paths.base, JSON.stringify(base, null, 2))
    console.log(`      Phase 1: Done (${formatDuration(Date.now() - startTime)})`)
  }

  // Phase 2: Get or generate word details
  const wordDetails: WordDetail[] = []
  const totalWords = base.words.length

  for (const word of base.words) {
    const wordPath = paths.word(word.wordNumber)

    if (fs.existsSync(wordPath)) {
      console.log(`      Phase 2: Word ${word.wordNumber}/${totalWords} - cached`)
      wordDetails.push(JSON.parse(fs.readFileSync(wordPath, 'utf-8')))
    } else {
      console.log(`      Phase 2: Word ${word.wordNumber}/${totalWords} (${word.arabic})...`)
      const startTime = Date.now()
      const detail = await generateWordDetail(surah, verseNum, base.verse.arabic, word, totalWords)
      fs.writeFileSync(wordPath, JSON.stringify(detail, null, 2))
      wordDetails.push(detail)
      console.log(`               Done (${formatDuration(Date.now() - startTime)})`)
    }
  }

  // Merge and save final
  console.log(`      Merging and saving final analysis...`)
  const final = mergeAnalysis(base, wordDetails)
  fs.writeFileSync(paths.final, JSON.stringify(final, null, 2))

  // Update manifest immediately (so CTRL+C won't lose progress)
  updateManifest()

  // Cleanup temp files
  if (fs.existsSync(paths.base)) fs.unlinkSync(paths.base)
  for (const word of base.words) {
    const wordPath = paths.word(word.wordNumber)
    if (fs.existsSync(wordPath)) fs.unlinkSync(wordPath)
  }

  // Log total verse time
  const totalVerseTime = Date.now() - verseStartTime
  console.log(`      Total: ${formatDuration(totalVerseTime)} ✓`)

  return { success: true, cached: false }
}

/**
 * Main seed function
 */
async function main() {
  console.log('='.repeat(60))
  console.log('Qalam Verse Analysis Seeder (Two-Phase)')
  console.log('='.repeat(60))
  console.log(`Range:        Surah ${START_SURAH} - ${END_SURAH}`)
  console.log(`Backend:      ${LLM_BACKEND}`)
  if (LLM_BACKEND.toLowerCase() === 'lms' || LLM_BACKEND.toLowerCase() === 'lmstudio') {
    console.log(`LM Studio:    ${LMS_BASE_URL}`)
    console.log(`Model:        ${LMS_MODEL}`)
  } else {
    console.log(`Ollama:       ${OLLAMA_BASE_URL}`)
    console.log(`Model:        ${OLLAMA_MODEL}`)
  }
  console.log(`Output:       ${ANALYSIS_DIR}`)
  console.log('='.repeat(60))
  console.log('')

  // Ensure directories exist
  if (!fs.existsSync(ANALYSIS_DIR)) {
    fs.mkdirSync(ANALYSIS_DIR, { recursive: true })
  }
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true })
  }

  // Load quran.json (source of truth for verse text)
  if (!fs.existsSync(QURAN_FILE)) {
    console.error('ERROR: quran.json not found. Run `npx tsx scripts/build-quran-json.ts` first.')
    process.exit(1)
  }
  const quranData: QuranData = JSON.parse(fs.readFileSync(QURAN_FILE, 'utf-8'))
  const surahs = quranData.surahs

  console.log(`Source: ${quranData.meta.source} (${quranData.meta.arabicEdition})`)

  // Calculate totals
  const totalVerses = surahs.reduce((sum, s) => sum + s.verseCount, 0)
  let processedCount = 0
  let skippedCount = 0
  let errorCount = 0
  const startTime = Date.now()

  console.log(`Total surahs: ${surahs.length}`)
  console.log(`Total verses: ${totalVerses}`)
  console.log('')

  // Process each surah
  for (const surah of surahs) {
    // Skip surahs outside the configured range
    if (surah.id < START_SURAH || surah.id > END_SURAH) {
      continue
    }

    console.log(`\n${'─'.repeat(50)}`)
    console.log(`Surah ${surah.id}: ${surah.name} (${surah.nameArabic})`)
    console.log(`Verses: ${surah.verseCount}`)
    console.log('─'.repeat(50))

    for (let verseNum = 1; verseNum <= surah.verseCount; verseNum++) {
      const verseId = `${surah.id}:${verseNum}`
      const currentTotal = processedCount + skippedCount + errorCount + 1
      const progress = ((currentTotal / totalVerses) * 100).toFixed(1)

      console.log(`\n   [${progress}%] ${verseId}`)

      try {
        const result = await processVerse(surah, verseNum)

        if (result.cached) {
          skippedCount++
          console.log(`      Skipped (already exists)`)
        } else {
          processedCount++
        }
      } catch (error) {
        errorCount++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.log(`      ERROR: ${errorMessage}`)

        // Log error to file
        const errorLogPath = path.join(ANALYSIS_DIR, '_errors.log')
        fs.appendFileSync(
          errorLogPath,
          `[${new Date().toISOString()}] ${verseId}: ${errorMessage}\n`
        )
      }
    }
  }

  // Update manifest with all available analyses
  updateManifest()

  // Summary
  const totalDuration = Date.now() - startTime
  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`Processed: ${processedCount}`)
  console.log(`Skipped:   ${skippedCount}`)
  console.log(`Errors:    ${errorCount}`)
  console.log(`Duration:  ${formatDuration(totalDuration)}`)
  console.log('='.repeat(60))

  if (errorCount > 0) {
    console.log(`\nCheck ${path.join(ANALYSIS_DIR, '_errors.log')} for error details`)
  }

  process.exit(errorCount > 0 ? 1 : 0)
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
