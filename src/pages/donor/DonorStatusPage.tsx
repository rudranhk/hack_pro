import { HeartHandshake } from 'lucide-react'
import { MobileShell } from '@/components/layout/MobileShell'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function DonorStatusPage() {
  return (
    <MobileShell title="You're helping today" headerless={false}>
      <div className="p-4">
        <ComingSoon
          icon={HeartHandshake}
          phase="Phase 7"
          title="You're helping someone today."
          description="Matched → Screening → Confirmed → En route → Arrived → Donated — with manual status updates and an optional ETA share."
        />
      </div>
    </MobileShell>
  )
}
