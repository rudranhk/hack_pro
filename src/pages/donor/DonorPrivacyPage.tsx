import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, ChevronRight, FileText } from 'lucide-react'
import { MobileShell } from '@/components/layout/MobileShell'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { DangerZone } from '@/components/ui/DangerZone'
import { useToast } from '@/components/ui/Toast'
import { PrivacyFieldRow } from '@/components/privacy/PrivacyFieldRow'
import { privacyFields } from '@/lib/privacyData'

export function DonorPrivacyPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleDelete = () => {
    setConfirmOpen(false)
    toast({
      title: 'Your data has been deleted',
      description: 'Your donor profile, history, and consent record have been removed.',
      tone: 'success',
    })
    navigate('/')
  }

  return (
    <MobileShell
      title="Privacy & data"
      leadingAction={
        <Link
          to="/donor"
          aria-label="Back"
          className="flex h-8 w-8 items-center justify-center rounded-sm text-ink-secondary hover:bg-surface-sunken"
        >
          <ArrowLeft size={18} />
        </Link>
      }
    >
      <div className="flex flex-col gap-5 p-4">
        <div>
          <h1 className="text-[19px] font-semibold text-ink">Your data. Your control.</h1>
          <p className="mt-1 text-[13px] text-ink-secondary">
            No medical verification is performed by this platform — only what's needed to filter and rank
            donors is stored.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface px-4">
          <p className="pt-3.5 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
            Data we store
          </p>
          {privacyFields.map((field) => (
            <PrivacyFieldRow key={field.label} field={field} description={field.donorWhy} />
          ))}
        </div>

        <div className="rounded-lg border border-success-border bg-success-subtle p-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-ink">Consent status</p>
            <Badge tone="success" dot size="sm">
              Given
            </Badge>
          </div>
          <p className="mt-1.5 text-[12px] text-ink-secondary">
            You consented to eligibility-first matching when you registered. You can withdraw at any time by
            deleting your data below.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
            <Calendar size={15} className="text-ink-tertiary" />
            Data retention
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-secondary">
            Response and donation history is kept for 24 months to support matching quality, then
            automatically deleted. Any location shared during an active request is discarded within 24 hours
            of that request closing.
          </p>
        </div>

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

        <DangerZone
          title="Delete my data"
          description="Permanently removes your donor profile, blood group, eligibility, location, donation history, response history, and consent record. This can't be undone."
          actionLabel="Delete my data"
          onAction={() => setConfirmOpen(true)}
        />
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete your data?"
        description="This permanently removes your donor profile and every field listed above. This can't be undone."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Yes, delete everything
            </Button>
          </>
        }
      />
    </MobileShell>
  )
}
