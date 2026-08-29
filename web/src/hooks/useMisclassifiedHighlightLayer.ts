import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import type { FilterSpecification } from 'maplibre-gl'
import { getRouteColors } from '@/lib/mapPaint'
import { buildClassColorExpression } from '@/lib/doseZonePaint'
import type { MapFilterExpression } from '@/lib/misclassifiedHighlight'
import type { BlocksGeoJson } from '@/lib/types'

const HIGHLIGHT_FILL_OPACITY = 0.55
const HIGHLIGHT_LINE_WIDTH = 1.5

const SOURCE_ID = 'heatwalk-misclassified-highlight'
const FILL_LAYER_ID = 'heatwalk-misclassified-highlight-fill'
const LINE_LAYER_ID = 'heatwalk-misclassified-highlight-line'
const ALL_LAYER_IDS = [FILL_LAYER_ID, LINE_LAYER_ID]

interface UseMisclassifiedHighlightLayerInput {
  map: maplibregl.Map | null
  blocks: BlocksGeoJson | null
  filter: MapFilterExpression | null
  hideHeatData: boolean
  theme: string
}

function addLayers(map: maplibregl.Map): void {
  map.addSource(SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  map.addLayer({ id: FILL_LAYER_ID, type: 'fill', source: SOURCE_ID, paint: { 'fill-opacity': HIGHLIGHT_FILL_OPACITY } })
  map.addLayer({ id: LINE_LAYER_ID, type: 'line', source: SOURCE_ID, paint: { 'line-width': HIGHLIGHT_LINE_WIDTH } })
}

export function useMisclassifiedHighlightLayer(input: UseMisclassifiedHighlightLayerInput): void {
  const { map, blocks, filter, hideHeatData, theme } = input

  useEffect(() => {
    if (map === null) return
    if (map.getSource(SOURCE_ID) === undefined) addLayers(map)

    return () => {
      for (const layerId of ALL_LAYER_IDS) {
        if (map.getLayer(layerId) !== undefined) map.removeLayer(layerId)
      }
      if (map.getSource(SOURCE_ID) !== undefined) map.removeSource(SOURCE_ID)
    }
  }, [map])

  useEffect(() => {
    if (map === null || map.getLayer(FILL_LAYER_ID) === undefined) return
    const colors = getRouteColors()
    map.setPaintProperty(FILL_LAYER_ID, 'fill-color', buildClassColorExpression(colors))
    map.setPaintProperty(LINE_LAYER_ID, 'line-color', colors.ink)
  }, [map, theme])

  useEffect(() => {
    if (map === null) return
    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
    source?.setData(blocks ?? { type: 'FeatureCollection', features: [] })
  }, [map, blocks])

  useEffect(() => {
    if (map === null || map.getLayer(FILL_LAYER_ID) === undefined) return

    const visibility = filter !== null && !hideHeatData ? 'visible' : 'none'
    for (const layerId of ALL_LAYER_IDS) {
      map.setLayoutProperty(layerId, 'visibility', visibility)
      map.setFilter(layerId, filter as FilterSpecification | null)
    }
  }, [map, filter, hideHeatData])
}
