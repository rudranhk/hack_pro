import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Hourglass, SearchX } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { EscalationTimeline } from '@/components/hospital/EscalationTimeline'
import { DonorMap } from '@/components/hospital/DonorMap'
import { LiveMatchRankingPanel } from '@/components/hospital/LiveMatchRankingPanel'
import { DemoModeControls } from '@/components/hospital/DemoModeControls'
import { HumanEscalationPanel } from '@/components/hospital/HumanEscalationPanel'
import { useRequests } from '@/lib/context/RequestsContext'
import { mockRankedDonors } from '@/lib/mockData'
import { compatibleDonorGroups } from '@/lib/compatibility'
import { componentLabel, requestStatusHeadline, requestStatusTone } from '@/lib/domainMeta'

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { requests } = useRequests()
  const request = requests.find((r) => r.id === id)

  if (!request) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <EmptyState
          icon={SearchX}
          title="Request not found"
          description={`There's no request with ID "${id}" in this session.`}
        />
      </div>
    )
  }

  const resolved = request.status === 'COVERED' || request.status === 'CONFIRMED' || request.status === 'FULFILLED'
  const matchedDonor = mockRankedDonors.find((d) => d.mapState === 'MATCHED')

  // Blood-type compatibility is a hard filter, applied before anything else touches the pool —
  // a request can genuinely have zero eligible donors if the demo pool has no compatible match.
  const allowedGroups = compatibleDonorGroups(request.bloodGroup, request.component)
  const compatibleDonors = mockRankedDonors.filter((d) => allowedGroups.has(d.bloodGroup))

  return (
    <div className="flex flex-col gap-5">
      <BackLink />

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[12px] text-ink-tertiary">Emergency Request</p>
            <h1 className="font-mono text-[20px] font-semibold text-ink">#{request.id}</h1>
          </div>
          <Badge tone={requestStatusTone[request.status]} dot className="px-3 py-1.5 text-[12px] tracking-wide">
            {requestStatusHeadline[request.status].toUpperCase()}
          </Badge>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-3">
            <Badge tone="primary" className="px-3 py-1.5 text-[15px] font-bold">
              {request.bloodGroup}
            </Badge>
            <div>
              <p className="text-[13.5px] font-medium text-ink">{componentLabel[request.component]}</p>
              <p className="text-[12px] text-ink-tertiary">{request.unitsNeeded} units required</p>
            </div>
          </div>

          <div className="min-w-[220px] flex-1">
            <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
              <span className="font-medium text-ink">
                {request.unitsSecured} / {request.unitsNeeded} units secured
              </span>
              <span className="tabular text-ink-tertiary">Elapsed {request.timeElapsedLabel}</span>
            </div>
            <ProgressBar
              value={request.unitsSecured}
              max={request.unitsNeeded}
              tone={request.unitsSecured >= request.unitsNeeded ? 'success' : 'primary'}
            />
          </div>
        </div>
      </Card>

      {request.status === 'SEARCHING' && <DemoModeControls request={request} />}

      {request.escalationTier === 'HUMAN' && <HumanEscalationPanel request={request} />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-ink">Escalation timeline</h2>
          <EscalationTimeline currentTier={request.escalationTier} resolved={resolved} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-ink">Live donor map</h2>
          <DonorMap currentTier={request.escalationTier} donors={compatibleDonors} />
        </Card>
      </div>

      <Card className="p-5">
        {request.status === 'EXPIRED' ? (
          <EmptyState
            icon={Hourglass}
            title="This emergency request expired without enough confirmed donors."
            description="Escalation ran through every tier, including the blood-bank coordinator handoff, without securing all required units."
          />
        ) : resolved ? (
          <EmptyState
            icon={CheckCircle2}
            tone="success"
            title="All required units are currently secured."
            description={
              matchedDonor
                ? `${request.unitsSecured} of ${request.unitsNeeded} units confirmed — including Donor #${matchedDonor.id}. No further donors are being alerted for this request.`
                : 'No further donors are being alerted for this request.'
            }
          />
        ) : (
          <>
            {request.unitsSecured > 0 && matchedDonor && (
              <div className="mb-4 rounded-md border border-success-border bg-success-subtle px-3.5 py-2.5 text-[12.5px] text-success">
                {request.unitsSecured} of {request.unitsNeeded} units already secured — Donor #{matchedDonor.id}{' '}
                confirmed and matched.
              </div>
            )}
            <LiveMatchRankingPanel request={request} fallbackDonors={compatibleDonors} />
          </>
        )}
      </Card>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/hospital/requests"
      className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-ink-secondary hover:text-ink"
    >
      <ArrowLeft size={15} />
      Back to requests
    </Link>
  )
}
