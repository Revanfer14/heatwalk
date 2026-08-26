import HeatValue from '@/components/HeatValue'
import Metric from '@/components/Metric'
import { formatDose } from '@/lib/units'
import type { SchoolSummary } from '@/lib/types'

interface OutcomePanelProps {
  schoolName: string
  kidsAffected: number
  summary: SchoolSummary
}

export default function OutcomePanel({ schoolName, kidsAffected, summary }: OutcomePanelProps) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4">
      <h2 className="text-[1.125rem] font-semibold tracking-tight text-ink">
        Moving {kidsAffected} children at {schoolName} to buses eliminates
      </h2>
      <div className="flex flex-col gap-2">
        <Metric
          label="Per child per day"
          value={<HeatValue>{formatDose(summary.dose_eliminated_per_child_per_day)}</HeatValue>}
        />
        <Metric
          label="Per child per school year (180 days)"
          value={<HeatValue>{`±${formatDose(summary.dose_eliminated_per_child_per_year)}`}</HeatValue>}
        />
        <Metric
          label="Equivalent to removing walking time at 42°C"
          value={<HeatValue>{`${Math.round(summary.equivalent_minutes_at_42c)} min every day`}</HeatValue>}
        />
      </div>
    </section>
  )
}
