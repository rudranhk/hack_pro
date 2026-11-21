import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export interface BarChartDatum {
  label: string
  value: number
  /** Per-bar override — used for the ordinal escalation-severity ramp; omit for a flat single hue. */
  color?: string
}

export interface BarChartProps {
  data: BarChartDatum[]
  color?: string
  height?: number
  valueFormat?: (value: number) => string
  referenceLine?: { value: number; label: string }
  className?: string
}

const VIEW_W = 600
const PAD_L = 34
const PAD_R = 12
const PAD_T = 20
const PAD_B = 30
const MAX_BAR_W = 24
const RADIUS = 4

function roundedTopBarPath(x: number, top: number, width: number, bottom: number, radius: number): string {
  const r = Math.min(radius, width / 2, Math.max(0, bottom - top))
  return [
    `M ${x} ${bottom}`,
    `L ${x} ${top + r}`,
    `Q ${x} ${top} ${x + r} ${top}`,
    `L ${x + width - r} ${top}`,
    `Q ${x + width} ${top} ${x + width} ${top + r}`,
    `L ${x + width} ${bottom}`,
    'Z',
  ].join(' ')
}

export function BarChart({
  data,
  color = '#2a78d6',
  height = 220,
  valueFormat = (v) => String(v),
  referenceLine,
  className,
}: BarChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const { bars, plotBottom, refY } = useMemo(() => {
    const max = Math.max(...data.map((d) => d.value), referenceLine?.value ?? 0) * 1.15 || 1
    const plotW = VIEW_W - PAD_L - PAD_R
    const plotH = height - PAD_T - PAD_B
    const bottom = PAD_T + plotH
    const band = plotW / data.length
    const barW = Math.min(MAX_BAR_W, band * 0.55)

    const items = data.map((d, i) => {
      const barHeight = (d.value / max) * plotH
      const x = PAD_L + band * i + (band - barW) / 2
      const top = bottom - barHeight
      return { ...d, x, top, width: barW, path: roundedTopBarPath(x, top, barW, bottom, RADIUS) }
    })

    const ref = referenceLine ? bottom - (referenceLine.value / max) * plotH : null

    return { bars: items, plotBottom: bottom, refY: ref }
  }, [data, height, referenceLine])

  const hovered = hoverIndex !== null ? bars[hoverIndex] : null

  return (
    <div className={cn('relative', className)}>
      <svg viewBox={`0 0 ${VIEW_W} ${height}`} className="w-full" style={{ height }} role="img" aria-label={data.map(d=>d.label+' '+d.value).join(', ')}>
        <line x1={PAD_L} x2={VIEW_W - PAD_R} y1={plotBottom} y2={plotBottom} stroke="var(--color-border-strong)" strokeWidth={1} />

        {refY !== null && referenceLine && (
          <>
            <line x1={PAD_L} x2={VIEW_W - PAD_R} y1={refY} y2={refY} stroke="var(--color-ink-tertiary)" strokeWidth={1} strokeDasharray="3 3" />
            {/* Fixed at the top margin, not at refY, so it never collides with a bar's value label */}
            <text x={VIEW_W - PAD_R} y={PAD_T - 8} textAnchor="end" fontSize={9} fill="var(--color-ink-tertiary)">
              {referenceLine.label}
            </text>
          </>
        )}

        {bars.map((bar, i) => (
          <g
            key={bar.label}
            onPointerEnter={() => setHoverIndex(i)}
            onPointerLeave={() => setHoverIndex((cur) => (cur === i ? null : cur))}
            className="cursor-pointer"
          >
            {/* Bigger, invisible hit target than the painted bar */}
            <rect x={bar.x - 6} y={PAD_T} width={bar.width + 12} height={plotBottom - PAD_T} fill="transparent" />
            <path d={bar.path} fill={bar.color ?? color} opacity={hoverIndex === null || hoverIndex === i ? 1 : 0.55} />
            <text
              x={bar.x + bar.width / 2}
              y={bar.top - 6}
              textAnchor="middle"
              fontSize={9.5}
              fontWeight={600}
              fill="var(--color-ink)"
            >
              {valueFormat(bar.value)}
            </text>
            <text
              x={bar.x + bar.width / 2}
              y={height - 10}
              textAnchor="middle"
              fontSize={8.5}
              fill="var(--color-ink-tertiary)"
            >
              {bar.label.length > 10 ? `${bar.label.slice(0, 9)}…` : bar.label}
            </text>
          </g>
        ))}
      </svg>

      {hovered && (
        <div className="pointer-events-none absolute -top-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] shadow-md" style={{ left: `${(hovered.x / VIEW_W) * 100}%` }}>
          <p className="font-semibold tabular text-ink">{valueFormat(hovered.value)}</p>
          <p className="text-ink-tertiary">{hovered.label}</p>
        </div>
      )}
    </div>
  )
}
