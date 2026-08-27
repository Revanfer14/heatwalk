import FieldLabel from '@/components/FieldLabel'
import SchoolSelect from '@/components/SchoolSelect'
import { SAMPLE_LOCATIONS } from '@/lib/sampleLocations'
import type { PinPosition } from '@/lib/appStateContext'
import type { School } from '@/lib/types'
import { cn } from '@/lib/utils'

const ADDRESS_INPUT_ID = 'heatwalk-address-input'

interface AddressInputProps {
  schools: School[]
  selectedSchoolId: string | null
  onSelectSchool: (schoolId: string) => void
  pin: PinPosition
  onPinChange: (pin: PinPosition) => void
  addressText: string
  onAddressTextChange: (text: string) => void
}

export default function AddressInput({
  schools,
  selectedSchoolId,
  onSelectSchool,
  pin,
  onPinChange,
  addressText,
  onAddressTextChange,
}: AddressInputProps) {
  const selectSampleLocation = (locationId: string): void => {
    const location = SAMPLE_LOCATIONS.find((candidate) => candidate.id === locationId)
    if (location === undefined) return
    onAddressTextChange(location.label)
    onPinChange({ lon: location.lon, lat: location.lat })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={ADDRESS_INPUT_ID}>Your location</FieldLabel>
        <input
          id={ADDRESS_INPUT_ID}
          value={addressText}
          onChange={(event) => onAddressTextChange(event.target.value)}
          placeholder="Enter an address"
          className="w-full rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus-visible:border-ink"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SAMPLE_LOCATIONS.map((location) => (
          <button
            key={location.id}
            type="button"
            onClick={() => selectSampleLocation(location.id)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs',
              pin.lon === location.lon && pin.lat === location.lat
                ? 'border-ink bg-ink text-bg'
                : 'border-border-strong text-ink-muted hover:text-ink',
            )}
          >
            {location.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-ink-subtle">Demo addresses — no live geocoding, works offline.</p>
      <p className="text-xs text-ink-subtle">Or drag the pin on the map.</p>
      <SchoolSelect schools={schools} selectedSchoolId={selectedSchoolId} onSelect={onSelectSchool} />
    </div>
  )
}
