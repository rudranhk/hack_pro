import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { mockRequests } from '@/lib/mockData'
import type { BloodGroup, Component, EmergencyRequest, Urgency } from '@/lib/types'

export interface CreateRequestInput {
  bloodGroup: BloodGroup
  component: Component
  unitsNeeded: number
  urgency: Urgency
}

interface RequestsContextValue {
  requests: EmergencyRequest[]
  /** Non-terminal requests (SEARCHING / COVERED / CONFIRMED) — what "active" means across the dashboard. */
  activeRequests: EmergencyRequest[]
  createRequest: (input: CreateRequestInput) => EmergencyRequest
  /** Generic patch — used by Demo Mode to fast-forward a request's escalation without waiting in real time. */
  updateRequest: (id: string, patch: Partial<EmergencyRequest>) => void
}

const RequestsContext = createContext<RequestsContextValue | null>(null)

function nextRequestId(existing: EmergencyRequest[]): string {
  const highest = existing.reduce((max, req) => {
    const num = Number(req.id.replace('REQ-', ''))
    return Number.isFinite(num) ? Math.max(max, num) : max
  }, 2000)
  return `REQ-${highest + 1}`
}

function formatCreatedAt(date: Date): string {
  return `Today, ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
}

export function RequestsProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<EmergencyRequest[]>(mockRequests)

  const createRequest = useCallback(
    (input: CreateRequestInput): EmergencyRequest => {
      const created: EmergencyRequest = {
        id: nextRequestId(requests),
        hospitalName: 'City Hospital',
        bloodGroup: input.bloodGroup,
        component: input.component,
        unitsNeeded: input.unitsNeeded,
        unitsSecured: 0,
        urgency: input.urgency,
        status: 'SEARCHING',
        escalationTier: 'NEARBY',
        timeElapsedLabel: '00:00',
        createdAtLabel: formatCreatedAt(new Date()),
      }
      setRequests((prev) => [created, ...prev])
      return created
    },
    [requests]
  )

  const updateRequest = useCallback((id: string, patch: Partial<EmergencyRequest>) => {
    setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, ...patch } : req)))
  }, [])

  const activeRequests = useMemo(
    () => requests.filter((r) => r.status !== 'FULFILLED' && r.status !== 'EXPIRED'),
    [requests]
  )

  const value = useMemo(
    () => ({ requests, activeRequests, createRequest, updateRequest }),
    [requests, activeRequests, createRequest, updateRequest]
  )

  return <RequestsContext.Provider value={value}>{children}</RequestsContext.Provider>
}

export function useRequests(): RequestsContextValue {
  const ctx = useContext(RequestsContext)
  if (!ctx) throw new Error('useRequests must be used within a RequestsProvider')
  return ctx
}
