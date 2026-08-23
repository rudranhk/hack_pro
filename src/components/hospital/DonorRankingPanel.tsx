import { useState } from 'react'
import { DonorCard } from './DonorCard'
import type { RankedDonor } from '@/lib/types'

export function DonorRankingPanel({ donors }: { donors: RankedDonor[] }) {
  const candidates = donors
    .filter((d) => d.mapState === 'ALERTED' || d.mapState === 'ELIGIBLE')
    .sort((a, b) => b.score - a.score)

  const [expandedId, setExpandedId] = useState<string | null>(candidates[0]?.id ?? null)

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
          <DonorCard
            key={donor.id}
            donor={donor}
            rank={index + 1}
            expanded={expandedId === donor.id}
            onToggle={() => setExpandedId((current) => (current === donor.id ? null : donor.id))}
          />
        ))}
      </div>
    </div>
  )
}
