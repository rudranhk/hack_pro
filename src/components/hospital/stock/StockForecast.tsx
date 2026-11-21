import { useState } from 'react'
import type { StockBalance } from '@/lib/api/workspace'
import { useRequests } from '@/lib/context/RequestsContext'
import { componentLabel } from '@/lib/domainMeta'
import { ActionButton } from '@/components/shared/ActionButton'

const inputClass = 'ml-2 rounded border border-border bg-surface px-2 py-1'

function StockAdjustment({balance}:{balance:StockBalance}) {
  const {mutate} = useRequests()
  const [operation,setOperation] = useState('RECEIVE')
  const [quantity,setQuantity] = useState('')
  const [token,setToken] = useState(()=>crypto.randomUUID())
  const count = Number(quantity)
  const valid = quantity.trim()!=='' && Number.isInteger(count) && count<=(100000) && count>=(operation==='COUNT'?0:1)
  return <details className="space-y-2 border-t border-border pt-3"><summary className="cursor-pointer font-medium">Receive stock or correct a balance</summary>
    <div className="flex flex-wrap items-center gap-3 text-sm"><label>Operation <select className={inputClass} value={operation} onChange={e=>{setOperation(e.target.value);setToken(crypto.randomUUID())}}>
      <option value="RECEIVE">Receive units</option><option value="COUNT">Set physical count</option></select></label>
      <label>{operation==='COUNT'?'Counted units':'Received units'}<input className={inputClass+' w-24'} value={quantity} type="number" min={operation==='COUNT'?0:1} max="100000" onChange={e=>{setQuantity(e.target.value);setToken(crypto.randomUUID())}}/></label>
      <ActionButton key={token} size="sm" disabled={!valid} success="Inventory updated" confirm={operation==='COUNT'?'Replace the recorded balance of '+balance.available+' with '+count+' units?':undefined}
        run={async()=>{await mutate('/stock/adjust',{token,operation,quantity:count,expected:balance.available,bloodGroup:balance.bloodGroup,component:balance.component});setQuantity('');setToken(crypto.randomUUID())}}>Save inventory change</ActionButton>
    </div>
    {quantity && !valid && <p role="alert">Enter a whole quantity within the displayed limits.</p>}
    <h3 className="text-sm font-medium">Recent receipts and counts</h3>
    {balance.adjustments.length ? <ul className="text-sm">{balance.adjustments.map((a,i)=><li key={i}>{new Date(a.at*1000).toLocaleString()} · {a.operation==='COUNT'?'Physical count':'Receipt'} · {a.beforeCount} → {a.afterCount} units</li>)}</ul> : <p className="text-sm">No receipts or corrections recorded.</p>}
    <p className="text-xs text-ink-secondary">This workspace tracks aggregate units. Batch expiry dates are unavailable.</p>
  </details>
}

function BalanceDetails({balance}: {balance: StockBalance}) {
  const {mutate} = useRequests()
  const [issueUnits,setIssueUnits] = useState('1')
  const [token,setToken] = useState(() => crypto.randomUUID())
  const [day,setDay] = useState(balance.history.find(h => h.units === null)?.day ?? balance.history[0].day)
  const selected = balance.history.find(h => h.day === day) ?? balance.history[0]
  const [edit,setEdit] = useState<string|null>(null)
  const [message,setMessage] = useState('')
  const daily = edit ?? String(selected.units ?? selected.logged)
  const key = {bloodGroup:balance.bloodGroup,component:balance.component}
  const confirmed = balance.history.filter(h => h.units !== null).length
  return <div className="space-y-4">
    <div aria-live="polite" className="rounded bg-surface-sunken p-3 text-sm">
      <strong>{balance.bloodGroup} {componentLabel[balance.component]} · {balance.available} units on hand</strong>
      {balance.forecastUnits === null ? <p>Awaiting daily totals · {confirmed} of 7 days confirmed.</p> :
        <p>Estimated use over the next 7 days: {balance.forecastUnits} units. Projected shortfall: {balance.projectedShortfall} units.</p>}
    </div>
    <div className="space-y-2 border-t border-border pt-3">
      <h3 className="font-medium">Issue stock today</h3>
      <p className="text-sm">{balance.issuedToday} units issued today (UTC). Recording an issue reduces the available balance.</p>
      <div className="flex flex-wrap items-center gap-3"><label>Units to issue<input className={inputClass+' w-20'} type="number" min="1" max={balance.available} value={issueUnits}
        onChange={e=>{setIssueUnits(e.target.value);setToken(crypto.randomUUID())}} /></label>
      <ActionButton key={token} confirm={'Issue '+issueUnits+' units from this balance?'} size="sm" disabled={!Number.isInteger(Number(issueUnits)) || Number(issueUnits)<1 || Number(issueUnits)>balance.available}
        run={async()=>{await mutate('/stock/issues',{...key,units:Number(issueUnits),token});setToken(crypto.randomUUID());setMessage('Stock issue recorded.')}}>Record stock issue</ActionButton></div>
    </div>
    <details className="space-y-3 border-t border-border pt-3"><summary className="cursor-pointer font-medium">Daily usage history</summary>
      <p className="text-sm">Enter the full issued total from the stock register for each completed UTC day, including zero-use days. Historical totals update the estimate and leave today's balance unchanged.</p>
      <div className="flex flex-wrap items-center gap-3">
        <label>Usage date<select className={inputClass} value={selected.day} onChange={e=>{setDay(e.target.value);setEdit(null)}}>
          {balance.history.map(h=><option key={h.day} value={h.day}>{h.day} · {h.units===null?'unconfirmed':h.units+' issued'}</option>)}</select></label>
        <label>Total issued<input className={inputClass+' w-20'} type="number" min={selected.logged} max="100000" value={daily} onChange={e=>setEdit(e.target.value)}/></label>
        <ActionButton size="sm" variant="outline" disabled={!daily.trim() || !Number.isInteger(Number(daily)) || Number(daily)<selected.logged || Number(daily)>100000}
          run={async()=>{await mutate('/stock/daily-usage',{...key,day:selected.day,units:Number(daily)});setEdit(null);setMessage('Daily total saved for '+selected.day+'.')}}>Save daily total</ActionButton>
      </div>
      <p className="text-xs text-ink-secondary">{selected.logged} units were issued in this workspace on {selected.day}.</p>
    </details>
    <StockAdjustment key={balance.available} balance={balance}/>
    <p role="status" className="text-sm">{message}</p>
  </div>
}

export function StockForecast({balances}: {balances: StockBalance[]}) {
  const [group,setGroup] = useState('O-')
  const balance = balances.find(b=>b.bloodGroup===group) ?? balances[0]
  if (!balance) return null
  return <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
    <h2 className="font-semibold">Seven-day stock outlook</h2>
    <p className="text-sm text-ink-secondary">This planning estimate assumes the next seven days repeat the last seven days of recorded usage, with no incoming collections or expiries.</p>
    <label>Forecast blood group<select className={inputClass} value={balance.bloodGroup} onChange={e=>setGroup(e.target.value)}>
      {balances.map(b=><option key={b.bloodGroup}>{b.bloodGroup}</option>)}</select></label>
    <BalanceDetails key={balance.component+balance.bloodGroup+balance.history[0].day} balance={balance}/>
  </section>
}
