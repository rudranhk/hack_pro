import type { NetworkDonor } from './types'

/** Synthetic donor pool for the hospital's Donor Network view — an operational summary, not a directory. */
export const donorNetworkMetrics = {
  availableNow: 184,
  eligibleNearby: 42,
  currentlyResponding: 12,
  activeCommitments: 7,
}

function donor(
  id: string,
  bloodGroup: NetworkDonor['bloodGroup'],
  distanceKm: number,
  availability: NetworkDonor['availability'],
  responseRate: number,
  lastActiveLabel: string,
  score: number,
  eligible = true,
  components: NetworkDonor['components'] = ['WHOLE']
): NetworkDonor {
  const proximity = Math.max(0, Math.round(25 - distanceKm * 0.6))
  const responseHistory = Math.round(12 * responseRate)
  const compatibility = eligible ? 38 : 20
  const eligibilityMargin = eligible ? 14 : 3
  const recentActivity = Math.max(0, score - compatibility - proximity - responseHistory - eligibilityMargin) || 4
  return {
    id,
    bloodGroup,
    distanceKm,
    availability,
    responseRate,
    lastActiveLabel,
    score,
    eligible,
    components,
    scoreBreakdown: { compatibility, proximity, eligibilityMargin, responseHistory, recentActivity },
  }
}

export const mockNetworkDonors: NetworkDonor[] = [
  donor('A284', 'O-', 1.8, 'AVAILABLE', 0.82, '2 min ago', 92, true, ['WHOLE', 'PLASMA']),
  donor('B193', 'O+', 3.2, 'AVAILABLE', 0.67, '5 min ago', 78, true, ['WHOLE', 'PLATELET']),
  donor('C905', 'O-', 3.9, 'RESPONDING', 0.65, '1 min ago', 74),
  donor('D562', 'A+', 4.6, 'AVAILABLE', 0.71, '12 min ago', 80, true, ['WHOLE', 'PLASMA']),
  donor('E238', 'A-', 5.1, 'AVAILABLE', 0.4, '6 days ago', 55),
  donor('F701', 'O-', 2.6, 'UNAVAILABLE', 0.3, '3 weeks ago', 40, false),
  donor('G840', 'O-', 1.2, 'RESPONDING', 0.9, '20 min ago', 88, true, ['WHOLE', 'PLATELET', 'PLASMA']),
  donor('H124', 'B+', 6.4, 'AVAILABLE', 0.58, '18 min ago', 69, true, ['PLATELET']),
  donor('J356', 'B-', 9.7, 'AVAILABLE', 0.55, '2 hours ago', 61),
  donor('K479', 'AB+', 6.8, 'AVAILABLE', 0.49, '1 hour ago', 58, true, ['WHOLE', 'PLASMA']),
  donor('L802', 'AB-', 14.2, 'AVAILABLE', 0.38, '12 days ago', 44),
  donor('M615', 'A+', 3.3, 'RESPONDING', 0.77, '9 min ago', 85, true, ['WHOLE', 'PLATELET']),
  donor('N937', 'O+', 7.5, 'AVAILABLE', 0.44, '4 days ago', 52),
  donor('P264', 'B+', 2.9, 'AVAILABLE', 0.62, '30 min ago', 71, true, ['WHOLE', 'PLASMA']),
  donor('Q583', 'A-', 8.8, 'AVAILABLE', 0.35, '9 days ago', 46),
  donor('R719', 'O-', 5.5, 'AVAILABLE', 0.6, '45 min ago', 70, true, ['PLASMA']),
  donor('S042', 'AB+', 11.3, 'UNAVAILABLE', 0.28, '1 month ago', 35, false),
  donor('T358', 'O+', 4.1, 'AVAILABLE', 0.68, '15 min ago', 76, true, ['WHOLE', 'PLATELET']),
  donor('U671', 'B-', 6.2, 'AVAILABLE', 0.51, '3 hours ago', 60),
  donor('V904', 'A+', 1.6, 'RESPONDING', 0.86, '4 min ago', 90, true, ['WHOLE', 'PLATELET', 'PLASMA']),
  donor('W227', 'O-', 9.4, 'AVAILABLE', 0.42, '7 days ago', 50),
  donor('X550', 'AB-', 7.1, 'AVAILABLE', 0.33, '10 days ago', 42),
  donor('Y873', 'B+', 3.5, 'AVAILABLE', 0.64, '22 min ago', 73, true, ['PLASMA']),
  donor('Z196', 'O+', 2.2, 'AVAILABLE', 0.74, '8 min ago', 82, true, ['WHOLE', 'PLATELET']),
]
