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

export type EdgeWeightPenalties = Map<string, number>

export interface DijkstraResult {
  distances: Map<string, number>
  previous: Map<string, string | null>
}

interface HeapEntry {
  distance: number
  node: string
}

class MinHeap {
  private entries: HeapEntry[] = []

  size(): number {
    return this.entries.length
  }

  push(entry: HeapEntry): void {
    this.entries.push(entry)
    this.bubbleUp(this.entries.length - 1)
  }

  pop(): HeapEntry | undefined {
    const top = this.entries[0]
    const last = this.entries.pop()
    if (this.entries.length > 0 && last !== undefined) {
      this.entries[0] = last
      this.bubbleDown(0)
    }
    return top
  }

  private bubbleUp(startIndex: number): void {
    let index = startIndex
    while (index > 0) {
      const parentIndex = (index - 1) >> 1
      if (this.entries[parentIndex].distance <= this.entries[index].distance) break
      ;[this.entries[parentIndex], this.entries[index]] = [this.entries[index], this.entries[parentIndex]]
      index = parentIndex
    }
  }

  private bubbleDown(startIndex: number): void {
    let index = startIndex
    const length = this.entries.length
    for (;;) {
      const leftIndex = index * 2 + 1
      const rightIndex = index * 2 + 2
      let smallestIndex = index
      if (leftIndex < length && this.entries[leftIndex].distance < this.entries[smallestIndex].distance) {
        smallestIndex = leftIndex
      }
      if (rightIndex < length && this.entries[rightIndex].distance < this.entries[smallestIndex].distance) {
        smallestIndex = rightIndex
      }
      if (smallestIndex === index) break
      ;[this.entries[smallestIndex], this.entries[index]] = [this.entries[index], this.entries[smallestIndex]]
      index = smallestIndex
    }
  }
}

export function dijkstra(
  adjacency: RoutingAdjacency,
  source: string,
  weightKey: RoutingWeightKey,
  edgePenalties?: EdgeWeightPenalties,
): DijkstraResult {
  const distances = new Map<string, number>()
  const previous = new Map<string, string | null>()
  const visited = new Set<string>()
  const queue = new MinHeap()

  distances.set(source, 0)
  previous.set(source, null)
  queue.push({ distance: 0, node: source })

  while (queue.size() > 0) {
    const current = queue.pop()
    if (current === undefined) break
    if (visited.has(current.node)) continue
    if (current.distance > (distances.get(current.node) ?? Infinity)) continue
    visited.add(current.node)

    for (const edge of adjacency.get(current.node) ?? []) {
      if (visited.has(edge.to)) continue
      const penalty = edgePenalties?.get(edge.edgeId) ?? 1
      const candidateDistance = current.distance + edge[weightKey] * penalty
      if (candidateDistance < (distances.get(edge.to) ?? Infinity)) {
        distances.set(edge.to, candidateDistance)
        previous.set(edge.to, current.node)
        queue.push({ distance: candidateDistance, node: edge.to })
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
