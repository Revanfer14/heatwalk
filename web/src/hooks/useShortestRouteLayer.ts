import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import type { SolvedRouteLeg } from '@/lib/types'
import { getRouteColors } from '@/lib/mapPaint'
import { rampColorExpression, rampSegmentFeatureCollection } from '@/lib/routeRampFeatures'

const SHORTEST_LAYER_ID = 'heatwalk-shortest-route'
const FR16_LINE_WIDTH = 2
const FR16_LINE_WIDTH_SELECTED = 3
const FR16_DASH = [4, 4]
const HEAT_LINE_WIDTH = 2.5
const HEAT_LINE_WIDTH_SELECTED = 3.5

function emptyFeatureCollection() {
  return { type: 'FeatureCollection' as const, features: [] }
}

interface UseShortestRouteLayerInput {
  map: maplibregl.Map | null
  shortest: SolvedRouteLeg | null
  baselineC: number
  hideHeatData: boolean
  theme: string
  selected?: boolean
}

export function useShortestRouteLayer(input: UseShortestRouteLayerInput): void {
  const { map, shortest, baselineC, hideHeatData, theme, selected = false } = input

  useEffect(() => {
    if (map === null) return

    if (map.getSource(SHORTEST_LAYER_ID) === undefined) {
      map.addSource(SHORTEST_LAYER_ID, { type: 'geojson', data: emptyFeatureCollection() })
      map.addLayer({
        id: SHORTEST_LAYER_ID,
        type: 'line',
        source: SHORTEST_LAYER_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {},
      })
    }

    return () => {
      if (map.getLayer(SHORTEST_LAYER_ID) !== undefined) map.removeLayer(SHORTEST_LAYER_ID)
      if (map.getSource(SHORTEST_LAYER_ID) !== undefined) map.removeSource(SHORTEST_LAYER_ID)
    }
  }, [map])

  useEffect(() => {
    if (map === null) return
    const source = map.getSource(SHORTEST_LAYER_ID) as maplibregl.GeoJSONSource | undefined
    source?.setData(shortest !== null ? rampSegmentFeatureCollection(shortest.segments) : emptyFeatureCollection())
  }, [map, shortest])

  useEffect(() => {
    if (map === null || map.getLayer(SHORTEST_LAYER_ID) === undefined) return
    const colors = getRouteColors()

    if (hideHeatData) {
      map.setPaintProperty(SHORTEST_LAYER_ID, 'line-color', colors.inkSubtle)
      map.setPaintProperty(SHORTEST_LAYER_ID, 'line-width', selected ? FR16_LINE_WIDTH_SELECTED : FR16_LINE_WIDTH)
      map.setPaintProperty(SHORTEST_LAYER_ID, 'line-dasharray', FR16_DASH)
      return
    }

    const colorExpression = selected
      ? colors.routeCoolest
      : rampColorExpression(baselineC, shortest?.segments ?? [], colors.routeHeatCool, colors.routeHeatHot)
    map.setPaintProperty(SHORTEST_LAYER_ID, 'line-color', colorExpression)
    map.setPaintProperty(SHORTEST_LAYER_ID, 'line-width', selected ? HEAT_LINE_WIDTH_SELECTED : HEAT_LINE_WIDTH)
    map.setPaintProperty(SHORTEST_LAYER_ID, 'line-dasharray', null)
  }, [map, hideHeatData, baselineC, shortest, theme, selected])
}
