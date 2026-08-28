import type { RouteHeatSegment } from '@/lib/types'

export function rampSegmentFeatureCollection(segments: RouteHeatSegment[]) {
  return {
    type: 'FeatureCollection' as const,
    features: segments.map((segment) => ({
      type: 'Feature' as const,
      properties: { temp_c: segment.temp_c },
      geometry: { type: 'LineString' as const, coordinates: segment.geometry },
    })),
  }
}

export function rampColorExpression(
  baselineC: number,
  segments: RouteHeatSegment[],
  coolColor: string,
  hotColor: string,
): unknown[] {
  const hottestC = segments.reduce((max, segment) => Math.max(max, segment.temp_c), baselineC)
  const hotStop = hottestC > baselineC ? hottestC : baselineC + 1
  return ['interpolate', ['linear'], ['get', 'temp_c'], baselineC, coolColor, hotStop, hotColor]
}
