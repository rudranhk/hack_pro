import type { EmergencyRequest } from './types'

/** Synthetic demo data — stands in for the requests collection until Firebase lands. */
export const mockRequests: EmergencyRequest[] = [
  {
    id: 'REQ-2048',
    hospitalName: 'City Hospital',
    bloodGroup: 'O-',
    component: 'WHOLE',
    unitsNeeded: 2,
    unitsSecured: 1,
    urgency: 'CRITICAL',
    status: 'SEARCHING',
    escalationTier: 'WIDE',
    timeElapsedLabel: '04:18',
    createdAtLabel: 'Today, 10:12 AM',
  },
  {
    id: 'REQ-2051',
    hospitalName: 'City Hospital',
    bloodGroup: 'A+',
    component: 'PLATELET',
    unitsNeeded: 3,
    unitsSecured: 3,
    urgency: 'URGENT',
    status: 'COVERED',
    escalationTier: 'NEARBY',
    timeElapsedLabel: '01:52',
    createdAtLabel: 'Today, 11:41 AM',
  },
  {
    id: 'REQ-2053',
    hospitalName: 'City Hospital',
    bloodGroup: 'B-',
    component: 'PLASMA',
    unitsNeeded: 1,
    unitsSecured: 0,
    urgency: 'STANDARD',
    status: 'SEARCHING',
    escalationTier: 'NEARBY',
    timeElapsedLabel: '00:47',
    createdAtLabel: 'Today, 12:03 PM',
  },
]

export const mockOverviewMetrics = {
  activeRequests: 3,
  donorsResponding: 8,
  unitsSecured: 6,
  unitsTarget: 8,
  medianFirstResponse: '2m 14s',
}
