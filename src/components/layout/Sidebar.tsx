import { BrandHomeLink } from '@/components/layout/BrandHomeLink'
import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hospitalNavItems } from '@/lib/navigation'

interface SidebarProps {
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const panel = useRef<HTMLElement>(null)
  useEffect(()=>{
    if (!mobileOpen) return
    const previous=document.activeElement as HTMLElement|null
    const items=Array.from(panel.current?.querySelectorAll<HTMLElement>('a,button') ?? [])
    items[0]?.focus()
    const handle=(e:KeyboardEvent)=>{
      if (e.key==='Escape') {e.preventDefault();onCloseMobile()}
      if (e.key==='Tab' && document.activeElement===items[e.shiftKey?0:items.length-1]) {
        e.preventDefault();items[e.shiftKey?items.length-1:0]?.focus()
      }
    }
    document.addEventListener('keydown',handle)
    return ()=>{document.removeEventListener('keydown',handle);previous?.focus()}
  },[mobileOpen,onCloseMobile])
  return (
    <>
      {/* Mobile scrim */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside ref={panel} id="hospital-navigation" aria-label="Hospital navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0',
          mobileOpen ? 'visible translate-x-0' : 'invisible -translate-x-full lg:visible'
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-5">
          <BrandHomeLink>
            <div className="leading-tight">
              <p className="text-[14px] font-semibold text-ink">Blood Buddy</p>
              <p className="text-[11px] text-ink-tertiary">Emergency network</p>
            </div>
          </BrandHomeLink>
          <button
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="rounded-sm p-1 text-ink-tertiary hover:bg-surface-sunken lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
            Workspace
          </p>
          <ul className="flex flex-col gap-0.5">
            {hospitalNavItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13px] font-medium transition-colors',
                      isActive
                        ? 'bg-primary-subtle text-primary-active'
                        : 'text-ink-secondary hover:bg-surface-sunken hover:text-ink'
                    )
                  }
                >
                  <item.icon size={17} strokeWidth={2} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-border p-4">
          <div className="rounded-md bg-surface-sunken px-3 py-2.5">
            <p className="text-[12px] font-medium text-ink">Synthetic workspace</p>
            <p className="mt-0.5 text-[11px] text-ink-tertiary">
              Start a fresh critical O− demonstration from Overview.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
