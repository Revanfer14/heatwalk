import type { GraphEdge, GraphNode } from '@/lib/types'
import type { RoutingAdjacency } from '@/lib/dijkstra'

function squaredDistance(node: GraphNode, point: number[]): number {
  const dx = node[0] - point[0]
  const dy = node[1] - point[1]
  return dx * dx + dy * dy
}

function orientGeometryFromNode(geom: number[][], fromNode: GraphNode): number[][] {
  const start = geom[0]
  const end = geom[geom.length - 1]
  const distanceToStart = squaredDistance(fromNode, start)
  const distanceToEnd = squaredDistance(fromNode, end)
  return distanceToStart <= distanceToEnd ? geom : [...geom].reverse()
}

export function buildRouteGeometry(
  nodes: Record<string, GraphNode>,
  edges: Record<string, GraphEdge>,
  adjacency: RoutingAdjacency,
  path: string[],
): number[][] {
  const coordinates: number[][] = []

  for (let index = 0; index < path.length - 1; index += 1) {
    const fromId = path[index]
    const toId = path[index + 1]
    const routingEdge = (adjacency.get(fromId) ?? []).find((candidate) => candidate.to === toId)
    if (routingEdge === undefined) continue

    const edge = edges[routingEdge.edgeId]
    const orientedGeometry = orientGeometryFromNode(edge.geom, nodes[fromId])
    const segment = index === 0 ? orientedGeometry : orientedGeometry.slice(1)
    coordinates.push(...segment)
  }

  return coordinates
}
