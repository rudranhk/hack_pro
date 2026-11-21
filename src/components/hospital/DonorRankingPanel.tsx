import { useState } from 'react'
import { DonorCard } from './DonorCard'
import type { EmergencyRequest, RankedDonor } from '@/lib/types'
import { escalationTierRadiusKm } from '@/lib/domainMeta'

export function DonorRankingPanel({request, donors}: {request:EmergencyRequest; donors:RankedDonor[]}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const candidates = donors.filter(d => d.available && d.distanceKm <= escalationTierRadiusKm[request.escalationTier])
    .sort((a,b) => b.score-a.score)
  return <div className="space-y-2">{candidates.length === 0 && <p>No available donors in range.</p>}
    {candidates.map((d,i) => <DonorCard key={d.id} donor={d} rank={i+1} expanded={expanded === d.id} onToggle={() => setExpanded(expanded === d.id ? null : d.id)}/>)}</div>
}
