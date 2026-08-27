import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import { getRouteColors } from '@/lib/mapPaint'
import { registerSchoolPinImages, SCHOOL_PIN_IMAGE_ID, SCHOOL_PIN_MUTED_IMAGE_ID } from '@/lib/schoolPinImage'

export interface SchoolPinFeatureCollection {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    properties: { name: string; analyzed: boolean }
    geometry: { type: 'Point'; coordinates: number[] }
  }>
}

const ICON_SIZE_MIN_ZOOM = 10
const ICON_SIZE_MAX_ZOOM = 14
const ICON_SIZE_MIN = 0.55
const ICON_SIZE_MAX = 1
const LABEL_TEXT_SIZE_MIN = 10
const LABEL_TEXT_SIZE_MAX = 12
const LABEL_HALO_WIDTH_PX = 1.5

interface UseSchoolPinsLayerInput {
  map: maplibregl.Map | null
  sourceId: string
  layerId: string
  featureCollection: SchoolPinFeatureCollection | null
  theme: string
  minZoom: number
}

export function useSchoolPinsLayer(input: UseSchoolPinsLayerInput): void {
  const { map, sourceId, layerId, featureCollection, theme, minZoom } = input

  useEffect(() => {
    if (map === null) return
    registerSchoolPinImages(map, getRouteColors())
  }, [map, theme])

  useEffect(() => {
    if (map === null) return

    if (map.getSource(sourceId) === undefined) {
      map.addSource(sourceId, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: layerId,
        type: 'symbol',
        source: sourceId,
        minzoom: minZoom,
        layout: {
          'icon-image': ['case', ['get', 'analyzed'], SCHOOL_PIN_IMAGE_ID, SCHOOL_PIN_MUTED_IMAGE_ID],
          'icon-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            ICON_SIZE_MIN_ZOOM,
            ICON_SIZE_MIN,
            ICON_SIZE_MAX_ZOOM,
            ICON_SIZE_MAX,
          ],
          'icon-anchor': 'center',
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Medium'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            ICON_SIZE_MIN_ZOOM,
            LABEL_TEXT_SIZE_MIN,
            ICON_SIZE_MAX_ZOOM,
            LABEL_TEXT_SIZE_MAX,
          ],
          'text-anchor': 'top',
          'text-offset': [0, 1.1],
          'text-optional': true,
          'symbol-sort-key': ['case', ['get', 'analyzed'], 0, 1],
        },
        paint: { 'text-halo-width': LABEL_HALO_WIDTH_PX },
      })
    }

    return () => {
      if (map.getLayer(layerId) !== undefined) map.removeLayer(layerId)
      if (map.getSource(sourceId) !== undefined) map.removeSource(sourceId)
    }
  }, [map, sourceId, layerId, minZoom])

  useEffect(() => {
    if (map === null || map.getLayer(layerId) === undefined) return
    const colors = getRouteColors()
    map.setPaintProperty(layerId, 'text-color', colors.ink)
    map.setPaintProperty(layerId, 'text-halo-color', colors.bg)
  }, [map, theme, layerId])

  useEffect(() => {
    if (map === null || featureCollection === null) return
    const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined
    source?.setData(featureCollection)
  }, [map, sourceId, featureCollection])

  useEffect(() => {
    if (map === null || map.getLayer(layerId) === undefined) return
    map.moveLayer(layerId)
  }, [map, layerId, featureCollection])
}
