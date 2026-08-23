import type { BadgeTone } from '@/components/ui/Badge'
import type { Component, DonorMapState, EscalationTier, RequestStatus, Urgency } from './types'

/** Central label/tone lookups so every screen renders the same request in the same words and colors. */

export const componentLabel: Record<Component, string> = {
  WHOLE: 'Whole Blood',
  PLATELET: 'Platelet',
  PLASMA: 'Plasma',
}

export const urgencyLabel: Record<Urgency, string> = {
  CRITICAL: 'Critical',
  URGENT: 'Urgent',
  STANDARD: 'Standard',
}

export const urgencyTone: Record<Urgency, BadgeTone> = {
  CRITICAL: 'critical',
  URGENT: 'warning',
  STANDARD: 'neutral',
}

export const escalationTierLabel: Record<EscalationTier, string> = {
  NEARBY: 'Nearby',
  WIDE: 'Wide',
  CITY: 'City',
  HUMAN: 'Human',
  EXPIRED: 'Expired',
}

export const escalationTierTone: Record<EscalationTier, BadgeTone> = {
  NEARBY: 'neutral',
  WIDE: 'info',
  CITY: 'warning',
  HUMAN: 'critical',
  EXPIRED: 'neutral',
}

export const requestStatusLabel: Record<RequestStatus, string> = {
  SEARCHING: 'Searching',
  COVERED: 'Covered',
  CONFIRMED: 'Confirmed',
  FULFILLED: 'Fulfilled',
  EXPIRED: 'Expired',
}

export const requestStatusTone: Record<RequestStatus, BadgeTone> = {
  SEARCHING: 'info',
  COVERED: 'success',
  CONFIRMED: 'success',
  FULFILLED: 'success',
  EXPIRED: 'critical',
}

/** The large headline shown on the live request screen, distinct from the compact table-badge label above. */
export const requestStatusHeadline: Record<RequestStatus, string> = {
  SEARCHING: 'Searching for donors',
  COVERED: 'All units secured',
  CONFIRMED: 'Donor confirmed',
  FULFILLED: 'Donation complete',
  EXPIRED: 'Request expired',
}

/** Search radius, in km, associated with each escalation tier — drives the donor map rings. */
export const escalationTierRadiusKm: Record<EscalationTier, number> = {
  NEARBY: 5,
  WIDE: 15,
  CITY: 40,
  HUMAN: 40,
  EXPIRED: 40,
}

export const donorMapStateLabel: Record<DonorMapState, string> = {
  ALERTED: 'Eligible & alerted',
  ELIGIBLE: 'Eligible, not alerted',
  UNAVAILABLE: 'Unavailable',
  MATCHED: 'Matched',
}

export const donorMapStateDotClass: Record<DonorMapState, string> = {
  ALERTED: 'bg-success',
  ELIGIBLE: 'bg-ink-tertiary',
  UNAVAILABLE: 'bg-critical',
  MATCHED: 'bg-info',
}
