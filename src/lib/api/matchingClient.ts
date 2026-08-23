import type { BloodGroup, Component, RankedDonor, ScoreBreakdown, Urgency } from '@/lib/types'

/**
 * Talks to the real FastAPI + Gemini + Qdrant backend in server/. Entirely optional —
 * every screen that uses this must keep working on mock data if the backend is
 * offline or unconfigured. See server/README.md for what "configured" means.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000'

export interface LiveMatchInput {
  bloodGroup: BloodGroup
  component: Component
  unitsNeeded: number
  urgency: Urgency
  topK?: number
}

interface ApiDonorMatch {
  id: string
  bloodGroup: BloodGroup
  distanceKm: number
  available: boolean
  responseRate: number
  lastActiveLabel: string
  score: number
  vectorSimilarity: number
  scoreBreakdown: ScoreBreakdown
}

interface ApiMatchResponse {
  query: string
  candidateCount: number
  candidates: ApiDonorMatch[]
}

export class MatchingApiError extends Error {}

function toRankedDonor(match: ApiDonorMatch): RankedDonor {
  return {
    id: match.id,
    bloodGroup: match.bloodGroup,
    distanceKm: match.distanceKm,
    available: match.available,
    responseRate: match.responseRate,
    lastActiveLabel: match.lastActiveLabel,
    score: match.score,
    mapState: 'ALERTED',
    mapPosition: { x: 50, y: 50 }, // live results aren't plotted on the stylized demo map
    scoreBreakdown: match.scoreBreakdown,
  }
}

/** Throws MatchingApiError with a human-readable reason on any failure — callers should fall back to demo data. */
export async function fetchLiveMatches(input: LiveMatchInput): Promise<{ donors: RankedDonor[]; query: string }> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/requests/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topK: 5, ...input }),
    })
  } catch {
    throw new MatchingApiError(
      `Can't reach the matching backend at ${API_BASE}. Is \`uvicorn main:app\` running in server/?`
    )
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new MatchingApiError(body?.detail ?? `Backend returned ${res.status}`)
  }

  const data = (await res.json()) as ApiMatchResponse
  return { donors: data.candidates.map(toRankedDonor), query: data.query }
}
