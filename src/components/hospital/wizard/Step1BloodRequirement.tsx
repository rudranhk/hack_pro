import { CircleDot, Droplet, Minus, Plus, TestTube } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BloodGroup, Component } from '@/lib/types'
import type { StepProps } from './types'

const bloodGroups: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']

const components: { value: Component; label: string; description: string; icon: typeof Droplet }[] = [
  { value: 'WHOLE', label: 'Whole Blood', description: 'General transfusion, trauma, surgery', icon: Droplet },
  { value: 'PLATELET', label: 'Platelet', description: 'Clotting support, cancer/chemo care', icon: CircleDot },
  { value: 'PLASMA', label: 'Plasma', description: 'Burns, clotting disorders, shock', icon: TestTube },
]

const MIN_UNITS = 1
const MAX_UNITS = 10

export function Step1BloodRequirement({ draft, onChange }: StepProps) {
  return (
    <div className="flex flex-col gap-7">
      <div>
        <h3 className="text-[13px] font-semibold text-ink">Blood group</h3>
        <p className="mt-0.5 text-[12.5px] text-ink-secondary">Which group is needed?</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {bloodGroups.map((group) => (
            <button
              key={group} aria-pressed={draft.bloodGroup===group}
              type="button"
              onClick={() => onChange({ bloodGroup: group })}
              className={cn(
                'h-11 rounded-md border text-[14px] font-semibold transition-colors',
                draft.bloodGroup === group
                  ? 'border-primary bg-primary text-white'
                  : 'border-border-strong bg-surface text-ink hover:bg-surface-sunken'
              )}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-semibold text-ink">Component</h3>
        <p className="mt-0.5 text-[12.5px] text-ink-secondary">What form does it need to be in?</p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {components.map((item) => {
            const selected = draft.component === item.value
            return (
              <button
                aria-pressed={selected}
                key={item.value}
                type="button"
                onClick={() => onChange({ component: item.value })}
                className={cn(
                  'flex flex-col items-start rounded-md border p-3.5 text-left transition-colors',
                  selected
                    ? 'border-primary bg-primary-subtle'
                    : 'border-border-strong bg-surface hover:bg-surface-sunken'
                )}
              >
                <item.icon size={18} className={selected ? 'text-primary-active' : 'text-ink-secondary'} strokeWidth={1.75} />
                <span className={cn('mt-2 text-[13px] font-semibold', selected ? 'text-primary-active' : 'text-ink')}>
                  {item.label}
                </span>
                <span className="mt-0.5 text-[11.5px] leading-snug text-ink-tertiary">{item.description}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-semibold text-ink">Units required</h3>
        <p className="mt-0.5 text-[12.5px] text-ink-secondary">How many units does this request need?</p>
        <div className="mt-3 flex w-fit items-center rounded-md border border-border-strong">
          <button
            type="button"
            onClick={() => onChange({ unitsNeeded: Math.max(MIN_UNITS, draft.unitsNeeded - 1) })}
            disabled={draft.unitsNeeded <= MIN_UNITS}
            aria-label="Decrease units"
            className="flex h-11 w-11 items-center justify-center text-ink-secondary transition-colors hover:bg-surface-sunken disabled:cursor-not-allowed disabled:text-ink-tertiary disabled:hover:bg-transparent"
          >
            <Minus size={16} />
          </button>
          <span className="w-14 text-center tabular text-[16px] font-semibold text-ink">{draft.unitsNeeded}</span>
          <button
            type="button"
            onClick={() => onChange({ unitsNeeded: Math.min(MAX_UNITS, draft.unitsNeeded + 1) })}
            disabled={draft.unitsNeeded >= MAX_UNITS}
            aria-label="Increase units"
            className="flex h-11 w-11 items-center justify-center text-ink-secondary transition-colors hover:bg-surface-sunken disabled:cursor-not-allowed disabled:text-ink-tertiary disabled:hover:bg-transparent"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
