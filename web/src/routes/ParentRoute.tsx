import { useRef, useState } from 'react'
import AddressInput from '@/components/AddressInput'
import OutOfAoiNotice from '@/components/OutOfAoiNotice'
import FloatingCard from '@/components/FloatingCard'
import MapPanel from '@/components/MapPanel'
import MapPanelHeader from '@/components/MapPanelHeader'
import MapPanelFooter from '@/components/MapPanelFooter'
import TileCoverageInfo from '@/components/TileCoverageInfo'
import StatusSentence from '@/components/StatusSentence'
import HourSlider from '@/components/HourSlider'
import SafeUntilLine from '@/components/SafeUntilLine'
import RouteComparisonPanel from '@/components/RouteComparisonPanel'
import PetitionButton from '@/components/PetitionButton'
import { Skeleton } from '@/components/ui/skeleton'
import { useMapInstance } from '@/hooks/useMapInstance'
import { useParentRouteData } from '@/hooks/useParentRouteData'
import { useRouteLayers } from '@/hooks/useRouteLayers'
import { useFlyToSchool } from '@/hooks/useFlyToSchool'
import { useAoiBoundaryLayer } from '@/hooks/useAoiBoundaryLayer'
import { useOfficialZoneLayer } from '@/hooks/useOfficialZoneLayer'
import { usePinMarker } from '@/hooks/usePinMarker'
import { useIsSidePanelViewport } from '@/hooks/useIsSidePanelViewport'
import { useMapPanelPadding } from '@/hooks/useMapPanelPadding'
import { SAMPLE_LOCATIONS } from '@/lib/sampleLocations'

const SCHOOL_FLY_TO_ZOOM = 14.5
const MOBILE_ADDRESS_CARD_TOP_PX = 64

export default function ParentRoute() {
  const { map } = useMapInstance()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const isSidePanel = useIsSidePanelViewport()
  const [addressText, setAddressText] = useState(SAMPLE_LOCATIONS[0].label)

  const {
    schools,
    tile,
    selectedSchoolId,
    setSelectedSchoolId,
    pin,
    setPin,
    hour,
    setHour,
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
  } = useParentRouteData()

  useRouteLayers({ map, solvedRoutes, hideHeatData, routeFailed, theme })
  useAoiBoundaryLayer(map, tile, theme)
  useOfficialZoneLayer({
    map,
    schoolPoint: selectedSchool !== null ? [selectedSchool.lon, selectedSchool.lat] : null,
    walkRadiusMi: selectedSchool?.walk_radius_mi ?? null,
    visible: true,
    theme,
  })
  usePinMarker({ map, pin, onPinChange: setPin })
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

  const addressInput = (
    <AddressInput
      schools={schools}
      selectedSchoolId={selectedSchoolId}
      onSelectSchool={setSelectedSchoolId}
      pin={pin}
      onPinChange={setPin}
      addressText={addressText}
      onAddressTextChange={setAddressText}
    />
  )

  const peekContent = !isPinInAoi ? (
    <OutOfAoiNotice />
  ) : schoolDataError !== null ? (
    <p className="text-sm text-ink-muted">Could not load data for {selectedSchool.name}.</p>
  ) : solvedRoutes === null || hour === null ? (
    <Skeleton className="h-24 rounded-lg" />
  ) : (
    <div className="flex flex-col gap-3">
      <StatusSentence distanceMiles={distanceToSchoolMiles} school={selectedSchool} />
      <HourSlider hours={schoolData?.temps.meta.hours ?? []} hour={hour} onHourChange={setHour} />
      <SafeUntilLine safeUntilHour={matchedBlock?.properties.safe_until_hour ?? null} />
    </div>
  )

  const expandedContent =
    isPinInAoi && schoolDataError === null && solvedRoutes !== null && hour !== null ? (
      <div className="flex flex-col gap-4">
        <RouteComparisonPanel routes={solvedRoutes} hour={hour} />
        {matchedBlock !== null && (
          <PetitionButton
            address={addressText}
            school={selectedSchool}
            block={matchedBlock.properties}
            hideHeatData={hideHeatData}
          />
        )}
      </div>
    ) : null

  return (
    <>
      {!isSidePanel && <FloatingCard top={MOBILE_ADDRESS_CARD_TOP_PX}>{addressInput}</FloatingCard>}
      <MapPanel
        panelRef={panelRef}
        collapsed={panelCollapsed}
        header={<MapPanelHeader title="HeatWalk" eyebrow="Orlando" />}
        peek={peekContent}
        footer={
          <MapPanelFooter>
            <TileCoverageInfo tile={tile} fetchedAt={schoolData?.temps.meta.fetched_at ?? null} />
          </MapPanelFooter>
        }
      >
        <div className="flex flex-col gap-4 p-4">
          {isSidePanel && addressInput}
          {isSidePanel && peekContent}
          {expandedContent}
        </div>
      </MapPanel>
    </>
  )
}
