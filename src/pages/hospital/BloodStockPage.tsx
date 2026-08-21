import { Droplets } from 'lucide-react'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function BloodStockPage() {
  return (
    <ComingSoon
      icon={Droplets}
      phase="Planned"
      title="Blood stock"
      description="On-hand inventory by blood group and component, so requests only go out for what the bank can't already cover."
    />
  )
}
