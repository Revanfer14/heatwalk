import type { GraphEdge, SchoolTemps } from '@/lib/types'
import { weightCool } from '@/lib/dose'
import type { RoutingAdjacency, RoutingEdge } from '@/lib/dijkstra'

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

function selectWinningEdges(
  edges: Record<string, GraphEdge>,
  tempsEdges: SchoolTemps['edges'],
  hour: string,
): Map<string, WinningEdge> {
  const winners = new Map<string, WinningEdge>()

  for (const [edgeId, edge] of Object.entries(edges)) {
    const key = undirectedPairKey(edge.u, edge.v)
    const existing = winners.get(key)
    if (existing !== undefined && existing.len_m <= edge.len_m) continue

    const hourTriple = tempsEdges[edgeId]?.[hour]
    if (hourTriple === undefined) continue
    const [temp_c, peak_c, dose] = hourTriple

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
): RoutingAdjacency {
  const winners = selectWinningEdges(edges, tempsEdges, hour)
  const adjacency: RoutingAdjacency = new Map()

  for (const winner of winners.values()) {
    addDirectedEdge(adjacency, winner.u, winner.v, winner, lambdaDetour)
    addDirectedEdge(adjacency, winner.v, winner.u, winner, lambdaDetour)
  }

  return adjacency
}
