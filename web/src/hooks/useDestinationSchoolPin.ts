import { useMemo } from 'react'
import type maplibregl from 'maplibre-gl'
import { useSchoolPinsLayer, type SchoolPinFeatureCollection } from '@/hooks/useSchoolPinsLayer'
import type { School } from '@/lib/types'

const DESTINATION_SCHOOL_PIN_SOURCE_ID = 'heatwalk-destination-school-pin'
const DESTINATION_SCHOOL_PIN_LAYER_ID = 'heatwalk-destination-school-pin'
const DESTINATION_SCHOOL_PIN_MIN_ZOOM = 0

function toDestinationSchoolFeatureCollection(school: School): SchoolPinFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: school.name, analyzed: true },
        geometry: { type: 'Point', coordinates: [school.lon, school.lat] },
      },
    ],
  }
}

interface UseDestinationSchoolPinInput {
  map: maplibregl.Map | null
  school: School | null
  theme: string
}

export function useDestinationSchoolPin(input: UseDestinationSchoolPinInput): void {
  const { map, school, theme } = input
  const featureCollection = useMemo(
    () => (school !== null ? toDestinationSchoolFeatureCollection(school) : null),
    [school],
  )

  useSchoolPinsLayer({
    map,
    sourceId: DESTINATION_SCHOOL_PIN_SOURCE_ID,
    layerId: DESTINATION_SCHOOL_PIN_LAYER_ID,
    featureCollection,
    theme,
    minZoom: DESTINATION_SCHOOL_PIN_MIN_ZOOM,
  })
}
