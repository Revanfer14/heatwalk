import { useEffect, useMemo } from 'react'
import { useAppState } from '@/hooks/useAppState'
import { useSchoolData } from '@/hooks/useSchoolData'
import { useSolvedRoutes } from '@/hooks/useSolvedRoutes'
import { findBlockAt } from '@/lib/pointInPolygon'
import { distanceMiles, type LonLat } from '@/lib/geoDistance'
import type { BlockFeature, Tile } from '@/lib/types'

function isPinInBbox(pin: LonLat, bbox: Tile['bbox'] | undefined): boolean {
  if (bbox === undefined) return false
  const [west, south, east, north] = bbox
  return pin[0] >= west && pin[0] <= east && pin[1] >= south && pin[1] <= north
}

export function useParentRouteData() {
  const appState = useAppState()
  const { schools, tile, selectedSchoolId, pin, hour, setHour } = appState
  const selectedSchool = schools.find((school) => school.id === selectedSchoolId) ?? null
  const { data: schoolData, loading: schoolDataLoading, error: schoolDataError } = useSchoolData(selectedSchoolId)

  useEffect(() => {
    if (hour === null && schoolData !== null) {
      setHour(schoolData.temps.meta.canonical_hour)
    }
  }, [hour, schoolData, setHour])

  const originPoint: LonLat = [pin.lon, pin.lat]
  const isPinInAoi = isPinInBbox(originPoint, tile?.bbox)
  const schoolPoint: LonLat | null = selectedSchool !== null ? [selectedSchool.lon, selectedSchool.lat] : null

  const solvedRoutes = useSolvedRoutes(
    schoolData?.graph ?? null,
    schoolData?.temps ?? null,
    schoolPoint,
    originPoint,
    hour,
  )

  const distanceToSchoolMiles = schoolPoint !== null ? distanceMiles(schoolPoint, originPoint) : 0

  const matchedBlock = useMemo<BlockFeature | null>(() => {
    if (schoolData === null) return null
    return findBlockAt(schoolData.blocks, [pin.lon, pin.lat])
  }, [schoolData, pin.lon, pin.lat])

  const routeFailed = matchedBlock?.properties.class === 'red'

  return {
    ...appState,
    selectedSchool,
    schoolData,
    schoolDataLoading,
    schoolDataError,
    isPinInAoi,
    solvedRoutes,
    distanceToSchoolMiles,
    matchedBlock,
    routeFailed,
  }
}
