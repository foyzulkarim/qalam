'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Button, Card, Spinner, Alert } from '@/components/ui'
import { FeedbackCard } from '@/components/FeedbackCard'
import { Navbar } from '@/components/Navbar'
import { cn } from '@/lib/utils'
import { getScoreColor, formatDate, formatRelativeDate } from '@/lib/formatters'
import {
  getAllAttempts,
  getAttemptsByVerse,
  getHistoryStats,
  clearAllHistory,
  type StoredAttempt
} from '@/lib/attemptHistory'
import { getAllSurahs } from '@/lib/data'
import type { Surah } from '@/types'

type ViewMode = 'timeline' | 'by-verse'
type SortOrder = 'newest' | 'oldest'

export default function HistoryPage() {
  const [attempts, setAttempts] = useState<StoredAttempt[]>([])
  const [attemptsByVerse, setAttemptsByVerse] = useState<Record<string, StoredAttempt[]>>({})
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('timeline')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [surahFilter, setSurahFilter] = useState<number | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        setError(null)
        setLoading(true)
        const [surahsData] = await Promise.all([getAllSurahs()])
        setSurahs(surahsData)

        // Load attempts from localStorage
        setAttempts(getAllAttempts())
        setAttemptsByVerse(getAttemptsByVerse())
      } catch (error) {
        console.error('Failed to load surahs:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to load surah data'
        setError(`Unable to load surah information: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleRetry = () => {
    const loadData = async () => {
      try {
        setError(null)
        setLoading(true)
        const [surahsData] = await Promise.all([getAllSurahs()])
        setSurahs(surahsData)
      } catch (error) {
        console.error('Failed to load surahs:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to load surah data'
        setError(`Unable to load surah information: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }

  const stats = getHistoryStats()

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleClearAll = () => {
    clearAllHistory()
    setAttempts([])
    setAttemptsByVerse({})
    setShowClearConfirm(false)
  }

  // Get surah name from verseId
  const getSurahName = (verseId: string): string => {
    const surahId = parseInt(verseId.split(':')[0], 10)
    const surah = surahs.find(s => s.id === surahId)
    return surah?.name || `Surah ${surahId}`
  }

  // Filter and sort attempts
  const filteredAttempts = useMemo(() => {
    return attempts
      .filter(a => !surahFilter || a.verseId.startsWith(`${surahFilter}:`))
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime()
        const timeB = new Date(b.timestamp).getTime()
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB
      })
  }, [attempts, surahFilter, sortOrder])

  // Filter attempts by verse
  const filteredAttemptsByVerse = useMemo(() => {
    return Object.entries(attemptsByVerse)
      .filter(([verseId]) => !surahFilter || verseId.startsWith(`${surahFilter}:`))
      .sort((a, b) => {
        // Sort by most recent attempt in each group
        const latestA = new Date(a[1][0]?.timestamp || 0).getTime()
        const latestB = new Date(b[1][0]?.timestamp || 0).getTime()
        return sortOrder === 'newest' ? latestB - latestA : latestA - latestB
      })
  }, [attemptsByVerse, surahFilter, sortOrder])

  // Get unique surah IDs from attempts
  const surahsWithAttempts = [...new Set(attempts.map(a => parseInt(a.verseId.split(':')[0], 10)))]
    .sort((a, b) => a - b)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Attempt History</h1>
          <p className="text-gray-600 mt-1">
            Review your past translation attempts and track your progress
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert
              variant="error"
              title="Failed to Load Surah Data"
              onDismiss={() => setError(null)}
            >
              <p className="mb-3">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                className="bg-white hover:bg-red-50"
              >
                Try Again
              </Button>
            </Alert>
          </div>
        )}

        {attempts.length === 0 ? (
          <Card>
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No attempts yet</h2>
              <p className="text-gray-500 mb-6">Start practicing to see your history here.</p>
              <Link href="/browse">
                <Button>Browse Verses</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="mb-8 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6 border border-primary-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Your Statistics</h2>
                  <p className="text-gray-600 text-sm">Keep practicing to improve!</p>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{stats.totalAttempts}</div>
                    <div className="text-xs text-gray-500">Total Attempts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary-600">{stats.versesAttempted}</div>
                    <div className="text-xs text-gray-500">Verses Practiced</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">
                      {Math.round(stats.averageScore * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">Average Score</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('timeline')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    viewMode === 'timeline'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setViewMode('by-verse')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    viewMode === 'by-verse'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  By Verse
                </button>
              </div>

              {/* Surah Filter */}
              <select
                value={surahFilter || ''}
                onChange={(e) => setSurahFilter(e.target.value ? parseInt(e.target.value, 10) : null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Surahs</option>
                {surahsWithAttempts.map(surahId => {
                  const surah = surahs.find(s => s.id === surahId)
                  return (
                    <option key={surahId} value={surahId}>
                      {surahId}. {surah?.name || `Surah ${surahId}`}
                    </option>
                  )
                })}
              </select>

              {/* Sort Order */}
              <button
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm bg-white hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
              </button>
            </div>

            {/* Timeline View */}
            {viewMode === 'timeline' && (
              <div className="space-y-3">
                {filteredAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="border border-gray-200 rounded-lg overflow-hidden bg-white"
                  >
                    {/* Attempt header */}
                    <button
                      onClick={() => toggleExpand(attempt.id)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/browse/surah/${attempt.verseId.split(':')[0]}/${attempt.verseId.split(':')[1]}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {getSurahName(attempt.verseId)} {attempt.verseId.split(':')[1]}
                        </Link>
                        <span className={cn(
                          'px-2 py-1 text-sm font-medium rounded border',
                          getScoreColor(attempt.feedback.overallScore)
                        )}>
                          {Math.round(attempt.feedback.overallScore * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500" title={formatDate(attempt.timestamp)}>
                          {formatRelativeDate(attempt.timestamp)}
                        </span>
                        <svg
                          className={cn(
                            'w-5 h-5 text-gray-400 transition-transform',
                            expandedId === attempt.id && 'rotate-180'
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded content */}
                    {expandedId === attempt.id && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
                        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Your translation</p>
                          <p className="text-gray-700 italic">&quot;{attempt.userTranslation}&quot;</p>
                        </div>
                        <FeedbackCard feedback={attempt.feedback} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* By Verse View */}
            {viewMode === 'by-verse' && (
              <div className="space-y-4">
                {filteredAttemptsByVerse.map(([verseId, verseAttempts]) => (
                  <Card key={verseId}>
                    <div className="flex items-center justify-between mb-4">
                      <Link
                        href={`/browse/surah/${verseId.split(':')[0]}/${verseId.split(':')[1]}`}
                        className="text-lg font-semibold text-primary-600 hover:text-primary-700"
                      >
                        {getSurahName(verseId)} - Verse {verseId.split(':')[1]}
                      </Link>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{verseAttempts.length} attempt{verseAttempts.length !== 1 ? 's' : ''}</span>
                        <span>Best: <span className="font-medium text-success-600">{Math.round(Math.max(...verseAttempts.map(a => a.feedback.overallScore)) * 100)}%</span></span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {verseAttempts.slice(0, 5).map((attempt, index) => (
                        <div
                          key={attempt.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400">#{verseAttempts.length - index}</span>
                            <span className={cn(
                              'px-2 py-0.5 text-xs font-medium rounded border',
                              getScoreColor(attempt.feedback.overallScore)
                            )}>
                              {Math.round(attempt.feedback.overallScore * 100)}%
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{formatRelativeDate(attempt.timestamp)}</span>
                        </div>
                      ))}
                      {verseAttempts.length > 5 && (
                        <p className="text-xs text-gray-400 text-center py-1">
                          +{verseAttempts.length - 5} more attempts
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Clear History */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              {showClearConfirm ? (
                <div className="flex items-center justify-center gap-4">
                  <span className="text-sm text-gray-600">Are you sure?</span>
                  <Button variant="danger" size="sm" onClick={handleClearAll}>
                    Yes, clear all
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowClearConfirm(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-sm text-gray-500 hover:text-error-600 transition-colors"
                  >
                    Clear all history
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
