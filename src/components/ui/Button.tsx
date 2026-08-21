import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover active:bg-primary-active shadow-xs disabled:bg-primary/50',
  secondary:
    'bg-secondary text-white hover:bg-secondary-hover shadow-xs disabled:bg-secondary/50',
  outline:
    'bg-surface text-ink border border-border-strong hover:bg-surface-sunken disabled:text-ink-tertiary',
  ghost: 'bg-transparent text-ink-secondary hover:bg-surface-sunken hover:text-ink',
  danger:
    'bg-critical text-white hover:brightness-95 shadow-xs disabled:bg-critical/50',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-sm',
  md: 'h-10 px-4 text-sm gap-2 rounded-md',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-md',
}

export interface ButtonClassOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
}

/**
 * Shared class builder so non-<button> elements (e.g. a react-router `Link` that
 * needs to look like a button) can match Button's styling without nesting an
 * interactive element inside another one.
 */
export function buttonClasses({ variant = 'primary', size = 'md', fullWidth, className }: ButtonClassOptions = {}) {
  return cn(
    'inline-flex items-center justify-center font-medium transition-colors duration-150',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    'disabled:cursor-not-allowed disabled:pointer-events-none',
    'active:scale-[0.98]',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    className
  )
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    leadingIcon,
    trailingIcon,
    fullWidth,
    className,
    children,
    ...props
  },
  ref
) {
  return (
    <button ref={ref} className={buttonClasses({ variant, size, fullWidth, className })} {...props}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  )
})
