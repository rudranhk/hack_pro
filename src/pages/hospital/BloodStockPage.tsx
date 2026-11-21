import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Clock, Plus } from 'lucide-react'
import { Tabs } from '@/components/ui/Tabs'
import { buttonClasses } from '@/components/ui/Button'
import { StockGroupCard } from '@/components/hospital/stock/StockGroupCard'
import { StockTable } from '@/components/hospital/stock/StockTable'
import { StockForecast } from '@/components/hospital/stock/StockForecast'
import { useRequests } from '@/lib/context/RequestsContext'
import { componentLabel, stockStatusFor } from '@/lib/domainMeta'
import type { Component } from '@/lib/types'

const TAB_OPTIONS: { value: Component; label: string }[] = [
  { value: 'WHOLE', label: 'Whole Blood' },
  { value: 'PLATELET', label: 'Platelets' },
  { value: 'PLASMA', label: 'Plasma' },
]

export function BloodStockPage() {
  const [component, setComponent] = useState<Component>('WHOLE')

  const {data, connection} = useRequests()
  const entries = useMemo(() => (data?.stock ?? []).filter(e => e.component === component)
    .map(e => ({...e, reserved:0, criticalThreshold:2})), [component, data])
  const criticalEntries = useMemo(
    () => entries.filter((e) => stockStatusFor(e.available, e.criticalThreshold) === 'CRITICAL'),
    [entries]
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold text-ink">Blood Stock</h1>
          <p className="mt-1 text-[13px] text-ink-secondary">Synthetic opening stock adjusted for recorded collections and issued units.</p>
        </div>
        <span className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-tertiary">
          <Clock size={13} />
          {connection} inventory
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {entries.map((e) => (
          <StockGroupCard key={e.bloodGroup} bloodGroup={e.bloodGroup} available={e.available} criticalThreshold={e.criticalThreshold} />
        ))}
      </div>

      <Tabs options={TAB_OPTIONS} value={component} onChange={setComponent} />

      {criticalEntries.map((entry) => (
        <div key={entry.bloodGroup} className="rounded-lg border border-critical-border bg-critical-subtle p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex gap-2.5">
              <AlertTriangle size={17} className="mt-0.5 shrink-0 text-critical" />
              <div>
                <p className="text-[13.5px] font-semibold text-critical">
                  {entry.bloodGroup} {componentLabel[entry.component].toLowerCase()} inventory is critically low
                </p>
                <p className="mt-1 text-[12.5px] text-ink-secondary">
                  {entry.available} unit{entry.available === 1 ? '' : 's'} available. Consider opening a donor
                  request before inventory reaches zero.
                </p>
              </div>
            </div>
            <Link
              to={`/hospital/requests/new?group=${encodeURIComponent(entry.bloodGroup)}&component=${entry.component}`}
              className={buttonClasses({ variant: 'danger', size: 'sm', className: 'shrink-0' })}
            >
              <Plus size={14} className="-ml-0.5" />
              Create Emergency Request
            </Link>
          </div>
        </div>
      ))}

      <StockTable entries={entries} />
      <StockForecast balances={entries} />
    </div>
  )
}
