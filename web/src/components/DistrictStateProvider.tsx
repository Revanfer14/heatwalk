import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  DistrictStateContext,
  type DistrictPanelView,
  type DistrictStateContextValue,
  type LayerVisibility,
  type MisclassifiedHighlight,
} from '@/lib/districtStateContext'
import type { SchoolNational } from '@/lib/districtTypes'

const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  officialZone: true,
  doseZone: true,
  doseRadius: true,
}

const DEFAULT_MISCLASSIFIED_HIGHLIGHT: MisclassifiedHighlight = {
  walkShouldBus: false,
  busNotNeeded: false,
}

export default function DistrictStateProvider({ children }: { children: ReactNode }) {
  const [panelView, setPanelView] = useState<DistrictPanelView>('schools')
  const [focusedSchoolId, setFocusedSchoolId] = useState<string | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>(DEFAULT_LAYER_VISIBILITY)
  const [misclassifiedHighlight, setMisclassifiedHighlight] = useState<MisclassifiedHighlight>(
    DEFAULT_MISCLASSIFIED_HIGHLIGHT,
  )
  const [schoolSearchText, setSchoolSearchText] = useState('')
  const [includeUnanalyzed, setIncludeUnanalyzed] = useState(false)
  const [unanalyzedNotice, setUnanalyzedNotice] = useState<SchoolNational | null>(null)
  const [legendCollapsed, setLegendCollapsed] = useState(false)

  const toggleLayer = useCallback((layer: keyof LayerVisibility) => {
    setLayerVisibility((current) => ({ ...current, [layer]: !current[layer] }))
  }, [])

  const toggleMisclassifiedHighlight = useCallback((category: keyof MisclassifiedHighlight) => {
    setMisclassifiedHighlight((current) => ({ ...current, [category]: !current[category] }))
  }, [])

  const toggleLegendCollapsed = useCallback(() => {
    setLegendCollapsed((current) => !current)
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
      misclassifiedHighlight,
      toggleMisclassifiedHighlight,
      schoolSearchText,
      setSchoolSearchText,
      includeUnanalyzed,
      setIncludeUnanalyzed,
      unanalyzedNotice,
      setUnanalyzedNotice,
      legendCollapsed,
      toggleLegendCollapsed,
    }),
    [
      panelView,
      focusedSchoolId,
      selectedBlockId,
      layerVisibility,
      toggleLayer,
      misclassifiedHighlight,
      toggleMisclassifiedHighlight,
      schoolSearchText,
      includeUnanalyzed,
      unanalyzedNotice,
      legendCollapsed,
      toggleLegendCollapsed,
    ],
  )

  return <DistrictStateContext.Provider value={value}>{children}</DistrictStateContext.Provider>
}
