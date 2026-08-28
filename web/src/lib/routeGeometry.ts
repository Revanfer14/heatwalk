import type { GraphEdge, GraphNode, RouteHeatSegment } from '@/lib/types'
import type { RoutingAdjacency } from '@/lib/dijkstra'

function squaredDistance(node: GraphNode, point: number[]): number {
  const dx = node[0] - point[0]
  const dy = node[1] - point[1]
  return dx * dx + dy * dy
}

export function orientGeometryFromNode(geom: number[][], fromNode: GraphNode): number[][] {
  const start = geom[0]
  const end = geom[geom.length - 1]
  const distanceToStart = squaredDistance(fromNode, start)
  const distanceToEnd = squaredDistance(fromNode, end)
  return distanceToStart <= distanceToEnd ? geom : [...geom].reverse()
}

export function buildRouteSegments(
  nodes: Record<string, GraphNode>,
  edges: Record<string, GraphEdge>,
  adjacency: RoutingAdjacency,
  path: string[],
): RouteHeatSegment[] {
  const segments: RouteHeatSegment[] = []

  for (let index = 0; index < path.length - 1; index += 1) {
    const fromId = path[index]
    const toId = path[index + 1]
    const routingEdge = (adjacency.get(fromId) ?? []).find((candidate) => candidate.to === toId)
    if (routingEdge === undefined) continue

    const edge = edges[routingEdge.edgeId]
    const orientedGeometry = orientGeometryFromNode(edge.geom, nodes[fromId])
    segments.push({ edgeId: routingEdge.edgeId, temp_c: routingEdge.temp_c, geometry: orientedGeometry })
  }

  return segments
}

export function flattenRouteGeometry(segments: RouteHeatSegment[]): number[][] {
  const coordinates: number[][] = []
  segments.forEach((segment, index) => {
    coordinates.push(...(index === 0 ? segment.geometry : segment.geometry.slice(1)))
  })
  return coordinates
}
