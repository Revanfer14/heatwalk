import type { BlockFeature, BlocksGeoJson } from '@/lib/types'

function isPointInRing(point: [number, number], ring: number[][]): boolean {
  const [x, y] = point
  let inside = false

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }

  return inside
}

export function isPointInPolygon(point: [number, number], rings: number[][][]): boolean {
  if (rings.length === 0) return false
  if (!isPointInRing(point, rings[0])) return false

  for (let holeIndex = 1; holeIndex < rings.length; holeIndex += 1) {
    if (isPointInRing(point, rings[holeIndex])) return false
  }

  return true
}

export function findBlockAt(blocks: BlocksGeoJson, point: [number, number]): BlockFeature | null {
  for (const feature of blocks.features) {
    if (isPointInPolygon(point, feature.geometry.coordinates)) {
      return feature
    }
  }
  return null
}
