import { useEffect, useMemo } from 'react'
import type maplibregl from 'maplibre-gl'
import { getRouteColors } from '@/lib/mapPaint'
import { buildBlockTempLabels } from '@/lib/blockTempLabelFeatures'
import type { BlocksGeoJson } from '@/lib/types'

const SOURCE_ID = 'heatwalk-block-temp-labels'
const LAYER_ID = 'heatwalk-block-temp-labels'
const LABEL_MIN_ZOOM = 12.5
const LABEL_TEXT_SIZE = 10
const LABEL_HALO_WIDTH_PX = 1.5

interface UseBlockTempLabelsLayerInput {
  map: maplibregl.Map | null
  blocks: BlocksGeoJson | null
  visible: boolean
  theme: string
}

export function useBlockTempLabelsLayer(input: UseBlockTempLabelsLayerInput): void {
  const { map, blocks, visible, theme } = input
  const labels = useMemo(() => buildBlockTempLabels(blocks), [blocks])

  useEffect(() => {
    if (map === null) return

    if (map.getSource(SOURCE_ID) === undefined) {
      const colors = getRouteColors()
      map.addSource(SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        minzoom: LABEL_MIN_ZOOM,
        layout: {
          'text-field': ['get', 'temp_label'],
          'text-font': ['Noto Sans Bold'],
          'text-size': LABEL_TEXT_SIZE,
        },
        paint: {
          'text-color': colors.ink,
          'text-halo-color': colors.bg,
          'text-halo-width': LABEL_HALO_WIDTH_PX,
        },
      })
    }

    return () => {
      if (map.getLayer(LAYER_ID) !== undefined) map.removeLayer(LAYER_ID)
      if (map.getSource(SOURCE_ID) !== undefined) map.removeSource(SOURCE_ID)
    }
  }, [map])

  useEffect(() => {
    if (map === null || map.getLayer(LAYER_ID) === undefined) return
    const colors = getRouteColors()
    map.setPaintProperty(LAYER_ID, 'text-color', colors.ink)
    map.setPaintProperty(LAYER_ID, 'text-halo-color', colors.bg)
  }, [map, theme])

  useEffect(() => {
    if (map === null) return
    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
    source?.setData(labels)
  }, [map, labels])

  useEffect(() => {
    if (map === null || map.getLayer(LAYER_ID) === undefined) return
    map.setLayoutProperty(LAYER_ID, 'visibility', visible ? 'visible' : 'none')
  }, [map, visible])
}
