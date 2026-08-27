import type { BlockClass } from '@/lib/types'

export interface SchoolNational {
  id: string
  name: string
  lon: number
  lat: number
  analyzed: boolean
}

export interface BlockHourRecord {
  shortest: number
  coolest: number
  mean_c: number
  class: BlockClass
}

export type BlocksHours = Record<string, Record<string, BlockHourRecord>>

export interface SegmentPriorityRow {
  edge_id: string
  street_name: string
  kids_affected: number
  peak_c: number
  peak_shaded_c: number
  dose_reduction_pct: number
}
