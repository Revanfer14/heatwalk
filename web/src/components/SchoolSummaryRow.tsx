import HeatValue from '@/components/HeatValue'
import Metric from '@/components/Metric'
import { Separator } from '@/components/ui/separator'
import { formatMiles, formatPercent, formatSignedPercent, percentChange, percentOf } from '@/lib/units'
import type { SchoolSummary } from '@/lib/types'

interface SchoolSummaryRowProps {
  summary: SchoolSummary
}

export default function SchoolSummaryRow({ summary }: SchoolSummaryRowProps) {
  const rerouteEnoughPct = percentOf(summary.reroute_enough, summary.in_walk_zone)
  const noSafeRoutePct = percentOf(summary.no_safe_route, summary.in_walk_zone)
  const lowestIncomePct = percentOf(summary.lowest_income_quartile, summary.no_safe_route)
  const doseRadiusChangePct = percentChange(summary.radius_setara_dosis_mi, summary.radius_kebijakan_mi)

  return (
    <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <Metric label="Students in walk zone" value={summary.in_walk_zone} />
        <Metric
          label="Route change is enough"
          value={<HeatValue>{`${summary.reroute_enough} (${formatPercent(rerouteEnoughPct)})`}</HeatValue>}
        />
        <Metric
          label="No safe route"
          value={<HeatValue>{`${summary.no_safe_route} (${formatPercent(noSafeRoutePct)})`}</HeatValue>}
        />
        <Metric
          label="Bottom income quartile"
          value={
            <HeatValue>{`${summary.lowest_income_quartile} (${formatPercent(lowestIncomePct)} of those at risk)`}</HeatValue>
          }
        />
      </div>
      <Separator orientation="vertical" className="h-10" />
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <Metric label="Policy radius" value={formatMiles(summary.radius_kebijakan_mi)} />
        <Metric
          label="Dose-equivalent radius"
          value={
            <HeatValue>{`${formatMiles(summary.radius_setara_dosis_mi)} (${formatSignedPercent(doseRadiusChangePct)})`}</HeatValue>
          }
        />
      </div>
      <Separator orientation="vertical" className="h-10" />
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <Metric label="Gets bus, doesn't need it" value={<HeatValue>{summary.misclassified.bus_not_needed}</HeatValue>} />
        <Metric label="Walks, should get bus" value={<HeatValue>{summary.misclassified.walk_should_bus}</HeatValue>} />
      </div>
    </div>
  )
}
