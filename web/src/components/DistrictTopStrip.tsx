import HourSlider from '@/components/HourSlider'
import LayerToggles from '@/components/LayerToggles'
import SchoolSummaryRow from '@/components/SchoolSummaryRow'
import TileCoverageInfo from '@/components/TileCoverageInfo'
import ZoneLegend from '@/components/ZoneLegend'
import type { LayerVisibility } from '@/lib/districtStateContext'
import type { SchoolSummary, Tile } from '@/lib/types'

interface DistrictTopStripProps {
  schoolSummary: SchoolSummary | null
  hours: string[]
  hour: string | null
  onHourChange: (hour: string) => void
  layerVisibility: LayerVisibility
  onToggleLayer: (layer: keyof LayerVisibility) => void
  tile: Tile | null
  fetchedAt: string | null
}

export default function DistrictTopStrip({
  schoolSummary,
  hours,
  hour,
  onHourChange,
  layerVisibility,
  onToggleLayer,
  tile,
  fetchedAt,
}: DistrictTopStripProps) {
  return (
    <div className="flex flex-col gap-3">
      {schoolSummary !== null && <SchoolSummaryRow summary={schoolSummary} />}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ZoneLegend />
        <LayerToggles layerVisibility={layerVisibility} onToggle={onToggleLayer} />
      </div>
      {hour !== null && hours.length > 0 && <HourSlider hours={hours} hour={hour} onHourChange={onHourChange} />}
      <TileCoverageInfo tile={tile} fetchedAt={fetchedAt} />
    </div>
  )
}
