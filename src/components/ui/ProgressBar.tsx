import { cn } from '@/lib/utils'
import type { BadgeTone } from './Badge'

export interface ProgressBarProps {
  value: number
  max?: number
  tone?: Extract<BadgeTone, 'primary' | 'success' | 'warning' | 'critical' | 'info'>
  size?: 'sm' | 'md'
  className?: string
  label?: string
}

const fillClasses: Record<string, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  critical: 'bg-critical',
  info: 'bg-info',
}

export function ProgressBar({
  value,
  max = 100,
  tone = 'primary',
  size = 'md',
  className,
  label,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between text-xs text-ink-secondary">
          <span>{label}</span>
          <span className="tabular">{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-surface-sunken',
          size === 'sm' ? 'h-1.5' : 'h-2.5'
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500 ease-out', fillClasses[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
