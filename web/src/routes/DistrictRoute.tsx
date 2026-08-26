import DistrictStateProvider from '@/components/DistrictStateProvider'
import DistrictLayout from '@/components/DistrictLayout'
import SchoolList from '@/components/SchoolList'
import DistrictTopStrip from '@/components/DistrictTopStrip'
import DistrictDetailPanel from '@/components/DistrictDetailPanel'
import { Skeleton } from '@/components/ui/skeleton'
import { useMapInstance } from '@/hooks/useMapInstance'
import { useDistrictRouteData } from '@/hooks/useDistrictRouteData'
import { useDistrictSelectedRoute } from '@/hooks/useDistrictSelectedRoute'
import { useDistrictMapLayers } from '@/hooks/useDistrictMapLayers'
import { useFlyToSchool } from '@/hooks/useFlyToSchool'
import { useAoiBoundaryLayer } from '@/hooks/useAoiBoundaryLayer'
import { useSegmentPriority } from '@/hooks/useSegmentPriority'
import { useDistrictSelectionHandlers } from '@/hooks/useDistrictSelectionHandlers'
import { applyHourClass } from '@/lib/applyHourClass'
import type { LonLat } from '@/lib/geoDistance'

const SCHOOL_FLY_TO_ZOOM = 13.5

function DistrictRouteInner() {
  const { map } = useMapInstance()
  const {
    schools,
    tile,
    selectedSchoolId,
    setSelectedSchoolId,
    hour,
    setHour,
    hideHeatData,
    theme,
    bootLoading,
    bootError,
    setSelectedBlockId,
    layerVisibility,
    toggleLayer,
    schoolSearchText,
    setSchoolSearchText,
    includeUnanalyzed,
    setIncludeUnanalyzed,
    unanalyzedNotice,
    setUnanalyzedNotice,
    selectedSchool,
    schoolData,
    blocksHours,
    nationalSchools,
    schoolSummary,
    selectedBlock,
  } = useDistrictRouteData()

  const schoolPoint: LonLat | null = selectedSchool !== null ? [selectedSchool.lon, selectedSchool.lat] : null
  const hourAdjustedBlocks = schoolData !== null ? applyHourClass(schoolData.blocks, blocksHours, hour) : null

  const { solvedRoutes, highlightedSegments } = useDistrictSelectedRoute(
    schoolData?.graph ?? null,
    schoolData?.temps ?? null,
    schoolPoint,
    selectedBlock,
    hour,
  )
  const routeFailed = selectedBlock?.properties.class === 'red'
  const { segments } = useSegmentPriority(selectedSchoolId)
  const { handleSelectAnalyzed, handleSelectUnanalyzed, handleBlockClick } = useDistrictSelectionHandlers({
    setSelectedSchoolId,
    setSelectedBlockId,
    setUnanalyzedNotice,
  })

  useDistrictMapLayers({
    map,
    schoolPoint,
    walkRadiusMi: selectedSchool?.walk_radius_mi ?? null,
    doseRadiusMi: schoolSummary?.radius_setara_dosis_mi ?? null,
    blocks: hourAdjustedBlocks,
    layerVisibility,
    hideHeatData,
    theme,
    schools,
    nationalSchools,
    onBlockClick: handleBlockClick,
    onSelectAnalyzed: handleSelectAnalyzed,
    onSelectUnanalyzed: handleSelectUnanalyzed,
    solvedRoutes,
    routeFailed,
    highlightedSegments,
  })

  useFlyToSchool(map, selectedSchool, SCHOOL_FLY_TO_ZOOM)
  useAoiBoundaryLayer(map, tile, theme)

  if (bootLoading) return <Skeleton className="fixed inset-x-4 top-16 h-24 rounded-lg" />

  if (bootError !== null || selectedSchool === null) {
    return (
      <div className="fixed inset-x-4 top-16 rounded-lg border border-border bg-surface-raised p-4 text-sm text-ink-muted">
        Could not load HeatWalk data. Reload to try again.
      </div>
    )
  }

  return (
    <DistrictLayout
      schoolList={
        <SchoolList
          analyzedSchools={schools}
          nationalSchools={nationalSchools}
          selectedSchoolId={selectedSchoolId}
          onSelectAnalyzed={handleSelectAnalyzed}
          onSelectUnanalyzed={handleSelectUnanalyzed}
          searchText={schoolSearchText}
          onSearchTextChange={setSchoolSearchText}
          includeUnanalyzed={includeUnanalyzed}
          onIncludeUnanalyzedChange={setIncludeUnanalyzed}
        />
      }
      topStrip={
        <DistrictTopStrip
          schoolSummary={schoolSummary}
          hours={schoolData?.temps.meta.hours ?? []}
          hour={hour}
          onHourChange={setHour}
          layerVisibility={layerVisibility}
          onToggleLayer={toggleLayer}
          tile={tile}
          fetchedAt={schoolData?.temps.meta.fetched_at ?? null}
          hideHeatData={hideHeatData}
        />
      }
      detailPanel={
        <DistrictDetailPanel
          unanalyzedNotice={unanalyzedNotice}
          selectedBlock={selectedBlock}
          allBlocks={schoolData?.blocks.features ?? []}
          schoolId={selectedSchool.id}
          schoolName={selectedSchool.name}
          schoolSummary={schoolSummary}
          segments={segments}
          baselineC={schoolData?.temps.meta.baseline_c ?? null}
        />
      }
    />
  )
}

export default function DistrictRoute() {
  return (
    <DistrictStateProvider>
      <DistrictRouteInner />
    </DistrictStateProvider>
  )
}
