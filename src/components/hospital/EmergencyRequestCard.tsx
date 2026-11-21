import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { buttonClasses } from '@/components/ui/Button'
import {
  componentLabel,
  escalationTierLabel,
  escalationTierTone,
  requestStatusLabel,
  requestStatusTone,
  urgencyLabel,
  urgencyTone,
} from '@/lib/domainMeta'
import type { EmergencyRequest } from '@/lib/types'

/** Shared column widths so the header row and every request row line up. */
const GRID_COLS = 'xl:grid-cols-[128px_1fr_140px_104px_104px_84px_110px_76px]'

export function EmergencyRequestListHeader() {
  return (
    <div
      className={`hidden gap-4 px-4 pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary xl:grid ${GRID_COLS}`}
    >
      <span>Request</span>
      <span>Requirement</span>
      <span>Progress</span>
      <span>Urgency</span>
      <span>Escalation</span>
      <span>Elapsed</span>
      <span>Status</span>
      <span className="text-right">Action</span>
    </div>
  )
}

export function EmergencyRequestCard({ request }: { request: EmergencyRequest }) {
  return (
    <Link to={'/hospital/requests/'+request.id} aria-label={'View request '+request.id}
      className={`grid grid-cols-2 items-center gap-x-4 gap-y-3 rounded-lg border border-border bg-surface p-4 shadow-xs transition-colors hover:border-border-strong xl:gap-y-0 ${GRID_COLS}`}
    >
      <div className="col-span-2 xl:col-span-1">
        <p className="font-mono text-[13px] font-medium text-ink">{request.id}</p>
        <p className="text-[11.5px] text-ink-tertiary">{request.createdAtLabel}</p>
      </div>

      <div>
        <p className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
          Requirement
        </p>
        <div className="flex items-center gap-2">
          <Badge tone="primary" size="sm">
            {request.bloodGroup}
          </Badge>
          <span className="text-[13px] text-ink">{componentLabel[request.component]}</span>
        </div>
      </div>

      <div>
        <p className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
          Progress
        </p>
        <p className="tabular text-[13px] font-medium text-ink">
          {request.unitsSecured} / {request.unitsNeeded} <span className="font-normal text-ink-tertiary">units</span>
        </p>
        <ProgressBar
          value={request.unitsSecured}
          max={request.unitsNeeded}
          tone={request.unitsSecured >= request.unitsNeeded ? 'success' : 'primary'}
          size="sm"
          className="mt-1.5 max-w-[120px]"
        />
      </div>

      <div>
        <p className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">Urgency</p>
        <Badge tone={urgencyTone[request.urgency]} dot size="sm">
          {urgencyLabel[request.urgency]}
        </Badge>
      </div>

      <div>
        <p className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
          Escalation
        </p>
        <Badge tone={escalationTierTone[request.escalationTier]} size="sm">
          {escalationTierLabel[request.escalationTier]}
        </Badge>
      </div>

      <div>
        <p className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">Elapsed</p>
        <span className="inline-flex items-center gap-1 tabular text-[13px] text-ink-secondary">
          <Clock size={13} />
          {request.timeElapsedLabel}
        </span>
      </div>

      <div>
        <p className="xl:hidden mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">Status</p>
        <Badge tone={requestStatusTone[request.status]} size="sm">
          {requestStatusLabel[request.status]}
        </Badge>
      </div>

      <div className="col-span-2 xl:col-span-1 xl:text-right">
        <span
          className={buttonClasses({ variant: 'outline', size: 'sm', className: 'w-full xl:w-auto' })}
        >
          View
        </span>
      </div>
    </Link>
  )
}
