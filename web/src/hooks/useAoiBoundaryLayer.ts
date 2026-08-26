import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import { getRouteColors } from '@/lib/mapPaint'
import type { Tile } from '@/lib/types'

const AOI_BOUNDARY_LAYER_ID = 'heatwalk-aoi-boundary'

function bboxToPolygon(bbox: Tile['bbox']) {
  const [west, south, east, north] = bbox
  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [west, south],
              [east, south],
              [east, north],
              [west, north],
              [west, south],
            ],
          ],
        },
      },
    ],
  }
}

export function useAoiBoundaryLayer(map: maplibregl.Map | null, tile: Tile | null, theme: string): void {
  useEffect(() => {
    if (map === null || tile === null) return

    if (map.getSource(AOI_BOUNDARY_LAYER_ID) === undefined) {
      map.addSource(AOI_BOUNDARY_LAYER_ID, { type: 'geojson', data: bboxToPolygon(tile.bbox) })
      map.addLayer({
        id: AOI_BOUNDARY_LAYER_ID,
        type: 'line',
        source: AOI_BOUNDARY_LAYER_ID,
        paint: { 'line-width': 1, 'line-dasharray': [2, 2] },
      })
    }

    const colors = getRouteColors()
    map.setPaintProperty(AOI_BOUNDARY_LAYER_ID, 'line-color', colors.inkSubtle)

    return () => {
      if (map.getLayer(AOI_BOUNDARY_LAYER_ID) !== undefined) map.removeLayer(AOI_BOUNDARY_LAYER_ID)
      if (map.getSource(AOI_BOUNDARY_LAYER_ID) !== undefined) map.removeSource(AOI_BOUNDARY_LAYER_ID)
    }
  }, [map, tile, theme])
}
