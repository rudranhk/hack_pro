import { Radar } from 'lucide-react'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function LiveMatchesPage() {
  return (
    <ComingSoon
      icon={Radar}
      phase="Phase 4"
      title="Live matches"
      description="Confirmed donors across every open request — blood group, ETA, distance, status, and a contact channel, at a glance."
    />
  )
}
