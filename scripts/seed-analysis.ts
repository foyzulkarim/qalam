/**
 * Seed Script: Generate verse analysis using local LLM (Ollama or LM Studio)
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
 *   - Skips existing analysis files (resume capability)
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

// Types
interface Surah {
  id: number
  name: string
  nameArabic: string
  verseCount: number
}

// Analysis prompt template
const ANALYSIS_PROMPT = `You are an expert in Classical Arabic grammar (naḥw and ṣarf). Analyze the following Quranic verse word-by-word and return a JSON object.

IMPORTANT GUIDELINES:
- Focus ONLY on lexical and morphological analysis
- NO tafsīr, thematic, or theological interpretation
- Use academic transliteration (ḥ, ʿ, ā, ū, ī, etc.)
- Include full diacritical marks (tashkīl) for Arabic text
- Analyze compound words by listing their components

VERSE TO ANALYZE:
Surah: {SURAH_NAME}
Surah Number: {SURAH_NUMBER}
Verse Number: {VERSE_NUMBER}

Return ONLY a valid JSON object with this exact structure:

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
      "meaning": "[literal meaning]",
      "grammaticalCategory": "[e.g., definite noun (ism maʿrifa)]",
      "definiteness": "[e.g., definite (by al- prefix)]",
      "root": {
        "letters": "[e.g., ح-م-د]",
        "transliteration": "[e.g., ḥ-m-d]",
        "meaning": "[core root meaning]"
      },
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
  ],
  "literalTranslation": {
    "wordAligned": "[Word-for-word with hyphens and [brackets] for implied words]",
    "preservingSyntax": "[Keeping Arabic order with transliterated terms]"
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
  "grammarObservations": {
    "sentenceType": {
      "classification": "[jumla ismiyya (nominal) | jumla fiʿliyya (verbal)]",
      "mubtada": "[subject if nominal]",
      "khabar": "[predicate if nominal]"
    },
    "idafaConstructions": [
      {
        "description": "[describe the construct]",
        "mudaf": "[first term]",
        "mudafIlayhi": "[second term]"
      }
    ],
    "notes": [
      "[grammatical observations about the verse]"
    ]
  },
  "metadata": {
    "analysisType": "lexical and morphological",
    "linguisticFramework": "Classical Arabic grammar (naḥw, ṣarf)",
    "scope": "no tafsīr, thematic, or theological interpretation"
  }
}

Return ONLY the JSON object, no additional text or markdown.`

/**
 * Call Ollama API to generate analysis
 */
async function callOllama(prompt: string, verseId: string): Promise<string> {
  const url = `${OLLAMA_BASE_URL}/api/generate`

  try {
    console.log(`\n      🔗 Connecting to Ollama at ${OLLAMA_BASE_URL}`)
    console.log(`      🤖 Using model: ${OLLAMA_MODEL}`)

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        // format: 'json',  // Forces valid JSON output
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Could not read error body')
      console.log(`      ❌ API returned ${response.status} ${response.statusText}`)
      console.log(`      📄 Response: ${errorBody.slice(0, 200)}`)
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
    }

    console.log(`      ✓ Response received, parsing...`)
    const data = await response.json();
    console.log(`      📄 Data`, data)

    if (!data.response) {
      console.log(`      ⚠️  Empty or missing response field in API response`)
      console.log(`      📄 Response keys: ${Object.keys(data).join(', ')}`)
      throw new Error('Ollama returned empty response')
    }

    console.log(`      ✓ Got ${data.response.length} chars from LLM`)
    return data.response
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.log(`\n      ❌ Connection failed - Is Ollama running?`)
      console.log(`         Try: ollama serve`)
      throw new Error(`Cannot connect to Ollama at ${OLLAMA_BASE_URL}`)
    }
    throw error
  }
}

/**
 * Call LM Studio API (OpenAI-compatible) to generate analysis
 */
