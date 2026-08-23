import type { BloodGroup, EscalationTier } from './types'

/** All synthetic/demo data — labeled as such wherever it's shown, per the product-language rules. */

export const analyticsKpis = {
  medianFirstAccept: '2m 14s',
  alertsPerUnitCollected: '6.2',
  requestsFulfilled: '94%',
  averageResponseRate: '31%',
}

export const requestsOverTime: { label: string; value: number }[] = [
  { label: 'Aug 10', value: 4 }, { label: 'Aug 11', value: 3 }, { label: 'Aug 12', value: 6 },
  { label: 'Aug 13', value: 5 }, { label: 'Aug 14', value: 7 }, { label: 'Aug 15', value: 4 },
  { label: 'Aug 16', value: 8 }, { label: 'Aug 17', value: 6 }, { label: 'Aug 18', value: 5 },
  { label: 'Aug 19', value: 9 }, { label: 'Aug 20', value: 7 }, { label: 'Aug 21', value: 6 },
  { label: 'Aug 22', value: 8 }, { label: 'Aug 23', value: 5 },
]

export const responseRateOverTime: { label: string; value: number }[] = [
  { label: 'Aug 10', value: 24 }, { label: 'Aug 11', value: 27 }, { label: 'Aug 12', value: 22 },
  { label: 'Aug 13', value: 30 }, { label: 'Aug 14', value: 28 }, { label: 'Aug 15', value: 33 },
  { label: 'Aug 16', value: 26 }, { label: 'Aug 17', value: 31 }, { label: 'Aug 18', value: 35 },
  { label: 'Aug 19', value: 29 }, { label: 'Aug 20', value: 34 }, { label: 'Aug 21', value: 32 },
  { label: 'Aug 22', value: 30 }, { label: 'Aug 23', value: 31 },
]

export const bloodGroupDemand: { label: BloodGroup; value: number }[] = [
  { label: 'O-', value: 42 }, { label: 'O+', value: 31 }, { label: 'A-', value: 14 },
  { label: 'A+', value: 26 }, { label: 'B-', value: 9 }, { label: 'B+', value: 18 },
  { label: 'AB-', value: 5 }, { label: 'AB+', value: 8 },
]

export const escalationFrequency: { label: string; tier: EscalationTier; value: number }[] = [
  { label: 'Nearby', tier: 'NEARBY', value: 58 },
  { label: 'Wide', tier: 'WIDE', value: 27 },
  { label: 'City', tier: 'CITY', value: 11 },
  { label: 'Human', tier: 'HUMAN', value: 4 },
  { label: 'Expired', tier: 'EXPIRED', value: 2 },
]

export const timeToFirstAccept: { label: string; value: number }[] = [
  { label: 'REQ-2039', value: 1.4 }, { label: 'REQ-2041', value: 3.2 }, { label: 'REQ-2044', value: 2.0 },
  { label: 'REQ-2046', value: 5.6 }, { label: 'REQ-2048', value: 1.8 }, { label: 'REQ-2050', value: 2.9 },
  { label: 'REQ-2051', value: 1.1 }, { label: 'REQ-2053', value: 2.4 },
]
export const timeToFirstAcceptMedianMinutes = 2.23 // "2m 14s"

export const systemEfficiency = {
  broadcast: { alerts: 200, usefulDonors: 3, label: 'Traditional broadcast' },
  filtered: { alerts: 12, confirmedDonors: 2, label: 'Filtered matching' },
}
