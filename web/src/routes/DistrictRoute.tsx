import { useRef } from 'react'
import DistrictStateProvider from '@/components/DistrictStateProvider'
import DistrictPanel from '@/components/DistrictPanel'
import { Skeleton } from '@/components/ui/skeleton'
import { useMapInstance } from '@/hooks/useMapInstance'
import { useDistrictRouteData } from '@/hooks/useDistrictRouteData'
import { useDistrictSelectedRoute } from '@/hooks/useDistrictSelectedRoute'
import { useDistrictMapLayers } from '@/hooks/useDistrictMapLayers'
import { useFlyToSchool } from '@/hooks/useFlyToSchool'
import { useAoiBoundaryLayer } from '@/hooks/useAoiBoundaryLayer'
import { useSegmentPriority } from '@/hooks/useSegmentPriority'
import { useDistrictSelectionHandlers } from '@/hooks/useDistrictSelectionHandlers'
import { useIsSidePanelViewport } from '@/hooks/useIsSidePanelViewport'
import { useMapPanelPadding } from '@/hooks/useMapPanelPadding'
import type { LonLat } from '@/lib/geoDistance'

const SCHOOL_FLY_TO_ZOOM = 13.5

function DistrictRouteInner() {
  const { map } = useMapInstance()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const isSidePanel = useIsSidePanelViewport()
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
    panelView,
    setPanelView,
    panelCollapsed,
    selectedSchool,
    schoolData,
    districtBlocks,
    districtBlocksError,
    policyCircleBlocks,
    nationalSchools,
    schoolSummary,
    selectedBlock,
  } = useDistrictRouteData()

  const schoolPoint: LonLat | null = selectedSchool !== null ? [selectedSchool.lon, selectedSchool.lat] : null

  const { solvedRoutes, highlightedSegments } = useDistrictSelectedRoute(
    schoolData?.graph ?? null,
    schoolData?.temps ?? null,
    schoolPoint,
    selectedBlock,
    hour,
  )
  const routeFailed = selectedBlock?.properties.class === 'red'
  const { segments } = useSegmentPriority(selectedSchoolId)
  const { handleSelectAnalyzed, handleSelectUnanalyzed, handleBlockClick, handleBackToSchools, handleBackToSchool } =
    useDistrictSelectionHandlers({
      districtBlocks,
      selectedSchoolId,
      setSelectedSchoolId,
      setSelectedBlockId,
      setUnanalyzedNotice,
      setPanelView,
    })

  useDistrictMapLayers({
    map,
    schoolPoint,
    walkRadiusMi: selectedSchool?.walk_radius_mi ?? null,
    doseRadiusMi: schoolSummary?.radius_setara_dosis_mi ?? null,
    blocks: policyCircleBlocks,
    layerVisibility,
    hideHeatData,
    theme,
    schools,
    nationalSchools,
    onBlockClick: handleBlockClick,
    onSelectAnalyzed: handleSelectAnalyzed,
    onSelectUnanalyzed: handleSelectUnanalyzed,
    solvedRoutes,
    baselineC: schoolData?.temps.meta.baseline_c ?? 0,
    routeFailed,
    highlightedSegments,
  })

  useFlyToSchool(map, selectedSchool, SCHOOL_FLY_TO_ZOOM)
  useAoiBoundaryLayer(map, tile, theme)
  useMapPanelPadding(map, { isSidePanel, collapsed: panelCollapsed, panelRef })

  if (bootLoading) return <Skeleton className="fixed inset-x-4 top-16 h-24 rounded-lg" />

  if (bootError !== null || districtBlocksError !== null || selectedSchool === null) {
    return (
      <div className="fixed inset-x-4 top-16 rounded-lg border border-border bg-surface-raised p-4 text-sm text-ink-muted">
        Could not load HeatWalk data. Reload to try again.
      </div>
    )
  }

  return (
    <DistrictPanel
      panelRef={panelRef}
      collapsed={panelCollapsed}
      panelView={panelView}
      schools={schools}
      nationalSchools={nationalSchools}
      selectedSchoolId={selectedSchoolId}
      selectedSchool={selectedSchool}
      schoolData={schoolData}
      schoolSummary={schoolSummary}
      selectedBlock={selectedBlock}
      unanalyzedNotice={unanalyzedNotice}
      tile={tile}
      hour={hour}
      onHourChange={setHour}
      layerVisibility={layerVisibility}
      onToggleLayer={toggleLayer}
      hideHeatData={hideHeatData}
      segments={segments}
      schoolSearchText={schoolSearchText}
      onSearchTextChange={setSchoolSearchText}
      includeUnanalyzed={includeUnanalyzed}
      onIncludeUnanalyzedChange={setIncludeUnanalyzed}
      onSelectAnalyzed={handleSelectAnalyzed}
      onSelectUnanalyzed={handleSelectUnanalyzed}
      onBackToSchools={handleBackToSchools}
      onBackToSchool={handleBackToSchool}
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
