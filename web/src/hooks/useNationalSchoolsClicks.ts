import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import { resolveAnalyzedSchoolId } from '@/lib/resolveAnalyzedSchool'
import {
  NATIONAL_SCHOOLS_ANALYZED_LAYER_ID,
  NATIONAL_SCHOOLS_UNANALYZED_LAYER_ID,
  NATIONAL_SCHOOLS_PIN_LAYER_ID,
} from '@/hooks/useNationalSchoolsLayer'
import type { School } from '@/lib/types'
import type { SchoolNational } from '@/lib/districtTypes'

interface UseNationalSchoolsClicksInput {
  map: maplibregl.Map | null
  schools: School[]
  onSelectAnalyzed: (schoolId: string) => void
  onSelectUnanalyzed: (school: SchoolNational) => void
}

export function useNationalSchoolsClicks(input: UseNationalSchoolsClicksInput): void {
  const { map, schools, onSelectAnalyzed, onSelectUnanalyzed } = input

  useEffect(() => {
    if (map === null || map.getLayer(NATIONAL_SCHOOLS_ANALYZED_LAYER_ID) === undefined) return

    const handleAnalyzedClick = (event: maplibregl.MapLayerMouseEvent): void => {
      const properties = event.features?.[0]?.properties
      if (properties === undefined) return
      const schoolId = resolveAnalyzedSchoolId(properties as SchoolNational, schools)
      if (schoolId !== null) onSelectAnalyzed(schoolId)
    }
    const handleUnanalyzedClick = (event: maplibregl.MapLayerMouseEvent): void => {
      const properties = event.features?.[0]?.properties
      if (properties !== undefined) onSelectUnanalyzed(properties as SchoolNational)
    }
    const handlePinClick = (event: maplibregl.MapLayerMouseEvent): void => {
      const properties = event.features?.[0]?.properties
      if (properties === undefined) return
      if (properties.analyzed === true) {
        handleAnalyzedClick(event)
      } else {
        handleUnanalyzedClick(event)
      }
    }
    const setPointerCursor = (): void => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const clearCursor = (): void => {
      map.getCanvas().style.cursor = ''
    }

    const interactiveLayerIds = [
      NATIONAL_SCHOOLS_ANALYZED_LAYER_ID,
      NATIONAL_SCHOOLS_UNANALYZED_LAYER_ID,
      NATIONAL_SCHOOLS_PIN_LAYER_ID,
    ]
    map.on('click', NATIONAL_SCHOOLS_ANALYZED_LAYER_ID, handleAnalyzedClick)
    map.on('click', NATIONAL_SCHOOLS_UNANALYZED_LAYER_ID, handleUnanalyzedClick)
    map.on('click', NATIONAL_SCHOOLS_PIN_LAYER_ID, handlePinClick)
    for (const layerId of interactiveLayerIds) {
      map.on('mouseenter', layerId, setPointerCursor)
      map.on('mouseleave', layerId, clearCursor)
    }

    return () => {
      map.off('click', NATIONAL_SCHOOLS_ANALYZED_LAYER_ID, handleAnalyzedClick)
      map.off('click', NATIONAL_SCHOOLS_UNANALYZED_LAYER_ID, handleUnanalyzedClick)
      map.off('click', NATIONAL_SCHOOLS_PIN_LAYER_ID, handlePinClick)
      for (const layerId of interactiveLayerIds) {
        map.off('mouseenter', layerId, setPointerCursor)
        map.off('mouseleave', layerId, clearCursor)
      }
    }
  }, [map, schools, onSelectAnalyzed, onSelectUnanalyzed])
}
