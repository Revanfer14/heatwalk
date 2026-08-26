import type { SchoolNational } from '@/lib/districtTypes'

interface UseDistrictSelectionHandlersInput {
  setSelectedSchoolId: (schoolId: string) => void
  setSelectedBlockId: (blockId: string | null) => void
  setUnanalyzedNotice: (school: SchoolNational | null) => void
}

interface DistrictSelectionHandlers {
  handleSelectAnalyzed: (schoolId: string) => void
  handleSelectUnanalyzed: (school: SchoolNational) => void
  handleBlockClick: (blockId: string) => void
}

export function useDistrictSelectionHandlers(
  input: UseDistrictSelectionHandlersInput,
): DistrictSelectionHandlers {
  const { setSelectedSchoolId, setSelectedBlockId, setUnanalyzedNotice } = input

  return {
    handleSelectAnalyzed: (schoolId: string) => {
      setSelectedSchoolId(schoolId)
      setSelectedBlockId(null)
      setUnanalyzedNotice(null)
    },
    handleSelectUnanalyzed: (school: SchoolNational) => {
      setUnanalyzedNotice(school)
      setSelectedBlockId(null)
    },
    handleBlockClick: (blockId: string) => {
      setSelectedBlockId(blockId)
      setUnanalyzedNotice(null)
    },
  }
}
