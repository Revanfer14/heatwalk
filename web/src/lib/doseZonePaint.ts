import type { RouteColors } from '@/lib/mapPaint'

const FILL_OPACITY_BY_CLASS: Record<string, number> = { green: 0.18, yellow: 0.22, red: 0.3 }
const DEFAULT_FILL_OPACITY = 0.1

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

export function buildFillOpacityExpression() {
  return [
    'match',
    ['get', 'class'],
    'green',
    FILL_OPACITY_BY_CLASS.green,
    'yellow',
    FILL_OPACITY_BY_CLASS.yellow,
    'red',
    FILL_OPACITY_BY_CLASS.red,
    DEFAULT_FILL_OPACITY,
  ]
}
