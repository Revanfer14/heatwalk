import { createContext } from 'react'
import type { SchoolNational } from '@/lib/districtTypes'

export interface LayerVisibility {
  officialZone: boolean
  doseZone: boolean
  doseRadius: boolean
}

export type DistrictPanelView = 'schools' | 'school' | 'block'

export interface DistrictStateContextValue {
  panelView: DistrictPanelView
  setPanelView: (view: DistrictPanelView) => void
  focusedSchoolId: string | null
  setFocusedSchoolId: (schoolId: string | null) => void
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
