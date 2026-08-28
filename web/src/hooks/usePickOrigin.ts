import { useCallback } from 'react'
import type maplibregl from 'maplibre-gl'
import type { PinPosition } from '@/lib/appStateContext'

const ORIGIN_FLY_TO_ZOOM = 14.5

export function usePickOrigin(
  map: maplibregl.Map | null,
  onPinChange: (pin: PinPosition) => void,
): (pin: PinPosition) => void {
  return useCallback(
    (pin: PinPosition): void => {
      onPinChange(pin)
      if (map !== null) {
        map.flyTo({ center: [pin.lon, pin.lat], zoom: Math.max(map.getZoom(), ORIGIN_FLY_TO_ZOOM) })
      }
    },
    [map, onPinChange],
  )
}
