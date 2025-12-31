/**
 * Utility functions for formatting scores, dates, and other display values.
 */

/**
 * Returns Tailwind CSS class names based on the score value for color-coding.
 * - 90%+: Success (green)
 * - 70-89%: Primary (teal)
 * - 50-69%: Warning (amber)
 * - Below 50%: Error (red)
 */
export function getScoreColor(score: number): string {
  if (score >= 0.9) return 'bg-success-100 text-success-700 border-success-200'
  if (score >= 0.7) return 'bg-primary-100 text-primary-700 border-primary-200'
  if (score >= 0.5) return 'bg-warning-100 text-warning-700 border-warning-200'
  return 'bg-error-100 text-error-700 border-error-200'
}

/**
 * Formats a timestamp as a relative date string.
 * Examples: "Just now", "5m ago", "2h ago", "3d ago", or "Jan 15"
 */
export function formatRelativeDate(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Formats a timestamp as an absolute date string with time.
 * Example: "Jan 15, 2024, 2:30 PM"
 */
export function formatDate(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

/**
 * Legacy function: Formats a timestamp with relative time but falls back to abbreviated date.
 * Used in AttemptHistoryModal for consistency with older date formatting.
 * Examples: "Just now", "5m ago", "2h ago", "3d ago", or "Jan 15" (without year)
 */
export function formatDateCompact(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}
