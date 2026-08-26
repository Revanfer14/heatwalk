import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { getRouteColors } from '@/lib/mapPaint'
import type { PinPosition } from '@/lib/appStateContext'

interface UsePinMarkerInput {
  map: maplibregl.Map | null
  pin: PinPosition
  onPinChange: (pin: PinPosition) => void
}

export function usePinMarker(input: UsePinMarkerInput): void {
  const { map, pin, onPinChange } = input
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const onPinChangeRef = useRef(onPinChange)

  useEffect(() => {
    onPinChangeRef.current = onPinChange
  })

  useEffect(() => {
    if (map === null) return

    const marker = new maplibregl.Marker({ draggable: true, color: getRouteColors().ink })
      .setLngLat([pin.lon, pin.lat])
      .addTo(map)

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat()
      onPinChangeRef.current({ lon: lngLat.lng, lat: lngLat.lat })
    })

    markerRef.current = marker

    return () => {
      marker.remove()
      markerRef.current = null
    }
  }, [map])

  useEffect(() => {
    if (markerRef.current === null) return
    const current = markerRef.current.getLngLat()
    if (current.lng !== pin.lon || current.lat !== pin.lat) {
      markerRef.current.setLngLat([pin.lon, pin.lat])
    }
  }, [pin])
}
