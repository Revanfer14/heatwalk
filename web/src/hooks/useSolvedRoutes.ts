import { useMemo } from 'react'
import type { SchoolGraph, SchoolTemps, SolvedRoutes } from '@/lib/types'
import { solveRoutes } from '@/lib/routeSolver'
import type { LonLat } from '@/lib/geoDistance'

export function useSolvedRoutes(
  graph: SchoolGraph | null,
  temps: SchoolTemps | null,
  schoolPoint: LonLat | null,
  originPoint: LonLat | null,
  hour: string | null,
): SolvedRoutes | null {
  return useMemo(() => {
    if (graph === null || temps === null || schoolPoint === null || originPoint === null || hour === null) {
      return null
    }
    return solveRoutes(graph, temps, schoolPoint, originPoint, hour)
  }, [graph, temps, schoolPoint, originPoint, hour])
}
