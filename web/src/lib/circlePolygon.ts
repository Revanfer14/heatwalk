import type { LonLat } from '@/lib/geoDistance'

const EARTH_RADIUS_KM = 6371
const KM_PER_MILE = 1.60934
const CIRCLE_STEPS = 64

export function buildCirclePolygon(center: LonLat, radiusMi: number, steps: number = CIRCLE_STEPS) {
  const radiusKm = radiusMi * KM_PER_MILE
  const [centerLon, centerLat] = center
  const latRadians = (centerLat * Math.PI) / 180
  const coordinates: number[][] = []

  for (let i = 0; i <= steps; i += 1) {
    const angle = (i / steps) * 2 * Math.PI
    const dx = radiusKm * Math.cos(angle)
    const dy = radiusKm * Math.sin(angle)
    const deltaLon = (dx / (EARTH_RADIUS_KM * Math.cos(latRadians))) * (180 / Math.PI)
    const deltaLat = (dy / EARTH_RADIUS_KM) * (180 / Math.PI)
    coordinates.push([centerLon + deltaLon, centerLat + deltaLat])
  }

  return {
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'Polygon' as const, coordinates: [coordinates] },
  }
}
