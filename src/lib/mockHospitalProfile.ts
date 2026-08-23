export const mockHospitalProfile = {
  name: 'City Hospital',
  registrationNumber: 'HSP-2026-0842',
  verified: true,
  verifiedOnLabel: '12 Aug 2026',
  location: 'Patiala, Punjab',
  coordinator: 'Emergency Blood Desk',
  phoneMasked: '+91 ••••• ••482',
  openRequests: { current: 3, limit: 5 },
  requestsToday: { current: 7, limit: 20 },
}

export interface CoordinationSetting {
  key: 'emergencyNotifications' | 'automaticEscalation' | 'coordinatorEscalation'
  label: string
  description: string
  defaultOn: boolean
}

export const coordinationSettings: CoordinationSetting[] = [
  {
    key: 'emergencyNotifications',
    label: 'Emergency notifications',
    description: 'Get notified the moment a donor responds to one of your requests.',
    defaultOn: true,
  },
  {
    key: 'automaticEscalation',
    label: 'Automatic escalation',
    description: 'Automatically widen the donor search when no eligible donor accepts.',
    defaultOn: true,
  },
  {
    key: 'coordinatorEscalation',
    label: 'Coordinator escalation',
    description: 'Notify the blood-bank coordinator when automated matching reaches the human escalation stage.',
    defaultOn: true,
  },
]
