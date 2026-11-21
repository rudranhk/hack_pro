import type { BloodGroup, Component, EmergencyRequest, ScoreBreakdown, Urgency } from '../types'

export interface Donor {
  id: number
  bloodGroup: BloodGroup
  distanceKm: number
  available: boolean
  eligible: boolean
  travelLimit: number|null
  nextEligible: string | null
  components: Component[]
  notifications: {hold:string|null; sent:number; accepted:number; declined:number; unanswered:number; lastSent:number|null; cooldownUntil:number|null}
  responseRate: number
  lastActiveLabel: string
}
export type OfferStatus = 'CANDIDATE' | 'INVITED' | 'ACCEPTED' | 'DECLINED' | 'EN_ROUTE' | 'ARRIVED' | 'DONATED' | 'WITHDRAWN' | 'RETRACTED' | 'EXPIRED'
export interface Offer {
  requestId: string
  donorId: number
  status: OfferStatus
  score: number
  breakdown: ScoreBreakdown
  similarity: number | null
  invited: number | null
  responded: number | null
  etaMinutes: number | null
}
export interface RequestRecord extends EmergencyRequest {
  review: {duplicateId:string|null; reviewedAt:number|null; logistics:string|null}
  dispatch: {wave:number; due:number|null; escalated:number}
  created: number
  radius: number
  source: string
  reason: string
  closed: string | null
}
export interface StockBalance {
  bloodGroup: BloodGroup
  component: Component
  available: number
  adjustments: {operation:string; beforeCount:number; afterCount:number; at:number}[]
  issuedToday: number
  history: {day:string; units:number|null; logged:number}[]
  forecastUnits: number|null
  projectedShortfall: number|null
}
export interface Workspace {
  hospital: {id: number; name: string; autoInvite: boolean; collectionKeyRequired:boolean}
  requests: RequestRecord[]
  offers: Offer[]
  donors: Donor[]
  stock: StockBalance[]
  events: {id: number; requestId: string | null; donorId: number | null; event: string; at: number}[]
}
export type Requirement = {radius?:number; logistics?:string|null; bloodGroup: BloodGroup; component: Component; unitsNeeded: number; urgency: Urgency}
const apiBase = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')
const base = new URL(apiBase || window.location.origin, window.location.origin)
const roomKey = 'blood-buddy-room'
const requestedRoom = new URLSearchParams(window.location.search).get('room')
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
export const room = requestedRoom && uuid.test(requestedRoom) ? requestedRoom :
  sessionStorage.getItem(roomKey) || localStorage.getItem(roomKey) || crypto.randomUUID()
sessionStorage.setItem(roomKey, room)
localStorage.setItem(roomKey, room)

export function donorUrl(donorId: number, requestId?: string) {
  const params = new URLSearchParams({room, donor: String(donorId)})
  if (requestId) params.set('request', requestId)
  return '/donor?' + params.toString()
}

export function endpoint(path: string) {
  const url = new URL(path, base)
  url.searchParams.set('room', room)
  return url
}

export async function api<T>(path: string, body?: unknown): Promise<T> {
  if (!apiBase) {
    throw new Error('The hosted matching service is not configured. Set VITE_API_BASE_URL when building the application.')
  }
  let response: Response
  try {
    response = await fetch(endpoint('/api' + path), body === undefined ? {} : {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Matching service is unreachable. Start FastAPI on port 8000 and retry.')
  }
  if (!response.ok) {
    const reason = await response.json().catch(() => ({}))
    const fields = Array.isArray(reason.detail) ? reason.detail.map((e:{loc?:string[]; msg?:string}) =>
      [e.loc?.slice(1).join(' '),e.msg].filter(Boolean).join(' – ')).join('. ') : ''
    throw new Error(typeof reason.detail === 'string' ? reason.detail : fields || 'Request failed (HTTP '+response.status+'). Please retry.')
  }
  return response.json()
}

export const committed: OfferStatus[] = ['ACCEPTED','EN_ROUTE','ARRIVED','DONATED']
export const statusText = (value: string) => value.toLowerCase().replaceAll('_', ' ')
export const localTime = (seconds: number) => new Date(seconds * 1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})
