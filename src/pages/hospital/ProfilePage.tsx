import { Building2 } from 'lucide-react'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function ProfilePage() {
  return (
    <ComingSoon
      icon={Building2}
      phase="Planned"
      title="Hospital profile"
      description="Verification status, registered location, contact channels, and the staff who can raise emergency requests."
    />
  )
}
