import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  tone?: 'neutral' | 'success'
  className?: string
}

/** Shared shape for every "nothing here" / resolved / covered state across the app. */
export function EmptyState({ icon: Icon, title, description, action, tone = 'neutral', className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-lg border border-dashed px-8 py-12 text-center',
        tone === 'success' ? 'border-success-border bg-success-subtle' : 'border-border-strong',
        className
      )}
    >
      <span
        className={cn(
          'mb-4 flex h-11 w-11 items-center justify-center rounded-md',
          tone === 'success' ? 'bg-success/10 text-success' : 'bg-surface-sunken text-ink-secondary'
        )}
      >
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <h3 className="text-[14.5px] font-semibold text-ink">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-secondary">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
