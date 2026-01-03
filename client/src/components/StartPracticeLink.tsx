import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { getLastVersePath } from '@/lib/lastVerse'

interface StartPracticeLinkProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
  asText?: boolean
}

export function StartPracticeLink({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  asText = false,
}: StartPracticeLinkProps) {
  const [href, setHref] = useState('/browse/surah/1/1')

  useEffect(() => {
    setHref(getLastVersePath())
  }, [])

  if (asText) {
    return (
      <Link to={href} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <Link to={href} className={className}>
      <Button variant={variant} size={size} className="w-full sm:w-auto">
        {children}
      </Button>
    </Link>
  )
}
