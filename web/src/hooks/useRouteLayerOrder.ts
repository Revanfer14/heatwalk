import { useEffect } from 'react'
import type maplibregl from 'maplibre-gl'
import { ALTERNATE_LAYER_ID } from '@/hooks/useAlternateRoutesLayer'
import { AOI_BOUNDARY_LAYER_ID } from '@/hooks/useAoiBoundaryLayer'
import { CASING_LAYER_ID, COOLEST_LAYER_ID } from '@/hooks/useRouteLayers'
import { SHORTEST_LAYER_ID } from '@/hooks/useShortestRouteLayer'
import { selectedAlternateIndex, type SelectedRouteId } from '@/lib/selectedRouteId'

export function useRouteLayerOrder(map: maplibregl.Map | null, selectedRouteId: SelectedRouteId): void {
  useEffect(() => {
    if (map === null || map.getLayer(AOI_BOUNDARY_LAYER_ID) === undefined) return

    const isAlternateSelected = selectedAlternateIndex(selectedRouteId) !== null
    const layersBottomToTop = [
      { layerId: ALTERNATE_LAYER_ID, selected: isAlternateSelected },
      { layerId: SHORTEST_LAYER_ID, selected: selectedRouteId === 'shortest' },
      { layerId: CASING_LAYER_ID, selected: selectedRouteId === 'coolest' },
      { layerId: COOLEST_LAYER_ID, selected: selectedRouteId === 'coolest' },
    ]
    layersBottomToTop.sort((a, b) => Number(a.selected) - Number(b.selected))

    for (const { layerId } of layersBottomToTop) {
      if (map.getLayer(layerId) !== undefined) map.moveLayer(layerId, AOI_BOUNDARY_LAYER_ID)
    }
  }, [map, selectedRouteId])
}
