import { Link } from 'react-router-dom'
import { MapPin, Phone } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses, Button } from '@/components/ui/Button'
import { MatchTimeline } from './MatchTimeline'
import { componentLabel, matchStatusLabel, matchStatusTone } from '@/lib/domainMeta'
import type { LiveMatch } from '@/lib/types'

export function LiveMatchCard({
  match,
  onOpenDetail,
  onContact,
}: {
  match: LiveMatch
  onOpenDetail: () => void
  onContact: () => void
}) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button onClick={onOpenDetail} className="text-left">
          <p className="font-mono text-[13.5px] font-semibold text-ink">{match.requestId}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-secondary">
            <Badge tone="primary" size="sm">
              {match.bloodGroup}
            </Badge>
            {componentLabel[match.component]}
            <span className="text-ink-tertiary">· {match.unitsSecured}/{match.unitsNeeded} units</span>
          </p>
        </button>
        <Badge tone={matchStatusTone[match.status]} dot size="sm">
          {matchStatusLabel[match.status].toUpperCase()}
        </Badge>
      </div>

      <button onClick={onOpenDetail} className="mt-3 flex w-full items-center justify-between text-left">
        <span className="font-mono text-[13px] font-medium text-ink">Donor #{match.donorId}</span>
        <span className="flex items-center gap-3 text-[12px] text-ink-secondary">
          <span className="flex items-center gap-1">
            <MapPin size={11} className="text-ink-tertiary" />
            {match.distanceKm} km
          </span>
          <span>{match.etaMinutes > 0 ? `ETA ${match.etaMinutes} min` : 'Arrived'}</span>
        </span>
      </button>

      <div className="mt-3.5">
        <MatchTimeline status={match.status} />
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          to={`/hospital/requests/${match.requestId}`}
          className={buttonClasses({ variant: 'outline', size: 'sm', className: 'flex-1' })}
        >
          View Request
        </Link>
        <Button variant="ghost" size="sm" onClick={onContact} leadingIcon={<Phone size={13} />}>
          Contact
        </Button>
      </div>
    </Card>
  )
}
