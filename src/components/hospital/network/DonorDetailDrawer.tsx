import type { ReactNode } from 'react'
import { MapPin, ShieldCheck } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Badge } from '@/components/ui/Badge'
import { MatchScoreBreakdown } from '@/components/hospital/MatchScoreBreakdown'
import { componentLabel, networkAvailabilityLabel, networkAvailabilityTone } from '@/lib/domainMeta'
import type { NetworkDonor } from '@/lib/types'

export function DonorDetailDrawer({ donor, onClose }: { donor: NetworkDonor | null; onClose: () => void }) {
  return (
    <Drawer open={!!donor} onClose={onClose} eyebrow="Donor Network" title={donor ? `Donor #${donor.id}` : undefined}>
      {donor && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Blood group">
              <Badge tone="primary" size="sm">
                {donor.bloodGroup}
              </Badge>
            </Field>
            <Field label="Availability">
              <Badge tone={networkAvailabilityTone[donor.availability]} dot size="sm">
                {networkAvailabilityLabel[donor.availability]}
              </Badge>
            </Field>
            <Field label="Distance">
              <span className="flex items-center gap-1 text-[13px] font-medium text-ink">
                <MapPin size={12} className="text-ink-tertiary" />
                {donor.distanceKm} km
              </span>
            </Field>
            <Field label="Response rate">
              <span className="tabular text-[13px] font-medium text-ink">{Math.round(donor.responseRate * 100)}%</span>
            </Field>
            <Field label="Last active">
              <span className="text-[13px] font-medium text-ink">{donor.lastActiveLabel}</span>
            </Field>
            <Field label="Eligibility">
              <Badge tone={donor.eligible ? 'success' : 'warning'} dot size="sm">
                {donor.eligible ? 'Eligible' : 'Under review'}
              </Badge>
            </Field>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">Components</p>
            <div className="flex flex-wrap gap-1.5">
              {donor.components.map((c) => (
                <Badge key={c} tone="neutral" size="sm">
                  {componentLabel[c]}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-border-strong p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-ink-tertiary">
                Explainable Match Score
              </p>
              <p className="tabular text-[20px] font-bold text-ink">
                {donor.score}
                <span className="text-[12px] font-normal text-ink-tertiary"> / 100</span>
              </p>
            </div>
            <div className="mt-4">
              <MatchScoreBreakdown breakdown={donor.scoreBreakdown} />
            </div>
            <p className="mt-4 text-[11.5px] leading-relaxed text-ink-tertiary">
              Used by the matching engine to prioritize emergency alerts.
            </p>
          </div>

          <div className="flex gap-2.5 rounded-md border border-info-border bg-info-subtle p-3.5">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-info" />
            <p className="text-[12px] leading-relaxed text-ink-secondary">
              Personal contact details are shared only after a donor accepts a verified emergency request.
            </p>
          </div>
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
