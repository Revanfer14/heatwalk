export interface RoutingEdge {
  to: string
  edgeId: string
  len_m: number
  temp_c: number
  peak_c: number
  dose: number
  weight_cool: number
}

export type RoutingAdjacency = Map<string, RoutingEdge[]>

export type RoutingWeightKey = 'len_m' | 'weight_cool'

export interface DijkstraResult {
  distances: Map<string, number>
  previous: Map<string, string | null>
}

export function dijkstra(
  adjacency: RoutingAdjacency,
  source: string,
  weightKey: RoutingWeightKey,
): DijkstraResult {
  const distances = new Map<string, number>()
  const previous = new Map<string, string | null>()
  const unvisited = new Set<string>()

  for (const node of adjacency.keys()) {
    distances.set(node, Infinity)
    previous.set(node, null)
    unvisited.add(node)
  }
  distances.set(source, 0)

  while (unvisited.size > 0) {
    let current: string | null = null
    let currentDistance = Infinity
    for (const node of unvisited) {
      const distance = distances.get(node) ?? Infinity
      if (distance < currentDistance) {
        currentDistance = distance
        current = node
      }
    }
    if (current === null || currentDistance === Infinity) break
    unvisited.delete(current)

    for (const edge of adjacency.get(current) ?? []) {
      if (!unvisited.has(edge.to)) continue
      const candidateDistance = currentDistance + edge[weightKey]
      if (candidateDistance < (distances.get(edge.to) ?? Infinity)) {
        distances.set(edge.to, candidateDistance)
        previous.set(edge.to, current)
      }
    }
  }

  return { distances, previous }
}

export function reconstructPath(result: DijkstraResult, source: string, target: string): string[] | null {
  if (source === target) return [source]
  const targetDistance = result.distances.get(target)
  if (targetDistance === undefined || !Number.isFinite(targetDistance)) return null

  const path: string[] = []
  let current: string | null = target
  while (current !== null) {
    path.push(current)
    if (current === source) break
    current = result.previous.get(current) ?? null
  }
  path.reverse()
  return path[0] === source ? path : null
}
