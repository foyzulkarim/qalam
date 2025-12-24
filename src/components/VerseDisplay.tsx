import { cn } from '@/lib/utils'

interface VerseDisplayProps {
  arabic: string
  verseNumber?: number
  surahName?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  colorizeWords?: boolean
}

const sizeStyles = {
  sm: 'text-arabic-sm',
  md: 'text-arabic-base',
  lg: 'text-arabic-lg',
  xl: 'text-arabic-xl',
}

// Alternating colors for word highlighting
const wordColors = [
  'text-teal-700',
  'text-amber-700',
]

export function VerseDisplay({
  arabic,
  verseNumber,
  surahName,
  className,
  size = 'lg',
  colorizeWords = false,
}: VerseDisplayProps) {
  // Split Arabic text into words for colorization
  const words = arabic.split(/\s+/)

  return (
    <div className={cn('bg-primary-50/50 rounded-xl p-6 md:p-8', className)}>
      {/* Surah and verse reference */}
      {(surahName || verseNumber) && (
        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
          {surahName && <span>{surahName}</span>}
          {verseNumber && (
            <span className="bg-primary-100 text-primary-700 px-2.5 py-0.5 rounded-full font-medium">
              Ayah {verseNumber}
            </span>
          )}
        </div>
      )}

      {/* Arabic text */}
      <p
        className={cn(
          'font-arabic leading-[2.5]',
          !colorizeWords && 'text-gray-900',
          sizeStyles[size]
        )}
        dir="rtl"
        lang="ar"
      >
        {colorizeWords ? (
          words.map((word, index) => (
            <span key={index}>
              <span className={wordColors[index % wordColors.length]}>
                {word}
              </span>
              {index < words.length - 1 && ' '}
            </span>
          ))
        ) : (
          arabic
        )}
      </p>
    </div>
  )
}

// Skeleton version for loading state
export function VerseDisplaySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-primary-50/50 rounded-xl p-6 md:p-8 animate-pulse', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-primary-100 rounded w-24"></div>
        <div className="h-5 bg-primary-100 rounded-full w-16"></div>
      </div>
      <div className="space-y-3" dir="rtl">
        <div className="h-8 bg-primary-100 rounded w-full"></div>
        <div className="h-8 bg-primary-100 rounded w-4/5"></div>
        <div className="h-8 bg-primary-100 rounded w-3/5"></div>
      </div>
    </div>
  )
}
