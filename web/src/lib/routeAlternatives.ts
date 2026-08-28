import { dijkstra, reconstructPath, type EdgeWeightPenalties, type RoutingAdjacency } from '@/lib/dijkstra'

export const ALTERNATE_ROUTE_COUNT = 2
const ALTERNATE_PENALTY_FACTOR = 2.5
const MAX_SHARED_LENGTH_RATIO = 0.7
const MAX_ALTERNATE_ATTEMPTS = 6

interface PathEdge {
  edgeId: string
  len_m: number
}

function pathEdges(adjacency: RoutingAdjacency, path: string[]): PathEdge[] {
  const edges: PathEdge[] = []
  for (let index = 0; index < path.length - 1; index += 1) {
    const edge = (adjacency.get(path[index]) ?? []).find((candidate) => candidate.to === path[index + 1])
    if (edge !== undefined) edges.push({ edgeId: edge.edgeId, len_m: edge.len_m })
  }
  return edges
}

function sharedLengthRatio(candidateEdges: PathEdge[], acceptedEdgeIdSets: Set<string>[]): number {
  const candidateLength = candidateEdges.reduce((sum, edge) => sum + edge.len_m, 0)
  if (candidateLength === 0) return 1

  let sharedLength = 0
  for (const edge of candidateEdges) {
    if (acceptedEdgeIdSets.some((edgeIds) => edgeIds.has(edge.edgeId))) sharedLength += edge.len_m
  }
  return sharedLength / candidateLength
}

function applyPenalty(penalties: EdgeWeightPenalties, edges: PathEdge[]): void {
  for (const edge of edges) {
    penalties.set(edge.edgeId, (penalties.get(edge.edgeId) ?? 1) * ALTERNATE_PENALTY_FACTOR)
  }
}

export function findAlternateRoutes(
  adjacency: RoutingAdjacency,
  schoolNode: string,
  originNode: string,
  acceptedPaths: string[][],
): string[][] {
  const penalties: EdgeWeightPenalties = new Map()
  const acceptedEdgeIdSets = acceptedPaths.map((path) => new Set(pathEdges(adjacency, path).map((edge) => edge.edgeId)))
  for (const edgeIds of acceptedEdgeIdSets) {
    for (const edgeId of edgeIds) penalties.set(edgeId, ALTERNATE_PENALTY_FACTOR)
  }

  const alternates: string[][] = []
  const alternateEdgeIdSets: Set<string>[] = []

  for (let attempt = 0; attempt < MAX_ALTERNATE_ATTEMPTS && alternates.length < ALTERNATE_ROUTE_COUNT; attempt += 1) {
    const result = dijkstra(adjacency, schoolNode, 'weight_cool', penalties)
    const candidatePath = reconstructPath(result, schoolNode, originNode)
    if (candidatePath === null) break

    const candidateEdges = pathEdges(adjacency, candidatePath)
    const ratio = sharedLengthRatio(candidateEdges, [...acceptedEdgeIdSets, ...alternateEdgeIdSets])

    if (ratio <= MAX_SHARED_LENGTH_RATIO) {
      alternates.push(candidatePath)
      alternateEdgeIdSets.push(new Set(candidateEdges.map((edge) => edge.edgeId)))
    }
    applyPenalty(penalties, candidateEdges)
  }

  return alternates
}
