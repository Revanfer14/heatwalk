import { useMemo } from 'react'
import { useAppState } from '@/hooks/useAppState'
import { useDistrictState } from '@/hooks/useDistrictState'
import { useSchoolData } from '@/hooks/useSchoolData'
import { useSummary } from '@/hooks/useSummary'
import { useNationalSchools } from '@/hooks/useNationalSchools'
import { useBlocksHours } from '@/hooks/useBlocksHours'
import { useDefaultHour } from '@/hooks/useDefaultHour'
import type { BlockFeature } from '@/lib/types'

export function useDistrictRouteData() {
  const appState = useAppState()
  const districtState = useDistrictState()
  const { schools, selectedSchoolId, hour, setHour } = appState
  const { selectedBlockId } = districtState

  const selectedSchool = schools.find((school) => school.id === selectedSchoolId) ?? null
  const { data: schoolData, loading: schoolDataLoading, error: schoolDataError } = useSchoolData(selectedSchoolId)
  const { blocksHours } = useBlocksHours(selectedSchoolId)
  const { summary } = useSummary()
  const { schools: nationalSchools, loading: nationalSchoolsLoading } = useNationalSchools()

  useDefaultHour(schoolData, hour, setHour)

  const selectedBlock = useMemo<BlockFeature | null>(() => {
    if (schoolData === null || selectedBlockId === null) return null
    return schoolData.blocks.features.find((feature) => feature.properties.block_id === selectedBlockId) ?? null
  }, [schoolData, selectedBlockId])

  const schoolSummary = selectedSchoolId !== null ? (summary?.[selectedSchoolId] ?? null) : null

  return {
    ...appState,
    ...districtState,
    selectedSchool,
    schoolData,
    schoolDataLoading,
    schoolDataError,
    blocksHours,
    nationalSchools,
    nationalSchoolsLoading,
    schoolSummary,
    selectedBlock,
  }
}
