import type { ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { componentLabel, urgencyLabel, urgencyTone } from '@/lib/domainMeta'
import type { RequestDraft } from './types'

function ReviewRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
      <span className="text-[13px] text-ink-secondary">{label}</span>
      <span className="text-[13.5px] font-medium text-ink">{children}</span>
    </div>
  )
}

export function Step4Review({ draft }: { draft: RequestDraft }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-[13px] font-semibold text-ink">Review request</h3>
        <p className="mt-0.5 text-[12.5px] text-ink-secondary">
          Confirm the details below. Matching runs on submission and follows the hospital’s invitation preference.
        </p>
      </div>

      <div className="rounded-md border border-border-strong px-4">
        <ReviewRow label="Blood group">
          {draft.bloodGroup ? (
            <Badge tone="primary" size="sm">
              {draft.bloodGroup}
            </Badge>
          ) : (
            '—'
          )}
        </ReviewRow>
        <ReviewRow label="Component">{draft.component ? componentLabel[draft.component] : '—'}</ReviewRow>
        <ReviewRow label="Units required">{draft.unitsNeeded} units</ReviewRow>
        <ReviewRow label="Urgency">
          {draft.urgency ? (
            <Badge tone={urgencyTone[draft.urgency]} dot size="sm">
              {urgencyLabel[draft.urgency]}
            </Badge>
          ) : (
            '—'
          )}
        </ReviewRow>
        <ReviewRow label="Initial search radius">{draft.radius} km</ReviewRow>
        <ReviewRow label="Location">City Hospital — 42 Marina Road, Sector 9 (synthetic site)</ReviewRow>
      </div>

      <div className="flex gap-3 rounded-md border border-info-border bg-info-subtle p-4">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-info" strokeWidth={1.75} />
        <div>
          <p className="text-[13px] font-semibold text-info">This request contains logistics information only.</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-secondary">
            No patient name, diagnosis, or medical history is collected. Only blood group, component, quantity and
            hospital location are used to filter and alert eligible donors.
          </p>
        </div>
      </div>
    </div>
  )
}
