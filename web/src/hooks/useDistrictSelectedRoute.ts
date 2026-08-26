import { useMemo } from 'react'
import { useSolvedRoutes } from '@/hooks/useSolvedRoutes'
import { solveCoolestPathSegments } from '@/lib/routeSolver'
import { topDosePerMeterSegments } from '@/lib/segmentHighlight'
import { polygonCentroid } from '@/lib/polygonCentroid'
import type { SchoolGraph, SchoolTemps, BlockFeature } from '@/lib/types'
import type { LonLat } from '@/lib/geoDistance'

export function useDistrictSelectedRoute(
  graph: SchoolGraph | null,
  temps: SchoolTemps | null,
  schoolPoint: LonLat | null,
  selectedBlock: BlockFeature | null,
  hour: string | null,
) {
  const blockCentroid = useMemo(
    () => (selectedBlock !== null ? polygonCentroid(selectedBlock.geometry) : null),
    [selectedBlock],
  )

  const solvedRoutes = useSolvedRoutes(graph, temps, schoolPoint, blockCentroid, hour)

  const highlightedSegments = useMemo(() => {
    if (graph === null || temps === null || schoolPoint === null || blockCentroid === null || hour === null) {
      return []
    }
    if (selectedBlock?.properties.class !== 'red') return []
    const segments = solveCoolestPathSegments(graph, temps, schoolPoint, blockCentroid, hour)
    return segments !== null ? topDosePerMeterSegments(segments) : []
  }, [graph, temps, schoolPoint, blockCentroid, hour, selectedBlock])

  return { solvedRoutes, highlightedSegments }
}
