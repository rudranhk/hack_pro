import { Link } from 'react-router-dom'
import { CheckCircle2, Droplets, Plus, Siren, Timer, Users } from 'lucide-react'
import { MetricCard } from '@/components/hospital/MetricCard'
import { EmergencyRequestCard, EmergencyRequestListHeader } from '@/components/hospital/EmergencyRequestCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { buttonClasses } from '@/components/ui/Button'
import { useRequests } from '@/lib/context/RequestsContext'
import { mockOverviewMetrics } from '@/lib/mockData'
import { urgencyLabel } from '@/lib/domainMeta'

function urgencyCaption(activeRequests: ReturnType<typeof useRequests>['activeRequests']): string {
  if (activeRequests.length === 0) return 'nothing open right now'
  const counts = new Map<string, number>()
  for (const req of activeRequests) counts.set(req.urgency, (counts.get(req.urgency) ?? 0) + 1)
  return [...counts.entries()]
    .map(([urgency, count]) => `${count} ${urgencyLabel[urgency as keyof typeof urgencyLabel].toLowerCase()}`)
    .join(', ')
}

export function OverviewPage() {
  const { activeRequests } = useRequests()
  const metrics = mockOverviewMetrics

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          icon={Siren}
          label="Active Requests"
          value={activeRequests.length}
          tone="critical"
          caption={urgencyCaption(activeRequests)}
        />
        <MetricCard icon={Users} label="Donors Responding" value={metrics.donorsResponding} tone="info" caption="across all open requests" />
        <MetricCard
          icon={Droplets}
          label="Units Secured"
          value={`${metrics.unitsSecured} / ${metrics.unitsTarget}`}
          tone="success"
          caption="today"
        />
        <MetricCard icon={Timer} label="Median First Response" value={metrics.medianFirstResponse} tone="neutral" caption="today, all requests" />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Active Emergency Requests</h2>
            <p className="text-[12.5px] text-ink-secondary">Everything City Hospital currently has open.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/hospital/requests" className={buttonClasses({ variant: 'outline', size: 'sm' })}>
              View all
            </Link>
            <Link to="/hospital/requests/new" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
              <Plus size={15} className="-ml-0.5" />
              New request
            </Link>
          </div>
        </div>

        {activeRequests.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            tone="success"
            title="You're all caught up."
            description="There are no active emergency requests right now."
            action={
              <Link to="/hospital/requests/new" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
                <Plus size={15} className="-ml-0.5" />
                New request
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            <EmergencyRequestListHeader />
            {activeRequests.map((request) => (
              <EmergencyRequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
