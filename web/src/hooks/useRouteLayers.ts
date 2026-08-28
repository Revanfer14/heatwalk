import { useEffect, useRef } from 'react'
import type maplibregl from 'maplibre-gl'
import type { SolvedRouteLeg } from '@/lib/types'
import { getRouteColors } from '@/lib/mapPaint'

const CASING_LAYER_ID = 'heatwalk-coolest-route-casing'
const COOLEST_LAYER_ID = 'heatwalk-coolest-route'
const FADE_DURATION_MS = 120
const CASING_LINE_WIDTH = 8
const CASING_LINE_WIDTH_SELECTED = 9.5
const COOLEST_LINE_WIDTH = 5
const COOLEST_LINE_WIDTH_SELECTED = 6.5

function emptyFeatureCollection() {
  return { type: 'FeatureCollection' as const, features: [] }
}

function lineFeatureCollection(coordinates: number[][]) {
  return {
    type: 'FeatureCollection' as const,
    features: [
      { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates } },
    ],
  }
}

interface UseRouteLayersInput {
  map: maplibregl.Map | null
  coolest: SolvedRouteLeg | null
  hideHeatData: boolean
  routeFailed: boolean
  theme: string
  selected?: boolean
}

export function useRouteLayers(input: UseRouteLayersInput): void {
  const { map, coolest, hideHeatData, routeFailed, theme, selected = false } = input
  const hasRenderedCoolestRef = useRef(false)

  useEffect(() => {
    if (map === null) return

    if (map.getSource(CASING_LAYER_ID) === undefined) {
      map.addSource(CASING_LAYER_ID, { type: 'geojson', data: emptyFeatureCollection() })
      map.addSource(COOLEST_LAYER_ID, { type: 'geojson', data: emptyFeatureCollection() })

      map.addLayer({
        id: CASING_LAYER_ID,
        type: 'line',
        source: CASING_LAYER_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-width': CASING_LINE_WIDTH, 'line-opacity-transition': { duration: FADE_DURATION_MS } },
      })
      map.addLayer({
        id: COOLEST_LAYER_ID,
        type: 'line',
        source: COOLEST_LAYER_ID,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-width': COOLEST_LINE_WIDTH, 'line-opacity-transition': { duration: FADE_DURATION_MS } },
      })
    }

    return () => {
      for (const layerId of [COOLEST_LAYER_ID, CASING_LAYER_ID]) {
        if (map.getLayer(layerId) !== undefined) map.removeLayer(layerId)
      }
      for (const sourceId of [CASING_LAYER_ID, COOLEST_LAYER_ID]) {
        if (map.getSource(sourceId) !== undefined) map.removeSource(sourceId)
      }
      hasRenderedCoolestRef.current = false
    }
  }, [map])

  useEffect(() => {
    if (map === null || map.getLayer(COOLEST_LAYER_ID) === undefined) return
    const colors = getRouteColors()
    map.setPaintProperty(CASING_LAYER_ID, 'line-color', colors.bg)
    map.setPaintProperty(COOLEST_LAYER_ID, 'line-color', routeFailed ? colors.zoneBus : colors.routeCoolest)
    map.setPaintProperty(CASING_LAYER_ID, 'line-width', selected ? CASING_LINE_WIDTH_SELECTED : CASING_LINE_WIDTH)
    map.setPaintProperty(COOLEST_LAYER_ID, 'line-width', selected ? COOLEST_LINE_WIDTH_SELECTED : COOLEST_LINE_WIDTH)
  }, [map, routeFailed, theme, selected])

  useEffect(() => {
    if (map === null) return
    const casingSource = map.getSource(CASING_LAYER_ID) as maplibregl.GeoJSONSource | undefined
    const coolestSource = map.getSource(COOLEST_LAYER_ID) as maplibregl.GeoJSONSource | undefined
    if (casingSource === undefined || coolestSource === undefined) return

    const visibility = hideHeatData ? 'none' : 'visible'
    map.setLayoutProperty(CASING_LAYER_ID, 'visibility', visibility)
    map.setLayoutProperty(COOLEST_LAYER_ID, 'visibility', visibility)
    if (hideHeatData) return

    const geometry = coolest !== null ? coolest.geometry : []
    const applyGeometry = (): void => {
      casingSource.setData(lineFeatureCollection(geometry))
      coolestSource.setData(lineFeatureCollection(geometry))
    }

    if (!hasRenderedCoolestRef.current) {
      hasRenderedCoolestRef.current = true
      applyGeometry()
      return
    }

    map.setPaintProperty(CASING_LAYER_ID, 'line-opacity', 0)
    map.setPaintProperty(COOLEST_LAYER_ID, 'line-opacity', 0)

    const timeoutId = setTimeout(() => {
      applyGeometry()
      map.setPaintProperty(CASING_LAYER_ID, 'line-opacity', 1)
      map.setPaintProperty(COOLEST_LAYER_ID, 'line-opacity', 1)
    }, FADE_DURATION_MS)

    return () => clearTimeout(timeoutId)
  }, [map, coolest, hideHeatData])
}
