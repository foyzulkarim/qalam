import { NextRequest, NextResponse } from 'next/server'
import type { VerseAnalysis, AttemptFeedback } from '@/types'
import { callLLM, buildAssessmentPrompt, type AssessmentResult } from '@/lib/llm'

export const runtime = 'edge'

interface AssessmentRequest {
  verseId: string
  userTranslation: string
}

/**
 * Load verse analysis from static JSON file (Edge-compatible)
 */
async function getVerseAnalysisServer(verseId: string, baseUrl: string): Promise<VerseAnalysis | null> {
  const fileName = verseId.replace(':', '-')
  const url = `${baseUrl}/data/analysis/${fileName}.json`

  try {
    const response = await fetch(url)
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

/**
 * Load reference translation from quran.json (Edge-compatible)
 */
async function getReferenceTranslation(verseId: string, baseUrl: string): Promise<string | null> {
  const [surahId, verseNum] = verseId.split(':').map(Number)
  const url = `${baseUrl}/data/quran.json`

  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const quranData = await response.json()

    const surah = quranData.surahs.find((s: { id: number }) => s.id === surahId)
    if (!surah) return null

    const verse = surah.verses.find((v: { number: number }) => v.number === verseNum)
    if (!verse) return null

    return verse.translations['en.sahih'] || null
  } catch {
    return null
  }
}

/**
 * Convert AI response to AttemptFeedback format
 */
function toAttemptFeedback(assessment: AssessmentResult): AttemptFeedback {
  const score = assessment.score / 100 // Convert to 0-1 scale

  // Generate encouragement based on score
  let encouragement: string
  if (score >= 0.9) {
    encouragement = 'Excellent work! Your translation beautifully captures the meaning of this verse.'
  } else if (score >= 0.7) {
    encouragement = 'Great effort! You understood the verse well. Keep practicing to refine your skills.'
  } else if (score >= 0.5) {
    encouragement = 'Good start! Review the word meanings and try again to improve your understanding.'
  } else {
    encouragement = 'Keep learning! Use the word analysis to understand each part of the verse.'
  }

  return {
    overallScore: score,
    correctElements: assessment.correctElements,
    missedElements: assessment.missedElements,
    suggestions: [assessment.feedback],
    encouragement,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AssessmentRequest = await request.json()
    const { verseId, userTranslation } = body

    // Validate input
    if (!verseId || !userTranslation?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Missing verseId or userTranslation' },
        { status: 400 }
      )
    }

    // Get base URL for fetching static files
    const baseUrl = new URL(request.url).origin

    // Load verse data server-side
    const [analysis, referenceTranslation] = await Promise.all([
      getVerseAnalysisServer(verseId, baseUrl),
      getReferenceTranslation(verseId, baseUrl),
    ])

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: 'Verse analysis not available' },
        { status: 404 }
      )
    }

    if (!referenceTranslation) {
      return NextResponse.json(
        { success: false, error: 'Reference translation not available' },
        { status: 404 }
      )
    }

    // Build word meanings string from analysis
    const wordMeanings = analysis.words
      .map(w => `${w.arabic} = "${w.meaning}"`)
      .join(', ')

    // Build prompt and call LLM (backend selected via ASSESSMENT_BACKEND env)
    const prompt = buildAssessmentPrompt(
      analysis.verse.arabic,
      referenceTranslation,
      wordMeanings,
      userTranslation.trim()
    )

    const assessment = await callLLM(prompt)
    const feedback = toAttemptFeedback(assessment)

    return NextResponse.json({
      success: true,
      data: {
        feedback,
        referenceTranslation,
      },
    })
  } catch (error) {
    console.error('Assessment error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
