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
const SURAHS_FILE = path.join(PROJECT_ROOT, 'public/data/surahs.json')
const ANALYSIS_DIR = path.join(PROJECT_ROOT, 'public/data/analysis')
const TEMP_DIR = path.join(ANALYSIS_DIR, '_temp')

// Types
interface Surah {
  id: number
  name: string
  nameArabic: string
  verseCount: number
}

interface BaseWord {
  wordNumber: number
  arabic: string
  transliteration: string
  meaning: string
}

interface WordDetail {
  wordNumber: number
  root?: {
    letters: string
    transliteration: string
    meaning: string
  }
  grammaticalCategory?: string
  definiteness?: string
  morphology?: {
    pattern: string
    patternTransliteration: string
    wordType: string
    note?: string
  }
  grammar?: {
    case: string
    caseMarker: string
    caseReason: string
    gender: string
    number: string
  }
  syntacticFunction?: string
  components?: Array<{
    element: string
    transliteration: string
    type: string
    function: string
  }>
  semanticNote?: string
}

interface BaseAnalysis {
  verseId: string
  verse: {
    arabic: string
    transliteration: string
    surah: string
    verseNumber: number
  }
  words: BaseWord[]
  literalTranslation: {
    wordAligned: string
    preservingSyntax?: string
  }
  rootSummary: Array<{
    word: string
    transliteration: string
    root: string
    coreMeaning: string
    derivedMeaning: string
  }>
  metadata?: {
    analysisType: string
    linguisticFramework: string
    scope: string
  }
}

// Phase 1 Prompt: Base verse + word list
const BASE_PROMPT = `You are an expert in Classical Arabic grammar (naḥw and ṣarf). Provide the base analysis for the following Quranic verse.

IMPORTANT GUIDELINES:
- Focus ONLY on lexical analysis (no deep morphology yet)
- NO tafsīr, thematic, or theological interpretation
- Use academic transliteration (ḥ, ʿ, ā, ū, ī, etc.)
- Include full diacritical marks (tashkīl) for Arabic text

VERSE TO ANALYZE:
Surah: {SURAH_NAME}
Surah Number: {SURAH_NUMBER}
Verse Number: {VERSE_NUMBER}

Return ONLY a valid JSON object with this structure:

{
  "verseId": "{SURAH_NUMBER}:{VERSE_NUMBER}",
  "verse": {
    "arabic": "[Full Arabic text with tashkīl]",
    "transliteration": "[Academic transliteration]",
    "surah": "{SURAH_NAME}",
    "verseNumber": {VERSE_NUMBER}
  },
  "words": [
    {
      "wordNumber": 1,
      "arabic": "[Word with tashkīl]",
      "transliteration": "[transliteration]",
      "meaning": "[literal meaning]"
    }
  ],
  "literalTranslation": {
    "wordAligned": "[Word-for-word translation with hyphens for compound meanings and [brackets] for implied words]"
  },
  "rootSummary": [
    {
      "word": "[Arabic word]",
      "transliteration": "[transliteration]",
      "root": "[ح-م-د (ḥ-m-d)]",
      "coreMeaning": "[core meaning of root]",
      "derivedMeaning": "[meaning of this derived word]"
    }
  ],
  "metadata": {
    "analysisType": "lexical and morphological",
    "linguisticFramework": "Classical Arabic grammar (naḥw, ṣarf)",
    "scope": "no tafsīr, thematic, or theological interpretation"
  }
}

Return ONLY the JSON object, no additional text or markdown.`

// Phase 2 Prompt: Word detail
const WORD_PROMPT = `You are an expert in Classical Arabic grammar (naḥw and ṣarf). Provide detailed morphological and grammatical analysis for this word from the Quran.

CONTEXT:
Surah: {SURAH_NAME}
Verse Number: {VERSE_NUMBER}
Full Verse: {VERSE_ARABIC}

WORD TO ANALYZE:
Word Number: {WORD_NUMBER} of {TOTAL_WORDS}
Arabic: {WORD_ARABIC}
Transliteration: {WORD_TRANSLITERATION}
Meaning: {WORD_MEANING}

IMPORTANT GUIDELINES:
- Focus ONLY on lexical and morphological analysis
- NO tafsīr, thematic, or theological interpretation
- Use academic transliteration (ḥ, ʿ, ā, ū, ī, etc.)
- Consider the word's role in the sentence context

Return ONLY a valid JSON object with this structure:

{
  "wordNumber": {WORD_NUMBER},
  "root": {
    "letters": "[e.g., ح-م-د]",
    "transliteration": "[e.g., ḥ-m-d]",
    "meaning": "[core root meaning]"
  },
  "grammaticalCategory": "[e.g., definite noun (ism maʿrifa)]",
  "definiteness": "[e.g., definite (by al- prefix)]",
  "morphology": {
    "pattern": "[Arabic pattern, e.g., فَعْل]",
    "patternTransliteration": "[e.g., faʿl]",
    "wordType": "[e.g., maṣdar (verbal noun)]",
    "note": "[optional additional info]"
  },
  "grammar": {
    "case": "[nominative (marfūʿ) | accusative (manṣūb) | genitive (majrūr)]",
    "caseMarker": "[e.g., ḍamma (ُ)]",
    "caseReason": "[why this case]",
    "gender": "[masculine | feminine]",
    "number": "[singular | dual | plural]"
  },
  "syntacticFunction": "[role in sentence, e.g., mubtadaʾ (subject)]",
  "components": [
    {
      "element": "[Arabic part]",
      "transliteration": "[transliteration]",
      "type": "[e.g., preposition (ḥarf jarr)]",
      "function": "[what it does]"
    }
  ],
  "semanticNote": "[optional: additional meaning context]"
}

NOTES:
- Include "components" ONLY if the word has prefixes/suffixes (like بِسْمِ = بِ + اسْم)
- For particles without roots, omit the "root" field or set letters to "—"

Return ONLY the JSON object, no additional text or markdown.`

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
 * Phase 1: Generate base analysis
 */
async function generateBaseAnalysis(surah: Surah, verseNum: number): Promise<BaseAnalysis> {
  const prompt = BASE_PROMPT
    .replace(/{SURAH_NAME}/g, surah.name)
    .replace(/{SURAH_NUMBER}/g, surah.id.toString())
    .replace(/{VERSE_NUMBER}/g, verseNum.toString())

  const response = await callLLM(prompt)
  return extractJson(response) as BaseAnalysis
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
        grammaticalCategory: detail.grammaticalCategory,
        definiteness: detail.definiteness,
        morphology: detail.morphology,
        grammar: detail.grammar,
        syntacticFunction: detail.syntacticFunction,
        components: detail.components,
        semanticNote: detail.semanticNote,
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
  const verseId = `${surah.id}:${verseNum}`

  // Check if final file exists
  if (fs.existsSync(paths.final)) {
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

  // Cleanup temp files
  if (fs.existsSync(paths.base)) fs.unlinkSync(paths.base)
  for (const word of base.words) {
    const wordPath = paths.word(word.wordNumber)
    if (fs.existsSync(wordPath)) fs.unlinkSync(wordPath)
  }

  return { success: true, cached: false }
}

/**
 * Main seed function
 */
async function main() {
  console.log('='.repeat(60))
  console.log('Qalam Verse Analysis Seeder (Two-Phase)')
  console.log('='.repeat(60))
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

  // Load surahs
  const surahs: Surah[] = JSON.parse(fs.readFileSync(SURAHS_FILE, 'utf-8'))

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
          console.log(`      Complete!`)
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
