import type maplibregl from 'maplibre-gl'
import { useOfficialZoneLayer } from '@/hooks/useOfficialZoneLayer'
import { useDoseZoneLayer } from '@/hooks/useDoseZoneLayer'
import { useBlockTempLabelsLayer } from '@/hooks/useBlockTempLabelsLayer'
import { useDoseRadiusLayer } from '@/hooks/useDoseRadiusLayer'
import { useNationalSchoolsLayer } from '@/hooks/useNationalSchoolsLayer'
import { useNationalSchoolsClicks } from '@/hooks/useNationalSchoolsClicks'
import { useShortestRouteLayer } from '@/hooks/useShortestRouteLayer'
import { useRouteLayers } from '@/hooks/useRouteLayers'
import { useSegmentHighlightLayer } from '@/hooks/useSegmentHighlightLayer'
import type { LayerVisibility } from '@/lib/districtStateContext'
import type { BlocksGeoJson, School, SolvedRoutes } from '@/lib/types'
import type { SchoolNational } from '@/lib/districtTypes'
import type { RouteSegment } from '@/lib/routeSolver'
import type { LonLat } from '@/lib/geoDistance'

interface UseDistrictMapLayersInput {
  map: maplibregl.Map | null
  schoolPoint: LonLat | null
  walkRadiusMi: number | null
  doseRadiusMi: number | null
  blocks: BlocksGeoJson | null
  layerVisibility: LayerVisibility
  hideHeatData: boolean
  theme: string
  schools: School[]
  nationalSchools: SchoolNational[] | null
  onBlockClick: (blockId: string) => void
  onSelectAnalyzed: (schoolId: string) => void
  onSelectUnanalyzed: (school: SchoolNational) => void
  solvedRoutes: SolvedRoutes | null
  baselineC: number
  routeFailed: boolean
  highlightedSegments: RouteSegment[]
}

export function useDistrictMapLayers(input: UseDistrictMapLayersInput): void {
  const {
    map,
    schoolPoint,
    walkRadiusMi,
    doseRadiusMi,
    blocks,
    layerVisibility,
    hideHeatData,
    theme,
    schools,
    nationalSchools,
    onBlockClick,
    onSelectAnalyzed,
    onSelectUnanalyzed,
    solvedRoutes,
    baselineC,
    routeFailed,
    highlightedSegments,
  } = input

  useOfficialZoneLayer({ map, schoolPoint, walkRadiusMi, visible: layerVisibility.officialZone, theme })
  useDoseZoneLayer({
    map,
    blocks,
    visible: layerVisibility.doseZone && !hideHeatData,
    theme,
    onBlockClick,
  })
  useBlockTempLabelsLayer({
    map,
    blocks,
    visible: layerVisibility.doseZone && !hideHeatData,
    theme,
  })
  useDoseRadiusLayer({
    map,
    schoolPoint,
    doseRadiusMi,
    visible: layerVisibility.doseRadius && !hideHeatData,
    theme,
  })
  useShortestRouteLayer({ map, shortest: solvedRoutes?.shortest ?? null, baselineC, hideHeatData, theme })
  useRouteLayers({ map, coolest: solvedRoutes?.coolest ?? null, hideHeatData, routeFailed, theme })
  useSegmentHighlightLayer({ map, segments: hideHeatData ? [] : highlightedSegments, theme })
  useNationalSchoolsLayer({ map, nationalSchools, theme })
  useNationalSchoolsClicks({ map, schools, onSelectAnalyzed, onSelectUnanalyzed })
}