async function callLMS(prompt: string, verseId: string): Promise<string> {
  const url = `${LMS_BASE_URL}/v1/chat/completions`

  // 10 minute timeout for large models
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10 * 60 * 1000)

  try {
    console.log(`\n      🔗 Connecting to LM Studio at ${LMS_BASE_URL}`)
    console.log(`      🤖 Using model: ${LMS_MODEL}`)

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
        max_tokens: -1, // Let LM Studio use maximum available
        stream: false,
        tools: [],           // Explicitly no tools
        tool_choice: 'none', // Disable tool calling
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Could not read error body')
      console.log(`      ❌ API returned ${response.status} ${response.statusText}`)
      console.log(`      📄 Response: ${errorBody.slice(0, 200)}`)
      throw new Error(`LM Studio API error: ${response.status} ${response.statusText}`)
    }

    console.log(`      ✓ Response received, parsing...`)
    const data = await response.json()

    // OpenAI-style response structure
    if (!data.choices || !data.choices[0]?.message?.content) {
      console.log(`      ⚠️  Empty or missing content in API response`)
      console.log(`      📄 Response keys: ${Object.keys(data).join(', ')}`)
      throw new Error('LM Studio returned empty response')
    }

    const content = data.choices[0].message.content
    console.log(`      ✓ Got ${content.length} chars from LLM`)
    return content
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`\n      ❌ Request timed out after 10 minutes`)
      throw new Error(`LM Studio request timed out for ${verseId}`)
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.log(`\n      ❌ Connection failed - Is LM Studio running?`)
      console.log(`         Check that the server is started in LM Studio`)
      throw new Error(`Cannot connect to LM Studio at ${LMS_BASE_URL}`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Unified LLM caller - routes to appropriate backend based on LLM_BACKEND env var
 */
async function callLLM(prompt: string, verseId: string): Promise<string> {
  switch (LLM_BACKEND.toLowerCase()) {
    case 'lms':
    case 'lmstudio':
      return callLMS(prompt, verseId)
    case 'ollama':
    default:
      return callOllama(prompt, verseId)
  }
}

/**
 * Attempt to repair common JSON issues from LLM output
 */
function repairJson(json: string): string {
  let repaired = json.trim()

  // Count brackets to find mismatches
  const openBraces = (repaired.match(/\{/g) || []).length
  const closeBraces = (repaired.match(/\}/g) || []).length
  const openBrackets = (repaired.match(/\[/g) || []).length
  const closeBrackets = (repaired.match(/\]/g) || []).length

  const missingBraces = openBraces - closeBraces
  const missingBrackets = openBrackets - closeBrackets

  if (missingBraces > 0 || missingBrackets > 0) {
    console.log(`      🔧 Attempting JSON repair...`)
    console.log(`         Missing } braces: ${missingBraces}`)
    console.log(`         Missing ] brackets: ${missingBrackets}`)

    // Remove trailing comma if present
    repaired = repaired.replace(/,\s*$/, '')

    // Add missing brackets and braces in correct order
    // We need to close arrays before objects typically
    for (let i = 0; i < missingBrackets; i++) {
      repaired += ']'
    }
    for (let i = 0; i < missingBraces; i++) {
      repaired += '}'
    }

    console.log(`         Added ${missingBrackets} ] and ${missingBraces} }`)
  }

  // Fix trailing commas before closing brackets/braces
  repaired = repaired.replace(/,\s*\]/g, ']')
  repaired = repaired.replace(/,\s*\}/g, '}')

  return repaired
}

/**
 * Extract JSON from LLM response (handles markdown code blocks)
 */
function extractJson(response: string): object {
  // Helper to try parsing with repair
  const tryParse = (json: string, label: string): object | null => {
    try {
      return JSON.parse(json)
    } catch (error) {
      console.log(`\n      ⚠️  ${label} - parse failed:`)
      console.log(`         ${error instanceof Error ? error.message : 'Parse error'}`)

      // Try repair
      try {
        const repaired = repairJson(json)
        const result = JSON.parse(repaired)
        console.log(`      ✓ JSON repair successful!`)
        return result
      } catch (repairError) {
        console.log(`      ❌ Repair also failed:`)
        console.log(`         ${repairError instanceof Error ? repairError.message : 'Parse error'}`)
        return null
      }
    }
  }

  // Try to parse directly first
  const direct = tryParse(response.trim(), 'Direct parse')
  if (direct) return direct

  // Try to extract from markdown code block
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    const codeBlock = tryParse(jsonMatch[1].trim(), 'Code block')
    if (codeBlock) return codeBlock
  }

  // Try to find JSON object in response
  const objectMatch = response.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    const extracted = tryParse(objectMatch[0], 'Extracted object')
    if (extracted) return extracted
  }

  // Log the raw response for debugging
  console.log('\n      📄 Raw response preview (first 500 chars):')
  console.log(`         ${response.slice(0, 500).replace(/\n/g, '\n         ')}`)
  if (response.length > 500) {
    console.log(`         ... (${response.length - 500} more chars)`)
  }

  throw new Error('Could not extract valid JSON from response')
}

