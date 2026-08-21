import type { BadgeTone } from '@/components/ui/Badge'
import type { Component, EscalationTier, RequestStatus, Urgency } from './types'

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
