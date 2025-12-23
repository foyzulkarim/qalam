'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button, Card, CardHeader, CardTitle, CardContent, Textarea, Alert, Spinner } from '@/components/ui'
import { VerseDisplay } from '@/components/VerseDisplay'
import { FeedbackCard } from '@/components/FeedbackCard'
import { Navbar } from '@/components/Navbar'
import { cn } from '@/lib/utils'
import { getSurahById, getRandomVerse, getVerseAnalysis } from '@/lib/data'
import type { AttemptFeedback, WordAnalysis, VerseAnalysis, Verse, Surah } from '@/types'

// Default analysis for verses without pre-computed analysis (verse 1:1)
const defaultAnalysis: WordAnalysis[] = [
  {
    wordNumber: 1,
    arabic: 'بِسْمِ',
    transliteration: 'bismi',
    meaning: 'In the name of',
    root: { letters: 'س-م-و', transliteration: 's-m-w', meaning: 'to be elevated; name' },
    grammaticalCategory: 'prepositional phrase'
  },
  {
    wordNumber: 2,
    arabic: 'اللَّهِ',
    transliteration: 'Allāhi',
    meaning: 'Allah/God',
    root: { letters: 'أ-ل-ه', transliteration: 'ʾ-l-h', meaning: 'to worship, deity' },
    grammaticalCategory: 'proper noun'
  },
  {
    wordNumber: 3,
    arabic: 'الرَّحْمَٰنِ',
    transliteration: 'ar-Raḥmāni',
    meaning: 'The Most Gracious',
    root: { letters: 'ر-ح-م', transliteration: 'r-ḥ-m', meaning: 'mercy, compassion' },
    grammaticalCategory: 'adjective/name'
  },
  {
    wordNumber: 4,
    arabic: 'الرَّحِيمِ',
    transliteration: 'ar-Raḥīmi',
    meaning: 'The Most Merciful',
    root: { letters: 'ر-ح-م', transliteration: 'r-ḥ-m', meaning: 'mercy, compassion' },
    grammaticalCategory: 'adjective/name'
  },
]

// Mock feedback generator (will be replaced with LLM evaluation)
function generateMockFeedback(score: number): AttemptFeedback {
  const isExcellent = score >= 0.9
  const isGood = score >= 0.7

  return {
    overallScore: score,
    correctElements: isExcellent
      ? ['Excellent understanding of the verse', 'Proper translation of divine attributes', 'Good grammatical structure']
      : isGood
      ? ['Captured the core meaning', 'Good use of English phrasing']
      : ['Basic meaning understood'],
    missedElements: isExcellent
      ? []
      : isGood
      ? ['Consider using "the Most" before Gracious and Merciful for emphasis']
      : ['Missing some key elements', 'Translation could be more precise'],
    suggestions: [
      'Both الرَّحْمَٰنِ and الرَّحِيمِ derive from the root ر-ح-م meaning mercy',
      'The "Bismillah" is recited before beginning any good deed',
    ],
    encouragement: isExcellent
      ? 'Excellent work! Your translation beautifully captures the meaning.'
      : isGood
      ? 'Great effort! You understood the verse well.'
      : 'Good start! Keep practicing to improve your understanding.',
  }
}

type ViewState = 'practice' | 'feedback' | 'analysis'

interface VerseData {
  verse: Verse
  surah: Surah
  totalVerses: number
}

