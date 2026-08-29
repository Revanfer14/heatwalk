import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import type { FilterSpecification } from 'maplibre-gl'
import { getRouteColors } from '@/lib/mapPaint'
import { buildMisclassifiedFilter } from '@/lib/misclassifiedHighlight'
import type { MisclassifiedHighlight } from '@/lib/districtStateContext'
import type { BlocksGeoJson } from '@/lib/types'

const SOURCE_ID = 'heatwalk-misclassified-highlight'
const CASING_LAYER_ID = 'heatwalk-misclassified-highlight-casing'
const LINE_LAYER_ID = 'heatwalk-misclassified-highlight-line'
const ALL_LAYER_IDS = [CASING_LAYER_ID, LINE_LAYER_ID]

interface UseMisclassifiedHighlightLayerInput {
  map: maplibregl.Map | null
  blocks: BlocksGeoJson | null
  highlight: MisclassifiedHighlight
  schoolId: string | null
  walkRadiusMi: number | null
  hideHeatData: boolean
  theme: string
}

function addLayers(map: maplibregl.Map): void {
  map.addSource(SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  map.addLayer({ id: CASING_LAYER_ID, type: 'line', source: SOURCE_ID, paint: { 'line-width': 4 } })
  map.addLayer({ id: LINE_LAYER_ID, type: 'line', source: SOURCE_ID, paint: { 'line-width': 2 } })
}

export function useMisclassifiedHighlightLayer(input: UseMisclassifiedHighlightLayerInput): void {
  const { map, blocks, highlight, schoolId, walkRadiusMi, hideHeatData, theme } = input

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
    if (map === null || map.getLayer(CASING_LAYER_ID) === undefined) return
    const colors = getRouteColors()
    map.setPaintProperty(CASING_LAYER_ID, 'line-color', colors.bg)
    map.setPaintProperty(LINE_LAYER_ID, 'line-color', colors.ink)
  }, [map, theme])

  useEffect(() => {
    if (map === null) return
    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
    source?.setData(blocks ?? { type: 'FeatureCollection', features: [] })
  }, [map, blocks])

  useEffect(() => {
    if (map === null || map.getLayer(CASING_LAYER_ID) === undefined) return

    const filter = schoolId !== null && walkRadiusMi !== null
      ? buildMisclassifiedFilter(highlight, schoolId, walkRadiusMi)
      : null

    const visibility = filter !== null && !hideHeatData ? 'visible' : 'none'
    for (const layerId of ALL_LAYER_IDS) {
      map.setLayoutProperty(layerId, 'visibility', visibility)
      map.setFilter(layerId, filter as FilterSpecification | null)
    }
  }, [map, highlight, schoolId, walkRadiusMi, hideHeatData])
}
