import { useEffect, useRef } from 'react'
import type maplibregl from 'maplibre-gl'
import { boundsFromCoordinates } from '@/lib/routeBounds'

const ROUTE_FOCUS_PADDING_PX = 64
const ROUTE_FOCUS_MAX_ZOOM = 17
const ROUTE_FOCUS_DURATION_MS = 600

export function useRouteFocus(map: maplibregl.Map | null, geometry: number[][] | null, focusKey: string | null): void {
  const geometryRef = useRef(geometry)
  geometryRef.current = geometry

  useEffect(() => {
    if (map === null || focusKey === null) return
    const currentGeometry = geometryRef.current
    if (currentGeometry === null || currentGeometry.length === 0) return

    const bounds = boundsFromCoordinates(currentGeometry)
    if (bounds === null) return

    map.fitBounds(bounds, {
      padding: ROUTE_FOCUS_PADDING_PX,
      maxZoom: ROUTE_FOCUS_MAX_ZOOM,
      duration: ROUTE_FOCUS_DURATION_MS,
    })
  }, [map, focusKey])
}
