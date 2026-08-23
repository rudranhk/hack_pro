import { CheckCircle2, Info, Send, Timer, Users } from 'lucide-react'
import { MetricCard } from '@/components/hospital/MetricCard'
import { ChartCard } from '@/components/charts/ChartCard'
import { LineChart } from '@/components/charts/LineChart'
import { BarChart } from '@/components/charts/BarChart'
import {
  analyticsKpis,
  bloodGroupDemand,
  escalationFrequency,
  requestsOverTime,
  responseRateOverTime,
  systemEfficiency,
  timeToFirstAccept,
  timeToFirstAcceptMedianMinutes,
} from '@/lib/mockAnalytics'

const SERIES_BLUE = '#2a78d6'
// Ordinal severity ramp (light -> dark = mild -> severe), validated against the app's white surface.
const ESCALATION_RAMP = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#104281']

export function AnalyticsPage() {
  const efficiencyRatio = (
    systemEfficiency.broadcast.alerts /
    systemEfficiency.broadcast.usefulDonors /
    (systemEfficiency.filtered.alerts / systemEfficiency.filtered.confirmedDonors)
  ).toFixed(1)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-2 rounded-md border border-info-border bg-info-subtle px-3.5 py-2.5 text-[12.5px] text-info">
        <Info size={15} className="mt-0.5 shrink-0" />
        Every figure on this page is synthetic demo data generated for this prototype — none of it reflects
        real hospital or donor activity.
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={Timer} label="Median time to first accept" value={analyticsKpis.medianFirstAccept} tone="info" caption="across all requests" />
        <MetricCard icon={Send} label="Alerts per unit collected" value={analyticsKpis.alertsPerUnitCollected} tone="neutral" caption="lower is more efficient" />
        <MetricCard icon={CheckCircle2} label="Requests fulfilled" value={analyticsKpis.requestsFulfilled} tone="success" caption="last 30 days" />
        <MetricCard icon={Users} label="Average response rate" value={analyticsKpis.averageResponseRate} tone="critical" caption="of donors alerted" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Requests over time" subtitle="Emergency requests raised per day">
          <LineChart data={requestsOverTime} color={SERIES_BLUE} valueFormat={(v) => String(v)} />
        </ChartCard>
        <ChartCard title="Response rate" subtitle="Share of alerted donors who responded, per day">
          <LineChart data={responseRateOverTime} color={SERIES_BLUE} valueFormat={(v) => `${v}%`} />
        </ChartCard>
        <ChartCard title="Blood group demand" subtitle="Requested units by blood group, last 30 days">
          <BarChart data={bloodGroupDemand} color={SERIES_BLUE} valueFormat={(v) => String(v)} />
        </ChartCard>
        <ChartCard title="Escalation frequency" subtitle="Tier each request was resolved or closed at, last 30 days">
          <BarChart
            data={escalationFrequency.map((d, i) => ({ label: d.label, value: d.value, color: ESCALATION_RAMP[i] }))}
            valueFormat={(v) => String(v)}
          />
        </ChartCard>
        <ChartCard
          title="Time to first accept"
          subtitle="Minutes from alert to a donor accepting, most recent requests"
          className="lg:col-span-2"
        >
          <BarChart
            data={timeToFirstAccept}
            color={SERIES_BLUE}
            valueFormat={(v) => `${v}m`}
            referenceLine={{ value: timeToFirstAcceptMedianMinutes, label: 'Median 2m 14s' }}
          />
        </ChartCard>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-[15px] font-semibold text-ink">System efficiency</h2>
        <p className="mt-0.5 text-[12.5px] text-ink-secondary">
          Filtering and ranking donors before alerting, instead of broadcasting to everyone.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-border-strong bg-surface-sunken p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
              {systemEfficiency.broadcast.label}
            </p>
            <p className="mt-2 text-[22px] font-semibold text-ink">
              {systemEfficiency.broadcast.alerts} alerts
              <span className="mx-2 font-normal text-ink-tertiary">→</span>
              {systemEfficiency.broadcast.usefulDonors} useful donors
            </p>
          </div>
          <div className="rounded-md border border-success-border bg-success-subtle p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-success">
              {systemEfficiency.filtered.label}
            </p>
            <p className="mt-2 text-[22px] font-semibold text-ink">
              {systemEfficiency.filtered.alerts} alerts
              <span className="mx-2 font-normal text-ink-tertiary">→</span>
              {systemEfficiency.filtered.confirmedDonors} confirmed donors
            </p>
          </div>
        </div>

        <p className="mt-4 text-[12.5px] text-ink-secondary">
          <span className="font-semibold text-ink">~{efficiencyRatio}× fewer alerts</span> sent per useful donor
          reached, in this synthetic comparison.
        </p>
      </div>
    </div>
  )
}
