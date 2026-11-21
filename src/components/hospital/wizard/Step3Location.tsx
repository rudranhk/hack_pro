import { MapPin, ShieldCheck } from 'lucide-react'

import type { StepProps } from "./types"

export function Step3Location({draft,onChange}: StepProps) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold text-ink">Location</h3>
      <p className="mt-0.5 text-[12.5px] text-ink-secondary">
        Requests are centered on City Hospital’s synthetic site. Donor distances in this workspace are measured relative to this site.
      </p>

      <label className="mt-3 block text-sm">Initial search radius
        <select className="ml-2 rounded border border-border p-2" value={draft.radius} onChange={e=>onChange({radius:Number(e.target.value)})}>
          {[5,15,40].map(km=><option value={km} key={km}>{km} km</option>)}</select></label>
      <div className="mt-3 overflow-hidden rounded-md border border-border-strong">
        <div className="relative flex h-32 items-center justify-center bg-surface-sunken">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md">
            <MapPin size={18} fill="currentColor" strokeWidth={0} />
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 bg-surface p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-white">
              CH
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
                City Hospital
                <ShieldCheck size={14} className="text-success" aria-label="Synthetic hospital" />
              </p>
              <p className="text-[12px] text-ink-secondary">42 Marina Road, Sector 9 — synthetic address</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
