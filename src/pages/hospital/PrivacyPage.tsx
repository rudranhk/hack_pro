import { ShieldCheck } from 'lucide-react'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function HospitalPrivacyPage() {
  return (
    <ComingSoon
      icon={ShieldCheck}
      phase="Phase 11"
      title="Privacy & data"
      description="What donor data this hospital can see, why, and the retention rules around it — no medical-verification claims the system can't back up."
    />
  )
}
