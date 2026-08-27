import { findDistrictBlock } from '@/lib/findDistrictBlock'
import type { BlocksGeoJson } from '@/lib/types'
import type { DistrictPanelView } from '@/lib/districtStateContext'
import type { SchoolNational } from '@/lib/districtTypes'

interface UseDistrictSelectionHandlersInput {
  districtBlocks: BlocksGeoJson | null
  selectedSchoolId: string | null
  setSelectedSchoolId: (schoolId: string) => void
  setSelectedBlockId: (blockId: string | null) => void
  setUnanalyzedNotice: (school: SchoolNational | null) => void
  setPanelView: (view: DistrictPanelView) => void
}

interface DistrictSelectionHandlers {
  handleSelectAnalyzed: (schoolId: string) => void
  handleSelectUnanalyzed: (school: SchoolNational) => void
  handleBlockClick: (blockId: string) => void
  handleBackToSchools: () => void
  handleBackToSchool: () => void
}

export function useDistrictSelectionHandlers(
  input: UseDistrictSelectionHandlersInput,
): DistrictSelectionHandlers {
  const { districtBlocks, selectedSchoolId, setSelectedSchoolId, setSelectedBlockId, setUnanalyzedNotice, setPanelView } =
    input

  return {
    handleSelectAnalyzed: (schoolId: string) => {
      setSelectedSchoolId(schoolId)
      setSelectedBlockId(null)
      setUnanalyzedNotice(null)
      setPanelView('school')
    },
    handleSelectUnanalyzed: (school: SchoolNational) => {
      setUnanalyzedNotice(school)
      setSelectedBlockId(null)
      setPanelView('block')
    },
    handleBlockClick: (blockId: string) => {
      const block = findDistrictBlock(districtBlocks, blockId)
      if (block !== null && block.properties.school_id !== selectedSchoolId) {
        setSelectedSchoolId(block.properties.school_id)
      }
      setSelectedBlockId(blockId)
      setUnanalyzedNotice(null)
      setPanelView('block')
    },
    handleBackToSchools: () => {
      setPanelView('schools')
    },
    handleBackToSchool: () => {
      setSelectedBlockId(null)
      setUnanalyzedNotice(null)
      setPanelView('school')
    },
  }
}
