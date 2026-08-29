import { useMemo } from 'react'
import { useAppState } from '@/hooks/useAppState'
import { useDistrictState } from '@/hooks/useDistrictState'
import { useSchoolData } from '@/hooks/useSchoolData'
import { useSummary } from '@/hooks/useSummary'
import { useNationalSchools } from '@/hooks/useNationalSchools'
import { useDistrictBlocks } from '@/hooks/useDistrictBlocks'
import { useDefaultHour } from '@/hooks/useDefaultHour'
import { applyHourClass } from '@/lib/applyHourClass'
import { blocksForSchool } from '@/lib/blocksForSchool'
import { blocksInsidePolicyCircle } from '@/lib/blocksInsidePolicyCircle'
import { findDistrictBlock } from '@/lib/findDistrictBlock'

export function useDistrictRouteData() {
  const appState = useAppState()
  const districtState = useDistrictState()
  const { schools, hour, setHour } = appState
  const { focusedSchoolId, selectedBlockId } = districtState

  const selectedSchool = schools.find((school) => school.id === focusedSchoolId) ?? null
  const { data: schoolData, loading: schoolDataLoading, error: schoolDataError } = useSchoolData(focusedSchoolId)
  const { districtBlocks, districtBlocksHours, error: districtBlocksError } = useDistrictBlocks()
  const { summary } = useSummary()
  const { schools: nationalSchools, loading: nationalSchoolsLoading } = useNationalSchools()

  useDefaultHour(schoolData, hour, setHour)

  const selectedBlock = useMemo(
    () => findDistrictBlock(districtBlocks, selectedBlockId),
    [districtBlocks, selectedBlockId],
  )

  const policyCircleBlocks = useMemo(() => {
    if (districtBlocks === null || selectedSchool === null) return null
    const circleBlocks = blocksInsidePolicyCircle(
      districtBlocks,
      [selectedSchool.lon, selectedSchool.lat],
      selectedSchool.walk_radius_mi,
    )
    return applyHourClass(circleBlocks, districtBlocksHours, hour)
  }, [districtBlocks, districtBlocksHours, hour, selectedSchool])

  const focusedSchoolBlocks = useMemo(() => {
    if (districtBlocks === null || selectedSchool === null) return null
    return applyHourClass(blocksForSchool(districtBlocks, selectedSchool.id), districtBlocksHours, hour)
  }, [districtBlocks, districtBlocksHours, hour, selectedSchool])

  const schoolSummary = focusedSchoolId !== null ? (summary?.[focusedSchoolId] ?? null) : null

  return {
    ...appState,
    ...districtState,
    selectedSchool,
    schoolData,
    schoolDataLoading,
    schoolDataError,
    districtBlocks,
    districtBlocksHours,
    districtBlocksError,
    policyCircleBlocks,
    focusedSchoolBlocks,
    nationalSchools,
    nationalSchoolsLoading,
    schoolSummary,
    selectedBlock,
  }
}
