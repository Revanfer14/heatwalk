import { useState, type FormEvent } from 'react'
import FieldLabel from '@/components/FieldLabel'
import { useGeocodeSuggestions, type GeocodeStatus } from '@/hooks/useGeocodeSuggestions'
import type { GeocodeResult } from '@/lib/geocode'
import type { PinPosition } from '@/lib/appStateContext'
import type { Tile } from '@/lib/types'

const ORIGIN_INPUT_ID = 'heatwalk-origin-input'
const SUGGESTION_CLOSE_DELAY_MS = 150
const DRAG_PIN_HINT = "Can't find your address? Drag the pin on the map."
const NO_MATCH_HINT = 'No match inside the mapped area. Try dragging the pin instead.'
const SEARCH_UNAVAILABLE_HINT = 'Search unavailable right now. Try dragging the pin instead.'

function originHintFor(isSuggestionListOpen: boolean, status: GeocodeStatus): string {
  if (!isSuggestionListOpen) return DRAG_PIN_HINT
  if (status === 'not_found') return NO_MATCH_HINT
  if (status === 'error') return SEARCH_UNAVAILABLE_HINT
  return DRAG_PIN_HINT
}

interface OriginFieldProps {
  tile: Tile | null
  onPickOrigin: (pin: PinPosition) => void
  addressText: string
  onAddressTextChange: (text: string) => void
}

export default function OriginField({ tile, onPickOrigin, addressText, onAddressTextChange }: OriginFieldProps) {
  const { status, suggestions, search } = useGeocodeSuggestions(tile)
  const [isOpen, setIsOpen] = useState(false)

  const handleChange = (text: string): void => {
    onAddressTextChange(text)
    setIsOpen(true)
    search(text)
  }

  const selectSuggestion = (suggestion: GeocodeResult): void => {
    onAddressTextChange(suggestion.displayName)
    onPickOrigin({ lon: suggestion.lon, lat: suggestion.lat })
    setIsOpen(false)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const topSuggestion = suggestions[0]
    if (topSuggestion !== undefined) selectSuggestion(topSuggestion)
  }

  return (
    <div className="relative flex flex-col gap-1.5">
      <FieldLabel htmlFor={ORIGIN_INPUT_ID}>Origin</FieldLabel>
      <form onSubmit={handleSubmit}>
        <input
          id={ORIGIN_INPUT_ID}
          value={addressText}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), SUGGESTION_CLOSE_DELAY_MS)}
          placeholder="Search for an address"
          autoComplete="off"
          className="w-full rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-ink outline-none focus-visible:border-ink"
        />
      </form>
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute top-full z-controls mt-1 w-full rounded-md border border-border-strong bg-surface-raised py-1 shadow-lg">
          {suggestions.map((suggestion) => (
            <li key={`${suggestion.lon}-${suggestion.lat}`}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
                className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-surface"
              >
                {suggestion.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-ink-subtle">{originHintFor(isOpen, status)}</p>
    </div>
  )
}
