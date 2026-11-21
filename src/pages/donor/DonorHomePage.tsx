import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StatusTimeline } from '@/components/donor/StatusTimeline'
import { MobileShell } from '@/components/layout/MobileShell'
import { Badge } from '@/components/ui/Badge'
import { ActionButton } from '@/components/shared/ActionButton'
import { useRequests } from '@/lib/context/RequestsContext'
import { componentLabel } from '@/lib/domainMeta'
import { statusText, type OfferStatus } from '@/lib/api/workspace'
import { Link } from 'react-router-dom'

function TravelPreference({id,limit}:{id:number;limit:number|null}) {
  const {mutate}=useRequests()
  const [value,setValue]=useState(limit?.toString() ?? '')
  const units=Number(value)
  const valid=value==='' || (Number.isInteger(units) && units>=1 && units<=100)
  return <details className="space-y-2 text-sm"><summary className="cursor-pointer">Edit donor travel preference</summary>
    <label>Maximum travel distance (km) <input className="w-24 rounded border border-border p-2" type="number" min="1" max="100" placeholder="Any" value={value} onChange={e=>setValue(e.target.value)}/></label>
    <p>Leave blank for any distance. Existing commitments stay active.</p>
    {!valid && <p role="alert">Enter a whole number from 1 to 100 km or leave blank.</p>}
    <ActionButton size="sm" disabled={!valid || value===(limit?.toString() ?? '')} success="Travel preference saved" run={()=>mutate('/donors/'+id+'/preferences',{travelLimit:value===''?null:units})}>Save travel preference</ActionButton>
  </details>
}

