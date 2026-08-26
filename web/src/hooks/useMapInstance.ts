import { useContext } from 'react'
import { MapInstanceContext } from '@/lib/mapInstanceContext'

export function useMapInstance() {
  const context = useContext(MapInstanceContext)
  if (context === null) {
    throw new Error('useMapInstance must be used within a MapInstanceProvider')
  }
  return context
}
