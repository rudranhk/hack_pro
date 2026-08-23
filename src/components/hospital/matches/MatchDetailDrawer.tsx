import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Badge } from '@/components/ui/Badge'
import { buttonClasses } from '@/components/ui/Button'
import { componentLabel, matchStatusLabel, matchStatusTone } from '@/lib/domainMeta'
import type { LiveMatch } from '@/lib/types'

export function MatchDetailDrawer({ match, onClose }: { match: LiveMatch | null; onClose: () => void }) {
  return (
    <Drawer open={!!match} onClose={onClose} eyebrow="Live match" title={match?.requestId}>
      {match && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Blood">
              <Badge tone="primary" size="sm">
                {match.bloodGroup}
              </Badge>
            </Field>
            <Field label="Component">
              <span className="text-[13px] font-medium text-ink">{componentLabel[match.component]}</span>
            </Field>
            <Field label="Units">
              <span className="tabular text-[13px] font-medium text-ink">
                {match.unitsSecured} / {match.unitsNeeded} secured
              </span>
            </Field>
            <Field label="Status">
              <Badge tone={matchStatusTone[match.status]} dot size="sm">
                {matchStatusLabel[match.status]}
              </Badge>
            </Field>
            <Field label="Donor">
              <span className="font-mono text-[13px] font-medium text-ink">#{match.donorId}</span>
            </Field>
            <Field label="Distance / ETA">
              <span className="flex items-center gap-1 text-[13px] font-medium text-ink">
                <MapPin size={12} className="text-ink-tertiary" />
                {match.distanceKm} km · {match.etaMinutes > 0 ? `${match.etaMinutes} min` : 'Arrived'}
              </span>
            </Field>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">Match timeline</p>
            <ol className="flex flex-col gap-3">
              {match.timeline.map((event, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="font-mono text-[12px] tabular text-ink-tertiary">{event.timeLabel}</span>
                  <span className="text-[12.5px] text-ink">{event.label}</span>
                </li>
              ))}
            </ol>
          </div>

          <Link to={`/hospital/requests/${match.requestId}`} className={buttonClasses({ variant: 'primary', size: 'sm' })}>
            Open full request
          </Link>
        </div>
      )}
    </Drawer>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-ink-tertiary">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  )
}
