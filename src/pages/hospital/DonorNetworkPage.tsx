import { Users } from 'lucide-react'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function DonorNetworkPage() {
  return (
    <ComingSoon
      icon={Users}
      phase="Planned"
      title="Donor network"
      description="A read-only view into the eligible donor pool this hospital can reach — blood group mix, distance bands, and response history."
    />
  )
}
