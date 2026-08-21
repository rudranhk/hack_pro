import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'critical' | 'info' | 'secondary'

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-ink-secondary border-border',
  primary: 'bg-primary-subtle text-primary-active border-primary-subtle-border',
  success: 'bg-success-subtle text-success border-success-border',
  warning: 'bg-warning-subtle text-warning border-warning-border',
  critical: 'bg-critical-subtle text-critical border-critical-border',
  info: 'bg-info-subtle text-info border-info-border',
  secondary: 'bg-secondary-subtle text-secondary border-transparent',
}

const dotClasses: Record<BadgeTone, string> = {
  neutral: 'bg-ink-tertiary',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  critical: 'bg-critical',
  info: 'bg-info',
  secondary: 'bg-secondary',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  dot?: boolean
  icon?: ReactNode
  size?: 'sm' | 'md'
}

/** Generic status/label pill. Used both as a plain badge and as a "status badge" via the `dot` prop. */
export function Badge({
  tone = 'neutral',
  dot,
  icon,
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border font-medium tabular whitespace-nowrap',
        size === 'sm' ? 'rounded-xs px-1.5 py-0.5 text-[11px]' : 'rounded-sm px-2 py-0.5 text-xs',
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotClasses[tone])} />}
      {icon}
      {children}
    </span>
  )
}
