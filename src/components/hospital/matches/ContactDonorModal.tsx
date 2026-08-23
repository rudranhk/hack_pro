import { Phone, ShieldCheck } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

function demoPhoneFor(donorId: string): { masked: string; tel: string } {
  const digits = String(donorId)
    .split('')
    .map((c) => c.charCodeAt(0) % 10)
    .join('')
    .padEnd(3, '7')
    .slice(0, 3)
  return { masked: `+91 ••••• ••${digits}`, tel: `+9198765${digits}10` }
}

export function ContactDonorModal({
  donorId,
  open,
  onClose,
}: {
  donorId: string | null
  open: boolean
  onClose: () => void
}) {
  const phone = donorId ? demoPhoneFor(donorId) : null

  return (
    <Modal open={open} onClose={onClose} title={donorId ? `Contact Donor #${donorId}` : undefined} size="sm">
      {phone && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-md border border-border-strong p-3.5">
            <span className="font-mono text-[14px] font-medium text-ink">{phone.masked}</span>
            <a
              href={`tel:${phone.tel}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white"
              aria-label="Call donor"
            >
              <Phone size={15} />
            </a>
          </div>
          <div className="flex gap-2.5 rounded-md border border-info-border bg-info-subtle p-3.5">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-info" />
            <p className="text-[12px] leading-relaxed text-ink-secondary">
              This channel opened because the donor confirmed acceptance. The full number is never shown until
              that point.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </Modal>
  )
}
