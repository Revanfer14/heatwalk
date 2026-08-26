import ClassificationBadge from '@/components/ClassificationBadge'
import HeatValue from '@/components/HeatValue'
import Metric from '@/components/Metric'
import OutcomePanel from '@/components/OutcomePanel'
import SafeUntilLine from '@/components/SafeUntilLine'
import TemperaturePair from '@/components/TemperaturePair'
import { STATUS_NOW_LABEL, STATUS_REC_LABEL } from '@/lib/classificationLabels'
import { deltaDosePercent } from '@/lib/routeStats'
import { deltaVsNearestGreenBlock } from '@/lib/nearestGreenBlock'
import { formatDose, formatSignedPercent, formatSignedTemperature } from '@/lib/units'
import type { BlockFeature, SchoolSummary } from '@/lib/types'

interface BlockDetailPanelProps {
  block: BlockFeature
  allBlocks: BlockFeature[]
  schoolName: string
  schoolSummary: SchoolSummary | null
}

export default function BlockDetailPanel({ block, allBlocks, schoolName, schoolSummary }: BlockDetailPanelProps) {
  const { properties } = block
  const dosePercent = deltaDosePercent(properties.shortest.dose, properties.coolest.dose)
  const deltaVsGreen = deltaVsNearestGreenBlock(block, allBlocks)

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-subtle">Block {properties.block_id}</span>
        <ClassificationBadge blockClass={properties.class} />
      </div>

      <Metric label="Estimated school-age children" value={properties.kids_est} />

      <Metric
        label="Coolest route, mean / peak temperature"
        value={
          <HeatValue>
            <TemperaturePair celsius={properties.coolest.mean_c} /> / <TemperaturePair celsius={properties.coolest.peak_c} />
          </HeatValue>
        }
        size="headline"
      />

      <div className="flex flex-col gap-2">
        <Metric
          label="Heat dose, shortest vs coolest route"
          value={
            <HeatValue>
              {formatDose(properties.shortest.dose)} → {formatDose(properties.coolest.dose)} (
              {formatSignedPercent(dosePercent)})
            </HeatValue>
          }
        />
        {deltaVsGreen !== null && (
          <Metric
            label="Delta vs. nearest green block at equivalent distance"
            value={<HeatValue>{formatSignedTemperature(deltaVsGreen)}</HeatValue>}
          />
        )}
        {schoolSummary !== null && properties.class === 'red' && (
          <Metric
            label="Exceedance days per school year (school average, red blocks)"
            value={<HeatValue>{Math.round(schoolSummary.days_exceedance_per_year)}</HeatValue>}
          />
        )}
      </div>

      <div className="flex flex-col gap-1 border-t border-border pt-4">
        <Metric label="Status today" value={<HeatValue>{STATUS_NOW_LABEL[properties.status_now]}</HeatValue>} />
        <Metric label="Recommendation" value={<HeatValue>{STATUS_REC_LABEL[properties.status_rec]}</HeatValue>} />
        <p className="text-sm text-ink-muted">
          <HeatValue>{properties.reason}</HeatValue>
        </p>
        <HeatValue>
          <SafeUntilLine safeUntilHour={properties.safe_until_hour} />
        </HeatValue>
      </div>

      {properties.class === 'red' && schoolSummary !== null && (
        <OutcomePanel schoolName={schoolName} kidsAffected={properties.kids_est} summary={schoolSummary} />
      )}
    </div>
  )
}
