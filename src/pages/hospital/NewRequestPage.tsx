import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Loader2, Send } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Stepper } from '@/components/ui/Stepper'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useRequests } from '@/lib/context/RequestsContext'
import { Step1BloodRequirement } from '@/components/hospital/wizard/Step1BloodRequirement'
import { Step2Urgency } from '@/components/hospital/wizard/Step2Urgency'
import { Step3Location } from '@/components/hospital/wizard/Step3Location'
import { Step4Review } from '@/components/hospital/wizard/Step4Review'
import { emptyDraft, type RequestDraft } from '@/components/hospital/wizard/types'

const STEP_LABELS = ['Blood Requirement', 'Urgency', 'Location', 'Review']

function isStepValid(stepIndex: number, draft: RequestDraft): boolean {
  if (stepIndex === 0) return draft.bloodGroup !== null && draft.component !== null && draft.unitsNeeded > 0
  if (stepIndex === 1) return draft.urgency !== null
  return true
}

export function NewRequestPage() {
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<RequestDraft>(emptyDraft)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { createRequest } = useRequests()

  const isLastStep = stepIndex === STEP_LABELS.length - 1
  const canAdvance = isStepValid(stepIndex, draft)

  const updateDraft = (patch: Partial<RequestDraft>) => setDraft((prev) => ({ ...prev, ...patch }))

  const handleBack = () => {
    if (stepIndex === 0) {
      navigate('/hospital/requests')
      return
    }
    setStepIndex((i) => i - 1)
  }

  const handleNext = () => setStepIndex((i) => Math.min(STEP_LABELS.length - 1, i + 1))

  const handleSubmit = () => {
    if (!draft.bloodGroup || !draft.component || !draft.urgency) return
    setSubmitting(true)
    // Simulated network round-trip so "created → live tracking" reads as a real transition, not an instant swap.
    window.setTimeout(() => {
      const created = createRequest({
        bloodGroup: draft.bloodGroup!,
        component: draft.component!,
        unitsNeeded: draft.unitsNeeded,
        urgency: draft.urgency!,
      })
      toast({
        title: `Request ${created.id} created`,
        description: 'Filtering eligible donors and alerting top matches now.',
        tone: 'success',
      })
      navigate(`/hospital/requests/${created.id}`)
    }, 700)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="text-[18px] font-semibold text-ink">New emergency request</h2>
        <p className="mt-1 text-[13px] text-ink-secondary">
          A focused, logistics-only flow — no patient details are ever asked for.
        </p>
      </div>

      <Card className="p-6">
        <Stepper steps={STEP_LABELS} currentIndex={stepIndex} className="mb-7" />

        {stepIndex === 0 && <Step1BloodRequirement draft={draft} onChange={updateDraft} />}
        {stepIndex === 1 && <Step2Urgency draft={draft} onChange={updateDraft} />}
        {stepIndex === 2 && <Step3Location />}
        {stepIndex === 3 && <Step4Review draft={draft} />}

        <div className="mt-7 flex items-center justify-between border-t border-border pt-5">
          <Button variant="ghost" size="sm" onClick={handleBack} leadingIcon={<ArrowLeft size={15} />}>
            {stepIndex === 0 ? 'Cancel' : 'Back'}
          </Button>

          {isLastStep ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              leadingIcon={submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            >
              {submitting ? 'Submitting…' : 'Submit request'}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              disabled={!canAdvance}
              trailingIcon={<ArrowRight size={15} />}
            >
              Next
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
