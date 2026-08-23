import { Calendar, ChevronRight, FileText, ShieldCheck, UserX } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PrivacyFieldRow } from '@/components/privacy/PrivacyFieldRow'
import { privacyFields } from '@/lib/privacyData'

export function HospitalPrivacyPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div>
        <h1 className="text-[18px] font-semibold text-ink">Privacy & data</h1>
        <p className="mt-1 text-[13px] text-ink-secondary">
          What City Hospital can see about a donor, and what stays private until they confirm. No medical
          verification is performed by this platform.
        </p>
      </div>

      <Card className="px-5">
        <p className="pt-4 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
          What you can see about a donor
        </p>
        {privacyFields.map((field) => (
          <PrivacyFieldRow key={field.label} field={field} description={field.hospitalWhy} />
        ))}
      </Card>

      <Card className="flex items-start gap-3 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-info-subtle text-info">
          <UserX size={16} strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-[13px] font-semibold text-ink">Donor identity stays anonymous</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-secondary">
            Candidates appear as anonymous IDs ("Donor #A284") throughout matching. Full contact details are
            only shared with your hospital after a donor confirms acceptance — never before.
          </p>
        </div>
      </Card>

      <Card className="flex items-start gap-3 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-success-subtle text-success">
          <ShieldCheck size={16} strokeWidth={1.75} />
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-ink">Hospital verification status</p>
            <Badge tone="success" dot size="sm">
              Verified
            </Badge>
          </div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-secondary">
            City Hospital's identity was verified before this account could raise emergency requests.
            Verification confirms hospital identity only — it does not grant access to donor data beyond
            what's listed above.
          </p>
        </div>
      </Card>

      <Card className="p-4">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <Calendar size={15} className="text-ink-tertiary" />
          Data retention
        </p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-secondary">
          A matched donor's details stay visible for the life of a request, plus a short retention window for
          your records afterward. Donors who were only ranked or alerted — not confirmed — are not retained
          against your account.
        </p>
      </Card>

      <button
        type="button"
        disabled
        className="flex items-center justify-between rounded-lg border border-border bg-surface p-4 text-left opacity-60"
      >
        <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
          <FileText size={15} className="text-ink-tertiary" />
          Full privacy policy
        </span>
        <span className="flex items-center gap-1 text-[11.5px] text-ink-tertiary">
          Not yet published
          <ChevronRight size={14} />
        </span>
      </button>
    </div>
  )
}
