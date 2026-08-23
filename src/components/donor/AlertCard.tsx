import { motion } from 'framer-motion'
import { Droplet, Lock, MapPin, Siren } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { componentLabel, urgencyLabel, urgencyTone } from '@/lib/domainMeta'
import type { DonorAlert } from '@/lib/types'

export function AlertCard({
  alert,
  onAccept,
  onNotNow,
}: {
  alert: DonorAlert
  onAccept: () => void
  onNotNow: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="overflow-hidden rounded-lg border border-critical-border bg-surface shadow-md"
    >
      <div className="flex items-center gap-2 bg-critical px-4 py-2.5 text-white">
        <Siren size={16} />
        <span className="text-[12.5px] font-semibold uppercase tracking-wide">Blood needed nearby</span>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-subtle">
            <Droplet size={24} className="text-primary-active" fill="currentColor" strokeWidth={0.5} />
          </span>
          <div>
            <p className="text-[22px] font-bold leading-none text-ink">{alert.bloodGroup}</p>
            <p className="mt-1 text-[13.5px] text-ink-secondary">
              {componentLabel[alert.component]} · {alert.unitsNeeded} units
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 border-t border-border pt-4">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-ink-secondary">Hospital</span>
            <span className="font-medium text-ink">{alert.hospitalName}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-ink-secondary">Distance</span>
            <span className="flex items-center gap-1 font-medium text-ink">
              <MapPin size={13} className="text-ink-tertiary" />
              {alert.distanceKm} km away
            </span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-ink-secondary">Urgency</span>
            <Badge tone={urgencyTone[alert.urgency]} dot size="sm">
              {urgencyLabel[alert.urgency]}
            </Badge>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <Button variant="danger" size="lg" fullWidth onClick={onAccept}>
            Accept
          </Button>
          <Button variant="outline" size="lg" fullWidth onClick={onNotNow}>
            Not now
          </Button>
        </div>

        <p className="mt-4 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-ink-tertiary">
          <Lock size={12} className="mt-0.5 shrink-0" />
          Your information is only shared with the verified hospital after confirmation.
        </p>
      </div>
    </motion.div>
  )
}
