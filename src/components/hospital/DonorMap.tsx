import { Hospital } from 'lucide-react'
import { cn } from '@/lib/utils'
import { donorMapStateDotClass, donorMapStateLabel, escalationTierRadiusKm } from '@/lib/domainMeta'
import type { EscalationTier, RankedDonor } from '@/lib/types'

const RING_RADII_KM = [5, 15, 40]
/** Scales a km radius to a percentage of the map's half-width, so 40km reaches near the edge. */
const toPercent = (km: number) => (km / 40) * 46

const LEGEND_ORDER: RankedDonor['mapState'][] = ['ALERTED', 'ELIGIBLE', 'UNAVAILABLE', 'MATCHED']

export function DonorMap({ currentTier, donors }: { currentTier: EscalationTier; donors: RankedDonor[] }) {
  const currentRadiusKm = escalationTierRadiusKm[currentTier]

  return (
    <div>
      <div className="relative aspect-[16/11] w-full overflow-hidden rounded-md border border-border-strong bg-surface-sunken">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {RING_RADII_KM.filter((km) => km <= currentRadiusKm).map((km) => {
            const isCurrentRing = km === currentRadiusKm
            return (
              <ellipse
                key={km}
                cx="50"
                cy="50"
                rx={toPercent(km)}
                ry={toPercent(km) * 0.68}
                fill="none"
                stroke={isCurrentRing ? 'var(--color-primary)' : 'var(--color-border-strong)'}
                strokeWidth={isCurrentRing ? 0.5 : 0.3}
                strokeDasharray={isCurrentRing ? undefined : '1.5 1.5'}
                opacity={isCurrentRing ? 0.7 : 0.5}
              />
            )
          })}
        </svg>

        <div
          className="absolute rounded-md bg-surface/90 px-1.5 py-0.5 text-[10px] font-semibold tabular text-ink-secondary shadow-xs"
          style={{ left: `${50 + toPercent(currentRadiusKm)}%`, top: '50%' }}
        >
          {currentRadiusKm} km
        </div>

        {/* Hospital marker */}
        <div
          className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-secondary text-white shadow-md"
          style={{ left: '50%', top: '50%' }}
        >
          <Hospital size={15} strokeWidth={1.75} />
        </div>

        {donors.map((donor) => {
          const reached = donor.distanceKm <= currentRadiusKm
          return (
            <div
              key={donor.id}
              title={`Donor #${donor.id} — ${donor.distanceKm} km — ${donorMapStateLabel[donor.mapState]}`}
              className={cn(
                'absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-opacity',
                !reached && donor.mapState !== 'MATCHED' && 'opacity-35'
              )}
              style={{ left: `${donor.mapPosition.x}%`, top: `${donor.mapPosition.y}%` }}
            >
              <span
                className={cn(
                  'h-3 w-3 rounded-full ring-2 ring-surface',
                  donorMapStateDotClass[donor.mapState]
                )}
              />
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {LEGEND_ORDER.map((state) => (
          <span key={state} className="flex items-center gap-1.5 text-[11.5px] text-ink-secondary">
            <span className={cn('h-2 w-2 rounded-full', donorMapStateDotClass[state])} />
            {donorMapStateLabel[state]}
          </span>
        ))}
      </div>
    </div>
  )
}
