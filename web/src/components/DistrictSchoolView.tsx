import CsvExportButton from '@/components/CsvExportButton'
import HourSlider from '@/components/HourSlider'
import LayerToggles from '@/components/LayerToggles'
import SchoolSummaryRow from '@/components/SchoolSummaryRow'
import SegmentPriorityTable from '@/components/SegmentPriorityTable'
import ZoneLegend from '@/components/ZoneLegend'
import type { LayerVisibility } from '@/lib/districtStateContext'
import type { BlockFeature, SchoolSummary } from '@/lib/types'
import type { SegmentPriorityRow } from '@/lib/districtTypes'

interface DistrictSchoolViewProps {
  schoolId: string
  schoolSummary: SchoolSummary | null
  allBlocks: BlockFeature[]
  hours: string[]
  hour: string | null
  onHourChange: (hour: string) => void
  layerVisibility: LayerVisibility
  onToggleLayer: (layer: keyof LayerVisibility) => void
  hideHeatData: boolean
  segments: SegmentPriorityRow[] | null
}

export default function DistrictSchoolView({
  schoolId,
  schoolSummary,
  allBlocks,
  hours,
  hour,
  onHourChange,
  layerVisibility,
  onToggleLayer,
  hideHeatData,
  segments,
}: DistrictSchoolViewProps) {
  return (
    <div className="flex flex-col gap-5 p-4">
      {schoolSummary !== null && <SchoolSummaryRow summary={schoolSummary} />}
      <div className="flex flex-col gap-3">
        <ZoneLegend dimmed={hideHeatData} />
        <LayerToggles layerVisibility={layerVisibility} onToggle={onToggleLayer} hideHeatData={hideHeatData} />
      </div>
      {hour !== null && hours.length > 0 && <HourSlider hours={hours} hour={hour} onHourChange={onHourChange} />}
      {allBlocks.length > 0 && (
        <CsvExportButton
          schoolId={schoolId}
          blocks={allBlocks}
          daysExceedancePerYear={schoolSummary?.days_exceedance_per_year ?? null}
        />
      )}
      {segments !== null && <SegmentPriorityTable segments={segments} />}
    </div>
  )
}
