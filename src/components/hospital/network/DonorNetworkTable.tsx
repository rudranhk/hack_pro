import { Table, TableWrap, Td, Th, Tr } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchX } from 'lucide-react'
import { matchReadinessFromScore, matchReadinessLabel, matchReadinessTone, networkAvailabilityLabel, networkAvailabilityTone } from '@/lib/domainMeta'
import type { NetworkDonor } from '@/lib/types'

export function DonorNetworkTable({ donors, onSelect }: { donors: NetworkDonor[]; onSelect: (d: NetworkDonor) => void }) {
  if (donors.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No donors match these filters."
        description="Try widening the distance or clearing a filter."
      />
    )
  }

  return (
    <>
      <TableWrap className="hidden lg:block">
        <Table>
          <thead>
            <tr>
              <Th>Donor</Th>
              <Th>Blood group</Th>
              <Th>Distance</Th>
              <Th>Availability</Th>
              <Th>Response rate</Th>
              <Th>Match readiness</Th>
              <Th>Last active</Th>
            </tr>
          </thead>
          <tbody>
            {donors.map((donor) => {
              const readiness = matchReadinessFromScore(donor.score)
              return (
                <Tr key={donor.id} onClick={() => onSelect(donor)} className="cursor-pointer hover:bg-surface-sunken">
                  <Td className="font-mono font-medium">#{donor.id}</Td>
                  <Td>
                    <Badge tone="primary" size="sm">
                      {donor.bloodGroup}
                    </Badge>
                  </Td>
                  <Td className="tabular">{donor.distanceKm} km</Td>
                  <Td>
                    <Badge tone={networkAvailabilityTone[donor.availability]} dot size="sm">
                      {networkAvailabilityLabel[donor.availability]}
                    </Badge>
                  </Td>
                  <Td className="tabular">{Math.round(donor.responseRate * 100)}%</Td>
                  <Td>
                    <Badge tone={matchReadinessTone[readiness]} size="sm">
                      {matchReadinessLabel[readiness]}
                    </Badge>
                  </Td>
                  <Td className="text-ink-tertiary">{donor.lastActiveLabel}</Td>
                </Tr>
              )
            })}
          </tbody>
        </Table>
      </TableWrap>

      <div className="flex flex-col gap-2 lg:hidden">
        {donors.map((donor) => {
          const readiness = matchReadinessFromScore(donor.score)
          return (
            <button
              key={donor.id}
              onClick={() => onSelect(donor)}
              className="rounded-lg border border-border bg-surface p-3.5 text-left transition-colors hover:border-border-strong"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] font-semibold text-ink">#{donor.id}</span>
                <Badge tone="primary" size="sm">
                  {donor.bloodGroup}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-ink-secondary">
                <span>{donor.distanceKm} km</span>
                <span>Response {Math.round(donor.responseRate * 100)}%</span>
                <span>{donor.lastActiveLabel}</span>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <Badge tone={networkAvailabilityTone[donor.availability]} dot size="sm">
                  {networkAvailabilityLabel[donor.availability]}
                </Badge>
                <Badge tone={matchReadinessTone[readiness]} size="sm">
                  {matchReadinessLabel[readiness]}
                </Badge>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}
