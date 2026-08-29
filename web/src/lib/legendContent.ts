import type { BlockClass } from '@/lib/types'

export const BLOCK_CLASS_DEFINITION: Record<BlockClass, string> = {
  green: 'Shortest route already stays under the dose threshold.',
  yellow: 'Shortest route crosses the threshold, but a cooler route stays under it.',
  red: 'Even the coolest available route crosses the threshold.',
}

export interface LegendRadiusLine {
  id: 'officialZone' | 'doseRadius'
  label: string
  dashed: boolean
}

export const LEGEND_RADIUS_LINES: LegendRadiusLine[] = [
  { id: 'officialZone', label: 'Official walk zone', dashed: true },
  { id: 'doseRadius', label: 'Dose-equivalent radius', dashed: false },
]

export const LEGEND_AOI_LABEL = 'Area of interest boundary'
export const LEGEND_TEMP_LABEL_NOTE = 'Block temperature labels appear when you zoom in close enough to read them.'
