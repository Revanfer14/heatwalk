import { useRef } from 'react'
import DistrictStateProvider from '@/components/DistrictStateProvider'
import DistrictPanel from '@/components/DistrictPanel'
import MapLegend from '@/components/MapLegend'
import MapLegendContent from '@/components/MapLegendContent'
import { Skeleton } from '@/components/ui/skeleton'
import { useMapInstance } from '@/hooks/useMapInstance'
import { useDistrictRouteData } from '@/hooks/useDistrictRouteData'
import { useDistrictMapLayers } from '@/hooks/useDistrictMapLayers'
import { useFlyToSchool } from '@/hooks/useFlyToSchool'
import { useAoiBoundaryLayer } from '@/hooks/useAoiBoundaryLayer'
import { useDistrictSelectionHandlers } from '@/hooks/useDistrictSelectionHandlers'
import { useIsSidePanelViewport } from '@/hooks/useIsSidePanelViewport'
import { useMapPanelPadding } from '@/hooks/useMapPanelPadding'
import { LEGEND_WIDTH_PX } from '@/lib/panelGeometry'
import type { LonLat } from '@/lib/geoDistance'

const SCHOOL_FLY_TO_ZOOM = 13.5

function DistrictRouteInner() {
  const { map } = useMapInstance()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const isSidePanel = useIsSidePanelViewport()
  const {
    schools,
    tile,
    hour,
    setHour,
    hideHeatData,
    theme,
    bootLoading,
    bootError,
    focusedSchoolId,
    setFocusedSchoolId,
    setSelectedBlockId,
    layerVisibility,
    toggleLayer,
    misclassifiedHighlight,
    toggleMisclassifiedHighlight,
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
    focusedSchoolBlocks,
    nationalSchools,
    schoolSummary,
    selectedBlock,
    legendCollapsed,
    toggleLegendCollapsed,
  } = useDistrictRouteData()

  const schoolPoint: LonLat | null = selectedSchool !== null ? [selectedSchool.lon, selectedSchool.lat] : null
  const { handleSelectAnalyzed, handleSelectUnanalyzed, handleBlockClick, handleBackToSchools, handleBackToSchool } =
    useDistrictSelectionHandlers({
      districtBlocks,
      focusedSchoolId,
      setFocusedSchoolId,
      setSelectedBlockId,
      setUnanalyzedNotice,
      setPanelView,
      setHour,
    })

  useDistrictMapLayers({
    map,
    schoolPoint,
    walkRadiusMi: selectedSchool?.walk_radius_mi ?? null,
    doseRadiusMi: schoolSummary?.radius_setara_dosis_mi ?? null,
    blocks: policyCircleBlocks,
    focusedSchoolBlocks,
    misclassifiedHighlight,
    layerVisibility,
    hideHeatData,
    theme,
    schools,
    nationalSchools,
    focusedSchoolId,
    onBlockClick: handleBlockClick,
    onSelectAnalyzed: handleSelectAnalyzed,
    onSelectUnanalyzed: handleSelectUnanalyzed,
  })

  useFlyToSchool(map, selectedSchool, SCHOOL_FLY_TO_ZOOM)
  useAoiBoundaryLayer(map, tile, theme)
  const legendReservedPx = isSidePanel && !legendCollapsed ? LEGEND_WIDTH_PX : 0
  useMapPanelPadding(map, { isSidePanel, collapsed: panelCollapsed, panelRef, rightReservedPx: legendReservedPx })

  if (bootLoading) return <Skeleton className="fixed inset-x-4 top-16 h-24 rounded-lg" />

  if (bootError !== null || districtBlocksError !== null) {
    return (
      <div className="fixed inset-x-4 top-16 rounded-lg border border-border bg-surface-raised p-4 text-sm text-ink-muted">
        Could not load HeatWalk data. Reload to try again.
      </div>
    )
  }

  return (
    <>
      <DistrictPanel
        panelRef={panelRef}
        collapsed={panelCollapsed}
        panelView={panelView}
        schools={schools}
        nationalSchools={nationalSchools}
        selectedSchool={selectedSchool}
        schoolData={schoolData}
        schoolSummary={schoolSummary}
        selectedBlock={selectedBlock}
        unanalyzedNotice={unanalyzedNotice}
        hour={hour}
        onHourChange={setHour}
        layerVisibility={layerVisibility}
        onToggleLayer={toggleLayer}
        misclassifiedHighlight={misclassifiedHighlight}
        onToggleMisclassifiedHighlight={toggleMisclassifiedHighlight}
        hideHeatData={hideHeatData}
        schoolSearchText={schoolSearchText}
        onSearchTextChange={setSchoolSearchText}
        includeUnanalyzed={includeUnanalyzed}
        onIncludeUnanalyzedChange={setIncludeUnanalyzed}
        onSelectAnalyzed={handleSelectAnalyzed}
        onSelectUnanalyzed={handleSelectUnanalyzed}
        onBackToSchools={handleBackToSchools}
        onBackToSchool={handleBackToSchool}
      />
      {isSidePanel && (
        <MapLegend collapsed={legendCollapsed} onToggleCollapsed={toggleLegendCollapsed}>
          <MapLegendContent
            hideHeatData={hideHeatData}
            schoolSummary={schoolSummary}
            meta={schoolData?.temps.meta ?? null}
            misclassifiedHighlight={misclassifiedHighlight}
          />
        </MapLegend>
      )}
    </>
  )
}

export default function DistrictRoute() {
  return (
    <DistrictStateProvider>
      <DistrictRouteInner />
    </DistrictStateProvider>
  )
}
