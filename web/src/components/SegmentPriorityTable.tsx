import HeatValue from '@/components/HeatValue'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatPercent, formatSignedTemperature } from '@/lib/units'
import type { SegmentPriorityRow } from '@/lib/districtTypes'

interface SegmentPriorityTableProps {
  segments: SegmentPriorityRow[]
}

export default function SegmentPriorityTable({ segments }: SegmentPriorityTableProps) {
  if (segments.length === 0) return null

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[1.125rem] font-semibold tracking-tight text-ink">Segment priority</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Street</TableHead>
            <TableHead>Kids affected</TableHead>
            <TableHead>Peak temp reduction</TableHead>
            <TableHead>Dose reduction</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {segments.map((segment) => (
            <TableRow key={segment.edge_id}>
              <TableCell className="text-ink-muted">{segment.street_name}</TableCell>
              <TableCell className="tabular-nums">{segment.kids_affected}</TableCell>
              <TableCell className="tabular-nums">
                <HeatValue>{formatSignedTemperature(segment.peak_shaded_c - segment.peak_c)}</HeatValue>
              </TableCell>
              <TableCell className="tabular-nums">
                <HeatValue>{formatPercent(segment.dose_reduction_pct)}</HeatValue>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-ink-subtle">
        Assumes a uniform cooling effect under full canopy shade — an estimate, not a local measurement. See
        Methodology.
      </p>
    </section>
  )
}
