import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { MatchScoreBreakdown } from '@/components/hospital/MatchScoreBreakdown'
import { ActionButton } from '@/components/shared/ActionButton'
import { useRequests } from '@/lib/context/RequestsContext'
import { componentLabel, requestStatusLabel, requestStatusTone } from '@/lib/domainMeta'
import { api, donorUrl, localTime, statusText } from '@/lib/api/workspace'

type Fact = {donorId:number; group:string; distance:number; available:boolean; clearance:string|null; response:number;
  active:string; reasons:string[]; hold:string|null; previous?:string; decision?:string; reason?:string; recent:number; score?:number; breakdown?:Record<string,number>}
type Run = {id:number; at:number; wave:number; radius:number; facts:Fact[]}

function MatchExplanations({id, revision}: {id:string; revision:number}) {
  const [runs,setRuns] = useState<Run[]|null>(null)
  const [attempt,setAttempt] = useState(0)
  const [error,setError] = useState('')
  useEffect(() => {
    let current = true
    api<Run[]>('/requests/'+id+'/decisions').then(value => {if(current) {setRuns(value); setError('')}})
      .catch(e => {if(current) setError(e.message)})
    return () => {current=false}
  },[id,revision,attempt])
  return <Card className="space-y-3 p-5"><h2 className="font-semibold">Match explanations</h2>
    <p className="text-sm">Each run preserves the records used at dispatch. Fewer invitations in the last 24 hours get priority, then coordination score. A decline counts as a reply.</p>
    <p className="text-xs">Blood group, distance, clearance date and baseline history are synthetic fixtures. Availability and ETA are donor-reported in this workspace. Clinical verification and prior donation dates are unavailable.</p>
    {error && <p role="alert">{error} <Button size="sm" variant="outline" onClick={()=>setAttempt(n=>n+1)}>Retry explanations</Button></p>}
    {!runs && !error && <p role="status">Loading matching decisions…</p>}
    {runs?.map(run => <details key={run.id} className="rounded-md border border-border p-3"><summary className="cursor-pointer">Wave {run.wave} · {localTime(run.at)} · {run.radius} km · {run.facts.length} donors considered</summary>
      <ul className="mt-2 divide-y divide-border">{run.facts.map(f => <li key={f.donorId} className="py-2 text-sm"><strong>Donor #{f.donorId} · {f.group} · {f.distance} km</strong>
        <p>{f.reasons.length ? f.reasons.join(' · ') : 'Passes component, compatibility, radius and clearance filters'}{f.hold && ' · '+f.hold} {f.decision && ' · '+statusText(f.decision)}</p>
        <p>{f.available?'Available':'Paused'} · clearance date {f.clearance ?? 'unknown'} · {Math.round(f.response*100)}% response · active {f.active} · {f.recent} recent invitations</p>
        {f.reason && <p>{f.reason}</p>}
        {f.breakdown && <p>Score {f.score}/100 · {Object.entries(f.breakdown).map(([k,v]) => k.replace(/([A-Z])/g,' $1').toLowerCase()+' '+v).join(' · ')}</p>}
      </li>)}</ul></details>)}
    {runs?.length===0 && !error && <p className="text-sm">No saved decision runs available.</p>}
  </Card>
}

export function RequestDetailPage() {
  const {id} = useParams()
  return <RequestDetail key={id} id={id} />
}

