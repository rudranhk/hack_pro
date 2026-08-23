import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { matchStatusLabel } from '@/lib/domainMeta'
import type { MatchStatus } from '@/lib/types'

const ORDER: MatchStatus[] = ['MATCHED', 'CONFIRMED', 'EN_ROUTE', 'ARRIVED', 'DONATED']

/** A compact horizontal progress row for a match card — the hospital never sees the donor's own SCREENING step. */
export function MatchTimeline({ status }: { status: MatchStatus }) {
  const currentIndex = ORDER.indexOf(status)

  return (
    <ol className="flex items-center">
      {ORDER.map((stage, index) => {
        const isPast = index < currentIndex
        const isCurrent = index === currentIndex
        const isLast = index === ORDER.length - 1
        return (
          <li key={stage} className={cn('flex items-center', !isLast && 'flex-1')}>
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold',
                (isPast || isCurrent) ? 'border-primary bg-primary text-white' : 'border-border-strong bg-surface text-ink-tertiary'
              )}
              title={matchStatusLabel[stage]}
            >
              {isPast ? <Check size={10} strokeWidth={3} /> : index + 1}
            </span>
            {!isLast && <div className={cn('mx-1 h-px flex-1', isPast ? 'bg-primary' : 'bg-border')} />}
          </li>
        )
      })}
    </ol>
  )
}
