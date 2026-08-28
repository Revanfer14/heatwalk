import RouteEndpointFields from '@/components/RouteEndpointFields'
import StatusSentence from '@/components/StatusSentence'
import OutOfAoiNotice from '@/components/OutOfAoiNotice'
import LiveConditionsRow from '@/components/LiveConditionsRow'
import type { LiveTemperatureStatus } from '@/hooks/useLiveTemperature'
import type { PinPosition } from '@/lib/appStateContext'
import type { School, Tile } from '@/lib/types'

interface ParentPanelContentProps {
  tile: Tile | null
  onPinChange: (pin: PinPosition) => void
  addressText: string
  onAddressTextChange: (text: string) => void
  schools: School[]
  selectedSchoolId: string | null
  onSelectSchool: (schoolId: string) => void
  selectedSchool: School
  distanceToSchoolMiles: number
  isPinInAoi: boolean
  schoolDataError: string | null
  hour: string
  liveTemperatureStatus: LiveTemperatureStatus
  liveMedianC: number | null
  liveOffsetC: number
}

export default function ParentPanelContent({
  tile,
  onPinChange,
  addressText,
  onAddressTextChange,
  schools,
  selectedSchoolId,
  onSelectSchool,
  selectedSchool,
  distanceToSchoolMiles,
  isPinInAoi,
  schoolDataError,
  hour,
  liveTemperatureStatus,
  liveMedianC,
  liveOffsetC,
}: ParentPanelContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <RouteEndpointFields
        tile={tile}
        onPinChange={onPinChange}
        addressText={addressText}
        onAddressTextChange={onAddressTextChange}
        schools={schools}
        selectedSchoolId={selectedSchoolId}
        onSelectSchool={onSelectSchool}
      />
      {!isPinInAoi ? (
        <OutOfAoiNotice />
      ) : schoolDataError !== null ? (
        <p className="text-sm text-ink-muted">Could not load data for {selectedSchool.name}.</p>
      ) : (
        <StatusSentence distanceMiles={distanceToSchoolMiles} school={selectedSchool} />
      )}
      {isPinInAoi && schoolDataError === null && (
        <LiveConditionsRow
          hour={hour}
          status={liveTemperatureStatus}
          liveMedianC={liveMedianC}
          offsetC={liveOffsetC}
        />
      )}
    </div>
  )
}
