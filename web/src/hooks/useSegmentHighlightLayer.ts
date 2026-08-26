import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import { getRouteColors } from '@/lib/mapPaint'
import type { RouteSegment } from '@/lib/routeSolver'

const SEGMENT_HIGHLIGHT_LAYER_ID = 'heatwalk-segment-highlight'

function toFeatureCollection(segments: RouteSegment[]) {
  return {
    type: 'FeatureCollection' as const,
    features: segments.map((segment) => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: segment.geometry },
    })),
  }
}

interface UseSegmentHighlightLayerInput {
  map: maplibregl.Map | null
  segments: RouteSegment[]
  theme: string
}

export function useSegmentHighlightLayer(input: UseSegmentHighlightLayerInput): void {
  const { map, segments, theme } = input

  useEffect(() => {
    if (map === null) return

    if (map.getSource(SEGMENT_HIGHLIGHT_LAYER_ID) === undefined) {
      map.addSource(SEGMENT_HIGHLIGHT_LAYER_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: SEGMENT_HIGHLIGHT_LAYER_ID,
        type: 'line',
        source: SEGMENT_HIGHLIGHT_LAYER_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-width': 7, 'line-opacity': 1 },
      })
    }

    return () => {
      if (map.getLayer(SEGMENT_HIGHLIGHT_LAYER_ID) !== undefined) map.removeLayer(SEGMENT_HIGHLIGHT_LAYER_ID)
      if (map.getSource(SEGMENT_HIGHLIGHT_LAYER_ID) !== undefined) map.removeSource(SEGMENT_HIGHLIGHT_LAYER_ID)
    }
  }, [map])

  useEffect(() => {
    if (map === null || map.getLayer(SEGMENT_HIGHLIGHT_LAYER_ID) === undefined) return
    map.setPaintProperty(SEGMENT_HIGHLIGHT_LAYER_ID, 'line-color', getRouteColors().zoneBus)
  }, [map, theme])

  useEffect(() => {
    if (map === null) return
    const source = map.getSource(SEGMENT_HIGHLIGHT_LAYER_ID) as maplibregl.GeoJSONSource | undefined
    source?.setData(toFeatureCollection(segments))
  }, [map, segments])
}
