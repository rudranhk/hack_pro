import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function AvailabilityToggle({
  available,
  onChange,
}: {
  available: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        available ? 'border-success-border bg-success-subtle' : 'border-border-strong bg-surface'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13.5px] font-semibold text-ink">Available to help?</p>
          <p className={cn('mt-0.5 text-[12px]', available ? 'text-success' : 'text-ink-tertiary')}>
            {available ? 'AVAILABLE' : 'PAUSED'}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={available}
          onClick={() => onChange(!available)}
          className={cn(
            'relative h-9 w-16 shrink-0 rounded-full border transition-colors',
            available ? 'border-success bg-success' : 'border-border-strong bg-surface-sunken'
          )}
        >
          <motion.span
            className="absolute top-0.5 h-7 w-7 rounded-full bg-white shadow-md"
            animate={{ left: available ? 30 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          />
        </button>
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-secondary">
        {available
          ? "You're eligible for emergency requests in your area."
          : "You won't receive emergency alerts while paused."}
      </p>
    </div>
  )
}
