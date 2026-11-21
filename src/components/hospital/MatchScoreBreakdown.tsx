import { ProgressBar } from '@/components/ui/ProgressBar'
import type { ScoreBreakdown } from '@/lib/types'

const FACTORS: { key: keyof ScoreBreakdown; label: string; max: number }[] = [
  { key: 'compatibility', label: 'Compatibility', max: 40 },
  { key: 'proximity', label: 'Proximity', max: 25 },
  { key: 'eligibilityMargin', label: 'Review on file', max: 15 },
  { key: 'responseHistory', label: 'Response history', max: 12 },
  { key: 'recentActivity', label: 'Recent activity', max: 8 },
]

/** The explainable breakdown behind a donor's match score — never "AI selected this donor." */
export function MatchScoreBreakdown({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <div>
      <p className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-tertiary">
        Why this donor?
      </p>
      <div className="flex flex-col gap-2.5">
        {FACTORS.map((factor) => (
          <div key={factor.key} className="flex items-center gap-3">
            <span className="w-[120px] shrink-0 text-[12px] text-ink-secondary">{factor.label}</span>
            <ProgressBar value={breakdown[factor.key]} max={factor.max} size="sm" tone="primary" className="flex-1" />
            <span className="w-10 shrink-0 text-right tabular text-[11.5px] text-ink-tertiary">
              {breakdown[factor.key]}/{factor.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
