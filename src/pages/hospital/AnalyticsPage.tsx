import { useSearchParams } from "react-router-dom"
import { Activity, CheckCircle2, Send, Timer } from 'lucide-react'
import { useRequests } from '@/lib/context/RequestsContext'
import { MetricCard } from '@/components/hospital/MetricCard'
import { Card } from '@/components/ui/Card'
import { BarChart } from '@/components/charts/BarChart'

export function AnalyticsPage() {
  const {data,snapshotTime} = useRequests()
  const [params,setParams] = useSearchParams()
  const days = params.get("days") || "all"
  const since = days==="all" ? 0 : snapshotTime-Number(days)*86400
  if (!data) return null
  const events = data.events.filter(e=>e.at>=since)
  const requests = data.requests.filter(r=>r.created>=since)
  const invites = events.filter(e => e.event === 'INVITED')
  const accepted = events.filter(e => e.event === 'ACCEPTED').length
  const declined = events.filter(e => e.event === 'DECLINED').length
  const times = data.offers.flatMap(o => o.responded !== null && o.responded >= since && o.invited !== null ? [o.responded-o.invited] : []).sort((a,b) => a-b)
  const middle = Math.floor(times.length / 2)
  const median = times.length ? Math.round((times[middle] + times[Math.floor((times.length-1)/2)])/2) + 's' : '—'
  const counts = ['CRITICAL','URGENT','STANDARD'].map(label => ({label, value:requests.filter(r => r.urgency === label).length}))
  return <div className="space-y-5"><p className="text-sm text-ink-secondary">Measured from this synthetic workspace’s recorded requests and responses.</p>
    <label className="text-sm">Reporting period <select className="rounded border border-border p-2" value={days} onChange={e=>setParams({days:e.target.value})}>
      <option value="all">All time</option><option value="1">Last 24 hours</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select></label>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4"><MetricCard label="Invitations sent" icon={Send} value={invites.length}/>
    <MetricCard label="Acceptances" icon={CheckCircle2} value={accepted}/><MetricCard label="Declines" icon={Activity} value={declined}/>
    <MetricCard label="Median response time" icon={Timer} value={median}/></div>
    <Card className="space-y-4 p-5"><h2 className="font-semibold">Requests by urgency</h2>{requests.length ?
      <BarChart data={counts} color="var(--color-primary)" valueFormat={String}/> : <p>No requests were created during this reporting period.</p>}</Card></div>
}
