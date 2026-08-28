import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { createRoot, type Root } from 'react-dom/client'
import YourLocationMarker from '@/components/YourLocationMarker'
import type { PinPosition } from '@/lib/appStateContext'

interface UsePinMarkerInput {
  map: maplibregl.Map | null
  pin: PinPosition
  onPinChange: (pin: PinPosition) => void
  onPinDragEnd?: (pin: PinPosition) => void
}

export function usePinMarker(input: UsePinMarkerInput): void {
  const { map, pin, onPinChange, onPinDragEnd } = input
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const onPinChangeRef = useRef(onPinChange)
  const onPinDragEndRef = useRef(onPinDragEnd)

  useEffect(() => {
    onPinChangeRef.current = onPinChange
    onPinDragEndRef.current = onPinDragEnd
  })

  useEffect(() => {
    if (map === null) return

    const element = document.createElement('div')
    const root: Root = createRoot(element)
    root.render(<YourLocationMarker />)

    const marker = new maplibregl.Marker({ draggable: true, element, anchor: 'bottom' })
      .setLngLat([pin.lon, pin.lat])
      .addTo(map)

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat()
      const newPin = { lon: lngLat.lng, lat: lngLat.lat }
      onPinChangeRef.current(newPin)
      onPinDragEndRef.current?.(newPin)
    })

    markerRef.current = marker

    return () => {
      marker.remove()
      markerRef.current = null
      root.unmount()
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
