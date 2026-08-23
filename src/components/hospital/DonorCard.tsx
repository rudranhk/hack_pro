import { ChevronDown, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { MatchScoreBreakdown } from './MatchScoreBreakdown'
import type { RankedDonor } from '@/lib/types'

export function DonorCard({
  donor,
  rank,
  expanded,
  onToggle,
}: {
  donor: RankedDonor
  rank: number
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-md border border-border bg-surface">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3.5 p-3.5 text-left"
        aria-expanded={expanded}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-[11.5px] font-semibold text-ink-secondary">
          {rank}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[13px] font-semibold text-ink">Donor #{donor.id}</span>
            <Badge tone="primary" size="sm">
              {donor.bloodGroup}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-ink-tertiary">
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} />
              {donor.distanceKm} km away
            </span>
            <span>Response {Math.round(donor.responseRate * 100)}%</span>
            <span>Active {donor.lastActiveLabel}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="text-[18px] font-semibold leading-none tabular text-ink">{donor.score}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-tertiary">Score</p>
          </div>
          <ChevronDown
            size={16}
            className={cn('text-ink-tertiary transition-transform', expanded && 'rotate-180')}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-3.5 pb-3.5 pt-3.5">
          <MatchScoreBreakdown breakdown={donor.scoreBreakdown} />
        </div>
      )}
    </div>
  )
}
