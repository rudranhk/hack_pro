import type { EmergencyRequest } from './types'

/**
 * Models the "atomic slot claim" step of the documented flow: ACCEPT claims a unit
 * immediately (before screening even runs); a failed screening releases it again.
 * Single-donor-session simplification — no server-side concurrency to reconcile here.
 */

type ClaimPatch = Pick<EmergencyRequest, 'unitsSecured' | 'status'>

export function claimUnit(request: EmergencyRequest): ClaimPatch {
  const unitsSecured = Math.min(request.unitsNeeded, request.unitsSecured + 1)
  return { unitsSecured, status: unitsSecured >= request.unitsNeeded ? 'COVERED' : request.status }
}

export function releaseUnit(request: EmergencyRequest): ClaimPatch {
  const unitsSecured = Math.max(0, request.unitsSecured - 1)
  const stillCovered = unitsSecured >= request.unitsNeeded
  return { unitsSecured, status: !stillCovered && request.status === 'COVERED' ? 'SEARCHING' : request.status }
}
