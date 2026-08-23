import { useState } from 'react'
import { Loader2, Radio, RotateCcw, Wifi } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { fetchLiveMatches, MatchingApiError } from '@/lib/api/matchingClient'
import { DonorRankingPanel } from './DonorRankingPanel'
import type { EmergencyRequest, RankedDonor } from '@/lib/types'

type Mode = 'demo' | 'loading' | 'live'

/**
 * Wraps DonorRankingPanel with an optional call to the real Gemini + Qdrant backend
 * (server/). Defaults to — and always falls back to — the demo donor pool, so this
 * screen never depends on the backend being up.
 */
export function LiveMatchRankingPanel({
  request,
  fallbackDonors,
}: {
  request: EmergencyRequest
  fallbackDonors: RankedDonor[]
}) {
  const [mode, setMode] = useState<Mode>('demo')
  const [liveDonors, setLiveDonors] = useState<RankedDonor[] | null>(null)
  const { toast } = useToast()

  const tryLive = async () => {
    setMode('loading')
    try {
      const { donors, query } = await fetchLiveMatches({
        bloodGroup: request.bloodGroup,
        component: request.component,
        unitsNeeded: request.unitsNeeded,
        urgency: request.urgency,
      })
      setLiveDonors(donors)
      setMode('live')
      toast({
        title: 'Live match complete',
        description: `Gemini + Qdrant returned ${donors.length} candidates for: "${query}"`,
        tone: 'success',
      })
    } catch (err) {
      setMode('demo')
      toast({
        title: "Couldn't reach the live matching backend",
        description: err instanceof MatchingApiError ? err.message : 'Unknown error — see console.',
        tone: 'warning',
      })
    }
  }

  const backToDemo = () => {
    setMode('demo')
    setLiveDonors(null)
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-border-strong px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          {mode === 'live' ? (
            <Badge tone="success" dot size="sm">
              <Wifi size={11} className="mr-0.5" />
              Live match — Gemini + Qdrant
            </Badge>
          ) : (
            <Badge tone="neutral" size="sm">
              Demo data
            </Badge>
          )}
          <span className="text-[11.5px] text-ink-tertiary">
            {mode === 'live'
              ? 'Ranking below came from the real backend, not mock data.'
              : 'Optional: call the real vector-search backend if it\'s running locally.'}
          </span>
        </div>

        {mode === 'live' ? (
          <Button variant="ghost" size="sm" onClick={backToDemo} leadingIcon={<RotateCcw size={13} />}>
            Back to demo data
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={tryLive}
            disabled={mode === 'loading'}
            leadingIcon={
              mode === 'loading' ? <Loader2 size={13} className="animate-spin" /> : <Radio size={13} />
            }
          >
            {mode === 'loading' ? 'Matching…' : 'Try live match'}
          </Button>
        )}
      </div>

      <DonorRankingPanel request={request} donors={mode === 'live' && liveDonors ? liveDonors : fallbackDonors} />
    </div>
  )
}
