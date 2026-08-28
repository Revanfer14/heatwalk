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