function PracticeContent() {
  const searchParams = useSearchParams()
  const verseIdParam = searchParams.get('verseId')

  const [verseData, setVerseData] = useState<VerseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [userTranslation, setUserTranslation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewState, setViewState] = useState<ViewState>('practice')
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState<AttemptFeedback | null>(null)
  const [hintsRevealed, setHintsRevealed] = useState(0)
  const [showHints, setShowHints] = useState(false)
  const [verseAnalysis, setVerseAnalysis] = useState<VerseAnalysis | null>(null)

  // Use loaded analysis or fall back to default
  const analysis = verseAnalysis?.words || defaultAnalysis

  // Load verse data
  useEffect(() => {
    async function loadVerseData() {
      setLoading(true)
      setLoadError(null)

      try {
        if (verseIdParam) {
          // Load specific verse
          const [surahIdStr, verseNumStr] = verseIdParam.split(':')
          const surahId = parseInt(surahIdStr, 10)
          const verseNum = parseInt(verseNumStr, 10)

          const surah = await getSurahById(surahId)
          if (!surah) {
            setLoadError('Surah data not available yet.')
            return
          }

          const verse = surah.verses.find(v => v.verseNumber === verseNum)
          if (!verse) {
            setLoadError('Verse not found.')
            return
          }

          setVerseData({
            verse,
            surah: {
              id: surah.id,
              name: surah.name,
              nameArabic: surah.nameArabic,
              meaning: surah.meaning,
              verseCount: surah.verseCount,
              revelationType: surah.revelationType,
            },
            totalVerses: surah.verses.length,
          })

          // Try to load verse analysis
          const analysisData = await getVerseAnalysis(verse.id)
          if (analysisData) {
            setVerseAnalysis(analysisData)
          }
        } else {
          // Load random verse for quick practice
          const randomVerse = await getRandomVerse()
          if (!randomVerse) {
            setLoadError('No verse data available.')
            return
          }

          const surah = await getSurahById(randomVerse.surahId)
          if (!surah) {
            setLoadError('Surah data not available.')
            return
          }

          setVerseData({
            verse: randomVerse,
            surah: {
              id: surah.id,
              name: surah.name,
              nameArabic: surah.nameArabic,
              meaning: surah.meaning,
              verseCount: surah.verseCount,
              revelationType: surah.revelationType,
            },
            totalVerses: surah.verses.length,
          })

          // Try to load verse analysis
          const analysisData = await getVerseAnalysis(randomVerse.id)
          if (analysisData) {
            setVerseAnalysis(analysisData)
          }
        }
      } catch (err) {
        console.error('Failed to load verse:', err)
        setLoadError('Failed to load verse data.')
      } finally {
        setLoading(false)
      }
    }

    loadVerseData()
  }, [verseIdParam])

  const handleSubmit = useCallback(async () => {
    if (!userTranslation.trim()) {
      setError('Please enter your translation before submitting.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      // TODO: Call evaluation API
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Generate mock score based on translation length/content
      const baseScore = Math.min(0.95, 0.5 + (userTranslation.length / 100) * 0.3 + Math.random() * 0.2)
      const hintsPenalty = hintsRevealed * 0.05
      const finalScore = Math.max(0.3, baseScore - hintsPenalty)

      setFeedback(generateMockFeedback(finalScore))
      setViewState('feedback')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [userTranslation, hintsRevealed])

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
    setViewState('practice')
    setHintsRevealed(0)
    setShowHints(false)
  }

  const handleNextVerse = () => {
    if (!verseData) return

    const nextVerseNum = verseData.verse.verseNumber + 1
    if (nextVerseNum <= verseData.totalVerses) {
      const nextVerseId = `${verseData.surah.id}:${nextVerseNum}`
      window.location.href = `/practice?verseId=${nextVerseId}`
    } else {
      // Go back to surah page if no more verses
      window.location.href = `/browse/surah/${verseData.surah.id}`
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      </main>
    )
  }

  if (loadError || !verseData) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Alert variant="warning" title="Verse Not Available">
          {loadError || 'Unable to load verse data.'}
        </Alert>
        <div className="mt-6 flex gap-4">
          <Link href="/browse">
            <Button variant="outline">Browse Surahs</Button>
          </Link>
          <Link href="/practice">
            <Button>Try Random Verse</Button>
          </Link>
        </div>
      </main>
    )
  }

  const { verse, surah, totalVerses } = verseData

  return (
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

        {/* Progress in surah */}
        <div className="text-sm text-gray-500">
          <span className="font-medium text-gray-900">{verse.verseNumber}</span>
          <span> of {totalVerses}</span>
        </div>
      </div>

      {/* Verse Display */}
      <VerseDisplay
        arabic={verse.textArabic}
        surahName={surah.name}
        verseNumber={verse.verseNumber}
        size="xl"
        className="mb-8"
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
                {isSubmitting ? 'Evaluating...' : 'Submit Translation'}
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
          </CardContent>
        </Card>
      )}

      {viewState === 'feedback' && feedback && (
        <div className="space-y-6">
          {/* Score Celebration for 90%+ */}
          {feedback.overallScore >= 0.9 && (
            <div className="text-center py-4 animate-fade-in">
              <div className="text-6xl mb-2">🌟</div>
              <p className="text-xl font-semibold text-success-600">Excellent!</p>
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
              <p className="text-gray-700 text-lg">{verse.textEnglish}</p>
            </CardContent>
          </Card>

          {/* Feedback */}
          <FeedbackCard feedback={feedback} />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleTryAgain} variant="outline" className="flex-1" size="lg">
              Try Again
            </Button>
            <Button onClick={() => setViewState('analysis')} variant="outline" className="flex-1" size="lg">
              View Word Analysis
            </Button>
            <Button onClick={handleNextVerse} className="flex-1" size="lg">
              {verse.verseNumber < totalVerses ? 'Next Verse' : 'Back to Surah'}
            </Button>
          </div>
        </div>
      )}

      {viewState === 'analysis' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Word-by-Word Analysis</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewState(feedback ? 'feedback' : 'practice')}
              >
                Back
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-right font-medium text-gray-500 text-sm">Arabic</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">Transliteration</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">Meaning</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">Root</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-500 text-sm">Grammar</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.map((word, index) => (
                    <tr key={index} className={cn(
                      'border-b border-gray-100 hover:bg-gray-50',
                      hintsRevealed > 0 && index < hintsRevealed && 'bg-amber-50'
                    )}>
                      <td className="py-4 px-4 text-right font-arabic text-xl text-gray-900" dir="rtl">
                        {word.arabic}
                      </td>
                      <td className="py-4 px-4 text-gray-700 italic">
                        {word.transliteration}
                      </td>
                      <td className="py-4 px-4 text-gray-900 font-medium">
                        {word.meaning}
                      </td>
                      <td className="py-4 px-4 text-gray-600 font-arabic" dir="rtl">
                        {word.root?.letters || '—'}
                      </td>
                      <td className="py-4 px-4 text-gray-500 text-sm">
                        {word.grammaticalCategory || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => setViewState('practice')} variant="outline">
                Practice This Verse
              </Button>
              <Button onClick={handleNextVerse}>
                {verse.verseNumber < totalVerses ? 'Next Verse' : 'Back to Surah'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}

function PracticeLoading() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    </main>
  )
}

export default function PracticePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={<PracticeLoading />}>
        <PracticeContent />
      </Suspense>
    </div>
  )
}
