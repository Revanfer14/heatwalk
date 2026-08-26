import { distanceKm, type LonLat } from '@/lib/geoDistance'
import type { GraphNode } from '@/lib/types'

export function nearestNode(
  nodes: Record<string, GraphNode>,
  point: LonLat,
  candidateNodeIds: Iterable<string>,
): string | null {
  let closestNodeId: string | null = null
  let closestDistanceKm = Infinity

  for (const nodeId of candidateNodeIds) {
    const nodeCoordinates = nodes[nodeId]
    if (nodeCoordinates === undefined) continue

    const distance = distanceKm(point, nodeCoordinates)
    if (distance < closestDistanceKm) {
      closestDistanceKm = distance
      closestNodeId = nodeId
    }
  }

  return closestNodeId
}
