import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card'
import type { AttemptFeedback } from '@/types'

interface FeedbackCardProps {
  feedback: AttemptFeedback
  className?: string
}

function getScoreColor(score: number): string {
  if (score >= 0.9) return 'text-success-600 bg-success-50 border-success-200'
  if (score >= 0.7) return 'text-primary-600 bg-primary-50 border-primary-200'
  if (score >= 0.5) return 'text-warning-600 bg-warning-50 border-warning-200'
  return 'text-error-600 bg-error-50 border-error-200'
}

function getScoreLabel(score: number): string {
  if (score >= 0.9) return 'Excellent!'
  if (score >= 0.7) return 'Good'
  if (score >= 0.5) return 'Keep Practicing'
  return 'Needs Work'
}

export function FeedbackCard({ feedback, className }: FeedbackCardProps) {
  const percentage = Math.round(feedback.overallScore * 100)
  const scoreColor = getScoreColor(feedback.overallScore)
  const scoreLabel = getScoreLabel(feedback.overallScore)

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Feedback</CardTitle>
          <div className={cn('px-4 py-2 rounded-lg border font-semibold', scoreColor)}>
            {percentage}% - {scoreLabel}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Encouragement message */}
        {feedback.encouragement && (
          <p className="text-gray-700 italic">{feedback.encouragement}</p>
        )}

        {/* Correct elements */}
        {feedback.correctElements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-success-600 mb-2 flex items-center gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              What you got right
            </h4>
            <ul className="space-y-1">
              {feedback.correctElements.map((item, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-success-500 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missed elements */}
        {feedback.missedElements.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-warning-600 mb-2 flex items-center gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Areas to improve
            </h4>
            <ul className="space-y-1">
              {feedback.missedElements.map((item, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-warning-500 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {feedback.suggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-primary-600 mb-2 flex items-center gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Tips
            </h4>
            <ul className="space-y-1">
              {feedback.suggestions.map((item, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-primary-500 mt-1">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Skeleton for loading state
export function FeedbackCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-2 mt-4">
          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
      </CardContent>
    </Card>
  )
}
