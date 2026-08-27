import { useEffect, useMemo } from 'react'
import type maplibregl from 'maplibre-gl'
import { getRouteColors } from '@/lib/mapPaint'
import { toNationalSchoolsFeatureCollection } from '@/lib/nationalSchoolsGeoJson'
import { useSchoolPinsLayer } from '@/hooks/useSchoolPinsLayer'
import type { SchoolNational } from '@/lib/districtTypes'

export const NATIONAL_SCHOOLS_SOURCE_ID = 'heatwalk-national-schools'
export const NATIONAL_SCHOOLS_UNANALYZED_LAYER_ID = 'heatwalk-national-schools-unanalyzed'
export const NATIONAL_SCHOOLS_ANALYZED_LAYER_ID = 'heatwalk-national-schools-analyzed'
export const NATIONAL_SCHOOLS_PIN_SOURCE_ID = 'heatwalk-national-schools-pins'
export const NATIONAL_SCHOOLS_PIN_LAYER_ID = 'heatwalk-national-schools-pin'

const SCHOOL_PIN_MIN_ZOOM = 10
const SCHOOL_DOT_MAX_ZOOM = SCHOOL_PIN_MIN_ZOOM

interface UseNationalSchoolsLayerInput {
  map: maplibregl.Map | null
  nationalSchools: SchoolNational[] | null
  theme: string
}

export function useNationalSchoolsLayer(input: UseNationalSchoolsLayerInput): void {
  const { map, nationalSchools, theme } = input
  const featureCollection = useMemo(
    () => (nationalSchools !== null ? toNationalSchoolsFeatureCollection(nationalSchools) : null),
    [nationalSchools],
  )

  useEffect(() => {
    if (map === null) return

    if (map.getSource(NATIONAL_SCHOOLS_SOURCE_ID) === undefined) {
      map.addSource(NATIONAL_SCHOOLS_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: NATIONAL_SCHOOLS_UNANALYZED_LAYER_ID,
        type: 'circle',
        source: NATIONAL_SCHOOLS_SOURCE_ID,
        filter: ['==', ['get', 'analyzed'], false],
        maxzoom: SCHOOL_DOT_MAX_ZOOM,
        paint: { 'circle-radius': 2.5, 'circle-opacity': 0.5 },
      })
      map.addLayer({
        id: NATIONAL_SCHOOLS_ANALYZED_LAYER_ID,
        type: 'circle',
        source: NATIONAL_SCHOOLS_SOURCE_ID,
        filter: ['==', ['get', 'analyzed'], true],
        maxzoom: SCHOOL_DOT_MAX_ZOOM,
        paint: { 'circle-radius': 5, 'circle-stroke-width': 1.5 },
      })
    }

    return () => {
      for (const layerId of [NATIONAL_SCHOOLS_ANALYZED_LAYER_ID, NATIONAL_SCHOOLS_UNANALYZED_LAYER_ID]) {
        if (map.getLayer(layerId) !== undefined) map.removeLayer(layerId)
      }
      if (map.getSource(NATIONAL_SCHOOLS_SOURCE_ID) !== undefined) map.removeSource(NATIONAL_SCHOOLS_SOURCE_ID)
    }
  }, [map])

  useEffect(() => {
    if (map === null || map.getLayer(NATIONAL_SCHOOLS_ANALYZED_LAYER_ID) === undefined) return
    const colors = getRouteColors()
    map.setPaintProperty(NATIONAL_SCHOOLS_UNANALYZED_LAYER_ID, 'circle-color', colors.inkSubtle)
    map.setPaintProperty(NATIONAL_SCHOOLS_ANALYZED_LAYER_ID, 'circle-color', colors.ink)
    map.setPaintProperty(NATIONAL_SCHOOLS_ANALYZED_LAYER_ID, 'circle-stroke-color', colors.bg)
  }, [map, theme])

  useEffect(() => {
    if (map === null || featureCollection === null) return
    const source = map.getSource(NATIONAL_SCHOOLS_SOURCE_ID) as maplibregl.GeoJSONSource | undefined
    source?.setData(featureCollection)
  }, [map, featureCollection])

  useSchoolPinsLayer({
    map,
    sourceId: NATIONAL_SCHOOLS_PIN_SOURCE_ID,
    layerId: NATIONAL_SCHOOLS_PIN_LAYER_ID,
    featureCollection,
    theme,
    minZoom: SCHOOL_PIN_MIN_ZOOM,
  })
}
