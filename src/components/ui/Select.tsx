import { forwardRef, useId } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, children, ...props },
  ref
) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-[13px] font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-10 w-full appearance-none rounded-md border bg-surface px-3 pr-9 text-sm text-ink',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            error ? 'border-critical' : 'border-border-strong',
            className
          )}
          aria-invalid={!!error}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary"
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-[12px] text-critical">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-ink-tertiary">{hint}</p>
      ) : null}
    </div>
  )
})
