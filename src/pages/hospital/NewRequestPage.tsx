import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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

export function NewRequestPage() {
  const [params] = useSearchParams()
  const demo = params.get('demo') === '1'
  const [token] = useState(() => crypto.randomUUID())
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<RequestDraft>(() => {
    if (demo) return {radius:5,bloodGroup:'O-', component:'WHOLE', unitsNeeded:1, urgency:'CRITICAL'}
    const group = params.get('group')
    const component = params.get('component')
    return {...emptyDraft, bloodGroup:group && /^(A|B|AB|O)[+-]$/.test(group) ? group as RequestDraft['bloodGroup'] : null,
      component:component && ['WHOLE','PLATELET','PLASMA'].includes(component) ? component as RequestDraft['component'] : null}
  })
  const [logistics,setLogistics] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { createRequest } = useRequests()

  const isLastStep = stepIndex === STEP_LABELS.length - 1
  const completed = [
    draft.bloodGroup !== null && draft.component !== null && Number.isInteger(draft.unitsNeeded) && draft.unitsNeeded >= 1 && draft.unitsNeeded <= 10,
    draft.urgency !== null,
    [5, 15, 40].includes(draft.radius),
  ]
  const canAdvance = completed.slice(0, stepIndex + 1).every(Boolean)

  const updateDraft = (patch: Partial<RequestDraft>) => setDraft((prev) => ({ ...prev, ...patch }))

  const handleBack = () => {
    if (stepIndex === 0) {
      navigate('/hospital/requests')
      return
    }
    setStepIndex((i) => i - 1)
  }

  const handleNext = () => {
    if (!isLastStep && canAdvance) setStepIndex(stepIndex + 1)
  }

  const handleSubmit = async () => {
    if (!isLastStep || !canAdvance || submitting || !draft.bloodGroup || !draft.component || !draft.urgency) return
    setSubmitting(true)
    try {
      const created = await createRequest({
        bloodGroup: draft.bloodGroup,
        component: draft.component,
        unitsNeeded: draft.unitsNeeded,
        urgency: draft.urgency,
        radius: draft.radius,
        logistics: logistics || null,
      }, token)
      toast({
        title: `Request ${created.id} created`,
        description: 'Matching finished. See the ranked donors and invitation states.',
        tone: 'success',
      })
      navigate(`/hospital/requests/${created.id}`)
    } catch (err) {
      toast({title:'Request could not be created', description:err instanceof Error ? err.message : 'Try again.', tone:'critical'})
    } finally { setSubmitting(false) }
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
        {stepIndex === 2 && <Step3Location draft={draft} onChange={updateDraft} />}
        {stepIndex === 3 && <Step4Review draft={draft} />}

        {isLastStep && <label className="mt-4 block text-sm">Logistics preference
          <select aria-label="Logistics preference" className="mt-1 block w-full rounded border border-border p-2" value={logistics} onChange={e=>setLogistics(e.target.value)}>
            <option value="">No preference</option>{['Evening arrival','Travel by public transit','Help finding the collection entrance'].map(v=><option key={v}>{v}</option>)}</select></label>}
        {!canAdvance && <p className="mt-4 text-sm text-ink-secondary">{stepIndex===0 ? "Choose a blood group and component to continue." : "Choose an urgency to continue."}</p>}
        <div className="mt-7 flex items-center justify-between border-t border-border pt-5">
          <Button variant="ghost" size="sm" disabled={submitting} onClick={handleBack} leadingIcon={<ArrowLeft size={15} />}>
            {stepIndex === 0 ? 'Cancel' : 'Back'}
          </Button>

          {isLastStep ? (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !canAdvance}
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
