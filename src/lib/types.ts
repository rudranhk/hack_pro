/**
 * Domain types, shaped to resemble the eventual Firestore collections
 * (requests, donors, hospitals, matches, donations) so mock data here
 * can be swapped for real reads later without reshaping components.
 */

export type BloodGroup = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+'

export type Component = 'WHOLE' | 'PLATELET' | 'PLASMA'

export type Urgency = 'CRITICAL' | 'URGENT' | 'STANDARD'

/** Automated escalation ladder. EXPIRED is terminal — the request timed out unfulfilled. */
export type EscalationTier = 'NEARBY' | 'WIDE' | 'CITY' | 'HUMAN' | 'EXPIRED'

/** Hospital-facing lifecycle of a request, independent of any single donor's own status. */
export type RequestStatus = 'SEARCHING' | 'COVERED' | 'CONFIRMED' | 'FULFILLED' | 'EXPIRED'

/** How a donor renders on the stylized map for a given request. */
export type DonorMapState = 'ALERTED' | 'ELIGIBLE' | 'UNAVAILABLE' | 'MATCHED'

export interface ScoreBreakdown {
  compatibility: number
  proximity: number
  eligibilityMargin: number
  responseHistory: number
  recentActivity: number
}

export interface RankedDonor {
  /** Anonymous identifier only — no name, surfaced until a confirmed acceptance. */
  id: string
  bloodGroup: BloodGroup
  distanceKm: number
  available: boolean
  responseRate: number
  lastActiveLabel: string
  score: number
  mapState: DonorMapState
  /** Map position as percentages, purely for the stylized (non-real) map layout. */
  mapPosition: { x: number; y: number }
  scoreBreakdown: ScoreBreakdown
}

export type DonorEligibilityStatus = 'ELIGIBLE' | 'TEMPORARILY_INELIGIBLE'

export interface DonorProfile {
  bloodGroup: BloodGroup
  eligibility: DonorEligibilityStatus
  lastDonationLabel: string
  nextEligibleLabel: string
  defaultAvailable: boolean
}

/** What a donor sees on an emergency alert — logistics only, no patient/medical detail. */
export interface DonorAlert {
  requestId: string
  bloodGroup: BloodGroup
  component: Component
  unitsNeeded: number
  hospitalName: string
  distanceKm: number
  urgency: Urgency
}

export interface EmergencyRequest {
  id: string
  hospitalName: string
  bloodGroup: BloodGroup
  component: Component
  unitsNeeded: number
  unitsSecured: number
  urgency: Urgency
  status: RequestStatus
  escalationTier: EscalationTier
  /** Pre-formatted for the prototype (e.g. "04:18") — real timing lands with the live tracking phase. */
  timeElapsedLabel: string
  createdAtLabel: string
}
