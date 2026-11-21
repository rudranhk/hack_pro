import { AlertTriangle, Clock, Siren } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Urgency } from '@/lib/types'
import type { StepProps } from './types'

const urgencyOptions: {
  value: Urgency
  label: string
  description: string
  icon: typeof Siren
  selectedClasses: string
  iconClasses: string
}[] = [
  {
    value: 'CRITICAL',
    label: 'Critical',
    description: 'Immediate — patient at risk within the hour.',
    icon: Siren,
    selectedClasses: 'border-critical bg-critical-subtle',
    iconClasses: 'text-critical',
  },
  {
    value: 'URGENT',
    label: 'Urgent',
    description: 'Needed within the next few hours.',
    icon: AlertTriangle,
    selectedClasses: 'border-warning bg-warning-subtle',
    iconClasses: 'text-warning',
  },
  {
    value: 'STANDARD',
    label: 'Standard',
    description: 'Planned need or routine restocking.',
    icon: Clock,
    selectedClasses: 'border-border-strong bg-surface-sunken',
    iconClasses: 'text-ink-secondary',
  },
]

export function Step2Urgency({ draft, onChange }: StepProps) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold text-ink">Urgency</h3>
      <p className="mt-0.5 text-[12.5px] text-ink-secondary">
        This priority appears in the donor invitation, hospital dashboard and matching query.
      </p>
      <div className="mt-3 flex flex-col gap-2.5">
        {urgencyOptions.map((option) => {
          const selected = draft.urgency === option.value
          return (
            <button
              key={option.value} aria-pressed={selected}
              type="button"
              onClick={() => onChange({ urgency: option.value })}
              className={cn(
                'flex items-center gap-3.5 rounded-md border p-4 text-left transition-colors',
                selected ? option.selectedClasses : 'border-border-strong bg-surface hover:bg-surface-sunken'
              )}
            >
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center', option.iconClasses)}>
                <option.icon size={20} strokeWidth={1.75} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-ink">{option.label}</span>
                <span className="block text-[12px] text-ink-secondary">{option.description}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
