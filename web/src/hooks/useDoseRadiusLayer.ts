import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import { buildCirclePolygon } from '@/lib/circlePolygon'
import { getRouteColors } from '@/lib/mapPaint'
import type { LonLat } from '@/lib/geoDistance'

const DOSE_RADIUS_LAYER_ID = 'heatwalk-dose-radius'

interface UseDoseRadiusLayerInput {
  map: maplibregl.Map | null
  schoolPoint: LonLat | null
  doseRadiusMi: number | null
  visible: boolean
  theme: string
}

export function useDoseRadiusLayer(input: UseDoseRadiusLayerInput): void {
  const { map, schoolPoint, doseRadiusMi, visible, theme } = input

  useEffect(() => {
    if (map === null) return

    if (map.getSource(DOSE_RADIUS_LAYER_ID) === undefined) {
      map.addSource(DOSE_RADIUS_LAYER_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: DOSE_RADIUS_LAYER_ID,
        type: 'line',
        source: DOSE_RADIUS_LAYER_ID,
        paint: { 'line-width': 1.5 },
      })
    }

    return () => {
      if (map.getLayer(DOSE_RADIUS_LAYER_ID) !== undefined) map.removeLayer(DOSE_RADIUS_LAYER_ID)
      if (map.getSource(DOSE_RADIUS_LAYER_ID) !== undefined) map.removeSource(DOSE_RADIUS_LAYER_ID)
    }
  }, [map])

  useEffect(() => {
    if (map === null || map.getLayer(DOSE_RADIUS_LAYER_ID) === undefined) return
    map.setPaintProperty(DOSE_RADIUS_LAYER_ID, 'line-color', getRouteColors().ink)
  }, [map, theme])

  useEffect(() => {
    if (map === null) return
    const source = map.getSource(DOSE_RADIUS_LAYER_ID) as maplibregl.GeoJSONSource | undefined
    if (source === undefined) return

    map.setLayoutProperty(DOSE_RADIUS_LAYER_ID, 'visibility', visible ? 'visible' : 'none')
    if (!visible || schoolPoint === null || doseRadiusMi === null) {
      source.setData({ type: 'FeatureCollection', features: [] })
      return
    }
    source.setData({ type: 'FeatureCollection', features: [buildCirclePolygon(schoolPoint, doseRadiusMi)] })
  }, [map, schoolPoint, doseRadiusMi, visible])
}
