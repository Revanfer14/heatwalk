import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import { getRouteColors } from '@/lib/mapPaint'
import { registerHatchPattern, HATCH_PATTERN_ID } from '@/lib/hatchPattern'
import { buildClassColorExpression, buildFillOpacityExpression } from '@/lib/doseZonePaint'
import type { BlocksGeoJson } from '@/lib/types'

const FILL_LAYER_ID = 'heatwalk-dose-zone-fill'
const HATCH_LAYER_ID = 'heatwalk-dose-zone-hatch'
const LINE_SOLID_LAYER_ID = 'heatwalk-dose-zone-line-solid'
const LINE_DASHED_LAYER_ID = 'heatwalk-dose-zone-line-dashed'
const ALL_LAYER_IDS = [FILL_LAYER_ID, HATCH_LAYER_ID, LINE_SOLID_LAYER_ID, LINE_DASHED_LAYER_ID]

interface UseDoseZoneLayerInput {
  map: maplibregl.Map | null
  blocks: BlocksGeoJson | null
  visible: boolean
  theme: string
  onBlockClick: (blockId: string) => void
}

function addLayers(map: maplibregl.Map): void {
  map.addSource(FILL_LAYER_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
  map.addLayer({ id: FILL_LAYER_ID, type: 'fill', source: FILL_LAYER_ID, paint: {} })
  map.addLayer({
    id: HATCH_LAYER_ID,
    type: 'fill',
    source: FILL_LAYER_ID,
    filter: ['==', ['get', 'class'], 'red'],
    paint: { 'fill-pattern': HATCH_PATTERN_ID, 'fill-opacity': 1 },
  })
  map.addLayer({
    id: LINE_SOLID_LAYER_ID,
    type: 'line',
    source: FILL_LAYER_ID,
    filter: ['!=', ['get', 'class'], 'yellow'],
    paint: { 'line-width': 1 },
  })
  map.addLayer({
    id: LINE_DASHED_LAYER_ID,
    type: 'line',
    source: FILL_LAYER_ID,
    filter: ['==', ['get', 'class'], 'yellow'],
    paint: { 'line-width': 1, 'line-dasharray': [2, 2] },
  })
}

export function useDoseZoneLayer(input: UseDoseZoneLayerInput): void {
  const { map, blocks, visible, theme, onBlockClick } = input

  useEffect(() => {
    if (map === null) return
    if (map.getSource(FILL_LAYER_ID) === undefined) addLayers(map)

    return () => {
      for (const layerId of [HATCH_LAYER_ID, LINE_DASHED_LAYER_ID, LINE_SOLID_LAYER_ID, FILL_LAYER_ID]) {
        if (map.getLayer(layerId) !== undefined) map.removeLayer(layerId)
      }
      if (map.getSource(FILL_LAYER_ID) !== undefined) map.removeSource(FILL_LAYER_ID)
    }
  }, [map])

  useEffect(() => {
    if (map === null || map.getLayer(FILL_LAYER_ID) === undefined) return
    const colors = getRouteColors()
    registerHatchPattern(map, colors.zoneBus)
    map.setPaintProperty(FILL_LAYER_ID, 'fill-color', buildClassColorExpression(colors))
    map.setPaintProperty(FILL_LAYER_ID, 'fill-opacity', buildFillOpacityExpression())
    map.setPaintProperty(LINE_SOLID_LAYER_ID, 'line-color', buildClassColorExpression(colors))
    map.setPaintProperty(LINE_DASHED_LAYER_ID, 'line-color', colors.zoneReroute)
  }, [map, theme])

  useEffect(() => {
    if (map === null) return
    const source = map.getSource(FILL_LAYER_ID) as maplibregl.GeoJSONSource | undefined
    source?.setData(blocks ?? { type: 'FeatureCollection', features: [] })
  }, [map, blocks])

  useEffect(() => {
    if (map === null || map.getLayer(FILL_LAYER_ID) === undefined) return
    const visibility = visible ? 'visible' : 'none'
    for (const layerId of ALL_LAYER_IDS) map.setLayoutProperty(layerId, 'visibility', visibility)
  }, [map, visible])

  useEffect(() => {
    if (map === null || map.getLayer(FILL_LAYER_ID) === undefined) return

    const handleClick = (event: maplibregl.MapLayerMouseEvent): void => {
      const blockId = event.features?.[0]?.properties?.block_id as string | undefined
      if (blockId !== undefined) onBlockClick(blockId)
    }
    const setPointerCursor = (): void => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const clearCursor = (): void => {
      map.getCanvas().style.cursor = ''
    }

    map.on('click', FILL_LAYER_ID, handleClick)
    map.on('mouseenter', FILL_LAYER_ID, setPointerCursor)
    map.on('mouseleave', FILL_LAYER_ID, clearCursor)

    return () => {
      map.off('click', FILL_LAYER_ID, handleClick)
      map.off('mouseenter', FILL_LAYER_ID, setPointerCursor)
      map.off('mouseleave', FILL_LAYER_ID, clearCursor)
    }
  }, [map, onBlockClick])
}
