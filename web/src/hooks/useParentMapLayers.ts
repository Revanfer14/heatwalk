import type maplibregl from 'maplibre-gl'
import { useRouteLayers } from '@/hooks/useRouteLayers'
import { useShortestRouteLayer } from '@/hooks/useShortestRouteLayer'
import { useAlternateRoutesLayer } from '@/hooks/useAlternateRoutesLayer'
import { useAoiBoundaryLayer } from '@/hooks/useAoiBoundaryLayer'
import { useOfficialZoneLayer } from '@/hooks/useOfficialZoneLayer'
import { usePinMarker } from '@/hooks/usePinMarker'
import { useDestinationSchoolPin } from '@/hooks/useDestinationSchoolPin'
import { useRouteFocus } from '@/hooks/useRouteFocus'
import { selectedAlternateIndex, selectedRouteGeometry, type SelectedRouteId } from '@/lib/selectedRouteId'
import type { PinPosition } from '@/lib/appStateContext'
import type { School, SolvedRoutes, Tile } from '@/lib/types'

interface UseParentMapLayersInput {
  map: maplibregl.Map | null
  tile: Tile | null
  theme: string
  hideHeatData: boolean
  solvedRoutes: SolvedRoutes | null
  selectedRouteId: SelectedRouteId
  baselineC: number
  routeFailed: boolean
  selectedSchool: School | null
  pin: PinPosition
  onPinChange: (pin: PinPosition) => void
  onPinDragEnd?: (pin: PinPosition) => void
}

export function useParentMapLayers(input: UseParentMapLayersInput): void {
  const {
    map,
    tile,
    theme,
    hideHeatData,
    solvedRoutes,
    selectedRouteId,
    baselineC,
    routeFailed,
    selectedSchool,
    pin,
    onPinChange,
    onPinDragEnd,
  } = input

  const alternateIndex = selectedAlternateIndex(selectedRouteId)
  const focusGeometry = solvedRoutes !== null ? selectedRouteGeometry(solvedRoutes, selectedRouteId) : null

  useAlternateRoutesLayer({
    map,
    alternates: solvedRoutes?.alternates ?? [],
    selectedIndex: alternateIndex,
    hideHeatData,
    theme,
  })
  useShortestRouteLayer({
    map,
    shortest: solvedRoutes?.shortest ?? null,
    baselineC,
    hideHeatData,
    theme,
    selected: selectedRouteId === 'shortest',
  })
  useRouteLayers({
    map,
    coolest: solvedRoutes?.coolest ?? null,
    hideHeatData,
    routeFailed,
    theme,
    selected: selectedRouteId === 'coolest',
  })
  useRouteFocus(map, focusGeometry, selectedSchool !== null ? `${selectedSchool.id}:${selectedRouteId}` : null)
  useAoiBoundaryLayer(map, tile, theme)
  useOfficialZoneLayer({
    map,
    schoolPoint: selectedSchool !== null ? [selectedSchool.lon, selectedSchool.lat] : null,
    walkRadiusMi: selectedSchool?.walk_radius_mi ?? null,
    visible: true,
    theme,
  })
  usePinMarker({ map, pin, onPinChange, onPinDragEnd })
  useDestinationSchoolPin({ map, school: selectedSchool, theme })
}
