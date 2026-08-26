import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'

const HEADER_HEIGHT_PX = 48

export const DISTRICT_LEFT_WIDTH_PX = 280
export const DISTRICT_RIGHT_WIDTH_PX = 360

export function useDistrictMapPadding(map: maplibregl.Map | null, topStripHeightPx: number): void {
  useEffect(() => {
    if (map === null) return

    map.setPadding({
      top: HEADER_HEIGHT_PX + topStripHeightPx,
      left: DISTRICT_LEFT_WIDTH_PX,
      right: DISTRICT_RIGHT_WIDTH_PX,
      bottom: 0,
    })

    return () => {
      map.setPadding({ top: 0, left: 0, right: 0, bottom: 0 })
    }
  }, [map, topStripHeightPx])
}
