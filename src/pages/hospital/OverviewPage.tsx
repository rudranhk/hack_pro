import { LayoutDashboard } from 'lucide-react'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function OverviewPage() {
  return (
    <ComingSoon
      icon={LayoutDashboard}
      phase="Phase 2"
      title="Hospital overview"
      description="Active-request metrics, donors responding, units secured, and the live emergency request list land here next."
    />
  )
}
