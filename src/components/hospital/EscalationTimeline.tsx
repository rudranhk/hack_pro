import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EscalationTier } from '@/lib/types'

const TIER_ORDER: EscalationTier[] = ['NEARBY', 'WIDE', 'CITY', 'HUMAN', 'EXPIRED']

const STAGES: { tier: EscalationTier; time: string; title: string; description: string }[] = [
  { tier: 'NEARBY', time: '00:00', title: 'Nearby', description: 'Top 10 eligible donors within 5 km' },
  { tier: 'WIDE', time: '03:00', title: 'Wide', description: 'Expanded search to 15 km' },
  { tier: 'CITY', time: '08:00', title: 'City', description: 'Expanded search to 40 km' },
  { tier: 'HUMAN', time: '15:00', title: 'Human', description: 'Blood-bank coordinator notified' },
  { tier: 'EXPIRED', time: 'TTL', title: 'Expired', description: 'Closed without enough confirmed donors' },
]

export function EscalationTimeline({
  currentTier,
  resolved,
}: {
  currentTier: EscalationTier
  /** True once the request is FULFILLED/COVERED/CONFIRMED — stops the pulse, the stage reads as reached, not active. */
  resolved?: boolean
}) {
  const currentIndex = TIER_ORDER.indexOf(currentTier)

  return (
    <ol className="flex flex-col">
      {STAGES.map((stage, index) => {
        const isPast = index < currentIndex || (resolved && index === currentIndex)
        const isCurrent = index === currentIndex && !resolved
        const isLast = index === STAGES.length - 1
        const isTerminalCurrent = isCurrent && stage.tier === 'EXPIRED'

        return (
          <li key={stage.tier} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                {isCurrent && !isTerminalCurrent && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-primary/40"
                    animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
                <span
                  className={cn(
                    'relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold',
                    isPast && 'border-primary bg-primary text-white',
                    isCurrent && !isTerminalCurrent && 'border-primary bg-primary text-white',
                    isTerminalCurrent && 'border-critical bg-critical text-white',
                    !isPast && !isCurrent && 'border-border-strong bg-surface text-ink-tertiary'
                  )}
                >
                  {isPast ? <Check size={13} strokeWidth={2.5} /> : index + 1}
                </span>
              </span>
              {!isLast && (
                <div className={cn('w-px flex-1 py-1', isPast ? 'bg-primary' : 'bg-border')} style={{ minHeight: 28 }} />
              )}
            </div>

            <div className={cn('flex-1', !isLast && 'pb-6')}>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-[13.5px] font-semibold',
                    isCurrent && !isTerminalCurrent && 'text-primary-active',
                    isTerminalCurrent && 'text-critical',
                    !isCurrent && 'text-ink'
                  )}
                >
                  {stage.title}
                </span>
                <span className="font-mono text-[11px] tabular text-ink-tertiary">{stage.time}</span>
                {isCurrent && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      isTerminalCurrent ? 'bg-critical-subtle text-critical' : 'bg-primary-subtle text-primary-active'
                    )}
                  >
                    Current
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[12.5px] text-ink-secondary">{stage.description}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
