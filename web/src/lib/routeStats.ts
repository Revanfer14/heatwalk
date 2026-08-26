import { walkMinutes } from '@/lib/dose'
import type { RoutingAdjacency, RoutingEdge } from '@/lib/dijkstra'

export interface RouteStats {
  len_m: number
  minutes: number
  mean_c: number
  peak_c: number
  dose: number
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function findEdge(adjacency: RoutingAdjacency, from: string, to: string): RoutingEdge {
  const edge = (adjacency.get(from) ?? []).find((candidate) => candidate.to === to)
  if (edge === undefined) {
    throw new Error(`No edge between ${from} and ${to} in routing graph`)
  }
  return edge
}

export function summarizeRoute(adjacency: RoutingAdjacency, path: string[]): RouteStats {
  let totalLenM = 0
  let totalDose = 0
  let weightedTempSum = 0
  let peakC = 0

  for (let index = 0; index < path.length - 1; index += 1) {
    const edge = findEdge(adjacency, path[index], path[index + 1])
    totalLenM += edge.len_m
    totalDose += edge.dose
    weightedTempSum += edge.temp_c * edge.len_m
    if (edge.peak_c > peakC) peakC = edge.peak_c
  }

  const meanC = totalLenM > 0 ? weightedTempSum / totalLenM : 0

  return {
    len_m: roundTo(totalLenM, 1),
    minutes: roundTo(walkMinutes(totalLenM), 1),
    mean_c: roundTo(meanC, 2),
    peak_c: roundTo(peakC, 2),
    dose: roundTo(totalDose, 2),
  }
}

export function deltaDosePercent(shortestDose: number, coolestDose: number): number {
  if (shortestDose <= 0) return 0
  return Math.round(((coolestDose - shortestDose) / shortestDose) * 100)
}
