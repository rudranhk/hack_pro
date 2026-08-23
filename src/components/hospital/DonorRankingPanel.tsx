import { useState } from 'react'
import { motion } from 'framer-motion'
import { SearchX } from 'lucide-react'
import { DonorCard } from './DonorCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useRequests } from '@/lib/context/RequestsContext'
import { nextEscalationStep } from '@/lib/escalation'
import type { EmergencyRequest, RankedDonor } from '@/lib/types'

export function DonorRankingPanel({ request, donors }: { request: EmergencyRequest; donors: RankedDonor[] }) {
  const candidates = donors
    .filter((d) => d.mapState === 'ALERTED' || d.mapState === 'ELIGIBLE')
    .sort((a, b) => b.score - a.score)

  const [expandedId, setExpandedId] = useState<string | null>(candidates[0]?.id ?? null)
  const { updateRequest } = useRequests()
  const { toast } = useToast()

  if (candidates.length === 0) {
    const next = nextEscalationStep(request.escalationTier)
    return (
      <EmptyState
        icon={SearchX}
        title="No eligible donors found within the current radius."
        description="No compatible, available donors have been reached yet at this escalation tier."
        action={
          next ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                updateRequest(request.id, { escalationTier: next.toTier, timeElapsedLabel: next.elapsedLabel })
                toast({
                  title: 'Search expanded',
                  description: `Escalated to ${next.toTier} — still looking for compatible donors.`,
                  tone: 'warning',
                })
              }}
            >
              Expand search
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <div>
      <div className="mb-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-ink">Top Matches</h2>
          <span className="text-[11px] font-medium text-ink-tertiary">Explainable Match Score</span>
        </div>
        <p className="mt-0.5 text-[12.5px] text-ink-secondary">
          Ranked by response-propensity, not a black box — every score breaks down into the factors behind it.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {candidates.map((donor, index) => (
          <motion.div
            key={donor.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
          >
            <DonorCard
              donor={donor}
              rank={index + 1}
              expanded={expandedId === donor.id}
              onToggle={() => setExpandedId((current) => (current === donor.id ? null : donor.id))}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
