import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAppState } from '@/hooks/useAppState'
import { formatHourAmPm } from '@/lib/units'

export default function MethodologyCanonicalHourTable() {
  const { tile, bootLoading } = useAppState()

  if (bootLoading) return <Skeleton className="h-40 w-full rounded-lg" />
  if (tile === null || tile.hours_fetched.length === 0) {
    return <p className="text-sm text-ink-muted">Could not load hourly means from data/out/tiles.json.</p>
  }

  const meansByHour = tile.modeled_median_c_by_hour
  const canonicalHour = tile.hours_fetched.reduce((hottest, hour) =>
    (meansByHour[hour] ?? -Infinity) > (meansByHour[hottest] ?? -Infinity) ? hour : hottest,
  )

  return (
    <div className="flex flex-col gap-2">
      <Table>
        <TableHeader>
          <TableRow>
            {tile.hours_fetched.map((hour) => (
              <TableHead key={hour} className="tabular-nums">
                {formatHourAmPm(hour)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            {tile.hours_fetched.map((hour) => (
              <TableCell
                key={hour}
                className={`tabular-nums ${hour === canonicalHour ? 'font-semibold text-ink' : 'text-ink-muted'}`}
              >
                {meansByHour[hour]?.toFixed(1) ?? '—'}°C
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
      <p className="text-xs text-ink-subtle">
        Median AOI air temperature per hour, from data/out/tiles.json. Classification uses the highest of these
        hours — the worst defensible case in a school day, chosen by the data rather than by argument.
      </p>
    </div>
  )
}