function RequestDetail({id}:{id:string|undefined}) {
  const {requests, data, connection, mutate} = useRequests()
  const [staffKey,setStaffKey] = useState('')
  const [closing, setClosing] = useState<'CLOSED' | 'CANCELLED' | null>(null)
  const r = requests.find(item => item.id === id)
  if (!r || !data) return <Card className="space-y-3 p-6"><h2>Request not found in this workspace</h2><Link to="/hospital/requests">Back to requests</Link></Card>
  const offers = data.offers.filter(o => o.requestId === id)
  const events = data.events.filter(e => e.requestId === id)
  const path = '/requests/' + id
  const searching = r.status === 'SEARCHING'
  return <div className="space-y-5">
    <Link className="text-sm text-ink-secondary" to="/hospital/requests">← All requests</Link>
    <Card className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-sm">{id}</span>
        <Badge dot tone={connection === 'Live' ? 'success' : 'warning'}>{connection} · request channel</Badge></div>
      <h2 className="text-2xl font-semibold">{r.bloodGroup} {componentLabel[r.component]} <Badge tone={requestStatusTone[r.status]}>{requestStatusLabel[r.status]}</Badge></h2>
      <div className="flex flex-wrap justify-between gap-2 text-sm"><span>{r.unitsSecured} of {r.unitsNeeded} units committed</span><span>{r.urgency} · {r.radius} km radius</span></div>
      <p className="text-sm">Wave {r.dispatch.wave} · {r.unitsNeeded-r.unitsSecured} units outstanding · {searching ? r.dispatch.escalated ? 'Coordinator notified in dashboard' : !data.hospital.autoInvite ? 'Automatic invitations paused' : r.dispatch.due ? 'Next dispatch check '+localTime(r.dispatch.due) : 'Manual dispatch' : requestStatusLabel[r.status]}</p>
      <div className="space-y-2 border-t border-border pt-3 text-sm">
        <strong>Request review</strong><p>Synthetic hospital account. Institutional verification unavailable.</p>
        {r.review.duplicateId && <p>Similar open request in the previous 30 minutes: <Link className="text-primary" to={'/hospital/requests/'+r.review.duplicateId}>{r.review.duplicateId}</Link></p>}
        {r.review.logistics && <p>Requested logistics preference: {r.review.logistics}</p>}
        {r.review.reviewedAt ? <p>Reviewed in demo coordinator role at {localTime(r.review.reviewedAt)}</p> :
          <ActionButton size="sm" variant="outline" run={()=>mutate(path+'/review',{})}>Mark reviewed as demo coordinator</ActionButton>}
      </div>
      <ProgressBar value={r.unitsSecured} max={r.unitsNeeded} />
    </Card>
    <div className="grid items-start gap-5 xl:grid-cols-[3fr_2fr]">
      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">Donor ranking & invitations</h2>
        <div className="rounded-md bg-surface-sunken p-3 text-sm"><strong>{r.source}</strong><p>{r.reason}</p></div>
        <p className="text-xs text-ink-secondary">Preliminary coordination using synthetic clearance records, component, availability and distance. A blood bank determines clinical eligibility.</p>
        {offers.length === 0 && <p className="py-4 text-sm">No eligible donors at this radius. Review availability or expand the search.</p>}
        {offers.map(o => {
          const donor = data.donors.find(d => d.id === o.donorId)!
          return <div key={o.donorId} className="space-y-3 rounded-md border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><strong>Donor #{donor.id} · {donor.bloodGroup}</strong>
              <Badge tone={o.status === 'DECLINED' ? 'warning' : 'info'}>{statusText(o.status)}</Badge></div>
            <p className="text-sm text-ink-secondary">{donor.distanceKm} km · {Math.round(donor.responseRate * 100)}% baseline response · {o.score}/100 at matching</p>
            <details><summary className="cursor-pointer text-sm font-medium text-primary">Score breakdown</summary><div className="space-y-2 pt-3"><MatchScoreBreakdown breakdown={o.breakdown} />
              {o.similarity !== null && <p className="text-xs text-ink-secondary">Vector similarity {o.similarity.toFixed(3)} · tie-breaker for equal coordination scores.</p>}</div></details>
            <div className="flex flex-wrap items-center gap-3">
              {searching && o.status === 'CANDIDATE' && donor.notifications.hold && <Badge>{donor.notifications.hold}</Badge>}
              {searching && o.status === 'CANDIDATE' && !donor.notifications.hold && <ActionButton size="sm" run={() => mutate(path + '/offers/' + donor.id, {status:'INVITED'})}>Send invitation</ActionButton>}
              {o.etaMinutes && !r.closed && <Badge>ETA {o.etaMinutes} min (donor estimate)</Badge>}
              {['ACCEPTED','EN_ROUTE','ARRIVED'].includes(o.status) && <ActionButton size="sm" variant="outline" run={() => mutate(path + '/offers/' + donor.id + '/contact', {message:'Please check in at reception'})}>Send check-in reminder</ActionButton>}
              {o.status === 'ARRIVED' && <>
                {data.hospital.collectionKeyRequired && <label className="text-sm">Collection staff key <input type="password" autoComplete="off" className="rounded border p-1" value={staffKey} onChange={e=>setStaffKey(e.target.value)}/></label>}
                <ActionButton size="sm" disabled={data.hospital.collectionKeyRequired && !staffKey} confirm="Record one collected unit and update inventory?" success="Collection recorded" run={async()=>{await mutate(path+'/offers/'+donor.id,{status:'DONATED',staffKey:staffKey||undefined});setStaffKey('')}}>Record synthetic collection</ActionButton></>}
              {o.invited && <a href={donorUrl(donor.id, r.id)} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary">Open donor inbox ↗</a>}
            </div>
          </div>
        })}
        {searching && <div className="flex flex-wrap gap-2"><ActionButton size="sm" variant="outline" success="Matching finished. Review the latest decision run." run={() => mutate(path + '/rematch', {})}>Match again</ActionButton>
          {r.radius < 40 && <ActionButton size="sm" run={() => mutate(path + '/rematch?expand=true', {})}>Expand to {r.radius === 5 ? 15 : 40} km</ActionButton>}</div>}
      </Card>
      <Card className="space-y-4 p-5"><h2 className="font-semibold">Request activity</h2>
        <details className="rounded-md bg-surface-sunken p-3 text-sm"><summary className="cursor-pointer font-medium">Distances from City Hospital</summary>
          <ul className="mt-3 space-y-2">{offers.map(o => {
            const donor = data.donors.find(d => d.id === o.donorId)!
            return <li key={o.donorId}><div className="flex justify-between text-xs"><span>Donor #{o.donorId}</span><span>{donor.distanceKm} km</span></div>
              <ProgressBar size="sm" value={donor.distanceKm} max={r.radius} /></li>
          })}</ul>{!offers.length && <p className="mt-2 text-xs">No matches recorded.</p>}</details>
        <ol className="space-y-3">{events.map(e => <li key={e.id} className="flex justify-between gap-3 border-b border-border pb-2 text-sm">
          <span className="capitalize">{statusText(e.event)} {e.donorId ? '· Donor #' + e.donorId : ''}</span><time>{localTime(e.at)}</time></li>)}</ol>
        {r.closed==='CLOSED' && r.unitsSecured<r.unitsNeeded && <ActionButton size="sm" success="Request reopened" run={()=>mutate(path+'/reopen',{})}>Reopen request</ActionButton>}
        {!r.closed && <div className="space-y-2">
          {closing ? <><p className="text-sm">End outstanding invitations and commitments for this request?</p><ActionButton size="sm" variant="danger" run={async()=>{await mutate(path+'/close',{status:closing});setClosing(null)}}>Confirm {closing === 'CLOSED' ? 'close' : 'cancellation'}</ActionButton> <Button size="sm" variant="ghost" onClick={() => setClosing(null)}>Keep open</Button></> :
            <><Button size="sm" variant="outline" onClick={() => setClosing('CLOSED')}>Close request</Button> <Button size="sm" variant="ghost" onClick={() => setClosing('CANCELLED')}>Cancel request</Button></>}
        </div>}
      </Card>
    </div>
    <MatchExplanations key={r.id} id={r.id} revision={events[0]?.id ?? 0} />
  </div>
}
