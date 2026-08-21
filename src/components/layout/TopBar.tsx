import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, ChevronDown, Menu, ShieldCheck } from 'lucide-react'
import { hospitalNavItems } from '@/lib/navigation'

interface TopBarProps {
  onOpenMobileMenu: () => void
}

function useSectionTitle(): string {
  const { pathname } = useLocation()
  return useMemo(() => {
    const match = [...hospitalNavItems]
      .sort((a, b) => b.to.length - a.to.length)
      .find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)))
    return match?.label ?? 'Overview'
  }, [pathname])
}

export function TopBar({ onOpenMobileMenu }: TopBarProps) {
  const title = useSectionTitle()
  const [hasUnread, setHasUnread] = useState(true)

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open menu"
          className="shrink-0 rounded-sm p-1.5 text-ink-secondary hover:bg-surface-sunken lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="truncate text-[15px] font-semibold text-ink">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-1.5 rounded-full border border-border bg-surface-sunken py-1 pl-1 pr-3 sm:flex">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-white">
            CH
          </span>
          <span className="text-[12.5px] font-medium text-ink">City Hospital</span>
          <ShieldCheck size={14} className="text-success" aria-label="Verified hospital" />
        </div>

        <button
          onClick={() => setHasUnread(false)}
          aria-label="Notifications"
          className="relative rounded-sm p-2 text-ink-secondary hover:bg-surface-sunken hover:text-ink"
        >
          <Bell size={18} />
          {hasUnread && (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-surface" />
          )}
        </button>

        <button className="flex items-center gap-2 rounded-sm py-1 pl-1 pr-1.5 hover:bg-surface-sunken">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-subtle text-[11px] font-semibold text-primary-active">
            RS
          </span>
          <span className="hidden text-[12.5px] font-medium text-ink md:inline">R. Shah</span>
          <ChevronDown size={14} className="hidden text-ink-tertiary md:inline" />
        </button>
      </div>
    </header>
  )
}
