import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium rounded-lg',
      'transition-all duration-200 ease-in-out',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    )

    const variants = {
      primary: cn(
        'bg-primary-600 text-white',
        'hover:bg-primary-700 active:bg-primary-800',
        'focus-visible:ring-primary-500'
      ),
      secondary: cn(
        'bg-secondary-500 text-white',
        'hover:bg-secondary-600 active:bg-secondary-700',
        'focus-visible:ring-secondary-500'
      ),
      outline: cn(
        'border-2 border-primary-600 text-primary-600 bg-transparent',
        'hover:bg-primary-50 active:bg-primary-100',
        'focus-visible:ring-primary-500'
      ),
      ghost: cn(
        'text-gray-700 bg-transparent',
        'hover:bg-gray-100 active:bg-gray-200',
        'focus-visible:ring-gray-500'
      ),
      danger: cn(
        'bg-error-500 text-white',
        'hover:bg-error-600 active:bg-red-700',
        'focus-visible:ring-error-500'
      ),
    }

    const sizes = {
      sm: 'h-9 px-3 text-sm gap-1.5',
      md: 'h-11 px-5 text-base gap-2',
      lg: 'h-14 px-8 text-lg gap-2.5',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Spinner size="sm" className="mr-2" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
