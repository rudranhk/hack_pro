import { Phone, UserCog } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { componentLabel, escalationTierRadiusKm } from '@/lib/domainMeta'
import { mockRankedDonors } from '@/lib/mockData'
import type { EmergencyRequest } from '@/lib/types'

const COORDINATOR = {
  name: 'Priya Nair',
  role: 'Regional Blood Bank Coordinator',
  org: 'State Blood Bank Network',
  phone: '+91 98765 43210',
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-ink-tertiary">{label}</p>
      <p className="mt-0.5 text-[14px] font-semibold tabular text-ink">{value}</p>
    </div>
  )
}

export function HumanEscalationPanel({ request }: { request: EmergencyRequest }) {
  const unitsRemaining = Math.max(0, request.unitsNeeded - request.unitsSecured)
  const eligibleDonorsContacted = mockRankedDonors.filter(
    (d) => d.distanceKm <= escalationTierRadiusKm.HUMAN && d.mapState !== 'UNAVAILABLE'
  ).length
  const alertsSent = mockRankedDonors.filter((d) => d.mapState === 'ALERTED' || d.mapState === 'MATCHED').length

  return (
    <div className="overflow-hidden rounded-lg border border-critical-border">
      <div className="bg-critical-subtle p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-critical text-white">
            <UserCog size={18} strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-[15.5px] font-semibold text-ink">Human intervention required</h2>
            <p className="mt-0.5 text-[12.5px] text-ink-secondary">
              Automated matching has expanded to the city-wide network.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink-tertiary">Blood group</p>
            <Badge tone="primary" size="sm" className="mt-1">
              {request.bloodGroup}
            </Badge>
          </div>
          <Stat label="Units remaining" value={`${unitsRemaining} of ${request.unitsNeeded}`} />
          <Stat label="Component" value={componentLabel[request.component]} />
          <Stat label="Search radius" value={`${escalationTierRadiusKm.HUMAN} km`} />
          <Stat label="Time elapsed" value={request.timeElapsedLabel} />
          <Stat label="Alerts sent" value={String(alertsSent)} />
          <Stat label="Eligible donors contacted" value={String(eligibleDonorsContacted)} />
        </div>
      </div>

      <div className="bg-surface p-5">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-tertiary">
          Blood-bank coordinator notified
        </p>
        <div className="mt-3 flex items-center gap-3 rounded-md border border-border p-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-semibold text-white">
            {COORDINATOR.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold text-ink">{COORDINATOR.name}</p>
            <p className="truncate text-[12px] text-ink-secondary">
              {COORDINATOR.role} · {COORDINATOR.org}
            </p>
          </div>
          <a
            href={`tel:${COORDINATOR.phone.replace(/\s+/g, '')}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white"
            aria-label={`Call ${COORDINATOR.name}`}
          >
            <Phone size={15} />
          </a>
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-ink-tertiary">
          This is a manual handoff to the regional blood-bank network — a phone call, not an automated
          government API integration. The coordinator can check external blood-stock systems this platform
          doesn't have direct access to.
        </p>
      </div>
    </div>
  )
}
