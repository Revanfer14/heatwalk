import { useEffect, type RefObject } from 'react'
import type maplibregl from 'maplibre-gl'
import { useElementSize } from '@/hooks/useElementSize'
import { PANEL_INSET_PX, PANEL_WIDTH_PX } from '@/lib/panelGeometry'

interface UseMapPanelPaddingOptions {
  isSidePanel: boolean
  collapsed: boolean
  panelRef: RefObject<HTMLElement | null>
}

export function useMapPanelPadding(
  map: maplibregl.Map | null,
  { isSidePanel, collapsed, panelRef }: UseMapPanelPaddingOptions,
): void {
  const { height: panelHeightPx } = useElementSize(panelRef)

  useEffect(() => {
    if (map === null) return

    const sidePanelPadding = collapsed
      ? { top: PANEL_INSET_PX, left: PANEL_INSET_PX, right: PANEL_INSET_PX, bottom: PANEL_INSET_PX }
      : {
          top: PANEL_INSET_PX,
          left: PANEL_INSET_PX * 2 + PANEL_WIDTH_PX,
          right: PANEL_INSET_PX,
          bottom: PANEL_INSET_PX,
        }

    const bottomSheetPadding = {
      top: PANEL_INSET_PX,
      left: PANEL_INSET_PX,
      right: PANEL_INSET_PX,
      bottom: panelHeightPx > 0 ? panelHeightPx : PANEL_INSET_PX,
    }

    const chosenPadding = isSidePanel ? sidePanelPadding : bottomSheetPadding
    map.setPadding(chosenPadding)

    return () => {
      map.setPadding({ top: 0, left: 0, right: 0, bottom: 0 })
    }
  }, [map, isSidePanel, collapsed, panelHeightPx])
}
