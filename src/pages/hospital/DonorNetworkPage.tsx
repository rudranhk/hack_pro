import { useMemo, useState } from 'react'
import { Search, Users } from 'lucide-react'
import { MetricCard } from '@/components/hospital/MetricCard'
import { Input, Select } from '@/components/ui'
import { DonorNetworkTable } from '@/components/hospital/network/DonorNetworkTable'
import { DonorDetailDrawer } from '@/components/hospital/network/DonorDetailDrawer'
import { donorNetworkMetrics, mockNetworkDonors } from '@/lib/mockDonorNetwork'
import type { BloodGroup, Component, NetworkAvailability, NetworkDonor } from '@/lib/types'

const BLOOD_GROUPS: BloodGroup[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']

export function DonorNetworkPage() {
  const [search, setSearch] = useState('')
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | 'ALL'>('ALL')
  const [distance, setDistance] = useState<'ANY' | '2' | '5' | '10' | '25'>('ANY')
  const [availability, setAvailability] = useState<NetworkAvailability | 'ALL'>('ALL')
  const [component, setComponent] = useState<Component | 'ALL'>('ALL')
  const [minResponse, setMinResponse] = useState<'ALL' | '80' | '60' | 'BELOW60'>('ALL')
  const [selected, setSelected] = useState<NetworkDonor | null>(null)

  const filtered = useMemo(() => {
    return mockNetworkDonors.filter((d) => {
      if (search && !d.id.toLowerCase().includes(search.toLowerCase().replace('#', ''))) return false
      if (bloodGroup !== 'ALL' && d.bloodGroup !== bloodGroup) return false
      if (distance !== 'ANY' && d.distanceKm > Number(distance)) return false
      if (availability !== 'ALL' && d.availability !== availability) return false
      if (component !== 'ALL' && !d.components.includes(component)) return false
      if (minResponse === '80' && d.responseRate < 0.8) return false
      if (minResponse === '60' && d.responseRate < 0.6) return false
      if (minResponse === 'BELOW60' && d.responseRate >= 0.6) return false
      return true
    })
  }, [search, bloodGroup, distance, availability, component, minResponse])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold text-ink">Donor Network</h1>
          <p className="mt-1 text-[13px] text-ink-secondary">Eligible donors available for emergency requests.</p>
        </div>
        <span className="mt-1 flex items-center gap-1.5 rounded-full border border-success-border bg-success-subtle px-3 py-1 text-[12px] font-medium text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Network healthy
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={Users} label="Available now" value={donorNetworkMetrics.availableNow} tone="success" />
        <MetricCard icon={Users} label="Eligible nearby" value={donorNetworkMetrics.eligibleNearby} tone="info" />
        <MetricCard icon={Users} label="Currently responding" value={donorNetworkMetrics.currentlyResponding} tone="neutral" />
        <MetricCard icon={Users} label="Active commitments" value={donorNetworkMetrics.activeCommitments} tone="critical" />
      </div>

      <div className="flex flex-col gap-3">
        <Input
          placeholder="Search donors..."
          leadingIcon={<Search size={15} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-2.5">
          <div className="w-[150px]">
            <Select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value as BloodGroup | 'ALL')}>
              <option value="ALL">All blood groups</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-[150px]">
            <Select value={distance} onChange={(e) => setDistance(e.target.value as typeof distance)}>
              <option value="ANY">Any distance</option>
              <option value="2">Within 2 km</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
            </Select>
          </div>
          <div className="w-[150px]">
            <Select value={availability} onChange={(e) => setAvailability(e.target.value as NetworkAvailability | 'ALL')}>
              <option value="ALL">All availability</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESPONDING">Responding</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </Select>
          </div>
          <div className="w-[150px]">
            <Select value={component} onChange={(e) => setComponent(e.target.value as Component | 'ALL')}>
              <option value="ALL">All components</option>
              <option value="WHOLE">Whole Blood</option>
              <option value="PLATELET">Platelet</option>
              <option value="PLASMA">Plasma</option>
            </Select>
          </div>
          <div className="w-[150px]">
            <Select value={minResponse} onChange={(e) => setMinResponse(e.target.value as typeof minResponse)}>
              <option value="ALL">Any response score</option>
              <option value="80">80%+</option>
              <option value="60">60%+</option>
              <option value="BELOW60">Below 60%</option>
            </Select>
          </div>
        </div>
      </div>

      <DonorNetworkTable donors={filtered} onSelect={setSelected} />

      <DonorDetailDrawer donor={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
