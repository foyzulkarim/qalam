'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Input, Card, Spinner } from '@/components/ui'
import { Navbar } from '@/components/Navbar'
import { cn } from '@/lib/utils'
import { getAllSurahs, getAnalysisManifest, type AnalysisManifest } from '@/lib/data'
import type { Surah } from '@/types'

type FilterType = 'all' | 'Meccan' | 'Medinan'

export default function BrowsePage() {
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [analysisManifest, setAnalysisManifest] = useState<AnalysisManifest | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => {
    async function loadData() {
      try {
        const [surahsData, manifest] = await Promise.all([
          getAllSurahs(),
          getAnalysisManifest(),
        ])
        setSurahs(surahsData)
        setAnalysisManifest(manifest)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredSurahs = surahs.filter((surah) => {
    const matchesSearch =
      surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.nameArabic.includes(searchQuery) ||
      surah.meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.id.toString() === searchQuery

    const matchesFilter = filter === 'all' || surah.revelationType === filter

    return matchesSearch && matchesFilter
  })

  // Helper to get analysis count for a surah
  const getAnalysisCount = (surahId: number): number => {
    if (!analysisManifest) return 0
    return analysisManifest.verses.filter(v => v.startsWith(`${surahId}:`)).length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Surahs</h1>
          <p className="text-gray-600 mt-1">
            Select a surah to practice translating its verses
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, number, or meaning..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'Meccan', 'Medinan'] as FilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  filter === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {type === 'all' ? 'All' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : filteredSurahs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No surahs found matching your search.</p>
          </div>
        ) : (
          <>
            {/* Surah Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSurahs.map((surah) => (
                <Link key={surah.id} href={`/browse/surah/${surah.id}`}>
                  <Card hover className="h-full">
                    <div className="flex items-start gap-4">
                      {/* Surah Number */}
                      <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-700 font-bold">{surah.id}</span>
                      </div>

                      {/* Surah Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{surah.name}</h3>
                            <p className="text-sm text-gray-500">{surah.meaning}</p>
                          </div>
                          <p className="font-arabic text-xl text-gray-700 flex-shrink-0" dir="rtl">
                            {surah.nameArabic}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                          <span>{surah.verseCount} verses</span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full',
                            surah.revelationType === 'Meccan' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                          )}>
                            {surah.revelationType}
                          </span>
                        </div>
                        {/* Analysis Progress Bar */}
                        {(() => {
                          const analyzed = getAnalysisCount(surah.id)
                          const total = surah.verseCount
                          const percentage = total > 0 ? Math.round((analyzed / total) * 100) : 0
                          return (
                            <div className="mt-2">
                              <div className="relative h-5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    percentage === 100 ? 'bg-primary-500' :
                                    percentage > 0 ? 'bg-amber-500' : 'bg-gray-300'
                                  )}
                                  style={{ width: `${Math.max(percentage, percentage > 0 ? 10 : 0)}%` }}
                                />
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                                  {analyzed}/{total} analyzed
                                </span>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Stats Footer */}
            <div className="mt-8 text-center text-sm text-gray-500">
              Showing {filteredSurahs.length} of {surahs.length} surahs
            </div>
          </>
        )}
      </main>
    </div>
  )
}
