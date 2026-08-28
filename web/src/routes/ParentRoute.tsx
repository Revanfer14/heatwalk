import { useEffect, useRef, useState } from 'react'
import ParentPanelContent from '@/components/ParentPanelContent'
import ParentRouteResults from '@/components/ParentRouteResults'
import MapPanel from '@/components/MapPanel'
import MapPanelHeader from '@/components/MapPanelHeader'
import MapPanelFooter from '@/components/MapPanelFooter'
import TileCoverageInfo from '@/components/TileCoverageInfo'
import { Skeleton } from '@/components/ui/skeleton'
import { useMapInstance } from '@/hooks/useMapInstance'
import { useParentRouteData } from '@/hooks/useParentRouteData'
import { useParentMapLayers } from '@/hooks/useParentMapLayers'
import { useOriginAddressSync } from '@/hooks/useOriginAddressSync'
import { useFlyToSchool } from '@/hooks/useFlyToSchool'
import { useIsSidePanelViewport } from '@/hooks/useIsSidePanelViewport'
import { useMapPanelPadding } from '@/hooks/useMapPanelPadding'
import { SAMPLE_LOCATIONS } from '@/lib/sampleLocations'
import type { SelectedRouteId } from '@/lib/selectedRouteId'

const SCHOOL_FLY_TO_ZOOM = 14.5

export default function ParentRoute() {
  const { map } = useMapInstance()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const isSidePanel = useIsSidePanelViewport()
  const [addressText, setAddressText] = useState(SAMPLE_LOCATIONS[0].label)
  const [selectedRouteId, setSelectedRouteId] = useState<SelectedRouteId>('coolest')

  const {
    schools,
    tile,
    selectedSchoolId,
    setSelectedSchoolId,
    pin,
    setPin,
    hour,
    hideHeatData,
    theme,
    panelCollapsed,
    bootLoading,
    bootError,
    selectedSchool,
    schoolData,
    schoolDataError,
    isPinInAoi,
    solvedRoutes,
    distanceToSchoolMiles,
    matchedBlock,
    routeFailed,
    liveTemperatureStatus,
    liveMedianC,
    liveOffsetC,
    isLiveTemperatureActive,
  } = useParentRouteData()

  const handlePinDragEnd = useOriginAddressSync(setAddressText)

  useEffect(() => {
    setSelectedRouteId('coolest')
  }, [selectedSchoolId, pin.lon, pin.lat])

  useParentMapLayers({
    map,
    tile,
    theme,
    hideHeatData,
    solvedRoutes,
    selectedRouteId,
    baselineC: schoolData?.temps.meta.baseline_c ?? 0,
    routeFailed,
    selectedSchool,
    pin,
    onPinChange: setPin,
    onPinDragEnd: handlePinDragEnd,
  })
  useFlyToSchool(map, selectedSchool, SCHOOL_FLY_TO_ZOOM)
  useMapPanelPadding(map, { isSidePanel, collapsed: panelCollapsed, panelRef })

  if (bootLoading) {
    return <Skeleton className="fixed inset-x-4 top-16 h-24 rounded-lg" />
  }

  if (bootError !== null || selectedSchool === null) {
    return (
      <div className="fixed inset-x-4 top-16 rounded-lg border border-border bg-surface-raised p-4 text-sm text-ink-muted">
        Could not load HeatWalk data. Reload to try again.
      </div>
    )
  }

  const isReady = isPinInAoi && schoolDataError === null && solvedRoutes !== null

  const panelContent = (
    <ParentPanelContent
      tile={tile}
      onPinChange={setPin}
      addressText={addressText}
      onAddressTextChange={setAddressText}
      schools={schools}
      selectedSchoolId={selectedSchoolId}
      onSelectSchool={setSelectedSchoolId}
      selectedSchool={selectedSchool}
      distanceToSchoolMiles={distanceToSchoolMiles}
      isPinInAoi={isPinInAoi}
      schoolDataError={schoolDataError}
      hour={hour}
      liveTemperatureStatus={liveTemperatureStatus}
      liveMedianC={liveMedianC}
      liveOffsetC={liveOffsetC}
    />
  )

  const resultsContent = (
    <ParentRouteResults
      isReady={isReady}
      school={selectedSchool}
      solvedRoutes={solvedRoutes}
      hour={hour}
      matchedBlock={matchedBlock}
      addressText={addressText}
      hideHeatData={hideHeatData}
      isLive={isLiveTemperatureActive}
      modeledDate={schoolData?.temps.meta.fetched_at ?? ''}
      selectedRouteId={selectedRouteId}
      onSelectRoute={setSelectedRouteId}
    />
  )

  return (
    <MapPanel
      panelRef={panelRef}
      collapsed={panelCollapsed}
      header={<MapPanelHeader title="HeatWalk" eyebrow="Orlando" />}
      peek={panelContent}
      footer={
        <MapPanelFooter>
          <TileCoverageInfo tile={tile} fetchedAt={schoolData?.temps.meta.fetched_at ?? null} />
        </MapPanelFooter>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        {isSidePanel && panelContent}
        {resultsContent}
      </div>
    </MapPanel>
  )
}
