import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import type { SolvedRouteLeg } from '@/lib/types'
import { getRouteColors } from '@/lib/mapPaint'

const ALTERNATE_LAYER_ID = 'heatwalk-alternate-routes'
const ALTERNATE_LINE_WIDTH = 2
const ALTERNATE_LINE_WIDTH_SELECTED = 3

function emptyFeatureCollection() {
  return { type: 'FeatureCollection' as const, features: [] }
}

function alternateFeatureCollection(alternates: SolvedRouteLeg[], selectedIndex: number | null) {
  return {
    type: 'FeatureCollection' as const,
    features: alternates.map((alternate, index) => ({
      type: 'Feature' as const,
      properties: { selected: index === selectedIndex },
      geometry: { type: 'LineString' as const, coordinates: alternate.geometry },
    })),
  }
}

interface UseAlternateRoutesLayerInput {
  map: maplibregl.Map | null
  alternates: SolvedRouteLeg[]
  selectedIndex: number | null
  hideHeatData: boolean
  theme: string
}

export function useAlternateRoutesLayer(input: UseAlternateRoutesLayerInput): void {
  const { map, alternates, selectedIndex, hideHeatData, theme } = input

  useEffect(() => {
    if (map === null) return

    if (map.getSource(ALTERNATE_LAYER_ID) === undefined) {
      map.addSource(ALTERNATE_LAYER_ID, { type: 'geojson', data: emptyFeatureCollection() })
      map.addLayer({
        id: ALTERNATE_LAYER_ID,
        type: 'line',
        source: ALTERNATE_LAYER_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-width': ['case', ['get', 'selected'], ALTERNATE_LINE_WIDTH_SELECTED, ALTERNATE_LINE_WIDTH],
        },
      })
    }

    return () => {
      if (map.getLayer(ALTERNATE_LAYER_ID) !== undefined) map.removeLayer(ALTERNATE_LAYER_ID)
      if (map.getSource(ALTERNATE_LAYER_ID) !== undefined) map.removeSource(ALTERNATE_LAYER_ID)
    }
  }, [map])

  useEffect(() => {
    if (map === null) return
    const source = map.getSource(ALTERNATE_LAYER_ID) as maplibregl.GeoJSONSource | undefined
    source?.setData(hideHeatData ? emptyFeatureCollection() : alternateFeatureCollection(alternates, selectedIndex))
  }, [map, alternates, selectedIndex, hideHeatData])

  useEffect(() => {
    if (map === null || map.getLayer(ALTERNATE_LAYER_ID) === undefined) return
    const colors = getRouteColors()
    map.setPaintProperty(ALTERNATE_LAYER_ID, 'line-color', [
      'case',
      ['get', 'selected'],
      colors.routeCoolest,
      colors.inkSubtle,
    ])
  }, [map, theme])
}
