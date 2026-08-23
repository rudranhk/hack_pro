import { Badge } from '@/components/ui/Badge'
import { stockStatusFor, stockStatusLabel, stockStatusTone } from '@/lib/domainMeta'
import type { BloodGroup } from '@/lib/types'
import { cn } from '@/lib/utils'

export function StockGroupCard({
  bloodGroup,
  available,
  criticalThreshold,
}: {
  bloodGroup: BloodGroup
  available: number
  criticalThreshold: number
}) {
  const status = stockStatusFor(available, criticalThreshold)
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        status === 'CRITICAL' ? 'border-critical-border bg-critical-subtle' : 'border-border bg-surface'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[13px] font-bold text-ink">{bloodGroup}</span>
        <Badge tone={stockStatusTone[status]} size="sm">
          {stockStatusLabel[status]}
        </Badge>
      </div>
      <p className="mt-2 text-[22px] font-semibold tabular leading-none text-ink">
        {available} <span className="text-[12px] font-normal text-ink-tertiary">units</span>
      </p>
    </div>
  )
}
