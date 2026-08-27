import type { RefObject } from 'react'
import MapPanel from '@/components/MapPanel'
import MapPanelHeader from '@/components/MapPanelHeader'
import MapPanelFooter from '@/components/MapPanelFooter'
import SchoolList from '@/components/SchoolList'
import DistrictSchoolView from '@/components/DistrictSchoolView'
import BlockDetailPanel from '@/components/BlockDetailPanel'
import UnanalyzedSchoolNotice from '@/components/UnanalyzedSchoolNotice'
import TileCoverageInfo from '@/components/TileCoverageInfo'
import type { DistrictPanelView, LayerVisibility } from '@/lib/districtStateContext'
import type { SchoolNational, SegmentPriorityRow } from '@/lib/districtTypes'
import type { SchoolData } from '@/lib/schoolDataCache'
import type { BlockFeature, School, SchoolSummary, Tile } from '@/lib/types'

interface DistrictPanelProps {
  panelRef: RefObject<HTMLDivElement | null>
  collapsed: boolean
  panelView: DistrictPanelView
  schools: School[]
  nationalSchools: SchoolNational[] | null
  selectedSchoolId: string | null
  selectedSchool: School
  schoolData: SchoolData | null
  schoolSummary: SchoolSummary | null
  selectedBlock: BlockFeature | null
  unanalyzedNotice: SchoolNational | null
  tile: Tile | null
  hour: string | null
  onHourChange: (hour: string) => void
  layerVisibility: LayerVisibility
  onToggleLayer: (layer: keyof LayerVisibility) => void
  hideHeatData: boolean
  segments: SegmentPriorityRow[] | null
  schoolSearchText: string
  onSearchTextChange: (text: string) => void
  includeUnanalyzed: boolean
  onIncludeUnanalyzedChange: (value: boolean) => void
  onSelectAnalyzed: (schoolId: string) => void
  onSelectUnanalyzed: (school: SchoolNational) => void
  onBackToSchools: () => void
  onBackToSchool: () => void
}

export default function DistrictPanel({
  panelRef,
  collapsed,
  panelView,
  schools,
  nationalSchools,
  selectedSchoolId,
  selectedSchool,
  schoolData,
  schoolSummary,
  selectedBlock,
  unanalyzedNotice,
  tile,
  hour,
  onHourChange,
  layerVisibility,
  onToggleLayer,
  hideHeatData,
  segments,
  schoolSearchText,
  onSearchTextChange,
  includeUnanalyzed,
  onIncludeUnanalyzedChange,
  onSelectAnalyzed,
  onSelectUnanalyzed,
  onBackToSchools,
  onBackToSchool,
}: DistrictPanelProps) {
  return (
    <MapPanel
      panelRef={panelRef}
      collapsed={collapsed}
      header={
        panelView === 'schools' ? (
          <MapPanelHeader title="HeatWalk" eyebrow="Orlando" />
        ) : panelView === 'school' ? (
          <MapPanelHeader title={selectedSchool.name} onBack={onBackToSchools} />
        ) : (
          <MapPanelHeader
            title={unanalyzedNotice?.name ?? `Block ${selectedBlock?.properties.block_id ?? ''}`}
            onBack={onBackToSchool}
          />
        )
      }
      footer={
        panelView === 'schools' ? (
          <MapPanelFooter>{schools.length} schools analyzed</MapPanelFooter>
        ) : (
          <MapPanelFooter>
            <TileCoverageInfo tile={tile} fetchedAt={schoolData?.temps.meta.fetched_at ?? null} />
          </MapPanelFooter>
        )
      }
    >
      {panelView === 'schools' && (
        <SchoolList
          analyzedSchools={schools}
          nationalSchools={nationalSchools}
          selectedSchoolId={selectedSchoolId}
          onSelectAnalyzed={onSelectAnalyzed}
          onSelectUnanalyzed={onSelectUnanalyzed}
          searchText={schoolSearchText}
          onSearchTextChange={onSearchTextChange}
          includeUnanalyzed={includeUnanalyzed}
          onIncludeUnanalyzedChange={onIncludeUnanalyzedChange}
        />
      )}
      {panelView === 'school' && (
        <DistrictSchoolView
          schoolId={selectedSchool.id}
          schoolSummary={schoolSummary}
          allBlocks={schoolData?.blocks.features ?? []}
          hours={schoolData?.temps.meta.hours ?? []}
          hour={hour}
          onHourChange={onHourChange}
          layerVisibility={layerVisibility}
          onToggleLayer={onToggleLayer}
          hideHeatData={hideHeatData}
          segments={segments}
        />
      )}
      {panelView === 'block' &&
        (unanalyzedNotice !== null ? (
          <UnanalyzedSchoolNotice school={unanalyzedNotice} />
        ) : selectedBlock !== null ? (
          <BlockDetailPanel
            block={selectedBlock}
            allBlocks={schoolData?.blocks.features ?? []}
            schoolName={selectedSchool.name}
            schoolSummary={schoolSummary}
            baselineC={schoolData?.temps.meta.baseline_c ?? null}
          />
        ) : null)}
    </MapPanel>
  )
}
