import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import { buildCirclePolygon } from '@/lib/circlePolygon'
import { getRouteColors } from '@/lib/mapPaint'
import type { LonLat } from '@/lib/geoDistance'

const OFFICIAL_ZONE_LAYER_ID = 'heatwalk-official-zone'

interface UseOfficialZoneLayerInput {
  map: maplibregl.Map | null
  schoolPoint: LonLat | null
  walkRadiusMi: number | null
  visible: boolean
  theme: string
}

export function useOfficialZoneLayer(input: UseOfficialZoneLayerInput): void {
  const { map, schoolPoint, walkRadiusMi, visible, theme } = input

  useEffect(() => {
    if (map === null) return

    if (map.getSource(OFFICIAL_ZONE_LAYER_ID) === undefined) {
      map.addSource(OFFICIAL_ZONE_LAYER_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: OFFICIAL_ZONE_LAYER_ID,
        type: 'line',
        source: OFFICIAL_ZONE_LAYER_ID,
        paint: { 'line-width': 1.5, 'line-dasharray': [6, 6] },
      })
    }

    return () => {
      if (map.getLayer(OFFICIAL_ZONE_LAYER_ID) !== undefined) map.removeLayer(OFFICIAL_ZONE_LAYER_ID)
      if (map.getSource(OFFICIAL_ZONE_LAYER_ID) !== undefined) map.removeSource(OFFICIAL_ZONE_LAYER_ID)
    }
  }, [map])

  useEffect(() => {
    if (map === null || map.getLayer(OFFICIAL_ZONE_LAYER_ID) === undefined) return
    map.setPaintProperty(OFFICIAL_ZONE_LAYER_ID, 'line-color', getRouteColors().inkMuted)
  }, [map, theme])

  useEffect(() => {
    if (map === null) return
    const source = map.getSource(OFFICIAL_ZONE_LAYER_ID) as maplibregl.GeoJSONSource | undefined
    if (source === undefined) return

    map.setLayoutProperty(OFFICIAL_ZONE_LAYER_ID, 'visibility', visible ? 'visible' : 'none')
    if (!visible || schoolPoint === null || walkRadiusMi === null) {
      source.setData({ type: 'FeatureCollection', features: [] })
      return
    }
    source.setData({ type: 'FeatureCollection', features: [buildCirclePolygon(schoolPoint, walkRadiusMi)] })
  }, [map, schoolPoint, walkRadiusMi, visible])
}
