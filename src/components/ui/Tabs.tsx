import { cn } from '@/lib/utils'

export interface TabOption<T extends string> {
  value: T
  label: string
}

export interface TabsProps<T extends string> {
  options: TabOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/** A segmented tab control — same visual language as the wizard's step buttons and demo-scenario pickers. */
export function Tabs<T extends string>({ options, value, onChange, className }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn('inline-flex rounded-md border border-border-strong bg-surface-sunken p-1', className)}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-sm px-3.5 py-1.5 text-[13px] font-medium transition-colors',
            value === opt.value ? 'bg-surface text-ink shadow-xs' : 'text-ink-secondary hover:text-ink'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
