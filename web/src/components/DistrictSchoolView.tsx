import CsvExportButton from '@/components/CsvExportButton'
import HourSlider from '@/components/HourSlider'
import LayerToggles from '@/components/LayerToggles'
import SchoolSummaryRow from '@/components/SchoolSummaryRow'
import ZoneLegend from '@/components/ZoneLegend'
import type { LayerVisibility } from '@/lib/districtStateContext'
import type { BlockFeature, SchoolSummary } from '@/lib/types'

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
}: DistrictSchoolViewProps) {
  return (
    <div className="flex flex-col gap-6 p-4">
      {schoolSummary !== null && <SchoolSummaryRow summary={schoolSummary} />}

      <div className="flex flex-col gap-4 border-t border-border pt-4">
        <ZoneLegend dimmed={hideHeatData} />
        <LayerToggles layerVisibility={layerVisibility} onToggle={onToggleLayer} hideHeatData={hideHeatData} />
        {hour !== null && hours.length > 0 && <HourSlider hours={hours} hour={hour} onHourChange={onHourChange} />}
      </div>

      {allBlocks.length > 0 && (
        <div className="border-t border-border pt-4">
          <CsvExportButton
            schoolId={schoolId}
            blocks={allBlocks}
            daysExceedancePerYear={schoolSummary?.days_exceedance_per_year ?? null}
          />
        </div>
      )}
    </div>
  )
}
