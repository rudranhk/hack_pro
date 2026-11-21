import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Siren } from 'lucide-react'
import { EmergencyRequestCard, EmergencyRequestListHeader } from '@/components/hospital/EmergencyRequestCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { buttonClasses } from '@/components/ui/Button'
import { useRequests } from '@/lib/context/RequestsContext'

export function RequestsPage() {
  const { requests, data } = useRequests()
  const [params,setParams] = useSearchParams()
  const value = (key:string) => params.get(key) ?? ''
  const update = (key:string,v:string) => {
    const next = new URLSearchParams(params)
    if (v) next.set(key,v)
    else next.delete(key)
    setParams(next,{replace:true})
  }
  const filtered = requests.filter(r => (!value('status') || (value('status')==='OPEN' ? !r.closed : r.status===value('status'))) &&
    (!value('urgency') || r.urgency===value('urgency')) && (!value('group') || r.bloodGroup===value('group')) &&
    [r.id,r.bloodGroup,r.urgency,r.status,r.hospitalName,r.component].join(' ').toLowerCase().includes(value('q').trim().toLowerCase()))
  const choices = {status:['OPEN','SEARCHING','COVERED','FULFILLED','CLOSED','CANCELLED'],urgency:['CRITICAL','URGENT','STANDARD'],
    group:[...new Set(data?.stock.map(s=>s.bloodGroup))]}

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">Emergency requests</h2>
          <p className="text-[12.5px] text-ink-secondary">Every request City Hospital has raised, active or resolved.</p>
        </div>
        <Link to="/hospital/requests/new" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
          <Plus size={15} className="-ml-0.5" />
          New request
        </Link>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <label>Search requests<input className="block w-full rounded border border-border p-2" placeholder="ID or request details" value={value('q')} onChange={e=>update('q',e.target.value)} /></label>
        {Object.entries(choices).map(([k,opts])=><label key={k}>{k==='group'?'Blood group':k==='status'?'Request status':'Urgency'}<select className="block w-full rounded border border-border p-2" value={value(k)} onChange={e=>update(k,e.target.value)}>
          <option value="">All</option>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select></label>)}
      </div>
      {params.size>0 && <button className="self-start text-sm text-primary" onClick={()=>setParams({})}>Clear request filters</button>}
      {requests.length === 0 ? (
        <EmptyState
          icon={Siren}
          title="No requests yet"
          description="Emergency requests you raise will show up here, active or resolved."
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
          {!filtered.length && <p role="status" className="p-4">No requests match these filters.</p>}
          {filtered.map((request) => (
            <EmergencyRequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  )
}
