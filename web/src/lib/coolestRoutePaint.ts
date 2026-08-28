import type { RouteColors } from '@/lib/mapPaint'

export const CASING_LINE_WIDTH = 8
export const CASING_LINE_WIDTH_SELECTED = 9.5
export const COOLEST_LINE_WIDTH_SELECTED = 6.5
export const NEUTRAL_LINE_WIDTH = 2.5
export const FR16_LINE_WIDTH = 2
export const FR16_LINE_WIDTH_SELECTED = 3
export const FR16_DASH = [4, 4]

export interface CoolestRoutePaint {
  lineColor: string
  lineWidth: number
  dashArray: number[] | null
  casingVisible: boolean
}

interface CoolestRoutePaintInput {
  colors: RouteColors
  hideHeatData: boolean
  routeFailed: boolean
  selected: boolean
}

export function coolestRoutePaint(input: CoolestRoutePaintInput): CoolestRoutePaint {
  const { colors, hideHeatData, routeFailed, selected } = input

  if (hideHeatData) {
    return {
      lineColor: colors.inkSubtle,
      lineWidth: selected ? FR16_LINE_WIDTH_SELECTED : FR16_LINE_WIDTH,
      dashArray: FR16_DASH,
      casingVisible: false,
    }
  }

  const lineWidth = selected ? COOLEST_LINE_WIDTH_SELECTED : NEUTRAL_LINE_WIDTH
  const lineColor = routeFailed ? colors.zoneBus : selected ? colors.routeCoolest : colors.inkSubtle

  return { lineColor, lineWidth, dashArray: null, casingVisible: selected }
}
