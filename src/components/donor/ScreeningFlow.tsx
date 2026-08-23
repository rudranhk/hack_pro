import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, CheckCircle2, PauseCircle } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface Question {
  text: string
  /** The answer that keeps a donor eligible — the other answer triggers a deferral. */
  safeAnswer: boolean
}

const QUESTIONS: Question[] = [
  { text: 'Have you had fever, cold, or infection in the last 7 days?', safeAnswer: false },
  { text: 'Have you started any new medication recently?', safeAnswer: false },
  { text: 'Have you had a tattoo, piercing, or dental procedure recently?', safeAnswer: false },
  { text: 'Have you consumed alcohol in the last 24 hours?', safeAnswer: false },
  { text: 'Are you feeling well and rested today?', safeAnswer: true },
]

type Phase = { kind: 'questions' } | { kind: 'cleared' } | { kind: 'deferred' }

export function ScreeningFlow({
  onConfirm,
  onExit,
  onDeferred,
}: {
  onConfirm: () => void
  onExit: () => void
  /** Fires the moment screening fails — the caller releases whatever the accept-time slot claim held. */
  onDeferred?: () => void
}) {
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<Phase>({ kind: 'questions' })

  const answer = (value: boolean) => {
    const failed = value !== QUESTIONS[step].safeAnswer
    if (failed) {
      setPhase({ kind: 'deferred' })
      onDeferred?.()
      return
    }
    if (step === QUESTIONS.length - 1) {
      setPhase({ kind: 'cleared' })
    } else {
      setStep((s) => s + 1)
    }
  }

  if (phase.kind === 'cleared') {
    return (
      <div className="flex flex-col items-center px-4 pt-10 text-center">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-success-subtle text-success"
        >
          <CheckCircle2 size={32} strokeWidth={1.75} />
        </motion.span>
        <h2 className="mt-5 text-[18px] font-semibold text-ink">You're cleared for this request.</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">
          Nothing in your answers changes your eligibility. Confirm and the hospital will see you as a matched donor.
        </p>
        <Button variant="primary" size="lg" fullWidth className="mt-7" onClick={onConfirm}>
          Confirm donation
        </Button>
        <button onClick={onExit} className="mt-3 text-[13px] font-medium text-ink-secondary hover:text-ink">
          Cancel
        </button>
      </div>
    )
  }

  if (phase.kind === 'deferred') {
    return (
      <div className="flex flex-col items-center px-4 pt-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-warning-subtle text-warning">
          <PauseCircle size={32} strokeWidth={1.75} />
        </span>
        <h2 className="mt-5 text-[18px] font-semibold text-ink">You're temporarily unavailable for this request.</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">
          Based on today's answers, it's best to sit this one out. This is temporary, not a rejection — your
          eligibility resets automatically.
        </p>
        <div className="mt-5 flex items-center gap-2 rounded-md border border-border bg-surface-sunken px-4 py-3">
          <Calendar size={16} className="text-ink-tertiary" />
          <span className="text-[13px] font-medium text-ink">Next eligible: in about 7 days</span>
        </div>
        <Button variant="outline" size="lg" fullWidth className="mt-7" onClick={onExit}>
          Back to home
        </Button>
      </div>
    )
  }

  const question = QUESTIONS[step]

  return (
    <div className="flex flex-col px-4 pt-5">
      <div className="mb-1 flex items-center justify-between text-[12px] text-ink-tertiary">
        <span>
          Question {step + 1} of {QUESTIONS.length}
        </span>
      </div>
      <ProgressBar value={step + 1} max={QUESTIONS.length} size="sm" />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="mt-8"
        >
          <p className="text-[17px] font-medium leading-snug text-ink">{question.text}</p>

          <div className="mt-7 flex flex-col gap-2.5">
            <AnswerButton label="No" onClick={() => answer(false)} />
            <AnswerButton label="Yes" onClick={() => answer(true)} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function AnswerButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-14 rounded-md border border-border-strong bg-surface text-[15px] font-semibold text-ink transition-colors',
        'hover:border-primary hover:bg-primary-subtle active:scale-[0.98]'
      )}
    >
      {label}
    </button>
  )
}
