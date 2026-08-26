import { createContext } from 'react'
import type { SchoolNational } from '@/lib/districtTypes'

export interface LayerVisibility {
  officialZone: boolean
  doseZone: boolean
  doseRadius: boolean
}

export interface DistrictStateContextValue {
  selectedBlockId: string | null
  setSelectedBlockId: (blockId: string | null) => void
  layerVisibility: LayerVisibility
  toggleLayer: (layer: keyof LayerVisibility) => void
  schoolSearchText: string
  setSchoolSearchText: (text: string) => void
  includeUnanalyzed: boolean
  setIncludeUnanalyzed: (value: boolean) => void
  unanalyzedNotice: SchoolNational | null
  setUnanalyzedNotice: (school: SchoolNational | null) => void
}

export const DistrictStateContext = createContext<DistrictStateContextValue | null>(null)
