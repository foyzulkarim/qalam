'use client'

import { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Card, CardHeader, CardTitle, CardContent, Textarea, Alert, Spinner } from '@/components/ui'
import { VerseDisplay } from '@/components/VerseDisplay'
import { FeedbackCard } from '@/components/FeedbackCard'
import { Navbar } from '@/components/Navbar'
import { cn } from '@/lib/utils'
import { getVerseAnalysis, getSurahMetadata } from '@/lib/data'
import { saveLastVerse } from '@/lib/lastVerse'
import { markVerseMemorized, getMemorizedVerse, unmemorizeVerse, type MemorizedVerseData } from '@/lib/memorization'
import type { AttemptFeedback, WordAnalysis, VerseAnalysis, Verse, Surah } from '@/types'

// Default analysis for verses without pre-computed analysis (verse 1:1)
const defaultAnalysis: WordAnalysis[] = [
  {
    wordNumber: 1,
    arabic: 'بِسْمِ',
    transliteration: 'bismi',
    meaning: 'In the name of',
    root: { letters: 'س-م-و', meaning: 'to be elevated; name' },
    components: [
      { arabic: 'بِ', meaning: 'in/with' },
      { arabic: 'اسْم', meaning: 'name' },
    ],
  },
  {
    wordNumber: 2,
    arabic: 'اللَّهِ',
    transliteration: 'Allāhi',
    meaning: 'Allah/God',
  },
  {
    wordNumber: 3,
    arabic: 'الرَّحْمَٰنِ',
    transliteration: 'ar-Raḥmāni',
    meaning: 'The Most Gracious',
    root: { letters: 'ر-ح-م', meaning: 'mercy, compassion' },
  },
  {
    wordNumber: 4,
    arabic: 'الرَّحِيمِ',
    transliteration: 'ar-Raḥīmi',
    meaning: 'The Most Merciful',
    root: { letters: 'ر-ح-م', meaning: 'mercy, compassion' },
  },
]

// API URL for assessment (Worker in production, local API in dev)
const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

type ViewState = 'practice' | 'feedback' | 'analysis'

interface VerseData {
  verse: Verse
  surah: Surah
  totalVerses: number
}

