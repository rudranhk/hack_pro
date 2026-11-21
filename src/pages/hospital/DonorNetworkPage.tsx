import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Input, Select } from '@/components/ui'
import { useRequests } from '@/lib/context/RequestsContext'
import { componentLabel } from '@/lib/domainMeta'
import { donorUrl } from '@/lib/api/workspace'

export function DonorNetworkPage() {
  const {data} = useRequests()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('')
  const [component, setComponent] = useState('')
  const [availability, setAvailability] = useState('')
  const [radius, setRadius] = useState('40')
  const [response, setResponse] = useState('0')
  if (!data) return null
  const busy = new Set(data.offers.filter(o => ['ACCEPTED','EN_ROUTE','ARRIVED'].includes(o.status)).map(o => o.donorId))
  const state = (d: typeof data.donors[number]) => busy.has(d.id) ? 'Committed' : !d.eligible ? 'Pending review' : d.available ? 'Available' : 'Paused'
  const donors = data.donors.filter(d => (!group || d.bloodGroup === group) && d.distanceKm <= Number(radius)
    && d.responseRate >= Number(response) && (!component || d.components.some(c => c === component))
    && (!availability || availability === state(d)) && String(d.id).includes(query.replace('#','').trim()))
  return <div className="space-y-4"><h2 className="text-lg font-semibold">Donor network</h2>
    <p className="text-sm text-ink-secondary">{data.donors.length} synthetic records · {busy.size} active commitments</p>
    <div className="grid gap-2 sm:grid-cols-3"><Input aria-label="Search donor ID" placeholder="Search donor ID" value={query} onChange={e => setQuery(e.target.value)}/>
      <Select aria-label="Blood group" value={group} onChange={e => setGroup(e.target.value)}><option value="">All groups</option>{[...new Set(data.donors.map(d => d.bloodGroup))].map(g => <option key={g}>{g}</option>)}</Select>
      <Select aria-label="Component" value={component} onChange={e => setComponent(e.target.value)}><option value="">All components</option>{Object.entries(componentLabel).map(([c,label]) => <option key={c} value={c}>{label}</option>)}</Select>
      <Select aria-label="Availability" value={availability} onChange={e => setAvailability(e.target.value)}><option value="">All availability</option>{['Available','Paused','Committed','Pending review'].map(s => <option key={s}>{s}</option>)}</Select>
      <Select aria-label="Radius" value={radius} onChange={e => setRadius(e.target.value)}>{[2,5,15,40].map(k => <option key={k} value={k}>Within {k} km</option>)}</Select>
      <Select aria-label="Historical response rate" value={response} onChange={e => setResponse(e.target.value)}><option value="0">Any response rate</option><option value=".6">60% or higher</option><option value=".8">80% or higher</option></Select></div>
    {donors.length === 0 && <Card className="p-5">No donors match these filters.</Card>}
    <div className="grid gap-3 sm:grid-cols-2">{donors.map(d => <Card key={d.id} className="space-y-2 p-4"><div className="flex justify-between"><strong>Donor #{d.id} · {d.bloodGroup}</strong><Badge>{state(d)}</Badge></div>
      <p className="text-sm">{d.distanceKm} km · {Math.round(d.responseRate * 100)}% historical response</p>
      <details className="text-sm"><summary className="cursor-pointer">Coordination record</summary>
        <p className="my-2">{d.components.map(c => componentLabel[c]).join(', ')} · {d.eligible ? 'Synthetic review on file' : 'Pending interval or review'}</p>
        <a className="text-primary" href={donorUrl(d.id)} target="_blank" rel="noreferrer">Open demo inbox ↗</a></details></Card>)}</div>
  </div>
}
