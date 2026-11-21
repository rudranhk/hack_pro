import { Table, TableWrap, Td, Th, Tr } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { stockStatusFor, stockStatusLabel, stockStatusTone } from '@/lib/domainMeta'
import type { StockEntry } from '@/lib/types'

export function StockTable({ entries }: { entries: StockEntry[] }) {
  return (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            <Th>Blood group</Th>
            <Th>Available</Th>
            <Th>Critical threshold</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const status = stockStatusFor(entry.available, entry.criticalThreshold)
            return (
              <Tr key={entry.bloodGroup}>
                <Td className="font-mono font-semibold">{entry.bloodGroup}</Td>
                <Td className="tabular">{entry.available}</Td>
                <Td className="tabular text-ink-tertiary">{entry.criticalThreshold}</Td>
                <Td>
                  <Badge tone={stockStatusTone[status]} dot size="sm">
                    {stockStatusLabel[status]}
                  </Badge>
                </Td>
              </Tr>
            )
          })}
        </tbody>
      </Table>
    </TableWrap>
  )
}
