import type { BlockClass, StatusNow, StatusRec } from '@/lib/types'

export const BLOCK_CLASS_LABEL: Record<BlockClass, string> = {
  green: 'Safe to walk',
  yellow: 'Route choice needed',
  red: 'Bus recommended',
}

export const STATUS_NOW_LABEL: Record<StatusNow, string> = {
  walk: 'Walks today',
  bus: 'Bused today',
}

export const STATUS_REC_LABEL: Record<StatusRec, string> = {
  walk: 'Keep walking',
  reroute: 'Reroute recommended',
  bus_eligible: 'Bus eligible',
}
