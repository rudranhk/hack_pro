import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Radio, ShieldCheck } from 'lucide-react'
import { MobileShell } from '@/components/layout/MobileShell'
import { AvailabilityToggle } from '@/components/donor/AvailabilityToggle'
import { DonorProfileSummary } from '@/components/donor/DonorProfileSummary'
import { buttonClasses } from '@/components/ui/Button'
import { mockDonorProfile } from '@/lib/mockData'

export function DonorHomePage() {
  const [available, setAvailable] = useState(mockDonorProfile.defaultAvailable)

  return (
    <MobileShell title="BloodLink">
      <div className="flex flex-col gap-4 p-4">
        <AvailabilityToggle available={available} onChange={setAvailable} />
        <DonorProfileSummary profile={mockDonorProfile} available={available} />

        <div className="rounded-lg border border-dashed border-border-strong p-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
            <Radio size={13} />
            Demo control
          </p>
          <p className="mt-1.5 text-[12.5px] text-ink-secondary">
            No live push alerts in this prototype — trigger one manually to see the donor flow.
          </p>
          <Link
            to="/donor/alert"
            className={buttonClasses({ variant: 'primary', size: 'sm', className: 'mt-3 w-full' })}
          >
            Simulate emergency alert
          </Link>
        </div>

        <Link
          to="/donor/privacy"
          className="flex items-center justify-center gap-1.5 py-2 text-[12.5px] font-medium text-ink-secondary hover:text-ink"
        >
          <ShieldCheck size={14} />
          Privacy & data
        </Link>
      </div>
    </MobileShell>
  )
}
