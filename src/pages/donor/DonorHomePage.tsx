import { HeartPulse } from 'lucide-react'
import { MobileShell } from '@/components/layout/MobileShell'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function DonorHomePage() {
  return (
    <MobileShell title="BloodLink">
      <ComingSoon
        icon={HeartPulse}
        phase="Phase 5"
        title="Donor home"
        description="Your availability toggle, blood group, eligibility status, and next eligible donation date will live here."
      />
    </MobileShell>
  )
}
