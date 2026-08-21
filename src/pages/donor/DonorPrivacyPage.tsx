import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { MobileShell } from '@/components/layout/MobileShell'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function DonorPrivacyPage() {
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
      <ComingSoon
        icon={ShieldCheck}
        phase="Phase 11"
        title="Your data, your control"
        description="What BloodLink stores about you, why, and a delete-my-data control — no medical-verification claims the system can't back up."
      />
    </MobileShell>
  )
}
