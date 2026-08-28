import type { GraphEdge, SchoolTemps } from '@/lib/types'
import { doseCMin, weightCool } from '@/lib/dose'
import type { RoutingAdjacency, RoutingEdge } from '@/lib/dijkstra'
import type { LiveEdgeTemperatures } from '@/lib/edgeLiveTemperatures'

interface WinningEdge {
  u: string
  v: string
  edgeId: string
  len_m: number
  temp_c: number
  peak_c: number
  dose: number
}

function undirectedPairKey(u: string, v: string): string {
  return u < v ? `${u}::${v}` : `${v}::${u}`
}

function applyTemperatureOffset(
  storedTempC: number,
  storedPeakC: number,
  storedDose: number,
  lenM: number,
  baselineC: number,
  temperatureOffsetC: number,
): { temp_c: number; peak_c: number; dose: number } {
  if (temperatureOffsetC === 0) {
    return { temp_c: storedTempC, peak_c: storedPeakC, dose: storedDose }
  }
  const temp_c = storedTempC + temperatureOffsetC
  const peak_c = storedPeakC + temperatureOffsetC
  return { temp_c, peak_c, dose: doseCMin(temp_c, lenM, baselineC) }
}

function resolveEdgeTemperature(
  edgeId: string,
  storedTempC: number,
  storedPeakC: number,
  storedDose: number,
  lenM: number,
  baselineC: number,
  temperatureOffsetC: number,
  liveEdgeTemps: LiveEdgeTemperatures | undefined,
): { temp_c: number; peak_c: number; dose: number } {
  const live = liveEdgeTemps?.[edgeId]
  if (live !== undefined) {
    return { temp_c: live.temp_c, peak_c: live.peak_c, dose: doseCMin(live.temp_c, lenM, baselineC) }
  }
  return applyTemperatureOffset(storedTempC, storedPeakC, storedDose, lenM, baselineC, temperatureOffsetC)
}

function selectWinningEdges(
  edges: Record<string, GraphEdge>,
  tempsEdges: SchoolTemps['edges'],
  hour: string,
  baselineC: number,
  temperatureOffsetC: number,
  liveEdgeTemps: LiveEdgeTemperatures | undefined,
): Map<string, WinningEdge> {
  const winners = new Map<string, WinningEdge>()

  for (const [edgeId, edge] of Object.entries(edges)) {
    const key = undirectedPairKey(edge.u, edge.v)
    const existing = winners.get(key)
    if (existing !== undefined && existing.len_m <= edge.len_m) continue

    const hourTriple = tempsEdges[edgeId]?.[hour]
    if (hourTriple === undefined) continue
    const [storedTempC, storedPeakC, storedDose] = hourTriple
    const { temp_c, peak_c, dose } = resolveEdgeTemperature(
      edgeId,
      storedTempC,
      storedPeakC,
      storedDose,
      edge.len_m,
      baselineC,
      temperatureOffsetC,
      liveEdgeTemps,
    )

    winners.set(key, { u: edge.u, v: edge.v, edgeId, len_m: edge.len_m, temp_c, peak_c, dose })
  }

  return winners
}

function addDirectedEdge(
  adjacency: RoutingAdjacency,
  from: string,
  to: string,
  winner: WinningEdge,
  lambdaDetour: number,
): void {
  const routingEdge: RoutingEdge = {
    to,
    edgeId: winner.edgeId,
    len_m: winner.len_m,
    temp_c: winner.temp_c,
    peak_c: winner.peak_c,
    dose: winner.dose,
    weight_cool: weightCool(winner.dose, winner.len_m, lambdaDetour),
  }
  const existingList = adjacency.get(from)
  if (existingList === undefined) {
    adjacency.set(from, [routingEdge])
  } else {
    existingList.push(routingEdge)
  }
}

export function buildRoutingGraph(
  edges: Record<string, GraphEdge>,
  tempsEdges: SchoolTemps['edges'],
  hour: string,
  lambdaDetour: number,
  baselineC: number,
  temperatureOffsetC: number = 0,
  liveEdgeTemps?: LiveEdgeTemperatures,
): RoutingAdjacency {
  const winners = selectWinningEdges(edges, tempsEdges, hour, baselineC, temperatureOffsetC, liveEdgeTemps)
  const adjacency: RoutingAdjacency = new Map()

  for (const winner of winners.values()) {
    addDirectedEdge(adjacency, winner.u, winner.v, winner, lambdaDetour)
    addDirectedEdge(adjacency, winner.v, winner.u, winner, lambdaDetour)
  }

  return adjacency
}
