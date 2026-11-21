import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Droplet } from 'lucide-react'

export function BrandHomeLink({ children }: { children?: ReactNode }) {
  return (
    <Link
      to="/"
      aria-label="Blood Buddy home"
      className="inline-flex items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary text-white">
        <Droplet size={17} fill="currentColor" strokeWidth={0} aria-hidden="true" />
      </span>
      {children}
    </Link>
  )
}
