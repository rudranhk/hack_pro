import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, FlaskConical, X } from 'lucide-react'
import { MobileShell } from '@/components/layout/MobileShell'
import { AlertCard } from '@/components/donor/AlertCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { mockDonorAlert } from '@/lib/mockData'

type Scenario = 'open' | 'already-covered'

export function DonorAlertPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [scenario, setScenario] = useState<Scenario>('open')
  const [covered, setCovered] = useState(false)

  const handleNotNow = () => {
    toast({
      title: "No problem — you'll be notified for the next emergency.",
      tone: 'neutral',
    })
    navigate('/donor')
  }

  const handleAccept = () => {
    if (scenario === 'already-covered') {
      // Simulates losing a race to another donor's acceptance — handled gracefully, not as an error.
      setCovered(true)
      return
    }
    navigate('/donor/screening')
  }

  const handleNotifyMe = () => {
    toast({
      title: "You're on the list",
      description: "We'll alert you first for the next matching emergency.",
      tone: 'success',
    })
    navigate('/donor')
  }

  return (
    <MobileShell
      title="Emergency alert"
      trailingAction={
        <button
          onClick={handleNotNow}
          aria-label="Dismiss"
          className="flex h-8 w-8 items-center justify-center rounded-sm text-ink-secondary hover:bg-surface-sunken"
        >
          <X size={18} />
        </button>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        {!covered && (
          <div className="rounded-lg border border-dashed border-border-strong p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
              <FlaskConical size={12} />
              Demo control — scenario
            </p>
            <p className="mt-1 text-[11.5px] text-ink-secondary">
              Multiple donors can accept an alert at once — see how it's handled when someone else gets there
              first.
            </p>
            <div className="mt-2.5 flex gap-2">
              <ScenarioButton active={scenario === 'open'} onClick={() => setScenario('open')}>
                Slot open
              </ScenarioButton>
              <ScenarioButton active={scenario === 'already-covered'} onClick={() => setScenario('already-covered')}>
                Already covered
              </ScenarioButton>
            </div>
          </div>
        )}

        {covered ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <EmptyState
              icon={CheckCircle2}
              tone="success"
              title="This request is already covered."
              description="Thank you for responding. Your willingness to help has been recorded, and we'll notify you when you're needed."
              action={
                <Button variant="primary" onClick={handleNotifyMe}>
                  Notify me for the next emergency
                </Button>
              }
            />
          </motion.div>
        ) : (
          <AlertCard alert={mockDonorAlert} onAccept={handleAccept} onNotNow={handleNotNow} />
        )}
      </div>
    </MobileShell>
  )
}

function ScenarioButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 flex-1 rounded-full border text-[11.5px] font-medium transition-colors',
        active ? 'border-primary bg-primary text-white' : 'border-border-strong bg-surface text-ink-secondary'
      )}
    >
      {children}
    </button>
  )
}
