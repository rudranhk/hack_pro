import type { PrivacyField } from '@/lib/privacyData'

export function PrivacyFieldRow({ field, description }: { field: PrivacyField; description: string }) {
  return (
    <div className="flex gap-3 border-b border-border py-3.5 last:border-b-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-ink-secondary">
        <field.icon size={15} strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink">{field.label}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-ink-secondary">{description}</p>
      </div>
    </div>
  )
}
