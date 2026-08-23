import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

export interface DangerZoneProps {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
  children?: ReactNode
}

export function DangerZone({ title, description, actionLabel, onAction, children }: DangerZoneProps) {
  return (
    <div className="rounded-lg border border-critical-border bg-critical-subtle p-4">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-critical" />
        <div>
          <p className="text-[13px] font-semibold text-critical">{title}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-secondary">{description}</p>
        </div>
      </div>
      {children}
      <Button variant="danger" size="sm" className="mt-3.5" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  )
}
