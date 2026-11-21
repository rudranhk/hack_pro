import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OfferStatus } from '@/lib/api/workspace'

const STAGE_ORDER: OfferStatus[] = ['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'DONATED']

const STAGES: { status: OfferStatus; title: string; description: string }[] = [
  { status: 'ACCEPTED', title: 'Accepted', description: 'One unit committed to this request' },
  { status: 'EN_ROUTE', title: 'En route', description: 'Heading to the hospital' },
  { status: 'ARRIVED', title: 'Arrived', description: 'Checked in at the hospital' },
  { status: 'DONATED', title: 'Donated', description: 'Hospital recorded collection' },
]

export function StatusTimeline({ current }: { current: OfferStatus }) {
  const currentIndex = STAGE_ORDER.indexOf(current)

  return (
    <ol className="flex flex-col">
      {STAGES.map((stage, index) => {
        const isPast = index < currentIndex
        const isCurrent = index === currentIndex
        const isLast = index === STAGES.length - 1
        const isFinal = isCurrent && stage.status === 'DONATED'

        return (
          <li key={stage.status} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                {isCurrent && !isFinal && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-primary/40"
                    animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
                <span
                  className={cn(
                    'relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold',
                    (isPast || isFinal) && 'border-primary bg-primary text-white',
                    isCurrent && !isFinal && 'border-primary bg-primary text-white',
                    !isPast && !isCurrent && 'border-border-strong bg-surface text-ink-tertiary'
                  )}
                >
                  {isPast || isFinal ? <Check size={13} strokeWidth={2.5} /> : index + 1}
                </span>
              </span>
              {!isLast && (
                <div
                  className={cn('w-px flex-1 py-1', isPast || isFinal ? 'bg-primary' : 'bg-border')}
                  style={{ minHeight: 24 }}
                />
              )}
            </div>

            <div className={cn('flex-1', !isLast && 'pb-5')}>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-[13.5px] font-semibold',
                    isCurrent && !isFinal ? 'text-primary-active' : 'text-ink'
                  )}
                >
                  {stage.title}
                </span>
                {isCurrent && !isFinal && (
                  <span className="rounded-full bg-primary-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-active">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[12px] text-ink-secondary">{stage.description}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
