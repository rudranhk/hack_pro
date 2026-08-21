import { Siren } from 'lucide-react'
import { ComingSoon } from '@/components/shared/ComingSoon'

export function RequestsPage() {
  return (
    <ComingSoon
      icon={Siren}
      phase="Phase 2–3"
      title="Emergency requests"
      description="Browse every request this hospital has raised, and start the blood requirement → urgency → location → review flow for a new one."
    />
  )
}
