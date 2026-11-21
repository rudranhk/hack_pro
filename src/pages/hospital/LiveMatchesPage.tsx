import { Link, useSearchParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { useRequests } from '@/lib/context/RequestsContext'
import { committed, statusText } from '@/lib/api/workspace'

export function LiveMatchesPage() {
  const {data, connection} = useRequests()
  const [params,setParams] = useSearchParams()
  const view = params.get("view") || "all"
  if (!data) return null
  const open = new Set(data.requests.filter(r=>!r.closed).map(r=>r.id))
  const offers = data.offers.filter(o => view==='pending' ? o.status==='INVITED' :
    committed.includes(o.status) && (view==='all' || (open.has(o.requestId) && (view==='secured' || o.status!=='DONATED'))))
  return <div className="space-y-4"><div className="flex justify-between"><h2 className="text-lg font-semibold">Donor commitments</h2><Badge dot>{connection}</Badge></div>
    <label className="text-sm">Show invitations <select className="rounded border border-border p-2" value={view} onChange={e=>setParams({view:e.target.value})}>
      <option value="all">All commitments</option><option value="responding">Responding donors</option><option value="secured">Secured units on open requests</option><option value="pending">Awaiting reply</option></select></label>
    {offers.length === 0 && <Card className="p-6">No invitations match this view. <Link to="/hospital/requests" className="text-primary">View requests</Link></Card>}
    {offers.map(o => <Link key={o.requestId + '-' + o.donorId} to={'/hospital/requests/' + o.requestId} className="flex flex-wrap justify-between gap-3 rounded-lg border border-border bg-surface p-4">
      <strong>Donor #{o.donorId}</strong><span>{o.requestId}</span><Badge tone="info">{statusText(o.status)}</Badge></Link>)}</div>
}
