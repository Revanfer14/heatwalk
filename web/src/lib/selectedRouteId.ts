import type { SolvedRoutes } from '@/lib/types'

export type SelectedRouteId = 'coolest' | 'shortest' | `alternate-${number}`

const ALTERNATE_ROUTE_ID_PATTERN = /^alternate-(\d+)$/

export function selectedAlternateIndex(selectedRouteId: SelectedRouteId): number | null {
  const match = ALTERNATE_ROUTE_ID_PATTERN.exec(selectedRouteId)
  return match !== null ? Number.parseInt(match[1], 10) : null
}

export function selectedRouteGeometry(routes: SolvedRoutes, selectedRouteId: SelectedRouteId): number[][] | null {
  if (selectedRouteId === 'coolest') return routes.coolest.geometry
  if (selectedRouteId === 'shortest') return routes.shortest.geometry
  const alternateIndex = selectedAlternateIndex(selectedRouteId)
  if (alternateIndex === null) return null
  return routes.alternates[alternateIndex]?.geometry ?? null
}
