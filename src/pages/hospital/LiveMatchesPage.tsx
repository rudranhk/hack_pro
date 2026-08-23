import { useState } from 'react'
import { CheckCircle2, MapPinned, Navigation, Radar } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { MetricCard } from '@/components/hospital/MetricCard'
import { LiveMatchCard } from '@/components/hospital/matches/LiveMatchCard'
import { LiveMatchMap } from '@/components/hospital/matches/LiveMatchMap'
import { MatchDetailDrawer } from '@/components/hospital/matches/MatchDetailDrawer'
import { ContactDonorModal } from '@/components/hospital/matches/ContactDonorModal'
import { liveMatchMetrics, mockLiveMatches } from '@/lib/mockLiveMatches'
import type { LiveMatch } from '@/lib/types'

export function LiveMatchesPage() {
  const [detail, setDetail] = useState<LiveMatch | null>(null)
  const [contactDonorId, setContactDonorId] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold text-ink">Live Matches</h1>
          <p className="mt-1 text-[13px] text-ink-secondary">Real-time donor commitments across active requests.</p>
        </div>
        <span className="mt-1 flex items-center gap-1.5 rounded-full border border-critical-border bg-critical-subtle px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-critical">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-critical" />
          Live
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={Radar} label="Active matches" value={liveMatchMetrics.activeMatches} tone="info" />
        <MetricCard icon={Navigation} label="En route" value={liveMatchMetrics.enRoute} tone="warning" />
        <MetricCard icon={MapPinned} label="Arrived" value={liveMatchMetrics.arrived} tone="neutral" />
        <MetricCard icon={CheckCircle2} label="Donated" value={liveMatchMetrics.donated} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-3">
          {mockLiveMatches.length === 0 ? (
            <Card className="p-5">
              <EmptyState icon={Radar} title="No active donor commitments." />
            </Card>
          ) : (
            mockLiveMatches.map((match) => (
              <LiveMatchCard
                key={match.requestId}
                match={match}
                onOpenDetail={() => setDetail(match)}
                onContact={() => setContactDonorId(match.donorId)}
              />
            ))
          )}
        </div>

        <Card className="h-fit p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-ink">Live request map</h2>
          <LiveMatchMap matches={mockLiveMatches} />
        </Card>
      </div>

      <MatchDetailDrawer match={detail} onClose={() => setDetail(null)} />
      <ContactDonorModal donorId={contactDonorId} open={!!contactDonorId} onClose={() => setContactDonorId(null)} />
    </div>
  )
}
