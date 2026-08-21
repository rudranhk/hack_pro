import { BarChart3 } from 'lucide-react'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function AnalyticsPage() {
  return (
    <ComingSoon
      icon={BarChart3}
      phase="Phase 10"
      title="Analytics"
      description="Time-to-first-accept, fulfillment rate, escalation frequency, and the filtered-matching vs. broadcast efficiency comparison."
    />
  )
}
