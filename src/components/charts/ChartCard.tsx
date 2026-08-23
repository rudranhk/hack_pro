import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

export function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={cn('p-5', className)}>
      <h3 className="text-[13.5px] font-semibold text-ink">{title}</h3>
      {subtitle && <p className="mt-0.5 text-[11.5px] text-ink-tertiary">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  )
}
