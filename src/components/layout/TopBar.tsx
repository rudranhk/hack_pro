import { Link, useLocation } from 'react-router-dom'
import { Bell, Building2, Menu } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { hospitalNavItems } from '@/lib/navigation'
import { useRequests } from '@/lib/context/RequestsContext'
import { localTime, statusText } from '@/lib/api/workspace'

export function TopBar({onOpenMobileMenu,mobileOpen}: {mobileOpen:boolean;onOpenMobileMenu: () => void}) {
  const {pathname} = useLocation()
  const {data, connection} = useRequests()
  const title = [...hospitalNavItems].reverse().find(i => i.end ? i.to === pathname : pathname.startsWith(i.to))?.label
  return <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface px-4 sm:px-6">
    <div className="flex items-center gap-2"><button onClick={onOpenMobileMenu} aria-controls="hospital-navigation" aria-expanded={mobileOpen} aria-label="Open navigation" className="lg:hidden"><Menu size={20}/></button><h1 className="font-semibold">{title}</h1></div>
    <div className="flex items-center gap-3"><Badge dot tone={connection === 'Live' ? 'success' : 'warning'}>{connection} · demo</Badge>
      <details className="relative"><summary aria-label="Recent workspace events" className="cursor-pointer list-none"><Bell size={18}/></summary>
        <div className="absolute right-0 top-8 w-64 space-y-2 rounded-md border border-border bg-surface p-4 shadow-lg"><strong>Workspace activity</strong>
          {data?.events.length ? data.events.slice(0,6).map(e => <div className="text-xs" key={e.id}>{localTime(e.at)} · {statusText(e.event)} {e.requestId && <Link onClick={event=>{event.currentTarget.closest('details')?.removeAttribute('open')}} className="text-primary" to={'/hospital/requests/' + e.requestId}>{e.requestId}</Link>}</div>) : <p className="text-sm">No events yet.</p>}</div>
      </details><Link to="/hospital/profile" aria-label="Hospital profile"><Building2 size={18}/></Link></div>
  </header>
}
