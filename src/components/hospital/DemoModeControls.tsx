import { FlaskConical, RotateCcw, UserCog, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useRequests } from '@/lib/context/RequestsContext'
import type { EmergencyRequest, EscalationTier } from '@/lib/types'

interface TriggerStep {
  fromTier: EscalationTier
  toTier: EscalationTier
  elapsedLabel: string
  buttonLabel: string
  toastTitle: string
  toastDescription: string
}

const STEPS: TriggerStep[] = [
  {
    fromTier: 'NEARBY',
    toTier: 'WIDE',
    elapsedLabel: '03:00',
    buttonLabel: 'Trigger +3 min',
    toastTitle: 'Escalated to WIDE',
    toastDescription: 'Search radius expanded to 15 km — no response yet.',
  },
  {
    fromTier: 'WIDE',
    toTier: 'CITY',
    elapsedLabel: '08:00',
    buttonLabel: 'Trigger +8 min',
    toastTitle: 'Escalated to CITY',
    toastDescription: 'Search radius expanded to 40 km — still searching.',
  },
  {
    fromTier: 'CITY',
    toTier: 'HUMAN',
    elapsedLabel: '15:00',
    buttonLabel: 'Trigger Human Escalation',
    toastTitle: 'Escalated to HUMAN',
    toastDescription: 'Automated matching exhausted — blood-bank coordinator notified.',
  },
]

/** Fast-forwards a live request through the escalation ladder — no real waiting required for a demo. */
export function DemoModeControls({ request }: { request: EmergencyRequest }) {
  const { updateRequest } = useRequests()
  const { toast } = useToast()

  const trigger = (step: TriggerStep) => {
    updateRequest(request.id, { escalationTier: step.toTier, timeElapsedLabel: step.elapsedLabel })
    toast({ title: step.toastTitle, description: step.toastDescription, tone: step.toTier === 'HUMAN' ? 'critical' : 'warning' })
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
        {STEPS.map((step) => (
          <Button
            key={step.toTier}
            variant="outline"
            size="sm"
            disabled={request.escalationTier !== step.fromTier}
            onClick={() => trigger(step)}
            leadingIcon={step.toTier === 'HUMAN' ? <UserCog size={13} /> : <Zap size={13} />}
          >
            {step.buttonLabel}
          </Button>
        ))}
      </div>
    </div>
  )
}
