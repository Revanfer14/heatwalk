import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import type { School } from '@/lib/types'

export function useFlyToSchool(map: maplibregl.Map | null, school: School | null, zoom: number): void {
  useEffect(() => {
    if (map === null || school === null) return
    map.flyTo({ center: [school.lon, school.lat], zoom })
  }, [map, school, zoom])
}
