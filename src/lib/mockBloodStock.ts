import type { BloodGroup, Component, StockEntry } from './types'

export const stockLastUpdatedLabel = '2 min ago'

/** Same policy threshold per blood group across every component — a simplification, not a claim about real blood-bank policy. */
const CRITICAL_THRESHOLD: Record<BloodGroup, number> = {
  'O-': 3, 'O+': 3, 'A-': 3, 'A+': 5, 'B-': 2, 'B+': 4, 'AB-': 1, 'AB+': 2,
}

function row(component: Component, bloodGroup: BloodGroup, available: number, reserved: number): StockEntry {
  return { component, bloodGroup, available, reserved, criticalThreshold: CRITICAL_THRESHOLD[bloodGroup] }
}

export const mockBloodStock: StockEntry[] = [
  // Whole blood
  row('WHOLE', 'O-', 2, 1), row('WHOLE', 'O+', 8, 2), row('WHOLE', 'A-', 4, 1), row('WHOLE', 'A+', 12, 3),
  row('WHOLE', 'B-', 3, 0), row('WHOLE', 'B+', 9, 2), row('WHOLE', 'AB-', 1, 0), row('WHOLE', 'AB+', 6, 1),
  // Platelets
  row('PLATELET', 'O-', 1, 0), row('PLATELET', 'O+', 5, 1), row('PLATELET', 'A-', 2, 0), row('PLATELET', 'A+', 7, 2),
  row('PLATELET', 'B-', 1, 0), row('PLATELET', 'B+', 4, 1), row('PLATELET', 'AB-', 0, 0), row('PLATELET', 'AB+', 3, 0),
  // Plasma
  row('PLASMA', 'O-', 6, 1), row('PLASMA', 'O+', 14, 3), row('PLASMA', 'A-', 5, 1), row('PLASMA', 'A+', 18, 4),
  row('PLASMA', 'B-', 4, 1), row('PLASMA', 'B+', 11, 2), row('PLASMA', 'AB-', 2, 0), row('PLASMA', 'AB+', 9, 2),
]
