import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { MobileShell } from '@/components/layout/MobileShell'
import { ScreeningFlow } from '@/components/donor/ScreeningFlow'
import { useRequests } from '@/lib/context/RequestsContext'
import { releaseUnit } from '@/lib/donorSlotClaim'
import { mockDonorAlert } from '@/lib/mockData'

export function DonorScreeningPage() {
  const navigate = useNavigate()
  const { requests, updateRequest } = useRequests()

  const handleDeferred = () => {
    const matchedRequest = requests.find((r) => r.id === mockDonorAlert.requestId)
    if (matchedRequest) updateRequest(matchedRequest.id, releaseUnit(matchedRequest))
  }

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
      <ScreeningFlow
        onConfirm={() => navigate('/donor/status')}
        onExit={() => navigate('/donor')}
        onDeferred={handleDeferred}
      />
    </MobileShell>
  )
}
