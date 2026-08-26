import { useContext } from 'react'
import { DistrictStateContext } from '@/lib/districtStateContext'

export function useDistrictState() {
  const context = useContext(DistrictStateContext)
  if (context === null) {
    throw new Error('useDistrictState must be used within a DistrictStateProvider')
  }
  return context
}
