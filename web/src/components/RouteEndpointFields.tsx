import OriginField from '@/components/OriginField'
import DestinationField from '@/components/DestinationField'
import type { PinPosition } from '@/lib/appStateContext'
import type { School, Tile } from '@/lib/types'

interface RouteEndpointFieldsProps {
  tile: Tile | null
  onPickOrigin: (pin: PinPosition) => void
  addressText: string
  onAddressTextChange: (text: string) => void
  schools: School[]
  selectedSchoolId: string | null
  onSelectSchool: (schoolId: string) => void
}

export default function RouteEndpointFields({
  tile,
  onPickOrigin,
  addressText,
  onAddressTextChange,
  schools,
  selectedSchoolId,
  onSelectSchool,
}: RouteEndpointFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      <OriginField
        tile={tile}
        onPickOrigin={onPickOrigin}
        addressText={addressText}
        onAddressTextChange={onAddressTextChange}
      />
      <DestinationField schools={schools} selectedSchoolId={selectedSchoolId} onSelect={onSelectSchool} />
    </div>
  )
}
