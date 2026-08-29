import { useMemo } from 'react'
import type maplibregl from 'maplibre-gl'
import { useOfficialZoneLayer } from '@/hooks/useOfficialZoneLayer'
import { useDoseZoneLayer } from '@/hooks/useDoseZoneLayer'
import { useBlockTempLabelsLayer } from '@/hooks/useBlockTempLabelsLayer'
import { useDoseRadiusLayer } from '@/hooks/useDoseRadiusLayer'
import { useMisclassifiedHighlightLayer } from '@/hooks/useMisclassifiedHighlightLayer'
import { useNationalSchoolsLayer } from '@/hooks/useNationalSchoolsLayer'
import { useNationalSchoolsClicks } from '@/hooks/useNationalSchoolsClicks'
import { resolveAnalyzedSchoolId } from '@/lib/resolveAnalyzedSchool'
import type { LayerVisibility, MisclassifiedHighlight } from '@/lib/districtStateContext'
import type { BlocksGeoJson, School } from '@/lib/types'
import type { SchoolNational } from '@/lib/districtTypes'
import type { LonLat } from '@/lib/geoDistance'

interface UseDistrictMapLayersInput {
  map: maplibregl.Map | null
  schoolPoint: LonLat | null
  walkRadiusMi: number | null
  doseRadiusMi: number | null
  blocks: BlocksGeoJson | null
  focusedSchoolBlocks: BlocksGeoJson | null
  misclassifiedHighlight: MisclassifiedHighlight
  layerVisibility: LayerVisibility
  hideHeatData: boolean
  theme: string
  schools: School[]
  nationalSchools: SchoolNational[] | null
  focusedSchoolId: string | null
  onBlockClick: (blockId: string) => void
  onSelectAnalyzed: (schoolId: string) => void
  onSelectUnanalyzed: (school: SchoolNational) => void
}

export function useDistrictMapLayers(input: UseDistrictMapLayersInput): void {
  const {
    map,
    schoolPoint,
    walkRadiusMi,
    doseRadiusMi,
    blocks,
    focusedSchoolBlocks,
    misclassifiedHighlight,
    layerVisibility,
    hideHeatData,
    theme,
    schools,
    nationalSchools,
    focusedSchoolId,
    onBlockClick,
    onSelectAnalyzed,
    onSelectUnanalyzed,
  } = input

  const visibleNationalSchools = useMemo(() => {
    if (focusedSchoolId === null || nationalSchools === null) return nationalSchools
    return nationalSchools.filter((school) => resolveAnalyzedSchoolId(school, schools) === focusedSchoolId)
  }, [nationalSchools, schools, focusedSchoolId])

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
  useMisclassifiedHighlightLayer({
    map,
    blocks: focusedSchoolBlocks,
    highlight: misclassifiedHighlight,
    schoolId: focusedSchoolId,
    walkRadiusMi,
    hideHeatData,
    theme,
  })
  useNationalSchoolsLayer({ map, nationalSchools: visibleNationalSchools, theme })
  useNationalSchoolsClicks({ map, schools, onSelectAnalyzed, onSelectUnanalyzed })
}
