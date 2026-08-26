import type { RouteSegment } from '@/lib/routeSolver'

const TOP_DOSE_PER_METER_FRACTION = 0.2

export function topDosePerMeterSegments(segments: RouteSegment[]): RouteSegment[] {
  if (segments.length === 0) return []
  const ranked = [...segments].sort((a, b) => b.dose / b.len_m - a.dose / a.len_m)
  const topCount = Math.max(1, Math.ceil(ranked.length * TOP_DOSE_PER_METER_FRACTION))
  return ranked.slice(0, topCount)
}
