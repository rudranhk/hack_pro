import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StepperProps {
  steps: string[]
  currentIndex: number
  className?: string
}

export function Stepper({ steps, currentIndex, className }: StepperProps) {
  return (
    <ol className={cn('flex items-start', className)}>
      {steps.map((label, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const isLast = index === steps.length - 1

        return (
          <li key={label} className={cn('flex items-center', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold transition-colors',
                  isCompleted && 'border-primary bg-primary text-white',
                  isCurrent && 'border-primary bg-primary-subtle text-primary-active',
                  !isCompleted && !isCurrent && 'border-border-strong bg-surface text-ink-tertiary'
                )}
              >
                {isCompleted ? <Check size={14} strokeWidth={2.5} /> : index + 1}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-[12px] font-medium',
                  isCurrent ? 'text-ink' : isCompleted ? 'text-ink-secondary' : 'text-ink-tertiary'
                )}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn('mx-2 mb-5 h-px flex-1 transition-colors', isCompleted ? 'bg-primary' : 'bg-border')}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
