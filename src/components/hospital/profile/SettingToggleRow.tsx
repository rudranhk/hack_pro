import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function SettingToggleRow({
  label,
  description,
  on,
  onToggle,
}: {
  label: string
  description: string
  on: boolean
  onToggle: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-b-0">
      <div>
        <p className="text-[13.5px] font-medium text-ink">{label}</p>
        <p className="mt-0.5 max-w-md text-[12px] leading-relaxed text-ink-secondary">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onToggle(!on)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full border transition-colors',
          on ? 'border-primary bg-primary' : 'border-border-strong bg-surface-sunken'
        )}
      >
        <motion.span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md"
          animate={{ left: on ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        />
      </button>
    </div>
  )
}
