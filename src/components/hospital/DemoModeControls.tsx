import { FlaskConical, RotateCcw, UserCog, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useRequests } from '@/lib/context/RequestsContext'
import { ESCALATION_SEQUENCE, type EscalationStep } from '@/lib/escalation'
import type { EmergencyRequest, EscalationTier } from '@/lib/types'

const COPY: Record<EscalationTier, { buttonLabel: string; toastTitle: string; toastDescription: string }> = {
  NEARBY: { buttonLabel: '', toastTitle: '', toastDescription: '' }, // never a `toTier`, unused
  WIDE: {
    buttonLabel: 'Trigger +3 min',
    toastTitle: 'Escalated to WIDE',
    toastDescription: 'Search radius expanded to 15 km — no response yet.',
  },
  CITY: {
    buttonLabel: 'Trigger +8 min',
    toastTitle: 'Escalated to CITY',
    toastDescription: 'Search radius expanded to 40 km — still searching.',
  },
  HUMAN: {
    buttonLabel: 'Trigger Human Escalation',
    toastTitle: 'Escalated to HUMAN',
    toastDescription: 'Automated matching exhausted — blood-bank coordinator notified.',
  },
  EXPIRED: { buttonLabel: '', toastTitle: '', toastDescription: '' }, // not reachable from Demo Mode's 3 buttons
}

/** Fast-forwards a live request through the escalation ladder — no real waiting required for a demo. */
export function DemoModeControls({ request }: { request: EmergencyRequest }) {
  const { updateRequest } = useRequests()
  const { toast } = useToast()

  const trigger = (step: EscalationStep) => {
    const copy = COPY[step.toTier]
    updateRequest(request.id, { escalationTier: step.toTier, timeElapsedLabel: step.elapsedLabel })
    toast({ title: copy.toastTitle, description: copy.toastDescription, tone: step.toTier === 'HUMAN' ? 'critical' : 'warning' })
  }

  const reset = () => {
    updateRequest(request.id, { escalationTier: 'NEARBY', timeElapsedLabel: '00:00' })
    toast({ title: 'Scenario reset', description: 'Back to 00:00 — Nearby.', tone: 'neutral' })
  }

  return (
    <div className="rounded-lg border border-dashed border-border-strong p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
          <FlaskConical size={13} />
          Demo mode
        </p>
        <Button variant="ghost" size="sm" onClick={reset} leadingIcon={<RotateCcw size={13} />}>
          Reset scenario
        </Button>
      </div>
      <p className="mt-1 text-[12px] text-ink-secondary">
        Fast-forward this request through automated escalation — see the failure path in seconds instead of
        real minutes.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ESCALATION_SEQUENCE.map((step) => (
          <Button
            key={step.toTier}
            variant="outline"
            size="sm"
            disabled={request.escalationTier !== step.fromTier}
            onClick={() => trigger(step)}
            leadingIcon={step.toTier === 'HUMAN' ? <UserCog size={13} /> : <Zap size={13} />}
          >
            {COPY[step.toTier].buttonLabel}
          </Button>
        ))}
      </div>
    </div>
  )
}
