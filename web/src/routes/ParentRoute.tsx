import { useState } from 'react'
import AddressInput from '@/components/AddressInput'
import OutOfAoiNotice from '@/components/OutOfAoiNotice'
import BottomSheet from '@/components/BottomSheet'
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
import { usePinMarker } from '@/hooks/usePinMarker'
import { SAMPLE_LOCATIONS } from '@/lib/sampleLocations'

const SCHOOL_FLY_TO_ZOOM = 14.5

export default function ParentRoute() {
  const { map } = useMapInstance()
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
  usePinMarker({ map, pin, onPinChange: setPin })
  useFlyToSchool(map, selectedSchool, SCHOOL_FLY_TO_ZOOM)

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

  return (
    <>
      <div className="fixed inset-x-0 top-14 z-10 mx-auto w-full max-w-md px-4">
        <AddressInput
          schools={schools}
          selectedSchoolId={selectedSchoolId}
          onSelectSchool={setSelectedSchoolId}
          pin={pin}
          onPinChange={setPin}
          addressText={addressText}
          onAddressTextChange={setAddressText}
        />
      </div>

      {!isPinInAoi ? (
        <div className="fixed inset-x-4 bottom-6 z-10">
          <OutOfAoiNotice />
        </div>
      ) : schoolDataError !== null ? (
        <div className="fixed inset-x-4 bottom-6 z-10 rounded-lg border border-border bg-surface-raised p-4 text-sm text-ink-muted">
          Could not load data for {selectedSchool.name}.
        </div>
      ) : solvedRoutes === null || hour === null ? (
        <Skeleton className="fixed inset-x-4 bottom-6 z-10 h-32 rounded-lg" />
      ) : (
        <BottomSheet
          peek={
            <div className="flex flex-col gap-3 pt-3">
              <StatusSentence distanceMiles={distanceToSchoolMiles} school={selectedSchool} />
              <HourSlider hours={schoolData?.temps.meta.hours ?? []} hour={hour} onHourChange={setHour} />
              <SafeUntilLine safeUntilHour={matchedBlock?.properties.safe_until_hour ?? null} />
            </div>
          }
          expanded={
            <div className="flex flex-col gap-4">
              <RouteComparisonPanel routes={solvedRoutes} hour={hour} />
              {matchedBlock !== null && (
                <PetitionButton address={addressText} school={selectedSchool} block={matchedBlock.properties} />
              )}
            </div>
          }
        />
      )}
    </>
  )
}
