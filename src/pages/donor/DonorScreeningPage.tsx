import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { MobileShell } from '@/components/layout/MobileShell'
import { ScreeningFlow } from '@/components/donor/ScreeningFlow'

export function DonorScreeningPage() {
  const navigate = useNavigate()

  return (
    <MobileShell
      title="Eligibility check"
      trailingAction={
        <button
          onClick={() => navigate('/donor')}
          aria-label="Exit"
          className="flex h-8 w-8 items-center justify-center rounded-sm text-ink-secondary hover:bg-surface-sunken"
        >
          <X size={18} />
        </button>
      }
    >
      <p className="px-4 pt-3 text-[12.5px] text-ink-secondary">
        Just a few things that may have changed since your registration.
      </p>
      <ScreeningFlow onConfirm={() => navigate('/donor/status')} onExit={() => navigate('/donor')} />
    </MobileShell>
  )
}
