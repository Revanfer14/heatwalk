import CsvExportButton from '@/components/CsvExportButton'
import HourSlider from '@/components/HourSlider'
import LayerToggles from '@/components/LayerToggles'
import MapLegendContent from '@/components/MapLegendContent'
import SchoolSummaryRow from '@/components/SchoolSummaryRow'
import { useIsSidePanelViewport } from '@/hooks/useIsSidePanelViewport'
import type { LayerVisibility, MisclassifiedHighlight } from '@/lib/districtStateContext'
import type { BlockFeature, SchoolSummary, TempsMeta } from '@/lib/types'

interface DistrictSchoolViewProps {
  schoolId: string
  schoolSummary: SchoolSummary | null
  meta: TempsMeta | null
  allBlocks: BlockFeature[]
  hours: string[]
  hour: string | null
  onHourChange: (hour: string) => void
  layerVisibility: LayerVisibility
  onToggleLayer: (layer: keyof LayerVisibility) => void
  misclassifiedHighlight: MisclassifiedHighlight
  onToggleMisclassifiedHighlight: (category: keyof MisclassifiedHighlight) => void
  hideHeatData: boolean
}

export default function DistrictSchoolView({
  schoolId,
  schoolSummary,
  meta,
  allBlocks,
  hours,
  hour,
  onHourChange,
  layerVisibility,
  onToggleLayer,
  misclassifiedHighlight,
  onToggleMisclassifiedHighlight,
  hideHeatData,
}: DistrictSchoolViewProps) {
  const isSidePanel = useIsSidePanelViewport()

  return (
    <div className="flex flex-col gap-6 p-4">
      {schoolSummary !== null && (
        <SchoolSummaryRow
          summary={schoolSummary}
          hour={hour}
          misclassifiedHighlight={misclassifiedHighlight}
          onToggleMisclassifiedHighlight={onToggleMisclassifiedHighlight}
          hideHeatData={hideHeatData}
        />
      )}

      <div className="flex flex-col gap-4 border-t border-border pt-4">
        {!isSidePanel && (
          <MapLegendContent hideHeatData={hideHeatData} schoolSummary={schoolSummary} meta={meta} />
        )}
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
