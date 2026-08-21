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
