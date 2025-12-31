'use client'

import { useState, useMemo } from 'react'
import { Modal, Button } from './ui'
import { FeedbackCard } from './FeedbackCard'
import { cn } from '@/lib/utils'
import { getScoreColor, formatDateCompact } from '@/lib/formatters'
import type { StoredAttempt } from '@/lib/attemptHistory'

interface AttemptHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  attempts: StoredAttempt[]
  verseId: string
  onClearHistory?: () => void
}

export function AttemptHistoryModal({
  isOpen,
  onClose,
  attempts,
  verseId,
  onClearHistory
}: AttemptHistoryModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const bestScore = useMemo(() => {
    if (attempts.length === 0) return 0
    return Math.max(...attempts.map(a => a.feedback.overallScore))
  }, [attempts])

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`History for Verse ${verseId}`}
      size="lg"
    >
      <div className="p-6">
        {attempts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-3">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500">No attempts yet for this verse.</p>
            <p className="text-sm text-gray-400 mt-1">Submit a translation to see your history here.</p>
          </div>
        ) : (
          <>
            {/* Stats summary */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
              <div className="text-sm text-gray-500">
                <span className="font-medium text-gray-900">{attempts.length}</span> attempt{attempts.length !== 1 ? 's' : ''}
              </div>
              <div className="text-sm text-gray-500">
                Best: <span className="font-medium text-success-600">{Math.round(bestScore * 100)}%</span>
              </div>
            </div>

            {/* Attempts list */}
            <div className="space-y-3">
              {attempts.map((attempt, index) => (
                <div
                  key={attempt.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Attempt header - clickable */}
                  <button
                    onClick={() => toggleExpand(attempt.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-6">#{attempts.length - index}</span>
                      <span className={cn(
                        'px-2 py-1 text-sm font-medium rounded border',
                        getScoreColor(attempt.feedback.overallScore)
                      )}>
                        {Math.round(attempt.feedback.overallScore * 100)}%
                      </span>
                      <span className="text-sm text-gray-500">{formatDateCompact(attempt.timestamp)}</span>
                    </div>
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
                  </button>

                  {/* Expanded content */}
                  {expandedId === attempt.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
                      {/* User's translation */}
                      <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Your translation</p>
                        <p className="text-gray-700 italic">&quot;{attempt.userTranslation}&quot;</p>
                      </div>

                      {/* Feedback */}
                      <FeedbackCard feedback={attempt.feedback} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Clear history option */}
            {onClearHistory && (
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center">
                <button
                  onClick={onClearHistory}
                  className="text-sm text-gray-500 hover:text-error-600 transition-colors"
                >
                  Clear history for this verse
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