/**
 * Generate analysis for a single verse
 */
async function generateVerseAnalysis(
  surah: Surah,
  verseNumber: number
): Promise<object> {
  const verseId = `${surah.id}:${verseNumber}`

  console.log(`      📖 Surah: ${surah.name} (${surah.nameArabic})`)
  console.log(`      📜 Verse: ${verseNumber}`)

  const prompt = ANALYSIS_PROMPT
    .replace(/{SURAH_NAME}/g, surah.name)
    .replace(/{SURAH_NUMBER}/g, surah.id.toString())
    .replace(/{VERSE_NUMBER}/g, verseNumber.toString())

  const response = await callLLM(prompt, verseId)

  console.log(`      🔍 Extracting JSON from response...`)
  const analysis = extractJson(response)
  console.log(`      ✓ JSON extracted successfully`)

  return analysis
}

/**
 * Check if analysis file already exists
 */
function analysisExists(surahId: number, verseNumber: number): boolean {
  const filePath = path.join(ANALYSIS_DIR, `${surahId}-${verseNumber}.json`)
  return fs.existsSync(filePath)
}

/**
 * Save analysis to file
 */
function saveAnalysis(surahId: number, verseNumber: number, analysis: object): void {
  const filePath = path.join(ANALYSIS_DIR, `${surahId}-${verseNumber}.json`)
  fs.writeFileSync(filePath, JSON.stringify(analysis, null, 2))
}

/**
 * Format duration in human readable format
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

/**
 * Main seed function
 */
async function main() {
  console.log('='.repeat(60))
  console.log('Qalam Verse Analysis Seeder')
  console.log('='.repeat(60))
  console.log(`Backend:      ${LLM_BACKEND}`)
  if (LLM_BACKEND.toLowerCase() === 'lms' || LLM_BACKEND.toLowerCase() === 'lmstudio') {
    console.log(`LM Studio URL: ${LMS_BASE_URL}`)
    console.log(`Model:        ${LMS_MODEL}`)
  } else {
    console.log(`Ollama URL:   ${OLLAMA_BASE_URL}`)
    console.log(`Model:        ${OLLAMA_MODEL}`)
  }
  console.log(`Output:       ${ANALYSIS_DIR}`)
  console.log('='.repeat(60))
  console.log('')

  // Ensure analysis directory exists
  if (!fs.existsSync(ANALYSIS_DIR)) {
    fs.mkdirSync(ANALYSIS_DIR, { recursive: true })
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
    console.log(`📖 Surah ${surah.id}: ${surah.name} (${surah.nameArabic})`)
    console.log(`   Verses: ${surah.verseCount}`)
    console.log('─'.repeat(50))

    // Process each verse
    for (let verseNum = 1; verseNum <= surah.verseCount; verseNum++) {
      const verseId = `${surah.id}:${verseNum}`
      const currentTotal = processedCount + skippedCount + errorCount + 1
      const progress = ((currentTotal / totalVerses) * 100).toFixed(1)

      // Check if already exists
      if (analysisExists(surah.id, verseNum)) {
        skippedCount++
        console.log(`   ⏭️  [${progress}%] ${verseId} - Skipped (exists)`)
        continue
      }

      // Generate analysis
      const verseStart = Date.now()
      process.stdout.write(`   ⏳ [${progress}%] ${verseId} - Generating...`)

      try {
        const analysis = await generateVerseAnalysis(surah, verseNum)
        saveAnalysis(surah.id, verseNum, analysis)
        processedCount++

        const duration = Date.now() - verseStart
        console.log(`\r   ✅ [${progress}%] ${verseId} - Done (${formatDuration(duration)})`)
      } catch (error) {
        errorCount++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.log(`\r   ❌ [${progress}%] ${verseId} - Error: ${errorMessage}`)

        // Log error to file for debugging
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
  console.log(`✅ Processed: ${processedCount}`)
  console.log(`⏭️  Skipped:   ${skippedCount}`)
  console.log(`❌ Errors:    ${errorCount}`)
  console.log(`⏱️  Duration:  ${formatDuration(totalDuration)}`)
  console.log('='.repeat(60))

  if (errorCount > 0) {
    console.log(`\n⚠️  Check ${path.join(ANALYSIS_DIR, '_errors.log')} for error details`)
  }

  process.exit(errorCount > 0 ? 1 : 0)
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
