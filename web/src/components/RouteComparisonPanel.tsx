import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import HeatValue from '@/components/HeatValue'
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
        value={
          <HeatValue>
            <TemperaturePair celsius={coolest.mean_c} />
          </HeatValue>
        }
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
            <TableCell className="tabular-nums">
              <HeatValue>{formatKilometers(metersToKilometers(coolest.len_m))}</HeatValue>
            </TableCell>
            <TableCell className="tabular-nums">
              <HeatValue>{formatSignedMeters(coolest.len_m - shortest.len_m)}</HeatValue>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-ink-muted">Time</TableCell>
            <TableCell className="tabular-nums">{formatMinutes(shortest.minutes)}</TableCell>
            <TableCell className="tabular-nums">
              <HeatValue>{formatMinutes(coolest.minutes)}</HeatValue>
            </TableCell>
            <TableCell className="tabular-nums">
              <HeatValue>{formatSignedMinutes(coolest.minutes - shortest.minutes)}</HeatValue>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-ink-muted">Mean temp</TableCell>
            <TableCell>
              <HeatValue>
                <TemperaturePair celsius={shortest.mean_c} />
              </HeatValue>
            </TableCell>
            <TableCell>
              <HeatValue>
                <TemperaturePair celsius={coolest.mean_c} />
              </HeatValue>
            </TableCell>
            <TableCell className="tabular-nums">
              <HeatValue>{formatSignedTemperature(coolest.mean_c - shortest.mean_c)}</HeatValue>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-ink-muted">Peak temp</TableCell>
            <TableCell>
              <HeatValue>
                <TemperaturePair celsius={shortest.peak_c} />
              </HeatValue>
            </TableCell>
            <TableCell>
              <HeatValue>
                <TemperaturePair celsius={coolest.peak_c} />
              </HeatValue>
            </TableCell>
            <TableCell className="tabular-nums">
              <HeatValue>{formatSignedTemperature(coolest.peak_c - shortest.peak_c)}</HeatValue>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-ink-muted">Heat dose</TableCell>
            <TableCell className="tabular-nums">
              <HeatValue>{formatDose(shortest.dose)}</HeatValue>
            </TableCell>
            <TableCell className="tabular-nums">
              <HeatValue>{formatDose(coolest.dose)}</HeatValue>
            </TableCell>
            <TableCell className="tabular-nums">
              <HeatValue>{formatSignedPercent(dosePercent)}</HeatValue>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </section>
  )
}
