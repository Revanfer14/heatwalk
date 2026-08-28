import { findDistrictBlock } from '@/lib/findDistrictBlock'
import type { BlocksGeoJson } from '@/lib/types'
import type { DistrictPanelView } from '@/lib/districtStateContext'
import type { SchoolNational } from '@/lib/districtTypes'

interface UseDistrictSelectionHandlersInput {
  districtBlocks: BlocksGeoJson | null
  focusedSchoolId: string | null
  setFocusedSchoolId: (schoolId: string | null) => void
  setSelectedBlockId: (blockId: string | null) => void
  setUnanalyzedNotice: (school: SchoolNational | null) => void
  setPanelView: (view: DistrictPanelView) => void
  setHour: (hour: string | null) => void
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
  const {
    districtBlocks,
    focusedSchoolId,
    setFocusedSchoolId,
    setSelectedBlockId,
    setUnanalyzedNotice,
    setPanelView,
    setHour,
  } = input

  const clearSchoolFocus = (): void => {
    setFocusedSchoolId(null)
    setSelectedBlockId(null)
    setUnanalyzedNotice(null)
    setHour(null)
    setPanelView('schools')
  }

  return {
    handleSelectAnalyzed: (schoolId: string) => {
      if (schoolId === focusedSchoolId) {
        clearSchoolFocus()
        return
      }
      setFocusedSchoolId(schoolId)
      setSelectedBlockId(null)
      setUnanalyzedNotice(null)
      setHour(null)
      setPanelView('school')
    },
    handleSelectUnanalyzed: (school: SchoolNational) => {
      setUnanalyzedNotice(school)
      setSelectedBlockId(null)
      setPanelView('block')
    },
    handleBlockClick: (blockId: string) => {
      const block = findDistrictBlock(districtBlocks, blockId)
      if (block !== null && block.properties.school_id !== focusedSchoolId) {
        setFocusedSchoolId(block.properties.school_id)
        setHour(null)
      }
      setSelectedBlockId(blockId)
      setUnanalyzedNotice(null)
      setPanelView('block')
    },
    handleBackToSchools: () => {
      clearSchoolFocus()
    },
    handleBackToSchool: () => {
      setSelectedBlockId(null)
      setUnanalyzedNotice(null)
      setPanelView('school')
    },
  }
}
