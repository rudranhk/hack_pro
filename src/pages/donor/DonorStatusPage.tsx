import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HeartHandshake, MapPin } from 'lucide-react'
import { MobileShell } from '@/components/layout/MobileShell'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { StatusTimeline } from '@/components/donor/StatusTimeline'
import { ShareEtaToggle } from '@/components/donor/ShareEtaToggle'
import { componentLabel } from '@/lib/domainMeta'
import { mockDonorAlert } from '@/lib/mockData'
import type { DonorMatchStatus } from '@/lib/types'

const NEXT_STATUS: Partial<Record<DonorMatchStatus, DonorMatchStatus>> = {
  CONFIRMED: 'EN_ROUTE',
  EN_ROUTE: 'ARRIVED',
  ARRIVED: 'DONATED',
}

const ACTION_LABEL: Partial<Record<DonorMatchStatus, string>> = {
  CONFIRMED: "I'm on my way",
  EN_ROUTE: "I've arrived",
  ARRIVED: 'Mark as donated',
}

const SUBTEXT: Record<DonorMatchStatus, string> = {
  MATCHED: 'You accepted this request.',
  SCREENING: 'Completing your eligibility check.',
  CONFIRMED: 'Head to City Hospital when you’re ready.',
  EN_ROUTE: 'On your way — City Hospital is expecting you.',
  ARRIVED: "You're checked in. A staff member will find you shortly.",
  DONATED: 'Thank you — you may have just saved a life.',
}

export function DonorStatusPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<DonorMatchStatus>('CONFIRMED')
  const [sharingEta, setSharingEta] = useState(false)
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null)

  const advance = () => {
    const next = NEXT_STATUS[status]
    if (!next) return
    setStatus(next)
    if (next === 'DONATED') {
      setSharingEta(false)
      setEtaMinutes(null)
    }
  }

  const canShareEta = status === 'CONFIRMED' || status === 'EN_ROUTE' || status === 'ARRIVED'

  return (
    <MobileShell title="You're helping today">
      <div className="flex flex-col gap-5 p-4">
        <div>
          <h1 className="text-[19px] font-semibold leading-snug text-ink">You're helping someone today.</h1>
          <p className="mt-1 text-[13px] text-ink-secondary">{SUBTEXT[status]}</p>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3.5">
          <Badge tone="primary" className="px-2.5 py-1 text-[13px] font-bold">
            {mockDonorAlert.bloodGroup}
          </Badge>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">
              {componentLabel[mockDonorAlert.component]} · {mockDonorAlert.hospitalName}
            </p>
            <p className="flex items-center gap-1 text-[11.5px] text-ink-tertiary">
              <MapPin size={11} />
              {mockDonorAlert.distanceKm} km away
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <StatusTimeline current={status} />
        </div>

        {canShareEta && (
          <ShareEtaToggle
            sharing={sharingEta}
            onToggle={setSharingEta}
            etaMinutes={etaMinutes}
            onSelectEta={setEtaMinutes}
          />
        )}

        {status === 'DONATED' ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center rounded-lg border border-success-border bg-success-subtle px-5 py-7 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
              <HeartHandshake size={28} strokeWidth={1.75} />
            </span>
            <h2 className="mt-4 text-[16px] font-semibold text-ink">Donation complete</h2>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-secondary">
              One donor can save multiple lives. Thank you for responding — City Hospital has confirmed your
              donation.
            </p>
            <Button variant="primary" size="lg" fullWidth className="mt-5" onClick={() => navigate('/donor')}>
              Back to home
            </Button>
          </motion.div>
        ) : (
          <Button variant="primary" size="lg" fullWidth onClick={advance}>
            {ACTION_LABEL[status]}
          </Button>
        )}
      </div>
    </MobileShell>
  )
}
