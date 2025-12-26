'use client'

import { use, useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Button, Card, Spinner, Alert } from '@/components/ui'
import { Navbar } from '@/components/Navbar'
import { cn } from '@/lib/utils'
import { getQuranSurah, getAnalysisManifest } from '@/lib/data'
import { getMemorizationStore, type MemorizedVerseData } from '@/lib/memorization'
import type { QuranSurah } from '@/types'

// Generate verse range tabs (e.g., [1-50], [51-100], etc.)
const VERSES_PER_TAB = 50

function generateRangeTabs(totalVerses: number): { start: number; end: number; label: string }[] {
  if (totalVerses <= VERSES_PER_TAB) return []

  const tabs = []
  for (let start = 1; start <= totalVerses; start += VERSES_PER_TAB) {
    const end = Math.min(start + VERSES_PER_TAB - 1, totalVerses)
    tabs.push({
      start,
      end,
      label: `${start}-${end}`,
    })
  }
  return tabs
}

export default function SurahDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const surahId = parseInt(id, 10)

  const [surah, setSurah] = useState<QuranSurah | null>(null)
  const [availableAnalyses, setAvailableAnalyses] = useState<Set<string>>(new Set())
  const [memorizedVerses, setMemorizedVerses] = useState<Map<string, MemorizedVerseData>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeRange, setActiveRange] = useState<{ start: number; end: number } | null>(null)

  // Load memorized verses from localStorage (client-side only)
  useEffect(() => {
    const store = getMemorizationStore()
    const verseMap = new Map(store.verses.map(v => [v.verseId, v]))
    setMemorizedVerses(verseMap)
  }, [])

  // Generate range tabs based on verse count
  const rangeTabs = useMemo(() => {
    if (!surah) return []
    return generateRangeTabs(surah.verseCount)
  }, [surah])

  // Filter verses based on active range
  const displayedVerses = useMemo(() => {
    if (!surah) return []
    const verses = surah.verses
    if (!activeRange) return verses
    return verses.filter(
      v => v.number >= activeRange.start && v.number <= activeRange.end
    )
  }, [surah, activeRange])

  // Set initial range when surah loads
  useEffect(() => {
    if (surah && rangeTabs.length > 0 && !activeRange) {
      setActiveRange({ start: rangeTabs[0].start, end: rangeTabs[0].end })
    }
  }, [surah, rangeTabs, activeRange])

  useEffect(() => {
    async function loadData() {
      try {
        // Load surah with verses from quran.json and manifest in parallel
        const [surahData, manifest] = await Promise.all([
          getQuranSurah(surahId),
          getAnalysisManifest(),
        ])

        if (!surahData) {
          setError('Surah not found.')
          return
        }

        setSurah(surahData)
        setAvailableAnalyses(new Set(manifest.verses))
      } catch (err) {
        console.error('Failed to load surah:', err)
        setError('Failed to load surah data.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [surahId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        </main>
      </div>
    )
  }

  if (error || !surah) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="mb-6 text-sm">
            <ol className="flex items-center gap-2 text-gray-500">
              <li>
                <Link href="/browse" className="hover:text-gray-700">
                  Browse
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Surah {surahId}</li>
            </ol>
          </nav>
          <Alert variant="warning" title="Not Found">
            {error || 'This surah could not be found.'}
          </Alert>
          <div className="mt-6">
            <Link href="/browse">
              <Button variant="outline">Back to Browse</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // Count how many verses have analysis available for this surah
  const analysisCount = surah.verses.filter(v =>
    availableAnalyses.has(`${surah.id}:${v.number}`)
  ).length

  // Check if first verse has analysis for the "Start from Verse 1" button
  const firstVerseHasAnalysis = availableAnalyses.has(`${surah.id}:1`)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center gap-2 text-gray-500">
            <li>
              <Link href="/browse" className="hover:text-gray-700">
                Browse
              </Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium">{surah.name}</li>
          </ol>
        </nav>

        {/* Surah Header */}
        <div className="bg-primary-700 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-primary-100 text-sm">Surah {surah.id}</span>
                <span className={cn(
                  'text-xs px-2 py-1 rounded-full',
                  surah.revelationType === 'Meccan' ? 'bg-amber-400/30 text-amber-100' : 'bg-blue-400/30 text-blue-100'
                )}>
                  {surah.revelationType}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-1">{surah.name}</h1>
              <p className="text-primary-200">{surah.meaning}</p>
            </div>
            <div className="text-right">
              <p className="font-arabic text-4xl text-white mb-2" dir="rtl">
                {surah.nameArabic}
              </p>
              <p className="text-primary-200 text-sm">{surah.verseCount} verses</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {firstVerseHasAnalysis && (
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <Link href={`/browse/surah/${surah.id}/1`} className="flex-1">
              <Button className="w-full" size="lg">
                Start from Verse 1
              </Button>
            </Link>
          </div>
        )}

        {/* Availability Notice */}
        {analysisCount < surah.verseCount && analysisCount > 0 && (
          <Alert variant="info" className="mb-6">
            {`${analysisCount} of ${surah.verseCount} verses have analysis available for practice.`}
          </Alert>
        )}

        {/* Memorization Progress */}
        {(() => {
          const surahVerses = Array.from(memorizedVerses.entries()).filter(
            ([id]) => id.startsWith(`${surah.id}:`)
          )
          const memorizedInSurah = surahVerses.length
          if (memorizedInSurah === 0) return null

          // Check if surah is perfect (all verses memorized with 100%)
          const isPerfectSurah = memorizedInSurah === surah.verseCount &&
            surahVerses.every(([, data]) => data.highScore >= 1.0)

          return (
            <div className={cn(
              'mb-6 flex items-center gap-3 p-4 rounded-lg border',
              isPerfectSurah
                ? 'bg-amber-50 border-amber-300'
                : 'bg-secondary-50 border-secondary-200'
            )}>
              {isPerfectSurah ? (
                <span className="text-2xl">⭐</span>
              ) : (
                <svg className="w-6 h-6 text-secondary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
              <span className={cn(
                'font-medium',
                isPerfectSurah ? 'text-amber-800' : 'text-secondary-800'
              )}>
                {isPerfectSurah
                  ? `Perfect! All ${surah.verseCount} verses memorized with 100%`
                  : `${memorizedInSurah} of ${surah.verseCount} verses memorized`
                }
              </span>
            </div>
          )
        })()}

        {/* Verses List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Verses
            <span className="text-gray-500 font-normal ml-2">({surah.verseCount})</span>
          </h2>

          {/* Range Tabs for large surahs */}
          {rangeTabs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {rangeTabs.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveRange({ start: tab.start, end: tab.end })}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    activeRange?.start === tab.start
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Verse Cards */}
          <div className="flex flex-col gap-3">
            {displayedVerses.map((verse) => {
              const verseId = `${surah.id}:${verse.number}`
              const hasAnalysis = availableAnalyses.has(verseId)

              if (hasAnalysis) {
                const verseData = memorizedVerses.get(verseId)
                const isMemorized = !!verseData
                const isPerfect = isMemorized && verseData.highScore >= 1.0

                return (
                  <Link key={verseId} href={`/browse/surah/${surah.id}/${verse.number}`}>
                    <Card hover className="group py-3">
                      <div className="flex items-center gap-4">
                        {/* Verse Number - with memorized/perfect indicator */}
                        <div className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                          isPerfect
                            ? 'bg-amber-100 ring-2 ring-amber-400 group-hover:bg-amber-200'
                            : isMemorized
                              ? 'bg-secondary-100 ring-2 ring-secondary-400 group-hover:bg-secondary-200'
                              : 'bg-primary-100 group-hover:bg-primary-200'
                        )}>
                          {isPerfect ? (
                            <span className="text-lg">⭐</span>
                          ) : isMemorized ? (
                            <svg className="w-5 h-5 text-secondary-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className="text-primary-700 font-semibold text-sm">{verse.number}</span>
                          )}
                        </div>

                        {/* Arabic Text */}
                        <p
                          className="font-arabic text-xl text-gray-900 leading-relaxed flex-1"
                          dir="rtl"
                          lang="ar"
                        >
                          {verse.arabic}
                        </p>

                        {/* Memorized/Perfect badge */}
                        {isMemorized && (
                          <span className={cn(
                            'text-xs font-medium px-2 py-1 rounded-full flex-shrink-0',
                            isPerfect
                              ? 'text-amber-700 bg-amber-50'
                              : 'text-secondary-600 bg-secondary-50'
                          )}>
                            {isPerfect ? 'Perfect!' : 'Memorized'}
                          </span>
                        )}
                      </div>
                    </Card>
                  </Link>
                )
              }

              // Verse without analysis - show Arabic but not clickable
              return (
                <Card key={verseId} className="opacity-60 py-3">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-400 font-semibold text-sm">{verse.number}</span>
                    </div>
                    <p
                      className="font-arabic text-xl text-gray-500 leading-relaxed flex-1"
                      dir="rtl"
                      lang="ar"
                    >
                      {verse.arabic}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
