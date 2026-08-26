import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Metric from '@/components/Metric'
import TemperaturePair from '@/components/TemperaturePair'
import {
  formatDose,
  formatKilometers,
  formatMinutes,
  formatSignedMeters,
  formatSignedMinutes,
  formatSignedPercent,
  formatSignedTemperature,
  metersToKilometers,
} from '@/lib/units'
import { deltaDosePercent } from '@/lib/routeStats'
import type { SolvedRoutes } from '@/lib/types'

interface RouteComparisonPanelProps {
  routes: SolvedRoutes
  hour: string
}

export default function RouteComparisonPanel({ routes, hour }: RouteComparisonPanelProps) {
  const { shortest, coolest } = routes
  const dosePercent = deltaDosePercent(shortest.dose, coolest.dose)

  return (
    <section className="flex flex-col gap-4">
      <Metric
        label={`Coolest route, mean temperature at ${hour}`}
        value={<TemperaturePair celsius={coolest.mean_c} />}
        size="headline"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>Shortest</TableHead>
            <TableHead>Coolest</TableHead>
            <TableHead>Difference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="text-ink-muted">Distance</TableCell>
            <TableCell className="tabular-nums">{formatKilometers(metersToKilometers(shortest.len_m))}</TableCell>
            <TableCell className="tabular-nums">{formatKilometers(metersToKilometers(coolest.len_m))}</TableCell>
            <TableCell className="tabular-nums">{formatSignedMeters(coolest.len_m - shortest.len_m)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-ink-muted">Time</TableCell>
            <TableCell className="tabular-nums">{formatMinutes(shortest.minutes)}</TableCell>
            <TableCell className="tabular-nums">{formatMinutes(coolest.minutes)}</TableCell>
            <TableCell className="tabular-nums">{formatSignedMinutes(coolest.minutes - shortest.minutes)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-ink-muted">Mean temp</TableCell>
            <TableCell>
              <TemperaturePair celsius={shortest.mean_c} />
            </TableCell>
            <TableCell>
              <TemperaturePair celsius={coolest.mean_c} />
            </TableCell>
            <TableCell className="tabular-nums">
              {formatSignedTemperature(coolest.mean_c - shortest.mean_c)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-ink-muted">Peak temp</TableCell>
            <TableCell>
              <TemperaturePair celsius={shortest.peak_c} />
            </TableCell>
            <TableCell>
              <TemperaturePair celsius={coolest.peak_c} />
            </TableCell>
            <TableCell className="tabular-nums">
              {formatSignedTemperature(coolest.peak_c - shortest.peak_c)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-ink-muted">Heat dose</TableCell>
            <TableCell className="tabular-nums">{formatDose(shortest.dose)}</TableCell>
            <TableCell className="tabular-nums">{formatDose(coolest.dose)}</TableCell>
            <TableCell className="tabular-nums">{formatSignedPercent(dosePercent)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </section>
  )
}
