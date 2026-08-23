import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { cn } from '@/lib/utils'

export interface LineChartPoint {
  label: string
  value: number
}

export interface LineChartProps {
  data: LineChartPoint[]
  color?: string
  height?: number
  valueFormat?: (value: number) => string
  className?: string
}

const VIEW_W = 600
const PAD_L = 36
const PAD_R = 12
const PAD_T = 14
const PAD_B = 26

/** A single-series line chart: crosshair + tooltip on hover, sparse ticks, recessive gridlines. */
export function LineChart({
  data,
  color = '#2a78d6',
  height = 200,
  valueFormat = (v) => String(v),
  className,
}: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const { linePath, areaPath, points, yTicks, plotBottom } = useMemo(() => {
    const values = data.map((d) => d.value)
    const rawMin = Math.min(...values)
    const rawMax = Math.max(...values)
    const span = rawMax - rawMin || 1
    const min = Math.max(0, rawMin - span * 0.15)
    const max = rawMax + span * 0.15

    const plotW = VIEW_W - PAD_L - PAD_R
    const plotH = height - PAD_T - PAD_B
    const bottom = PAD_T + plotH

    const stepX = data.length > 1 ? plotW / (data.length - 1) : 0
    const yFor = (v: number) => PAD_T + plotH - ((v - min) / (max - min)) * plotH
    const pts = data.map((d, i) => ({ x: PAD_L + stepX * i, y: yFor(d.value), ...d }))

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${bottom} L ${pts[0].x.toFixed(1)} ${bottom} Z`

    const ticks = [min + (max - min) * 0.05, min + (max - min) * 0.5, max - (max - min) * 0.05].map((v) => ({
      value: v,
      y: yFor(v),
    }))

    return { linePath: line, areaPath: area, points: pts, yTicks: ticks, plotBottom: bottom }
  }, [data, height])

  const handleMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg || points.length === 0) return
    const rect = svg.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * VIEW_W
    let nearest = 0
    let best = Infinity
    points.forEach((p, i) => {
      const d = Math.abs(p.x - relX)
      if (d < best) {
        best = d
        nearest = i
      }
    })
    setHoverIndex(nearest)
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null
  const tickEvery = Math.ceil(data.length / 6)

  return (
    <div className={cn('relative', className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${height}`}
        className="w-full touch-none"
        style={{ height }}
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
        role="img"
        aria-label="Line chart"
      >
        {yTicks.map((t) => (
          <g key={t.value}>
            <line
              x1={PAD_L}
              x2={VIEW_W - PAD_R}
              y1={t.y}
              y2={t.y}
              stroke="var(--color-border)"
              strokeWidth={1}
            />
            <text x={PAD_L - 8} y={t.y + 3} textAnchor="end" fontSize={9} fill="var(--color-ink-tertiary)">
              {valueFormat(Math.round(t.value))}
            </text>
          </g>
        ))}

        {points.map((p, i) =>
          i % tickEvery === 0 || i === points.length - 1 ? (
            <text
              key={p.label}
              x={p.x}
              y={height - 8}
              textAnchor="middle"
              fontSize={9}
              fill="var(--color-ink-tertiary)"
            >
              {p.label}
            </text>
          ) : null
        )}

        <path d={areaPath} fill={color} opacity={0.1} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {hovered && (
          <>
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={PAD_T}
              y2={plotBottom}
              stroke="var(--color-ink-tertiary)"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            <circle cx={hovered.x} cy={hovered.y} r={4} fill={color} stroke="var(--color-surface)" strokeWidth={2} />
          </>
        )}

        {/* Endpoint marker + value, always visible (selective direct label) */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={4}
          fill={color}
          stroke="var(--color-surface)"
          strokeWidth={2}
        />
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] shadow-md"
          style={{
            left: `${(hovered.x / VIEW_W) * 100}%`,
            transform: hovered.x > VIEW_W * 0.7 ? 'translateX(-105%)' : 'translateX(8px)',
          }}
        >
          <p className="font-semibold tabular text-ink">{valueFormat(hovered.value)}</p>
          <p className="text-ink-tertiary">{hovered.label}</p>
        </div>
      )}
    </div>
  )
}
