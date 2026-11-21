import type { BloodGroup, Component, Urgency } from '@/lib/types'

export interface RequestDraft {
  bloodGroup: BloodGroup | null
  component: Component | null
  radius: number
  unitsNeeded: number
  urgency: Urgency | null
}

export const emptyDraft: RequestDraft = {
  bloodGroup: null,
  component: null,
  radius: 5,
  unitsNeeded: 1,
  urgency: null,
}

export interface StepProps {
  draft: RequestDraft
  onChange: (patch: Partial<RequestDraft>) => void
}
