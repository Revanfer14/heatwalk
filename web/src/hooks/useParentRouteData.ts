import { useMemo } from 'react'
import { useAppState } from '@/hooks/useAppState'
import { useSchoolData } from '@/hooks/useSchoolData'
import { useSolvedRoutes } from '@/hooks/useSolvedRoutes'
import { useLiveTemperature } from '@/hooks/useLiveTemperature'
import { buildLiveEdgeTemperatures } from '@/lib/edgeLiveTemperatures'
import { findBlockAt } from '@/lib/pointInPolygon'
import { distanceMiles, type LonLat } from '@/lib/geoDistance'
import {
  clampToSchoolHour,
  currentOrlandoHour,
  temperatureOffsetC as computeTemperatureOffsetC,
} from '@/lib/liveTemperature'
import type { BlockFeature, Tile } from '@/lib/types'

function isPinInBbox(pin: LonLat, bbox: Tile['bbox'] | undefined): boolean {
  if (bbox === undefined) return false
  const [west, south, east, north] = bbox
  return pin[0] >= west && pin[0] <= east && pin[1] >= south && pin[1] <= north
}

export function useParentRouteData() {
  const appState = useAppState()
  const { schools, tile, selectedSchoolId, pin, hideHeatData } = appState
  const selectedSchool = schools.find((school) => school.id === selectedSchoolId) ?? null
  const { data: schoolData, error: schoolDataError } = useSchoolData(selectedSchoolId)

  const hour = clampToSchoolHour(currentOrlandoHour())
  const {
    status: liveTemperatureStatus,
    liveMedianC,
    grid: liveGrid,
  } = useLiveTemperature(hideHeatData ? null : selectedSchoolId, hour)
  const modeledMedianC = tile?.modeled_median_c_by_hour[hour] ?? null
  const liveOffsetC =
    liveMedianC !== null && modeledMedianC !== null ? computeTemperatureOffsetC(liveMedianC, modeledMedianC) : 0
  const temperatureOffsetC = hideHeatData ? 0 : liveOffsetC
  const isLiveTemperatureActive = !hideHeatData && liveMedianC !== null

  const liveEdgeTemps = useMemo(() => {
    if (hideHeatData || liveGrid === null || schoolData === null) return undefined
    return buildLiveEdgeTemperatures(schoolData.graph.edges, liveGrid)
  }, [hideHeatData, liveGrid, schoolData])

  const originPoint: LonLat = [pin.lon, pin.lat]
  const isPinInAoi = isPinInBbox(originPoint, tile?.bbox)
  const schoolPoint: LonLat | null = selectedSchool !== null ? [selectedSchool.lon, selectedSchool.lat] : null

  const solvedRoutes = useSolvedRoutes(
    schoolData?.graph ?? null,
    schoolData?.temps ?? null,
    schoolPoint,
    originPoint,
    hour,
    temperatureOffsetC,
    liveEdgeTemps,
  )

  const distanceToSchoolMiles = schoolPoint !== null ? distanceMiles(schoolPoint, originPoint) : 0

  const matchedBlock = useMemo<BlockFeature | null>(() => {
    if (schoolData === null) return null
    return findBlockAt(schoolData.blocks, [pin.lon, pin.lat])
  }, [schoolData, pin.lon, pin.lat])

  const routeFailed = matchedBlock?.properties.class === 'red'

  return {
    ...appState,
    hour,
    selectedSchool,
    schoolData,
    schoolDataError,
    isPinInAoi,
    solvedRoutes,
    distanceToSchoolMiles,
    matchedBlock,
    routeFailed,
    liveTemperatureStatus,
    liveMedianC,
    liveOffsetC,
    isLiveTemperatureActive,
  }
}
