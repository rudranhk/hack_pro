import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { MobileShell } from '@/components/layout/MobileShell'
import { AlertCard } from '@/components/donor/AlertCard'
import { useToast } from '@/components/ui/Toast'
import { mockDonorAlert } from '@/lib/mockData'

export function DonorAlertPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleNotNow = () => {
    toast({
      title: "No problem — you'll be notified for the next emergency.",
      tone: 'neutral',
    })
    navigate('/donor')
  }

  const handleAccept = () => {
    navigate('/donor/screening')
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
      <div className="p-4">
        <AlertCard alert={mockDonorAlert} onAccept={handleAccept} onNotNow={handleNotNow} />
      </div>
    </MobileShell>
  )
}
