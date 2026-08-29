import type { MisclassifiedHighlight } from '@/lib/districtStateContext'
import type { SchoolMisclassified, SchoolSummary } from '@/lib/types'

export const BUS_NOT_NEEDED_MAX_EXCESS_MI = 0.25

export const MISCLASSIFIED_HIGHLIGHT_LABELS: Record<keyof MisclassifiedHighlight, string> = {
  walkShouldBus: 'Walks, should get bus',
  busNotNeeded: "Gets bus, doesn't need it",
}

export function misclassifiedCountsForHour(summary: SchoolSummary, hour: string | null): SchoolMisclassified {
  if (hour === null) return summary.misclassified
  return summary.misclassified_by_hour[hour] ?? summary.misclassified
}

export type MapFilterExpression = unknown[]

const HAS_STUDENTS: MapFilterExpression = ['>', ['get', 'kids_est'], 0]

function walkShouldBusFilter(): MapFilterExpression {
  return ['all', HAS_STUDENTS, ['==', ['get', 'status_now'], 'walk'], ['==', ['get', 'class'], 'red']]
}

function busNotNeededFilter(walkRadiusMi: number): MapFilterExpression {
  return [
    'all',
    HAS_STUDENTS,
    ['==', ['get', 'status_now'], 'bus'],
    ['==', ['get', 'class'], 'green'],
    ['<=', ['-', ['get', 'distance_mi'], walkRadiusMi], BUS_NOT_NEEDED_MAX_EXCESS_MI],
  ]
}

export function buildMisclassifiedFilter(
  highlight: MisclassifiedHighlight,
  schoolId: string,
  walkRadiusMi: number,
): MapFilterExpression | null {
  const activeCategoryFilters: MapFilterExpression[] = []
  if (highlight.walkShouldBus) activeCategoryFilters.push(walkShouldBusFilter())
  if (highlight.busNotNeeded) activeCategoryFilters.push(busNotNeededFilter(walkRadiusMi))

  if (activeCategoryFilters.length === 0) return null

  return ['all', ['==', ['get', 'school_id'], schoolId], ['any', ...activeCategoryFilters]]
}