export default function VersePracticeClient({ params }: { params: Promise<{ id: string; verse: string }> }) {
  const { id, verse: verseParam } = use(params)
  const surahId = parseInt(id, 10)
  const verseNum = parseInt(verseParam, 10)
  const verseId = `${surahId}:${verseNum}`

  const router = useRouter()

  const [verseData, setVerseData] = useState<VerseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [userTranslation, setUserTranslation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewState, setViewState] = useState<ViewState>('practice')
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState<AttemptFeedback | null>(null)
  const [referenceTranslation, setReferenceTranslation] = useState<string>('')
  const [hintsRevealed, setHintsRevealed] = useState(0)
  const [showHints, setShowHints] = useState(false)
  const [verseAnalysis, setVerseAnalysis] = useState<VerseAnalysis | null>(null)
  const [memorizedData, setMemorizedData] = useState<MemorizedVerseData | null>(null)

  // Check memorization status on mount and when verseId changes
  useEffect(() => {
    setMemorizedData(getMemorizedVerse(verseId))
  }, [verseId])

  // Derived state for convenience
  const isMemorized = !!memorizedData
  const isPerfect = isMemorized && memorizedData.highScore >= 1.0

  // Use loaded analysis or fall back to default
  const analysis = verseAnalysis?.words || defaultAnalysis

  // Load verse data from analysis files
  useEffect(() => {
    async function loadVerseData() {
      setLoading(true)
      setLoadError(null)

      try {
        // Load verse analysis directly
        const analysisData = await getVerseAnalysis(verseId)
        if (!analysisData) {
          setLoadError('Verse analysis not available yet.')
          return
        }

        setVerseAnalysis(analysisData)

        // Load surah metadata for verse count and navigation
        const surahMeta = await getSurahMetadata(surahId)

        // Build verse object from analysis data
        const verse: Verse = {
          id: analysisData.verseId,
          surahId: surahId,
          verseNumber: verseNum,
          textArabic: analysisData.verse.arabic,
          textEnglish: (analysisData.verse as { english?: string }).english || '',
          transliteration: analysisData.verse.transliteration,
        }

        setVerseData({
          verse,
          surah: {
            id: surahId,
            name: surahMeta?.name ?? analysisData.verse.surah,
            nameArabic: surahMeta?.nameArabic ?? '',
            meaning: surahMeta?.meaning ?? '',
            verseCount: surahMeta?.verseCount ?? 0,
            revelationType: surahMeta?.revelationType ?? 'Meccan',
          },
          totalVerses: surahMeta?.verseCount ?? 0,
        })

        // Save as last viewed verse
        saveLastVerse(surahId, verseNum)
      } catch (err) {
        console.error('Failed to load verse:', err)
        setLoadError('Failed to load verse data.')
      } finally {
        setLoading(false)
      }
    }

    loadVerseData()
  }, [verseId, surahId, verseNum])

  const handleSubmit = useCallback(async () => {
    if (!userTranslation.trim()) {
      setError('Please enter your translation before submitting.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      // Call assessment API (Worker in production, /api route in dev)
      const endpoint = API_URL ? `${API_URL}/assess` : '/api/assess-translation'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verseId,
          userTranslation: userTranslation.trim(),
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Assessment failed')
      }

      // Apply hints penalty to the score
      const hintsPenalty = hintsRevealed * 0.05
      const adjustedScore = Math.max(0.1, result.data.feedback.overallScore - hintsPenalty)

      setFeedback({
        ...result.data.feedback,
        overallScore: adjustedScore,
      })
      setReferenceTranslation(result.data.referenceTranslation || '')
      setViewState('feedback')

      // Mark verse as memorized if score >= 90%
      if (adjustedScore >= 0.9) {
        markVerseMemorized(verseId, adjustedScore)
        setMemorizedData(getMemorizedVerse(verseId))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message + '. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [userTranslation, verseId, hintsRevealed])

  // Keyboard shortcut for submit
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && viewState === 'practice') {
      handleSubmit()
    }
  }, [viewState, handleSubmit])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleTryAgain = () => {
    setUserTranslation('')
    setFeedback(null)
    setReferenceTranslation('')
    setViewState('practice')
    setHintsRevealed(0)
    setShowHints(false)
  }

  const handleNextVerse = () => {
    if (!verseData) return

    const nextVerseNum = verseData.verse.verseNumber + 1
    if (nextVerseNum <= verseData.totalVerses) {
      router.push(`/browse/surah/${verseData.surah.id}/${nextVerseNum}`)
    } else {
      // Go back to surah page if no more verses
      router.push(`/browse/surah/${verseData.surah.id}`)
    }
  }

  const handlePreviousVerse = () => {
    if (!verseData) return

    const prevVerseNum = verseData.verse.verseNumber - 1
    if (prevVerseNum >= 1) {
      router.push(`/browse/surah/${verseData.surah.id}/${prevVerseNum}`)
    }
  }

  const revealHint = () => {
    if (hintsRevealed < analysis.length) {
      setHintsRevealed(hintsRevealed + 1)
      setShowHints(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        </main>
      </div>
    )
  }

  if (loadError || !verseData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Alert variant="warning" title="Verse Not Available">
            {loadError || 'Unable to load verse data.'}
          </Alert>
          <div className="mt-6 flex gap-4">
            <Link href="/browse">
              <Button variant="outline">Browse Surahs</Button>
            </Link>
            <Link href={`/browse/surah/${surahId}`}>
              <Button>Back to Surah</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const { verse, surah, totalVerses } = verseData

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb & Progress */}
        <div className="flex items-center justify-between mb-6">
          <nav className="text-sm">
            <ol className="flex items-center gap-2 text-gray-500">
              <li>
                <Link href="/browse" className="hover:text-gray-700">
                  Browse
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href={`/browse/surah/${surah.id}`} className="hover:text-gray-700">
                  {surah.name}
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Verse {verse.verseNumber}</li>
            </ol>
          </nav>

          <div className="flex items-center gap-3">
            {/* Memorization Status */}
            {isMemorized && (
              <div className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                isPerfect
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-secondary-100 text-secondary-700'
              )}>
                {isPerfect ? <span>⭐</span> : (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{Math.round((memorizedData?.highScore || 0) * 100)}%</span>
              </div>
            )}

            {/* Progress in surah */}
            {totalVerses > 0 && (
              <div className="text-sm text-gray-500">
                <span className="font-medium text-gray-900">{verse.verseNumber}</span>
                <span> of {totalVerses}</span>
              </div>
            )}
          </div>
        </div>

        {/* Verse Display */}
        <VerseDisplay
          arabic={verse.textArabic}
          surahName={surah.name}
          verseNumber={verse.verseNumber}
          size="xl"
          className="mb-8"
          colorizeWords={viewState === 'analysis'}
          variant={isPerfect ? 'perfect' : isMemorized ? 'memorized' : 'default'}
        />

        {/* Practice/Feedback Content */}
        {viewState === 'practice' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Translation</CardTitle>
                {hintsRevealed > 0 && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    {hintsRevealed} hint{hintsRevealed > 1 ? 's' : ''} used
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="error" className="mb-4" onDismiss={() => setError('')}>
                  {error}
                </Alert>
              )}

              {/* Hints Section */}
              {showHints && hintsRevealed > 0 && (
                <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-medium text-amber-800 mb-2">Word Hints:</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.slice(0, hintsRevealed).map((word, i) => (
                      <span key={i} className="text-sm bg-white px-2 py-1 rounded border border-amber-200">
                        <span className="font-arabic" dir="rtl">{word.arabic}</span>
                        <span className="text-gray-500 mx-1">=</span>
                        <span className="text-amber-700">{word.meaning}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Textarea
                placeholder="Write your English translation of the verse above..."
                value={userTranslation}
                onChange={(e) => setUserTranslation(e.target.value)}
                className="min-h-[150px] text-lg"
              />

              <p className="mt-2 text-xs text-gray-400 text-right">
                Press Cmd/Ctrl + Enter to submit
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  className="flex-1"
                  size="lg"
                >
                  Submit Translation
                </Button>

                {hintsRevealed < analysis.length && (
                  <Button
                    variant="outline"
                    onClick={revealHint}
                    className="sm:w-auto"
                  >
                    Show Hint ({analysis.length - hintsRevealed} left)
                  </Button>
                )}
              </div>

              <div className="mt-4 flex justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setViewState('analysis')}
                  className="text-sm"
                >
                  View Word Analysis
                </Button>
              </div>

              {/* Navigation buttons */}
              <div className="mt-4 flex justify-between border-t pt-4">
                <Button
                  onClick={handlePreviousVerse}
                  variant="outline"
                  disabled={verse.verseNumber <= 1}
                >
                  ← Previous
                </Button>
                <Button
                  onClick={handleNextVerse}
                  variant="outline"
                >
                  {verse.verseNumber >= totalVerses ? 'Back to Surah' : 'Next →'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {viewState === 'feedback' && feedback && (
          <div className="space-y-6">
            {/* Score Celebration for 90%+ */}
            {feedback.overallScore >= 0.9 && (
              <div className="text-center py-4 animate-fade-in">
                {feedback.overallScore >= 1.0 ? (
                  <>
                    <div className="text-6xl mb-2">⭐</div>
                    <p className="text-xl font-semibold text-amber-600">Perfect!</p>
                    <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-amber-100 border border-amber-300 rounded-full">
                      <span className="text-lg">⭐</span>
                      <span className="text-sm font-medium text-amber-700">100% - Perfectly Memorized!</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-2">🌟</div>
                    <p className="text-xl font-semibold text-success-600">Excellent!</p>
                    <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-secondary-100 border border-secondary-300 rounded-full">
                      <svg className="w-5 h-5 text-secondary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-medium text-secondary-700">Verse Memorized!</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* User's Translation */}
            <Card>
              <CardHeader>
                <CardTitle>Your Translation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-lg italic">&quot;{userTranslation}&quot;</p>
              </CardContent>
            </Card>

            {/* Reference Translation */}
            <Card className="border-l-4 border-l-primary-500">
              <CardHeader>
                <CardTitle>Reference Translation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-lg">{referenceTranslation}</p>
              </CardContent>
            </Card>

            {/* Feedback */}
            <FeedbackCard feedback={feedback} />

            {/* Un-memorize Option */}
            {isMemorized && (
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    unmemorizeVerse(verseId)
                    setMemorizedData(null)
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Remove from memorized
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={handleTryAgain} variant="outline" className="flex-1" size="lg">
                Try Again
              </Button>
              <Button onClick={() => setViewState('analysis')} variant="outline" className="flex-1" size="lg">
                View Word Analysis
              </Button>
              <Button
                onClick={handlePreviousVerse}
                variant="outline"
                className="flex-1"
                size="lg"
                disabled={verse.verseNumber <= 1}
              >
                ← Previous
              </Button>
              <Button onClick={handleNextVerse} className="flex-1" size="lg">
                {verse.verseNumber >= totalVerses ? 'Back to Surah' : 'Next →'}
              </Button>
            </div>
          </div>
        )}

        {viewState === 'analysis' && (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Word-by-Word Analysis</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewState(feedback ? 'feedback' : 'practice')}
              >
                Back
              </Button>
            </div>

            {/* Word Cards */}
            <div className="space-y-4">
              {analysis.map((word, index) => (
                <div
                  key={index}
                  className={cn(
                    'border rounded-lg overflow-hidden',
                    hintsRevealed > 0 && index < hintsRevealed
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-gray-200 bg-white'
                  )}
                >
                  {/* Arabic + Transliteration Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="text-center">
                      <div className="font-arabic text-3xl text-gray-900 mb-1" dir="rtl">
                        {word.arabic}
                      </div>
                      <div className="text-gray-600 italic">
                        {word.transliteration}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* Meaning */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Meaning
                      </div>
                      <div className="text-lg font-medium text-gray-900">
                        {word.meaning}
                      </div>
                    </div>

                    {/* Components (if compound word) */}
                    {word.components && word.components.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Components
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {word.components.map((comp, i) => (
                            <div
                              key={i}
                              className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md px-3 py-1.5"
                            >
                              <span className="font-arabic text-lg" dir="rtl">{comp.arabic}</span>
                              <span className="text-blue-400">→</span>
                              <span className="text-blue-700 text-sm">{comp.meaning}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Root */}
                    {word.root && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Root
                        </div>
                        <div className="inline-flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-md px-3 py-2">
                          <span className="font-arabic text-xl text-teal-800" dir="rtl">
                            {word.root.letters}
                          </span>
                          <span className="text-teal-600 text-sm">
                            {word.root.meaning}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button onClick={() => setViewState('practice')} variant="outline">
                Practice This Verse
              </Button>
              <Button
                onClick={handlePreviousVerse}
                variant="outline"
                disabled={verse.verseNumber <= 1}
              >
                ← Previous
              </Button>
              <Button onClick={handleNextVerse}>
                {verse.verseNumber >= totalVerses ? 'Back to Surah' : 'Next →'}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
