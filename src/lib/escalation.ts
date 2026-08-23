import type { EscalationTier } from './types'

export interface EscalationStep {
  fromTier: EscalationTier
  toTier: EscalationTier
  elapsedLabel: string
}

/** The single source of truth for the escalation ladder — Demo Mode and "Expand search" both read this. */
export const ESCALATION_SEQUENCE: EscalationStep[] = [
  { fromTier: 'NEARBY', toTier: 'WIDE', elapsedLabel: '03:00' },
  { fromTier: 'WIDE', toTier: 'CITY', elapsedLabel: '08:00' },
  { fromTier: 'CITY', toTier: 'HUMAN', elapsedLabel: '15:00' },
]

export function nextEscalationStep(currentTier: EscalationTier): EscalationStep | null {
  return ESCALATION_SEQUENCE.find((s) => s.fromTier === currentTier) ?? null
}
