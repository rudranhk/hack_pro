import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: ReactNode
  caption?: string
  tone?: 'neutral' | 'critical' | 'success' | 'info'
}

const toneClasses: Record<NonNullable<MetricCardProps['tone']>, string> = {
  neutral: 'bg-surface-sunken text-ink-secondary',
  critical: 'bg-critical-subtle text-critical',
  success: 'bg-success-subtle text-success',
  info: 'bg-info-subtle text-info',
}

export function MetricCard({ icon: Icon, label, value, caption, tone = 'neutral' }: MetricCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-[12.5px] font-medium text-ink-secondary">{label}</p>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-md', toneClasses[tone])}>
          <Icon size={16} strokeWidth={2} />
        </span>
      </div>
      <p className="mt-3 text-[26px] font-semibold leading-none tabular text-ink">{value}</p>
      {caption && <p className="mt-2 text-[12px] text-ink-tertiary">{caption}</p>}
    </Card>
  )
}
