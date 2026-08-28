import type { GraphEdge } from '@/lib/types'
import { sampleGridAt, type LiveTemperatureGrid } from '@/lib/liveTemperatureGrid'
import { distanceKm } from '@/lib/geoDistance'

const SAMPLE_SPACING_M = 20
const METERS_PER_KILOMETER = 1000

export interface LiveEdgeTemperature {
  temp_c: number
  peak_c: number
}

export type LiveEdgeTemperatures = Record<string, LiveEdgeTemperature>

function samplePointsAlongGeometry(geometry: number[][]): number[][] {
  const points: number[][] = []

  for (let index = 0; index < geometry.length - 1; index += 1) {
    const [lon1, lat1] = geometry[index]
    const [lon2, lat2] = geometry[index + 1]
    const segmentLengthM = distanceKm([lon1, lat1], [lon2, lat2]) * METERS_PER_KILOMETER
    const steps = Math.max(Math.round(segmentLengthM / SAMPLE_SPACING_M), 1)
    for (let step = 0; step < steps; step += 1) {
      const fraction = step / steps
      points.push([lon1 + (lon2 - lon1) * fraction, lat1 + (lat2 - lat1) * fraction])
    }
  }

  const lastPoint = geometry[geometry.length - 1]
  if (lastPoint !== undefined) points.push(lastPoint)
  return points
}

export function buildLiveEdgeTemperatures(
  edges: Record<string, GraphEdge>,
  grid: LiveTemperatureGrid,
): LiveEdgeTemperatures {
  const liveEdgeTemps: LiveEdgeTemperatures = {}

  for (const [edgeId, edge] of Object.entries(edges)) {
    const values: number[] = []
    for (const point of samplePointsAlongGeometry(edge.geom)) {
      const value = sampleGridAt(grid, point[0], point[1])
      if (value !== null) values.push(value)
    }
    if (values.length === 0) continue

    const meanTempC = values.reduce((sum, value) => sum + value, 0) / values.length
    liveEdgeTemps[edgeId] = { temp_c: meanTempC, peak_c: Math.max(...values) }
  }

  return liveEdgeTemps
}
