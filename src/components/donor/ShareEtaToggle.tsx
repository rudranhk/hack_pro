import { motion } from 'framer-motion'
import { Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'

const ETA_OPTIONS = [5, 10, 15, 20] as const

export function ShareEtaToggle({
  sharing,
  onToggle,
  etaMinutes,
  onSelectEta,
}: {
  sharing: boolean
  onToggle: (next: boolean) => void
  etaMinutes: number | null
  onSelectEta: (minutes: number) => void
}) {
  return (
    <div className={cn('rounded-lg border p-4', sharing ? 'border-info-border bg-info-subtle' : 'border-border-strong bg-surface')}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Navigation size={16} className={sharing ? 'text-info' : 'text-ink-tertiary'} />
          <div>
            <p className="text-[13px] font-semibold text-ink">Share ETA</p>
            <p className="text-[11.5px] text-ink-tertiary">A rough arrival estimate, not your live location</p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={sharing}
          onClick={() => onToggle(!sharing)}
          className={cn(
            'relative h-8 w-14 shrink-0 rounded-full border transition-colors',
            sharing ? 'border-info bg-info' : 'border-border-strong bg-surface-sunken'
          )}
        >
          <motion.span
            className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md"
            animate={{ left: sharing ? 26 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          />
        </button>
      </div>

      {sharing && (
        <div className="mt-3.5 border-t border-info-border pt-3.5">
          <p className="mb-2 text-[11.5px] font-medium text-ink-secondary">Estimated arrival</p>
          <div className="flex gap-2">
            {ETA_OPTIONS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => onSelectEta(minutes)}
                className={cn(
                  'h-9 flex-1 rounded-md border text-[12.5px] font-semibold transition-colors',
                  etaMinutes === minutes
                    ? 'border-info bg-info text-white'
                    : 'border-border-strong bg-surface text-ink-secondary hover:bg-surface-sunken'
                )}
              >
                {minutes}m
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] text-ink-tertiary">
            City Hospital sees this estimate only — it expires automatically once your donation is complete.
          </p>
        </div>
      )}
    </div>
  )
}
