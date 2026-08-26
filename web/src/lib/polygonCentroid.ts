import type { PolygonGeometry } from '@/lib/types'
import type { LonLat } from '@/lib/geoDistance'

export function polygonCentroid(geometry: PolygonGeometry): LonLat {
  const ring = geometry.coordinates[0]
  const points = ring.slice(0, -1)
  const sumLon = points.reduce((sum, [lon]) => sum + lon, 0)
  const sumLat = points.reduce((sum, [, lat]) => sum + lat, 0)
  return [sumLon / points.length, sumLat / points.length]
}
