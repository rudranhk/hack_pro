import { BrandHomeLink } from './BrandHomeLink'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MobileShellProps {
  children: ReactNode
  title?: string
  leadingAction?: ReactNode
  trailingAction?: ReactNode
  headerless?: boolean
  className?: string
}

/**
 * Frames the donor experience like a real mobile app. On viewports >= 640px it
 * renders a centered device mockup (390px wide, like a modern phone); below
 * that breakpoint it fills the screen edge-to-edge since the browser IS the phone.
 */
export function MobileShell({
  children,
  title,
  leadingAction,
  trailingAction,
  headerless,
  className,
}: MobileShellProps) {
  return (
    <div className="flex min-h-svh justify-center bg-secondary sm:items-center sm:py-8">
      <div
        className={cn(
          'flex w-full flex-col bg-bg sm:h-[840px] sm:max-h-[92svh] sm:w-[390px] sm:overflow-hidden sm:rounded-[2.25rem] sm:border-[6px] sm:border-secondary sm:shadow-lg'
        )}
      >
        <div className="hidden shrink-0 items-center justify-center bg-bg pt-2.5 sm:flex">
          <div className="h-1 w-16 rounded-full bg-ink/15" />
        </div>

        {!headerless && (
          <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-4">
            <div className="flex w-9 items-center">{leadingAction ?? (title !== 'Blood Buddy' && <BrandHomeLink />)}</div>
            <h1 className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold text-ink">
              {title === 'Blood Buddy' ? <BrandHomeLink>{title}</BrandHomeLink> : title}
            </h1>
            <div className="flex w-9 items-center justify-end">{trailingAction}</div>
          </div>
        )}

        <div className={cn('flex-1 overflow-y-auto', className)}>{children}</div>
      </div>
    </div>
  )
}