export function DonorHomePage() {
  const {data, connection, mutate} = useRequests()
  const [hindi,setHindi] = useState(() => localStorage.getItem('bb-donor-actions') === 'hi')
  const [travel,setTravel] = useState(15)
  const [params, setParams] = useSearchParams()
  if (!data) return null
  const donor = data.donors.find(d => d.id === Number(params.get('donor') || 1))
  if (!donor) return <MobileShell title="Donor inbox"><p className="p-4">Unknown demo donor. <Link to="/donor">Switch to donor #1</Link></p></MobileShell>
  const selected = params.get('request')
  const offers = data.offers.filter(o => o.donorId === donor.id && o.invited !== null)
    .sort((a,b) => Number(b.requestId === selected) - Number(a.requestId === selected) || (b.invited ?? 0) - (a.invited ?? 0))
  return <MobileShell title="Blood Buddy"><div className="space-y-4 p-4">
    <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Donor inbox</h2><Badge dot tone={connection === 'Live' ? 'success' : 'warning'}>{connection}</Badge></div>
    <p className="text-sm text-ink-secondary">Local in-app invitations for synthetic donors. Keep this view open to receive updates.</p>
    <label className="block text-sm">Demo donor<select className="mt-1 block w-full rounded-md border border-border bg-surface p-2" value={donor.id} onChange={e => setParams({donor:e.target.value})}>
      {data.donors.map(d => <option key={d.id} value={d.id}>#{d.id} · {d.bloodGroup} · {d.distanceKm} km</option>)}</select></label>
    <label className="block text-sm">Invitation action language
      <select aria-label="Invitation action language" className="ml-2 rounded border border-border p-1" value={hindi?'hi':'en'} onChange={e=>{setHindi(e.target.value==='hi');localStorage.setItem('bb-donor-actions',e.target.value)}}>
        <option value="en">English</option><option value="hi">Hindi</option></select></label>
    <div className="space-y-2 rounded-md border border-border bg-surface p-4">
      <strong>{donor.available ? 'Available for invitations' : 'Invitations paused'}</strong>
      <p className="text-xs">{donor.eligible ? 'Synthetic interval and review record on file.' : 'Waiting for the recorded interval or external review.'}</p>
      <p className="text-xs">{donor.notifications.sent} received · {donor.notifications.accepted} accepted · {donor.notifications.declined} declined · {donor.notifications.unanswered} expired unanswered</p>
      <TravelPreference key={donor.id+'-'+donor.travelLimit} id={donor.id} limit={donor.travelLimit}/>
      {donor.notifications.lastSent && <p className="text-xs">Last invitation {new Date(donor.notifications.lastSent * 1000).toLocaleString()}. Cooldown ends {new Date(donor.notifications.cooldownUntil! * 1000).toLocaleString()}.</p>}
      <ActionButton size="sm" variant="outline" run={() => mutate('/donors/' + donor.id + '/availability', {available:!donor.available})}>{donor.available ? (hindi?'निमंत्रण रोकें':'Pause invitations') : (hindi?'निमंत्रण फिर शुरू करें':'Resume invitations')}</ActionButton>
    </div>
    {offers.length === 0 && <p className="rounded-md border border-dashed border-border p-5 text-sm">No invitations yet. A matching hospital request will appear here.</p>}
    {offers.map(o => {
      const r = data.requests.find(item => item.id === o.requestId)!
      const act = (status: OfferStatus) => mutate('/requests/' + r.id + '/offers/' + donor.id, {status})
      return <article key={r.id} className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <span className="font-mono text-xs">{r.id}</span><h3 className="font-semibold">{r.bloodGroup} {componentLabel[r.component]} · {r.unitsNeeded} unit{r.unitsNeeded === 1 ? '' : 's'}</h3>
        <p className="text-sm">{data.hospital.name} · {r.urgency.toLowerCase()} · {donor.distanceKm} km</p>
        <Badge tone="info">{statusText(o.status)}</Badge> {r.closed && <Badge>{statusText(r.closed)}</Badge>}
        {['ACCEPTED','EN_ROUTE','ARRIVED','DONATED'].includes(o.status) && <details className="text-sm"><summary className="cursor-pointer font-medium">Donation progress</summary><div className="pt-3"><StatusTimeline current={o.status}/></div></details>}
        <details className="text-sm"><summary className="cursor-pointer">Invitation history for {r.id}</summary>
          <ul className="my-2 space-y-1">{data.events.filter(e=>e.requestId===r.id && e.donorId===donor.id).slice().reverse().map(e=><li key={e.id}>{new Date(e.at*1000).toLocaleString()} · {statusText(e.event)}</li>)}</ul></details>
        {data.events.filter(e => e.requestId === r.id && e.donorId === donor.id && e.event.startsWith('Please ')).map(e => <p className="rounded-md bg-info-subtle p-2 text-xs" key={e.id}>Hospital message · {e.event}</p>)}
        {!r.closed && <div className="flex flex-wrap gap-2">
          {o.status === 'INVITED' && <><p className="w-full text-xs text-ink-secondary">{hindi?'स्वीकार करने पर इस अनुरोध के लिए एक यूनिट की प्रतिबद्धता दर्ज होगी। अंतिम जाँच रक्त संग्रह टीम करेगी।':'Accept to commit one unit for coordination. The collection team performs final screening.'}</p>
            <ActionButton size="sm" success={hindi?'स्वीकृति दर्ज हुई':'Invitation accepted'} run={() => act('ACCEPTED')}>{hindi?'निमंत्रण स्वीकार करें':'Accept invitation'}</ActionButton>
            <ActionButton size="sm" variant="outline" success={hindi?'उत्तर दर्ज हुआ':'Decline recorded'} run={() => act('DECLINED')}>{hindi?'मना करें':'Decline'}</ActionButton></>}
          {o.status === 'ACCEPTED' && <ActionButton size="sm" run={() => act('EN_ROUTE')}>I’m on my way</ActionButton>}
          {o.status === 'EN_ROUTE' && <ActionButton size="sm" run={() => act('ARRIVED')}>I’ve arrived</ActionButton>}
          {['ACCEPTED','EN_ROUTE'].includes(o.status) && !o.etaMinutes && <label className="text-sm">My travel estimate <select className="rounded border border-border" value={travel} onChange={e=>setTravel(Number(e.target.value))}>{[5,10,15,20,30,45,60,90].map(m=><option value={m} key={m}>{m} min</option>)}</select></label>}
          {['ACCEPTED','EN_ROUTE'].includes(o.status) && <ActionButton size="sm" variant="outline" run={() => mutate('/requests/' + r.id + '/offers/' + donor.id + '/eta', {minutes:o.etaMinutes ? null : travel})}>{o.etaMinutes ? 'Stop sharing ETA' : 'Share '+travel+' min ETA'}</ActionButton>}
          {o.status === 'ARRIVED' && <p className="text-sm">Awaiting the hospital’s collection record.</p>}
          {['ACCEPTED','EN_ROUTE','ARRIVED'].includes(o.status) && <ActionButton size="sm" variant="ghost" confirm="Release this commitment and return the unit to the hospital search?" success="Commitment withdrawn" run={() => act('WITHDRAWN')}>Withdraw commitment</ActionButton>}
        </div>}
      </article>
    })}
    <Link to={'/donor/privacy?donor=' + donor.id} className="text-sm text-primary">Privacy & workspace data</Link>
  </div></MobileShell>
}
