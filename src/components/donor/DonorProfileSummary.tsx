import type { ReactNode } from 'react'
import { Calendar, CalendarCheck, Droplet, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import type { DonorProfile } from '@/lib/types'

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Droplet
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0">
      <span className="flex items-center gap-2 text-[13px] text-ink-secondary">
        <Icon size={15} className="text-ink-tertiary" />
        {label}
      </span>
      <span className="text-[13px] font-medium text-ink">{children}</span>
    </div>
  )
}

export function DonorProfileSummary({ profile, available }: { profile: DonorProfile; available: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4">
      <Row icon={Droplet} label="Blood group">
        <Badge tone="primary" size="sm">
          {profile.bloodGroup}
        </Badge>
      </Row>
      <Row icon={ShieldCheck} label="Eligibility status">
        <Badge tone={profile.eligibility === 'ELIGIBLE' ? 'success' : 'warning'} dot size="sm">
          {profile.eligibility === 'ELIGIBLE' ? 'Eligible' : 'Temporarily ineligible'}
        </Badge>
      </Row>
      <Row icon={Calendar} label="Last donation">
        {profile.lastDonationLabel}
      </Row>
      <Row icon={CalendarCheck} label="Next eligible date">
        {profile.nextEligibleLabel}
      </Row>
      <Row icon={ShieldCheck} label="Current availability">
        <Badge tone={available ? 'success' : 'neutral'} dot size="sm">
          {available ? 'Available' : 'Paused'}
        </Badge>
      </Row>
    </div>
  )
}
