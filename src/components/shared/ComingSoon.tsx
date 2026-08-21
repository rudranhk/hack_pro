import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

interface ComingSoonProps {
  icon: LucideIcon
  title: string
  description: string
  phase: string
}

/** Placeholder for routes that are wired up but not yet built out. Keeps navigation real end-to-end. */
export function ComingSoon({ icon: Icon, title, description, phase }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex max-w-md flex-col items-center rounded-lg border border-dashed border-border-strong px-8 py-12 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-surface-sunken text-ink-secondary">
          <Icon size={22} strokeWidth={1.75} />
        </span>
        <Badge tone="neutral" size="sm" className="mb-3">
          {phase}
        </Badge>
        <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">{description}</p>
      </div>
    </div>
  )
}
