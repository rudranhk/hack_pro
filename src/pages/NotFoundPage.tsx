import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { buttonClasses } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-sunken text-ink-secondary">
        <Compass size={22} strokeWidth={1.75} />
      </span>
      <div>
        <h1 className="text-[17px] font-semibold text-ink">Page not found</h1>
        <p className="mt-1.5 text-[13px] text-ink-secondary">
          That screen doesn't exist in this prototype yet.
        </p>
      </div>
      <Link to="/" className={buttonClasses({ variant: 'outline', size: 'sm' })}>
        Back to home
      </Link>
    </div>
  )
}
