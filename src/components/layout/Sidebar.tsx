import { NavLink } from 'react-router-dom'
import { Droplet, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hospitalNavItems } from '@/lib/navigation'

interface SidebarProps {
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
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

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-surface transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-border px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-white">
              <Droplet size={17} fill="currentColor" strokeWidth={0} />
            </span>
            <div className="leading-tight">
              <p className="text-[14px] font-semibold text-ink">BloodLink</p>
              <p className="text-[11px] text-ink-tertiary">Emergency network</p>
            </div>
          </div>
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
            <p className="text-[12px] font-medium text-ink">Demo Mode available</p>
            <p className="mt-0.5 text-[11px] text-ink-tertiary">
              Fast-forward escalation from any live request.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
