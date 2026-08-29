import type { RouteColors } from '@/lib/mapPaint'
import type { MapFilterExpression } from '@/lib/misclassifiedHighlight'

const FILL_OPACITY_BY_CLASS: Record<string, number> = { green: 0.18, yellow: 0.22, red: 0.3 }
const DEFAULT_FILL_OPACITY = 0.1

const HIGHLIGHTED_FILL_OPACITY_BY_CLASS: Record<string, number> = { green: 0.45, yellow: 0.5, red: 0.55 }
const DIMMED_FILL_OPACITY = 0.06
const DIMMED_LINE_OPACITY = 0.15
const FULL_LINE_OPACITY = 1

export function buildClassColorExpression(colors: RouteColors) {
  return [
    'match',
    ['get', 'class'],
    'green',
    colors.zoneSafe,
    'yellow',
    colors.zoneReroute,
    'red',
    colors.zoneBus,
    colors.inkSubtle,
  ]
}

function matchByClass(byClass: Record<string, number>, fallback: number) {
  return [
    'match',
    ['get', 'class'],
    'green',
    byClass.green,
    'yellow',
    byClass.yellow,
    'red',
    byClass.red,
    fallback,
  ]
}

export function buildFillOpacityExpression(highlightFilter: MapFilterExpression | null = null) {
  const defaultExpression = matchByClass(FILL_OPACITY_BY_CLASS, DEFAULT_FILL_OPACITY)
  if (highlightFilter === null) return defaultExpression
  const highlightedExpression = matchByClass(HIGHLIGHTED_FILL_OPACITY_BY_CLASS, DEFAULT_FILL_OPACITY)
  return ['case', highlightFilter, highlightedExpression, DIMMED_FILL_OPACITY]
}

export function buildLineOpacityExpression(highlightFilter: MapFilterExpression | null = null) {
  if (highlightFilter === null) return FULL_LINE_OPACITY
  return ['case', highlightFilter, FULL_LINE_OPACITY, DIMMED_LINE_OPACITY]
}
