import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  DistrictStateContext,
  type DistrictPanelView,
  type DistrictStateContextValue,
  type LayerVisibility,
} from '@/lib/districtStateContext'
import type { SchoolNational } from '@/lib/districtTypes'

const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  officialZone: true,
  doseZone: true,
  doseRadius: true,
}

export default function DistrictStateProvider({ children }: { children: ReactNode }) {
  const [panelView, setPanelView] = useState<DistrictPanelView>('schools')
  const [focusedSchoolId, setFocusedSchoolId] = useState<string | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>(DEFAULT_LAYER_VISIBILITY)
  const [schoolSearchText, setSchoolSearchText] = useState('')
  const [includeUnanalyzed, setIncludeUnanalyzed] = useState(false)
  const [unanalyzedNotice, setUnanalyzedNotice] = useState<SchoolNational | null>(null)

  const toggleLayer = useCallback((layer: keyof LayerVisibility) => {
    setLayerVisibility((current) => ({ ...current, [layer]: !current[layer] }))
  }, [])

  const value = useMemo<DistrictStateContextValue>(
    () => ({
      panelView,
      setPanelView,
      focusedSchoolId,
      setFocusedSchoolId,
      selectedBlockId,
      setSelectedBlockId,
      layerVisibility,
      toggleLayer,
      schoolSearchText,
      setSchoolSearchText,
      includeUnanalyzed,
      setIncludeUnanalyzed,
      unanalyzedNotice,
      setUnanalyzedNotice,
    }),
    [
      panelView,
      focusedSchoolId,
      selectedBlockId,
      layerVisibility,
      toggleLayer,
      schoolSearchText,
      includeUnanalyzed,
      unanalyzedNotice,
    ],
  )

  return <DistrictStateContext.Provider value={value}>{children}</DistrictStateContext.Provider>
}
