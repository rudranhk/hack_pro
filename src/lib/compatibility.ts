import type { BloodGroup, Component } from './types'

/**
 * Standard ABO/Rh donor-recipient compatibility — a hard filter before ranking,
 * not something similarity or distance ever overrides. Mirrors server/compatibility.py
 * so the demo backend and this offline fallback agree.
 */

const ALL_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']

const RBC_COMPATIBLE_RECIPIENTS: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
}

// Plasma compatibility mirrors RBC — AB is the universal plasma donor, O recipients can receive from anyone.
const PLASMA_COMPATIBLE_DONOR_ABO: Record<string, string[]> = {
  O: ['O', 'A', 'B', 'AB'],
  A: ['A', 'AB'],
  B: ['B', 'AB'],
  AB: ['AB'],
}

const abo = (group: BloodGroup) => group.replace(/[+-]/, '')

/** Which donor blood groups may donate `component` to `recipient`. */
export function compatibleDonorGroups(recipient: BloodGroup, component: Component): Set<BloodGroup> {
  if (component === 'PLASMA') {
    const donorAbo = new Set(PLASMA_COMPATIBLE_DONOR_ABO[abo(recipient)])
    return new Set(ALL_GROUPS.filter((g) => donorAbo.has(abo(g))))
  }
  // WHOLE and PLATELET both follow standard RBC compatibility here — a simplification,
  // real platelet matching leans more on ABO-identical preference.
  return new Set(ALL_GROUPS.filter((donor) => RBC_COMPATIBLE_RECIPIENTS[donor].includes(recipient)))
}
