import { Hospital } from 'lucide-react'
import { cn } from '@/lib/utils'
import { matchMapDotClass, matchStatusLabel } from '@/lib/domainMeta'
import type { LiveMatch } from '@/lib/types'

const LEGEND: { status: 'CONFIRMED' | 'EN_ROUTE'; label: string }[] = [
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'EN_ROUTE', label: 'En route' },
]

/** Same stylized-map grammar as the live request donor map, but plots match status, not alert/eligibility state. */
export function LiveMatchMap({ matches }: { matches: LiveMatch[] }) {
  return (
    <div>
      <div className="relative aspect-[16/11] w-full overflow-hidden rounded-md border border-border-strong bg-surface-sunken">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div
          className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-secondary text-white shadow-md"
          style={{ left: '50%', top: '50%' }}
        >
          <Hospital size={15} strokeWidth={1.75} />
        </div>
        {matches.map((match) => (
          <div
            key={match.requestId}
            title={`${match.requestId} — Donor #${match.donorId} — ${matchStatusLabel[match.status]}`}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
            style={{ left: `${match.mapPosition.x}%`, top: `${match.mapPosition.y}%` }}
          >
            <span className={cn('h-3 w-3 rounded-full ring-2 ring-surface', matchMapDotClass[match.status])} />
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {LEGEND.map((item) => (
          <span key={item.status} className="flex items-center gap-1.5 text-[11.5px] text-ink-secondary">
            <span className={cn('h-2 w-2 rounded-full', matchMapDotClass[item.status])} />
            {item.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-[11.5px] text-ink-secondary">
          <span className="h-2 w-2 rounded-full bg-ink-tertiary" />
          Inactive
        </span>
      </div>
    </div>
  )
}
